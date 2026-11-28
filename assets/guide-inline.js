/* Guides on narrow screens (860 px and under: phones and tablet portrait): each section's text, then its stage,
   then the next section's text, in turn (user, 2026-11-27). Before this, the stage sat at the top of the page and the
   text scrolled under it (Bonding) or away from it (the rest).

   A guide keeps its one stage. This file adds a slot under each section and moves the stage into the slot that is
   most in view; the guide then loads that section as it always does. The slot it leaves keeps a still copy of the
   stage at the same height, so the page never jumps and never shows an empty frame where the stage just was.
   Tapping a still copy brings the live stage back to it. Slots not visited yet hold the stage's height, empty.

   Wide screens and presentation view are untouched: the slots go and the stage returns to its own place.

   const inline = GuideInline.attach({
     stage,          // the stage panel
     beats,          // every section, in page order
     skip(b),        // optional: true for sections with no stage of their own (Before we begin cards)
     current(),      // the section on the stage now
     activate(b),    // load section b on the stage (the guide's applyBeat)
     presenting(),   // presentation view on?
   });
   inline.on()            true while narrow and not presenting: the guide's own scroll tracking stands down
   inline.target(b)       the section whose slot b's stage belongs in (a skipped section hands on to the next)
   inline.place(b)        move the stage under b; call at the top of applyBeat, before the stage is cleared
   inline.sync()          call after presentation view turns on or off
   inline.scrollTo(b, s)  scroll so b's heading is at the top                                                  */
(function (global) {
  'use strict';

  var QUERY = '(max-width:860px)';

  function attach(o) {
    var mq = matchMedia(QUERY);
    var stage = o.stage;
    var home = { parent: stage.parentNode, next: stage.nextSibling };
    var beats = o.beats.filter(function (b) { return !(o.skip && o.skip(b)); });
    var slots = [];          // [{ beat, el }], page order
    var here = null;         // the slot holding the live stage
    var pinUntil = 0;
    var fromScroll = false;

    function on() { return mq.matches && !(o.presenting && o.presenting()); }

    function target(b) {
      if (!b || beats.indexOf(b) >= 0) return b;
      var i = o.beats.indexOf(b);
      for (var j = i + 1; j < o.beats.length; j++) if (beats.indexOf(o.beats[j]) >= 0) return o.beats[j];
      for (j = i - 1; j >= 0; j--) if (beats.indexOf(o.beats[j]) >= 0) return o.beats[j];
      return b;
    }
    function slotOf(b) {
      for (var i = 0; i < slots.length; i++) if (slots[i].beat === b) return slots[i];
      return null;
    }

    function build() {
      if (slots.length) return;
      document.body.classList.add('guide-inline');
      beats.forEach(function (b) {
        var el = document.createElement('div');
        el.className = 'guide-slot';
        b.after(el);
        var s = { beat: b, el: el };
        el.addEventListener('click', function () { if (s !== here && el.firstChild) o.activate(b); });
        slots.push(s);
      });
    }
    function unbuild() {
      document.body.classList.remove('guide-inline');
      if (!slots.length) return;
      // a guide that docks its own stage (Solubility) may have moved it already: only bring it home from a slot
      if (stage.parentNode && stage.parentNode.classList.contains('guide-slot')) {
        if (home.next && home.next.parentNode === home.parent) home.parent.insertBefore(stage, home.next);
        else home.parent.appendChild(stage);
      }
      slots.forEach(function (s) { s.el.remove(); });
      slots = []; here = null;
      resized();
    }

    // the still copy left in a slot: the stage as it last looked, canvases and field values included
    function freeze(s) {
      var copy = stage.cloneNode(true);
      [copy].concat(Array.prototype.slice.call(copy.querySelectorAll('[id]'))).forEach(function (n) { n.removeAttribute('id'); });
      copy.classList.add('guide-still');
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      var from = stage.querySelectorAll('canvas'), to = copy.querySelectorAll('canvas');
      Array.prototype.forEach.call(to, function (c, i) {
        try { c.getContext('2d').drawImage(from[i], 0, 0); } catch (e) { /* a 3D canvas copies blank */ }
      });
      var fIn = stage.querySelectorAll('input, select, textarea'), tIn = copy.querySelectorAll('input, select, textarea');
      Array.prototype.forEach.call(tIn, function (f, i) { f.value = fIn[i].value; if ('checked' in f) f.checked = fIn[i].checked; });
      s.el.style.height = stage.offsetHeight + 'px';
      s.el.appendChild(copy);
      s.el.classList.add('has-still');
    }

    function place(b) {
      if (!on()) return;
      build();
      var s = slotOf(target(b));
      if (!s) return;
      if (!fromScroll) pinUntil = Date.now() + 900;   // a link or menu jump: let the scroll settle first
      if (s === here) return;
      if (here) freeze(here);
      s.el.innerHTML = '';
      s.el.classList.remove('has-still');
      s.el.style.height = '';
      s.el.appendChild(stage);
      here = s;
      reserve();
      requestAnimationFrame(function () { reserve(); resized(); });   // again once the new section has loaded
    }
    // slots not visited yet hold the stage's height, so nothing below jumps when it arrives
    function reserve() {
      var h = stage.offsetHeight;
      if (h) slots.forEach(function (x) { if (!x.el.firstChild) x.el.style.height = h + 'px'; });
    }

    function resized() { global.dispatchEvent(new Event('resize')); }

    function sync() {
      if (on()) { build(); place(o.current()); }
      else unbuild();
    }

    function scrollTo(b, smooth) {
      pinUntil = Date.now() + 1500;
      var reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      b.scrollIntoView({ block: 'start', behavior: smooth && !reduced ? 'smooth' : 'auto' });
    }

    // The stage goes to the slot most in view, once that slot shows clearly more than the one holding it.
    // An empty slot (not visited yet) takes it sooner: as soon as it is on screen and the stage's own slot is
    // more than half gone, which leaves a still copy there and no empty frame coming up from below.
    // It only moves the way the page is scrolling (down to a slot below, up to one above), so it never bounces back.
    var lastY = global.scrollY;
    function pick() {
      var y = global.scrollY, dir = y > lastY ? 1 : y < lastY ? -1 : 0;
      lastY = y;
      if (!on() || !slots.length || Date.now() < pinUntil || !dir) return;
      var vh = global.innerHeight, best = null, bestV = 0, hereV = 0, hereH = 1, empty = null, emptyV = 0;
      var hi = slots.indexOf(here);
      slots.forEach(function (s, i) {
        if (s !== here && (i - hi) * dir < 0) return;   // behind the way the page is going
        var r = s.el.getBoundingClientRect();
        var v = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        if (s === here) { hereV = v; hereH = Math.max(1, Math.min(r.height, vh)); }
        if (v > bestV) { bestV = v; best = s; }
        if (s !== here && !s.el.firstChild && v > emptyV) { emptyV = v; empty = s; }
      });
      if (empty && emptyV > 60 && hereV < hereH * 0.5) best = empty;
      if (best && best !== here && (best === empty || bestV > hereV + 40)) {
        fromScroll = true;
        try { o.activate(best.beat); } finally { fromScroll = false; }
      }
    }
    var tick = 0;
    global.addEventListener('scroll', function () {
      if (tick) return;
      tick = requestAnimationFrame(function () { tick = 0; pick(); });
    }, { passive: true });
    // turning a tablet past 860 px: the media query's change event, and a resize check as a backstop
    if (mq.addEventListener) mq.addEventListener('change', sync); else if (mq.addListener) mq.addListener(sync);
    global.addEventListener('resize', function () { if (on() !== !!slots.length) sync(); });

    var api = { on: on, target: target, place: place, sync: sync, scrollTo: scrollTo, pick: pick };
    global.GuideInline.all.push(api);   // for the headless check (assets/dev/guide-inline-check.html)
    return api;
  }

  global.GuideInline = { attach: attach, all: [] };
})(window);
