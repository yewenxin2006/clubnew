(function () {
  'use strict';

  var PER_PAGE = 3;
  var currentPage = 0;
  var listEl = document.getElementById('project-list');
  var prevBtn = document.getElementById('pag-prev');
  var nextBtn = document.getElementById('pag-next');
  var indicatorEl = document.getElementById('pag-indicator');
  var overlay = document.getElementById('project-detail-overlay');
  var closeBtn = document.getElementById('pd-close');

  if (!listEl || !PROJECTS_DATA) return;

  var totalPages = Math.ceil(PROJECTS_DATA.length / PER_PAGE);

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderPage() {
    var start = currentPage * PER_PAGE;
    var end = Math.min(start + PER_PAGE, PROJECTS_DATA.length);
    var html = '';

    for (var i = start; i < end; i++) {
      var p = PROJECTS_DATA[i];
      html += '<article class="project-item" data-index="' + i + '" tabindex="0" role="button" aria-label="' + esc(p.title) + '">';
      html += '<div class="project-meta">' + esc(p.year) + '</div>';
      html += '<div class="project-body">';
      html += '<h3>' + esc(p.title) + '</h3>';
      html += '<p>' + esc(p.desc) + '</p>';
      html += '<ul class="tags">';
      p.tags.forEach(function (t) { html += '<li>' + esc(t) + '</li>'; });
      html += '</ul>';
      if (p.file) html += '<span class="project-dl-hint">DOWNLOAD</span>';
      html += '</div></article>';
    }

    listEl.innerHTML = html;
    indicatorEl.textContent = (currentPage + 1) + ' / ' + totalPages;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
  }

  function openDetail(index) {
    var p = PROJECTS_DATA[index];
    if (!p) return;
    document.getElementById('pd-year').textContent = p.year;
    document.getElementById('pd-title').textContent = p.title;
    document.getElementById('pd-desc').textContent = p.desc;
    var tagsEl = document.getElementById('pd-tags');
    tagsEl.innerHTML = p.tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    var actionsEl = document.getElementById('pd-actions');
    if (p.file) {
      actionsEl.innerHTML = '<a class="button button--solid" href="' + esc(p.file) + '" download>Download</a>';
    } else {
      actionsEl.innerHTML = '';
    }
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  prevBtn.addEventListener('click', function () {
    if (currentPage > 0) { currentPage--; renderPage(); }
  });

  nextBtn.addEventListener('click', function () {
    if (currentPage < totalPages - 1) { currentPage++; renderPage(); }
  });

  listEl.addEventListener('click', function (e) {
    var item = e.target.closest('.project-item');
    if (item) openDetail(Number(item.getAttribute('data-index')));
  });

  listEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      var item = e.target.closest('.project-item');
      if (item) { e.preventDefault(); openDetail(Number(item.getAttribute('data-index'))); }
    }
  });

  closeBtn.addEventListener('click', closeDetail);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeDetail();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeDetail();
  });

  renderPage();
})();
