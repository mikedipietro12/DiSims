/* SectionJump: in presentation view, the section title on the stage opens a menu of every section, so the
   teacher can skip straight to one. The ‹ › arrows still step one at a time. Shared by the Guides that have a
   presentation view (Intermolecular Forces, Intro to Equilibrium, Solubility); styled by .jump-* in suite.css.

   SectionJump.attach({
     badge,            // the title element on the stage (its text is set by the Guide; this only adds the menu)
     beats,            // the section elements, in order
     current(),        // the section on show now
     go(el),           // show that section (the Guide's own goToBeat + scroll)
     label(el),        // optional: html for the menu item (default: the section's h2)
     group(el)         // optional: a heading the item sits under (consecutive items share one)
   });  */
(function (global) {
  'use strict';
  const learnOn = () => document.body.classList.contains('learn-mode');

  function attach(o) {
    const badge = o.badge;
    if (!badge || !o.beats || !o.beats.length) return;
    const labelOf = el => (o.label && o.label(el)) || (el.querySelector('h2') ? el.querySelector('h2').innerHTML : el.id);
    let menu = null, items = [];

    badge.classList.add('jump-badge');
    const head = badge.closest('.guide-stage-head');
    if (head) head.classList.add('has-jump');
    // a button only in presentation view; a plain title otherwise
    function syncRole() {
      if (learnOn()) {
        badge.setAttribute('role', 'button'); badge.tabIndex = 0;
        badge.setAttribute('aria-haspopup', 'menu'); badge.setAttribute('aria-expanded', menu ? 'true' : 'false');
        badge.setAttribute('title', 'Jump to a section');
      } else {
        ['role', 'tabindex', 'aria-haspopup', 'aria-expanded', 'title'].forEach(a => badge.removeAttribute(a));
        close(false);
      }
    }
    new MutationObserver(syncRole).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    syncRole();

    function build() {
      menu = document.createElement('div');
      menu.className = 'jump-menu'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Sections');
      const now = o.current();
      let lastGroup = null;
      items = [];
      o.beats.forEach(el => {
        const g = o.group ? o.group(el) : null;
        if (g && g !== lastGroup) {
          const h = document.createElement('p'); h.className = 'jump-group'; h.setAttribute('role', 'presentation'); h.innerHTML = g;
          menu.appendChild(h);
        }
        lastGroup = g;
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'jump-item'; b.setAttribute('role', 'menuitem'); b.innerHTML = labelOf(el);
        if (el === now) { b.classList.add('is-current'); b.setAttribute('aria-current', 'true'); }
        b.addEventListener('click', () => { close(false); o.go(el); });
        menu.appendChild(b); items.push(b);
      });
      menu.addEventListener('keydown', onMenuKey);
      document.body.appendChild(menu);
      place();
    }
    function place() {
      if (!menu) return;
      const r = badge.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px';
      menu.style.top = (r.bottom + 6) + 'px';
      menu.style.maxHeight = Math.max(160, innerHeight - r.bottom - 24) + 'px';
    }
    function open() {
      if (menu || !learnOn()) return;
      build();
      badge.setAttribute('aria-expanded', 'true');
      const cur = menu.querySelector('.is-current') || items[0];
      if (cur) { cur.scrollIntoView({ block: 'center' }); cur.focus({ preventScroll: true }); }
      setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
      addEventListener('resize', place);
    }
    function close(refocus) {
      if (!menu) return;
      menu.remove(); menu = null; items = [];
      badge.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', outside, true);
      removeEventListener('resize', place);
      if (refocus) badge.focus();
    }
    function outside(e) { if (menu && !menu.contains(e.target) && e.target !== badge) close(false); }
    // keys stay in the menu: the Guide's arrow / space / Esc shortcuts must not fire while it is open
    function onMenuKey(e) {
      const i = items.indexOf(document.activeElement);
      const to = k => { e.preventDefault(); items[(k + items.length) % items.length].focus(); };
      if (e.key === 'ArrowDown') to(i + 1);
      else if (e.key === 'ArrowUp') to(i - 1);
      else if (e.key === 'Home') to(0);
      else if (e.key === 'End') to(items.length - 1);
      else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); close(true); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) items[i].click(); }
      e.stopPropagation();
    }
    badge.addEventListener('click', () => { if (!learnOn()) return; menu ? close(false) : open(); });
    badge.addEventListener('keydown', e => {
      if (!learnOn()) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); open(); }
    });
  }

  global.SectionJump = { attach };
})(window);
