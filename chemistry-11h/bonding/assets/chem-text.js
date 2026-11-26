/**
 * Chemical Bonding - formula text. Space Grotesk has no subscript digits (₀–₉) or charge signs (⁺ ⁻ ⁴…),
 * so the browser borrows them from another font, tiny and too low. This finds those characters in page text
 * (not SVG, not inside <option>) and draws them as real sub/superscripts in the page's own font.
 * Runs once on load and again whenever text changes (scenes rewrite their labels and readouts).
 */
(function (global) {
  'use strict';
  var doc = global.document;
  if (!doc || !global.MutationObserver) return;
  var SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻';
  // a superscript run is redrawn only if it holds a character the font lacks (¹ ² ³ alone render fine: sp³)
  var RUN = /[₀-₉]+|[⁰¹²³⁴-⁹⁺⁻]+/g, NEED = /[₀-₉⁰⁴-⁹⁺⁻]/;
  var SKIP = { SCRIPT: 1, STYLE: 1, OPTION: 1, SELECT: 1, TEXTAREA: 1, TITLE: 1 };
  function plain(ch) {
    var i = SUB.indexOf(ch);
    if (i >= 0) return String(i);
    i = SUP.indexOf(ch);
    return i < 10 ? String(i) : i === 10 ? '+' : '−';
  }
  function fix(node) {
    var t = node.nodeValue, p = node.parentNode;
    if (!t || !NEED.test(t) || !p || SKIP[p.nodeName] || p.closest && p.closest('svg, .chem-sub, .chem-sup')) return;
    var frag = doc.createDocumentFragment(), last = 0, m;
    RUN.lastIndex = 0;
    while ((m = RUN.exec(t))) {
      if (!NEED.test(m[0])) continue;
      if (m.index > last) frag.appendChild(doc.createTextNode(t.slice(last, m.index)));
      var s = doc.createElement('span');
      s.className = SUB.indexOf(m[0][0]) >= 0 ? 'chem-sub' : 'chem-sup';
      s.textContent = m[0].split('').map(plain).join('');
      s.setAttribute('data-chem', m[0]);   // the original characters (copy, search)
      frag.appendChild(s);
      last = m.index + m[0].length;
    }
    if (!last) return;
    if (last < t.length) frag.appendChild(doc.createTextNode(t.slice(last)));
    p.replaceChild(frag, node);
  }
  function walk(root) {
    if (root.nodeType === 3) { fix(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName] || root.namespaceURI === 'http://www.w3.org/2000/svg') return;
    var w = doc.createTreeWalker(root, 4, null), list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(fix);
  }
  function start() {
    walk(doc.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (mu) {
        if (mu.type === 'characterData') fix(mu.target);
        else mu.addedNodes.forEach(walk);
      });
    }).observe(doc.body, { childList: true, subtree: true, characterData: true });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(window);
