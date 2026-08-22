// XniperBuilds site — header scroll state, mobile menu, scroll reveals.
(function () {
  var head = document.querySelector('.site-head');
  var onScroll = function () {
    if (!head) return;
    head.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var btn = document.querySelector('.menu-btn');
  var links = document.querySelector('.nav-links');
  if (btn && links) {
    btn.addEventListener('click', function () { links.classList.toggle('open'); });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // Point download buttons straight at the file instead of at a releases page.
  //
  // Every such button ships pointing at .../releases/latest, which always
  // works. This upgrades it to the actual installer or APK so a click starts
  // the download where the visitor already is, rather than handing them a
  // GitHub page and asking them to find the right file among several.
  //
  // The asset name carries the version, so it cannot be hardcoded - it is
  // read from the release. If GitHub is slow, rate-limited or unreachable,
  // nothing is changed and the original link is still there. That is the
  // whole reason the href starts out valid rather than empty.
  var buttons = document.querySelectorAll('[data-dl]');
  if (!buttons.length || !window.fetch) return;

  var byRepo = {};
  buttons.forEach(function (el) {
    var repo = el.getAttribute('data-dl');
    (byRepo[repo] = byRepo[repo] || []).push(el);
  });

  var mb = function (bytes) { return (bytes / 1048576).toFixed(1) + ' MB'; };

  Object.keys(byRepo).forEach(function (repo) {
    fetch('https://api.github.com/repos/' + repo + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (rel) {
        byRepo[repo].forEach(function (el) {
          var prefix = el.getAttribute('data-dl-match') || '';
          var asset = (rel.assets || []).filter(function (a) {
            return a.name.indexOf(prefix) === 0;
          })[0];
          if (!asset) return;
          el.href = asset.browser_download_url;
          el.setAttribute('download', '');

          // Say what is about to arrive. Someone who can see the version and
          // the size before clicking is not being asked to trust a blind link.
          //
          // The selector is checked before use: querySelector('') throws, and
          // a throw here would abandon every button after this one - which is
          // exactly what happened the first time this was written.
          var sel = el.getAttribute('data-dl-note');
          var note = sel ? document.querySelector(sel) : null;
          if (note) {
            note.textContent = (rel.tag_name || '') + ' · ' + mb(asset.size);
          }
        });
      })
      .catch(function () { /* the releases link it shipped with still works */ });
  });
})();
