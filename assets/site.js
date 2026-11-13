'use strict';

const input = document.querySelector('#search');
if (input) {
  const results = document.querySelector('#search-results');
  const list = document.querySelector('#search-list');
  const status = document.querySelector('#search-status');
  const catalogue = document.querySelector('#catalogue');
  const normalize = (text) => text.toLowerCase().replaceAll('ё', 'е');
  const indexScript = document.createElement('script');
  indexScript.src = 'assets/search-index.js?v=' + document.currentScript.dataset.searchVersion;
  indexScript.addEventListener('load', update);
  indexScript.addEventListener('error', () => {
    status.textContent = 'Поиск недоступен. Выберите тему в каталоге ниже.';
    catalogue.hidden = false;
  });
  document.head.append(indexScript);

  function update() {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    results.hidden = words.length === 0;
    catalogue.hidden = words.length > 0 && typeof topicIndex !== 'undefined';
    list.replaceChildren();
    if (!words.length) return;
    if (typeof topicIndex === 'undefined') {
      status.textContent = 'Загрузка поиска…';
      return;
    }
    const matches = topicIndex.map((item) => {
      const title = normalize(item.title);
      const summary = normalize(item.description + ' ' + item.group + ' ' + item.headings);
      const text = normalize(item.text);
      let score = 0;
      for (const word of words) {
        if (title.includes(word)) score += 6;
        else if (summary.includes(word)) score += 3;
        else if (text.includes(word)) score += 1;
        else return { item, score: 0 };
      }
      return { item, score };
    }).filter((match) => match.score).sort((a, b) => b.score - a.score);
    status.textContent = matches.length ? 'Найдено тем: ' + matches.length : 'Темы не найдены. Попробуйте другой запрос.';
    for (const { item } of matches) {
      const row = document.createElement('li');
      const link = document.createElement('a');
      const name = document.createElement('strong');
      const detail = document.createElement('span');
      link.href = item.url;
      name.textContent = item.title;
      detail.textContent = item.group + ' · ' + item.description;
      link.append(name, detail);
      row.append(link);
      list.append(row);
    }
  }

  document.querySelectorAll('a[href$="#semester-1"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (!catalogue.hidden) return;
      input.value = '';
      update();
    });
  });
  input.addEventListener('input', update);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const first = list.querySelector('a');
      if (first) location.href = first.href;
    }
    if (event.key === 'Escape') {
      input.value = '';
      update();
    }
  });
  document.addEventListener('keydown', (event) => {
    if ((event.key === '/' && !event.metaKey && !event.ctrlKey &&
         !event.target.closest('input, textarea, select, [contenteditable]')) ||
        (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey))) {
      event.preventDefault();
      input.focus();
    }
  });
}

document.querySelectorAll('[data-copy]').forEach((button) => {
  if (!navigator.clipboard) {
    button.hidden = true;
    return;
  }
  button.addEventListener('click', async () => {
    const code = button.closest('.code-block').querySelector('code');
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Скопировано';
    } catch {
      button.textContent = 'Выделите код вручную';
    }
    window.setTimeout(() => { button.textContent = 'Копировать'; }, 1800);
  });
});

const figures = document.querySelectorAll('.note-figure > a');
if (figures.length && typeof HTMLDialogElement !== 'undefined') {
  const viewer = document.createElement('dialog');
  viewer.className = 'image-viewer';
  viewer.setAttribute('aria-labelledby', 'image-viewer-title');
  viewer.innerHTML = `
    <header class="image-viewer-bar">
      <h2 id="image-viewer-title"></h2>
      <div class="image-viewer-controls">
        <button type="button" data-zoom="out" aria-label="Уменьшить">−</button>
        <button type="button" data-zoom="fit" aria-label="Уместить изображение">По окну</button>
        <button type="button" data-zoom="in" aria-label="Увеличить">+</button>
        <a target="_blank" rel="noopener">Оригинал</a>
        <button type="button" data-close aria-label="Закрыть просмотр" autofocus>×</button>
      </div>
    </header>
    <div class="image-viewer-stage" tabindex="0" aria-label="Изображение с прокруткой">
      <img alt="">
    </div>
  `;
  const stage = viewer.querySelector('.image-viewer-stage');
  const image = stage.querySelector('img');
  const title = viewer.querySelector('h2');
  const original = viewer.querySelector('a');
  const zoomIn = viewer.querySelector('[data-zoom="in"]');
  const zoomOut = viewer.querySelector('[data-zoom="out"]');
  const reset = viewer.querySelector('[data-zoom="fit"]');
  const scales = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
  let step = 0;

  function resizeImage() {
    if (!viewer.open || !image.naturalWidth) return;
    const fit = Math.min(
      (stage.clientWidth - 32) / image.naturalWidth,
      (stage.clientHeight - 32) / image.naturalHeight,
      1,
    );
    const width = Math.max(1, image.naturalWidth * fit * scales[step]);
    image.style.width = width + 'px';
    zoomIn.disabled = step === scales.length - 1 || width >= Math.max(image.naturalWidth, stage.clientWidth * 2);
    zoomOut.disabled = step === 0;
    reset.disabled = step === 0;
  }

  function setZoom(next) {
    if (next < 0 || next >= scales.length) return;
    step = next;
    resizeImage();
    if (step === 0) stage.scrollTo(0, 0);
  }

  image.addEventListener('load', resizeImage);
  zoomIn.addEventListener('click', () => setZoom(step + 1));
  zoomOut.addEventListener('click', () => setZoom(step - 1));
  reset.addEventListener('click', () => setZoom(0));
  viewer.querySelector('[data-close]').addEventListener('click', () => viewer.close());
  window.addEventListener('resize', resizeImage);
  document.body.append(viewer);

  for (const link of figures) {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const thumbnail = link.querySelector('img');
      title.textContent = thumbnail.alt;
      image.alt = thumbnail.alt;
      original.href = link.href;
      image.src = link.href;
      viewer.showModal();
      setZoom(0);
    });
  }
}
