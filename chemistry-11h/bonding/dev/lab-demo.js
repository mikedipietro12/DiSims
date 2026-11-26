// Draw Lab screenshot states (dev only): run.html?page=lab.html&test=lab-demo.js&m=ch4&demo=start|full|3d|big[&table=1]
(function () {
  window.addEventListener('load', function () {
    var demo = (location.search.match(/demo=(\w+)/) || [])[1] || 'full';
    var Lab = window.DrawLab, e = Lab.engine(), id = Lab.state().cur;
    if (/table=1/.test(location.search)) e.setTable(true);   // &table=1: the atom table open
    if (demo === 'start') {   // one electron on C, one H waiting: the corner counts
      e.restore({ atoms: [{ el: 'C', x: 0, y: 0, slots: [0, 0, 0, 0, 0, 0, 1, 0] }, { el: 'H', x: 2, y: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0] }], bonds: [], transfers: [] });
      return;
    }
    e.load(window.BondingKit.structure(id === 'blank' ? 'ch4' : id));
    if (demo === '3d' || demo === 'big') Lab.open3d(true);
    if (demo === 'big') document.getElementById('labBig').click();
  });
})();
