/**
 * Chemical Bonding - 3D turntable (three.js r128, global THREE). Spheres arrive in Chapter C.
 *
 *   var tt = Turntable.create(container, { presets: true })
 *   tt.setMolecule(model, { lones: 'inner' | 'all' | false, from: [[x,y,z]…] (lift), ms })
 *   tt.content          THREE.Group for custom objects (orbitals); call tt.render() after changes
 *   tt.label(id, text, [x,y,z])   HTML label pinned to a 3D point (null text removes)
 *   tt.preset('front' | 'side' | 'top')
 *   tt.setShape(on) / tt.shapeOptions({ faces })   the atoms' outline as a solid (tetrahedron …), or
 *                       with faces:false the bonds traced (linear, bent, T-shaped); off with space filling
 *   tt.showMolecule(on)  hide / show the ball-and-stick model (content stays)
 *   tt.settle(), tt.destroy()
 *   Turntable.lobe(dir, length, width, colour, opacity)  teardrop mesh along dir
 *
 * Drag spins about the vertical axis and tilts (no zoom, no pan), so the view cannot get lost.
 */
(function (global) {
  'use strict';
  var Gm = global.Geometry;
  var INK = 0x3d4658;

  function hasWebGL() {
    try { var c = document.createElement('canvas'); return !!(global.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }

  /**
   * The one lobe shape (also drawn flat by ShapeView): a smooth teardrop, rounded at the atom, widest a little past
   * halfway, closing in a round end. r(u) = u^0.6 · (1 − u)^0.45, scaled so its widest point is 1; no neck, no cap.
   */
  var LOBE_A = 0.6, LOBE_B = 0.45, LOBE_PEAK = Math.pow(LOBE_A / (LOBE_A + LOBE_B), LOBE_A) * Math.pow(LOBE_B / (LOBE_A + LOBE_B), LOBE_B);
  function lobeProfile(u) { return u <= 0 || u >= 1 ? 0 : Math.pow(u, LOBE_A) * Math.pow(1 - u, LOBE_B) / LOBE_PEAK; }
  function lobeGeometry(len, width) {
    var T = global.THREE, pts = [], N = 72;
    for (var i = 0; i <= N; i++) {
      var s0 = i / N, u = s0 < 0.5 ? 2 * s0 * s0 : 1 - 2 * (1 - s0) * (1 - s0);   // more points at both ends, where the curve turns fastest
      pts.push(new T.Vector2(Math.max(0.0001, width * lobeProfile(u)), u * len));
    }
    return new T.LatheGeometry(pts, 48);
  }
  /** A teardrop lobe from the origin along dir. */
  function lobe(dir, len, width, colour, opacity) {
    var T = global.THREE;
    // outside only: drawing the inner faces through the see-through skin made creases
    var mat = new T.MeshStandardMaterial({ color: colour, transparent: true, opacity: opacity == null ? 0.55 : opacity, roughness: 0.8, depthWrite: false, side: T.FrontSide });
    var mesh = new T.Mesh(lobeGeometry(len, width), mat);
    var d = new T.Vector3(dir[0], dir[1], dir[2]).normalize();
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d);
    return mesh;
  }

  function create(container, opts) {
    opts = opts || {};
    var T = global.THREE;
    var wrap = document.createElement('div');
    wrap.className = 'tt';
    container.appendChild(wrap);
    if (!T || !hasWebGL()) {
      wrap.classList.add('tt-fallback');
      wrap.textContent = '3D needs WebGL, which this browser has turned off.';
      return { content: null, setMolecule: function () {}, label: function () {}, preset: function () {}, render: function () {}, settle: function () {}, destroy: function () { wrap.remove(); } };
    }
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, global.devicePixelRatio || 1));
    wrap.appendChild(renderer.domElement);
    var labels = document.createElement('div');
    labels.className = 'tt-labels';
    wrap.appendChild(labels);
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 12);
    scene.add(new T.AmbientLight(0xffffff, 0.62));
    var key = new T.DirectionalLight(0xffffff, 0.75); key.position.set(-4, 6, 8); scene.add(key);
    var rim = new T.DirectionalLight(0xffffff, 0.25); rim.position.set(5, -3, -4); scene.add(rim);
    var pivot = new T.Group();
    scene.add(pivot);
    var content = new T.Group();
    pivot.add(content);
    var mol = new T.Group();
    pivot.add(mol);

    var yaw = opts.yaw || -0.35, tilt = opts.tilt || 0.18, vYaw = 0, target = null, dragging = false, radius = 2.5;
    var spaceExtra = 0, spaceT = 0;   // space-filling spheres reach further: the view widens by this much as they grow
    var labelMap = {};
    var anims = [];

    function size() {
      var r = wrap.getBoundingClientRect(), w = Math.max(50, r.width), hh = Math.max(50, r.height);
      renderer.setSize(w, hh, false);
      camera.aspect = w / hh;
      aim();
    }
    /** Camera distance: the molecule's sphere (any turn) plus a slim margin, so it fills the box. */
    function aim() {
      var fit = radius + 0.3 + spaceExtra * spaceT;
      var dist = fit / Math.sin(camera.fov * Math.PI / 360) * (camera.aspect < 1 ? 1 / camera.aspect : 1);
      camera.position.set(0, 0, dist);
      camera.updateProjectionMatrix();
      render();
    }
    var ro = global.ResizeObserver ? new ResizeObserver(size) : null;
    if (ro) ro.observe(wrap);

    function render() {
      pivot.rotation.set(tilt, yaw, 0, 'XYZ');
      renderer.render(scene, camera);
      var r = renderer.domElement.getBoundingClientRect();
      Object.keys(labelMap).forEach(function (k) {
        var L = labelMap[k], v = new T.Vector3(L.p[0], L.p[1], L.p[2]);
        L.obj ? L.obj.getWorldPosition(v) : pivot.localToWorld(v);
        var depth = v.clone().applyMatrix4(camera.matrixWorldInverse).z;
        v.project(camera);
        L.el.style.transform = 'translate(' + ((v.x + 1) / 2 * r.width) + 'px,' + ((1 - v.y) / 2 * r.height) + 'px) translate(-50%,-50%)';
        L.el.style.opacity = L.fixed ? 1 : depth < -camera.position.z - 0.4 ? 0.35 : 1;
      });
    }
    var raf = 0;
    function loop() {
      raf = 0;
      var now = performance.now(), busy = false;
      anims = anims.filter(function (a) {
        var t = Math.min(1, (now - a.t0) / a.ms);
        a.step(t);
        if (t < 1) { busy = true; return true; }
        if (a.done) a.done();
        return false;
      });
      if (!dragging && Math.abs(vYaw) > 0.0004) { yaw += vYaw; vYaw *= 0.93; busy = true; }
      if (target) {
        yaw += (target.yaw - yaw) * 0.16; tilt += (target.tilt - tilt) * 0.16;
        if (Math.abs(target.yaw - yaw) + Math.abs(target.tilt - tilt) < 0.002) { yaw = target.yaw; tilt = target.tilt; target = null; } else busy = true;
      }
      render();
      if (busy && !raf) raf = requestAnimationFrame(loop);   // a render() asked for during the step has already queued the next frame
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    function animate(ms, step, done) { anims.push({ t0: performance.now(), ms: ms, step: step, done: done }); kick(); }

    // --- Turntable input -----------------------------------------------------------------------
    var last = null;
    var cv = renderer.domElement;
    cv.style.touchAction = 'none';
    cv.setAttribute('tabindex', '0');
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'Rotatable 3D model. Drag, or use the arrow keys, to turn it.');
    var downAt = null;
    cv.addEventListener('pointerdown', function (e) { dragging = true; target = null; downAt = { x: e.clientX, y: e.clientY }; last = { x: e.clientX, y: e.clientY, t: performance.now() }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} });
    cv.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - last.x, dy = e.clientY - last.y;
      yaw += dx * 0.011;
      tilt = Math.max(-1.2, Math.min(1.2, tilt + dy * 0.008));
      vYaw = dx * 0.011 * 0.6;
      last = { x: e.clientX, y: e.clientY };
      kick();
    });
    function up() { dragging = false; kick(); }
    var ray = new T.Raycaster();
    cv.addEventListener('pointerup', function (e) {
      up();
      if (!opts.onPick || !downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return;
      vYaw = 0;
      var r = cv.getBoundingClientRect();
      ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      var hits = ray.intersectObjects(pivot.children, true).filter(function (h2) { return h2.object.userData && h2.object.userData.pick != null; });
      opts.onPick(hits.length ? hits[0].object : null);
    });
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') yaw -= 0.2; else if (k === 'ArrowRight') yaw += 0.2;
      else if (k === 'ArrowUp') tilt = Math.max(-1.2, tilt - 0.15); else if (k === 'ArrowDown') tilt = Math.min(1.2, tilt + 0.15);
      else if (k === '1') preset('front'); else if (k === '2') preset('side'); else if (k === '3') preset('top');
      else return;
      e.preventDefault(); e.stopPropagation();
      kick();
    });
    function preset(name) {
      target = typeof name === 'object' && name ? { yaw: name.yaw || 0, tilt: Math.max(-1.2, Math.min(1.2, name.tilt || 0)) }   // or a custom { yaw, tilt }
        : { front: { yaw: 0, tilt: 0 }, side: { yaw: Math.PI / 2, tilt: 0 }, top: { yaw: 0, tilt: 1.2 }, start: { yaw: -0.35, tilt: 0.18 } }[name] || null;
      vYaw = 0;
      kick();
    }
    if (opts.onPick) cv.style.cursor = 'pointer';
    if (opts.presets !== false) {
      var bar = document.createElement('div');
      bar.className = 'tt-presets';
      [['front', 'Front'], ['side', 'Side'], ['top', 'Top']].forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'btn tt-btn'; b.textContent = p[1];
        b.addEventListener('click', function () { preset(p[0]); });
        bar.appendChild(b);
      });
      wrap.appendChild(bar);
    }

    // --- Labels ------------------------------------------------------------------------------------
    function label(id, text, p, opt) {
      if (labelMap[id]) { labelMap[id].el.remove(); delete labelMap[id]; }
      if (text == null) return;
      var el = document.createElement('span');
      el.className = 'tt-label' + (opt && opt.cls ? ' ' + opt.cls : '');
      if (opt && opt.html) el.innerHTML = text; else el.textContent = text;
      labels.appendChild(el);
      labelMap[id] = { el: el, p: p, obj: opt && opt.obj, fixed: opt && opt.fixed };
      kick();
    }
    function clearLabels() { Object.keys(labelMap).forEach(function (k) { label(k, null); }); }

    // --- Ball and stick -----------------------------------------------------------------------------
    var bondMat = new T.MeshStandardMaterial({ color: INK, roughness: 0.5 });
    var lpDot = new T.MeshStandardMaterial({ color: 0xd99a00, roughness: 0.5, emissive: 0x6b4a00, emissiveIntensity: 0.25 });
    var cyl = new T.CylinderGeometry(1, 1, 1, 18);
    function clearGroup(g) {
      while (g.children.length) {
        var c = g.children.pop();
        c.traverse(function (o) { if (o.geometry && o.geometry !== cyl) o.geometry.dispose(); if (o.material && o.material !== bondMat && o.material !== lpDot && !o.material.userData.keep) o.material.dispose(); });
      }
    }
    function placeCylinder(mesh, a, b, r) {
      var A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]);
      var d = B.clone().sub(A), L2 = d.length() || 1e-6;
      mesh.position.copy(A).add(B).multiplyScalar(0.5);
      mesh.scale.set(r, L2, r);
      mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    }
    // Space filling: atoms grow to their van der Waals size; sticks, lone-pair lobes and extras hide
    var VDW = { H: 1.2, B: 1.92, C: 1.7, N: 1.55, O: 1.52, F: 1.47, P: 1.8, S: 1.8, Cl: 1.75, Br: 1.85, I: 1.98, Xe: 2.16, Be: 1.53, Si: 2.1 };
    var space = false, lastMol = null;
    function vdwScale(a) { return (VDW[a.el] || 1.8) * 0.78 / (a.r * 0.82); }
    function applySpace(t) {   // t: 0 ball-and-stick → 1 space filling
      if (!lastMol) return;
      spaceT = t;
      aim();
      lastMol.atoms.forEach(function (A, i) { A.mesh.scale.setScalar(1 + (vdwScale(lastMol.m.atoms[i]) - 1) * t); A.lobes.forEach(function (g) { g.visible = t < 0.5; }); });
      lastMol.sticks.forEach(function (list) { list.forEach(function (cm) { cm.visible = t < 0.5; }); });
      content.visible = t < 0.5;
      // every pinned label (atom letters, angle) hides in space filling and returns after; corner labels stay
      Object.keys(labelMap).forEach(function (k) { if (!labelMap[k].fixed) labelMap[k].el.style.visibility = t < 0.5 ? '' : 'hidden'; });
    }
    function setSpaceFill(on) {
      space = !!on;
      if (space && shapeOn) { shapeOn = false; applyShape(0); }
      var from = space ? 0 : 1, to = space ? 1 : 0;
      animate(450, function (t) { var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; applySpace(from + (to - from) * e); });
      var want = space;
      setTimeout(function () { if (space === want) { applySpace(to); render(); } }, 520);   // lands even if frames are throttled
    }

    // --- Shape mode -------------------------------------------------------------------------------
    var shapeOn = false, shapeOpt = { faces: true }, shapeG = null, shapeT = 0;
    var faceMat = new T.MeshStandardMaterial({ color: 0x4152d9, roughness: 0.7, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false });
    var edgeMat = new T.MeshStandardMaterial({ color: 0x4152d9, roughness: 0.5, transparent: true, opacity: 0 });
    faceMat.userData.keep = edgeMat.userData.keep = true;
    bondMat.transparent = true;
    /** Faces of the convex hull of a few points: each face is its corner indices in order. All in one plane → one face. */
    function hull(P) {
      var V = Gm.v, n = P.length, eps = 0.06, seen = {}, out = [];
      function poly(on, nrm) {
        var o = P[on[0]], u = null;
        for (var q = 1; q < on.length && !u; q++) { var d = V.sub(P[on[q]], o); if (V.len(d) > 1e-3) u = V.norm(d); }
        var w = V.cross(nrm, u);
        var pts = on.map(function (i) { var d = V.sub(P[i], o); return { i: i, x: V.dot(d, u), y: V.dot(d, w) }; })
          .sort(function (a, b) { return a.x - b.x || a.y - b.y; });
        function cr(z, a, b) { return (a.x - z.x) * (b.y - z.y) - (a.y - z.y) * (b.x - z.x); }
        var lo = [], hi = [];
        pts.forEach(function (p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 1e-4) lo.pop(); lo.push(p); });
        pts.slice().reverse().forEach(function (p) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 1e-4) hi.pop(); hi.push(p); });
        return lo.slice(0, -1).concat(hi.slice(0, -1)).map(function (p) { return p.i; });
      }
      for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) for (var k = j + 1; k < n; k++) {
        var nrm = V.cross(V.sub(P[j], P[i]), V.sub(P[k], P[i]));
        if (V.len(nrm) < 1e-3) continue;
        nrm = V.norm(nrm);
        var d0 = V.dot(nrm, P[i]), pos = 0, neg = 0, on = [];
        for (var m = 0; m < n; m++) { var sd = V.dot(nrm, P[m]) - d0; if (sd > eps) pos++; else if (sd < -eps) neg++; else on.push(m); }
        if (pos && neg) continue;
        var key = on.join(',');
        if (seen[key]) continue;
        seen[key] = 1;
        if (!pos && !neg) return [poly(on, nrm)];
        out.push(poly(on, nrm));
      }
      return out;
    }
    function buildShape() {
      if (shapeG) { mol.remove(shapeG); clearGroup(shapeG); }
      shapeG = new T.Group();
      mol.add(shapeG);
      var P = lastMol.m.atoms.map(function (a) { return a.p; }), edges = {};
      function edge(a, b, r) {
        var key = Math.min(a, b) + '-' + Math.max(a, b);
        if (edges[key]) return;
        edges[key] = 1;
        var cm = new T.Mesh(cyl, edgeMat);
        placeCylinder(cm, P[a], P[b], r);
        shapeG.add(cm);
      }
      if (shapeOpt.faces === false) { lastMol.m.bonds.forEach(function (b) { edge(b.a, b.b, 0.11); }); return; }
      hull(P).forEach(function (f) {
        var pos = [];
        for (var q = 1; q + 1 < f.length; q++) [f[0], f[q], f[q + 1]].forEach(function (i) { pos.push(P[i][0], P[i][1], P[i][2]); });
        var g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        g.computeVertexNormals();
        shapeG.add(new T.Mesh(g, faceMat));
        f.forEach(function (i, q) { edge(i, f[(q + 1) % f.length], 0.04); });
      });
    }
    function applyShape(t) {   // t: 0 ball-and-stick → 1 the shape
      shapeT = t;
      faceMat.opacity = 0.22 * t;
      edgeMat.opacity = t;
      bondMat.opacity = 1 - 0.75 * t;
      if (lastMol && !space) lastMol.atoms.forEach(function (A) { A.mesh.scale.setScalar(1 - 0.4 * t); });
      if (shapeG) shapeG.visible = t > 0.001;
    }
    function setShape(on) {
      shapeOn = !!on;
      if (shapeOn && space) { space = false; applySpace(0); }
      if (!lastMol) return;
      if (shapeOn) buildShape();
      var from = shapeT, to = shapeOn ? 1 : 0, want = shapeOn;
      animate(650, function (t) { var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; applyShape(from + (to - from) * e); });
      setTimeout(function () { if (shapeOn === want) { applyShape(to); render(); } }, 720);   // lands even if frames are throttled
    }

    function setMolecule(m, o) {
      o = o || {};
      clearGroup(mol);
      clearLabels();
      var lonesMode = o.lones === undefined ? 'inner' : o.lones;
      var atoms = m.atoms.map(function (a, i) {
        var c = Gm.kit(a.el);
        var mat = new T.MeshStandardMaterial({ color: new T.Color(c[0]).lerp(new T.Color(c[1]), 0.35), roughness: 0.42, metalness: 0.04 });
        var sp = new T.Mesh(new T.SphereGeometry(a.r * 0.82, 32, 22), mat);
        mol.add(sp);
        var deg = m.bonds.filter(function (b) { return b.a === i || b.b === i; }).length;
        var lobes = [];
        if (lonesMode === 'all' || (lonesMode === 'inner' && deg >= 2)) {
          a.lones.forEach(function (d) {
            var g = new T.Group();
            g.add(lobe(d, 1.1, 0.29, 0xffc21a, 0.42));   // lone pair: yellow (negative), like the δ− clouds
            var dn = new T.Vector3(d[0], d[1], d[2]).normalize(), perp = new T.Vector3().crossVectors(dn, Math.abs(dn.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0)).normalize();
            [-1, 1].forEach(function (sgn) {
              var e = new T.Mesh(new T.SphereGeometry(0.06, 14, 10), lpDot);
              e.position.copy(dn.clone().multiplyScalar(0.8)).add(perp.clone().multiplyScalar(0.1 * sgn));
              g.add(e);
            });
            mol.add(g);
            lobes.push(g);
          });
        }
        return { mesh: sp, lobes: lobes };
      });
      var sticks = m.bonds.map(function (b) {
        var list = [];
        for (var k = 0; k < b.order; k++) { var cm = new T.Mesh(cyl, bondMat); mol.add(cm); list.push(cm); }
        return list;
      });
      var P = m.atoms.map(function (a) { return a.p.slice(); });
      // the ball-and-stick sphere: farthest atom centre plus its ball (and a hair); space filling may need more
      radius = Math.max.apply(null, P.map(function (p) { return Math.hypot(p[0], p[1], p[2]); })) + 0.42;
      m.atoms.forEach(function (a, i) {   // shown lone-pair lobes reach past their atom
        if (!atoms[i].lobes.length) return;
        a.lones.forEach(function (d) { var l = Math.hypot(d[0], d[1], d[2]) || 1; radius = Math.max(radius, Math.hypot(P[i][0] + d[0] / l * 1.1, P[i][1] + d[1] / l * 1.1, P[i][2] + d[2] / l * 1.1) + 0.12); });
      });
      spaceExtra = Math.max(0, Math.max.apply(null, P.map(function (p, i) { return Math.hypot(p[0], p[1], p[2]) + (VDW[m.atoms[i].el] || 1.8) * 0.78; })) + 0.4 - radius);   // a little more room: big spheres otherwise reach the corner labels
      size();
      function place(t) {
        var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        var cur = P.map(function (p, i) { var f = o.from ? o.from[i] : p; return [f[0] + (p[0] - f[0]) * e, f[1] + (p[1] - f[1]) * e, f[2] + (p[2] - f[2]) * e]; });
        atoms.forEach(function (A, i) {
          A.mesh.position.set(cur[i][0], cur[i][1], cur[i][2]);
          A.lobes.forEach(function (g) { g.position.copy(A.mesh.position); g.scale.setScalar(Math.max(0.001, e)); });
        });
        m.bonds.forEach(function (b, bi) {
          var a = cur[b.a], c = cur[b.b], n = sticks[bi].length;
          var d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          // offset multiple bonds sideways, in the plane of a neighbouring bond when there is one
          var ref = null;
          m.bonds.some(function (x) { if (x !== b && (x.a === b.a || x.b === b.a)) { var j = x.a === b.a ? x.b : x.a; ref = [cur[j][0] - a[0], cur[j][1] - a[1], cur[j][2] - a[2]]; return true; } return false; });
          var side = Gm.v.cross(d, ref || [0, 0, 1]);
          if (Gm.v.len(side) < 1e-4) side = Gm.v.cross(d, [0, 1, 0]);
          side = Gm.v.norm(Gm.v.cross(side, d));
          sticks[bi].forEach(function (cm, k) {
            var off = (k - (n - 1) / 2) * 0.17;
            placeCylinder(cm, Gm.v.add(a, Gm.v.mul(side, off)), Gm.v.add(c, Gm.v.mul(side, off)), n > 1 ? 0.055 : 0.08);
          });
        });
      }
      place(o.from ? 0 : 1);
      lastMol = { m: m, atoms: atoms, sticks: sticks };
      shapeG = null;
      if (shapeOn) {   // arriving in shape mode: the shape forms once the atoms are in place
        buildShape();
        if (o.from) {
          applyShape(0);
          var after = o.done;
          o.done = function () { if (after) after(); if (shapeOn) setShape(true); };
        } else applyShape(1);
      } else applyShape(0);
      if (space) {   // arriving in space-filling mode: no lift (the spheres would swallow it), just the model
        if (o.from) { place(1); o.from = null; }
        applySpace(1);
        if (o.done) { var dn = o.done; o.done = null; setTimeout(function () { dn(); applySpace(1); render(); }, 0); }
      }
      if (opts.letters !== false) m.atoms.forEach(function (a, i) { label('a' + i, a.el, [0, 0, 0], { obj: atoms[i].mesh, cls: a.el === 'C' ? 'is-dark' : '' }); });
      if (o.from) animate(o.ms || 1500, place, o.done); else render();
    }

    size();
    return {
      THREE: T, content: content, pivot: pivot, scene: scene, camera: camera,
      setMolecule: setMolecule, setSpaceFill: setSpaceFill, isSpaceFill: function () { return space; },
      setShape: setShape, isShape: function () { return shapeOn; }, shapeOptions: function (o) { shapeOpt = o || { faces: true }; }, label: label, clearLabels: clearLabels, preset: preset, animate: animate,
      setRadius: function (r) { radius = r; size(); },
      /** A dashed-looking arc between two bond directions at centre c, labelled with the angle. */
      angleArc: function (c, v1, v2, text, id) {
        var a = new T.Vector3(v1[0], v1[1], v1[2]).normalize(), b = new T.Vector3(v2[0], v2[1], v2[2]).normalize();
        var ang = a.angleTo(b), axis = new T.Vector3().crossVectors(a, b);
        if (axis.length() < 1e-6) axis = new T.Vector3().crossVectors(a, Math.abs(a.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0));
        axis.normalize();
        var R = 0.62, pts = [];
        for (var i = 0; i <= 32; i++) pts.push(a.clone().applyAxisAngle(axis, ang * i / 32).multiplyScalar(R).add(new T.Vector3(c[0], c[1], c[2])));
        var tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, 0.018, 8, false), new T.MeshBasicMaterial({ color: 0x4152d9 }));
        content.add(tube);
        var mid = a.clone().applyAxisAngle(axis, ang / 2).multiplyScalar(R + 0.32).add(new T.Vector3(c[0], c[1], c[2]));
        label(id || 'arc', text, [mid.x, mid.y, mid.z], { cls: 'is-angle' });
        kick();
        return tube;
      },
      clear: function () { clearGroup(mol); clearGroup(content); clearLabels(); render(); },
      /** Hide or show the ball-and-stick molecule (and its atom letters), leaving content in place. */
      showMolecule: function (on) {
        mol.visible = !!on;
        Object.keys(labelMap).forEach(function (k) { var L = labelMap[k]; if (L.obj && L.obj.parent === mol) L.el.style.display = on ? '' : 'none'; });
        kick();
      },
      render: function () { kick(); },
      settle: function () { anims.forEach(function (a) { a.step(1); if (a.done) a.done(); }); anims = []; render(); },
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        clearGroup(mol); clearGroup(content);
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        wrap.remove();
      },
    };
  }

  global.Turntable = { create: create, lobe: lobe, lobeGeometry: lobeGeometry, lobeProfile: lobeProfile };
})(window);
