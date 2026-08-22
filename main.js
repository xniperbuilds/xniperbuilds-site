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

  // Say which version and how big, under the download buttons.
  //
  // The buttons themselves need nothing from this. Each one points at
  //   github.com/<repo>/releases/latest/download/<stable name>
  // which GitHub redirects to whichever release is newest, straight to its
  // CDN. No API, so nothing here can be rate-limited, and a click works with
  // JavaScript switched off entirely.
  //
  // That matters more than it sounds. The first version of this asked
  // api.github.com for the asset URL, because the file name carried the
  // version and could not be written down in advance. That API allows 60
  // calls an hour PER IP - and behind a mobile carrier, thousands of people
  // share one. Sixty visitors from that carrier in an hour and the sixty-first
  // gets a refusal: exactly the moment a promotion is working is the moment
  // the button would stop leading to a file. The fix was on the release side,
  // not here - every release now also carries a copy under a name that never
  // changes, so the URL can simply be written in the page.
  //
  // What is left is decoration: the version and the size, so nobody is asked
  // to trust a blind link. If it does not arrive, the note stays empty and the
  // download is unaffected.
  var notes = document.querySelectorAll('[data-dl]');
  if (!notes.length || !window.fetch) return;

  var byRepo = {};
  notes.forEach(function (el) {
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
          // The selector is checked before use: querySelector('') throws, and
          // a throw here would abandon every button after this one - which is
          // exactly what happened the first time this was written.
          var sel = el.getAttribute('data-dl-note');
          var note = sel ? document.querySelector(sel) : null;
          if (!note) return;

          var name = el.getAttribute('data-dl-file') || '';
          var asset = (rel.assets || []).filter(function (a) {
            return a.name === name;
          })[0];
          note.textContent = (rel.tag_name || '') +
            (asset ? ' · ' + mb(asset.size) : '');
        });
      })
      .catch(function () { /* the button is a plain link; it does not need us */ });
  });
})();
