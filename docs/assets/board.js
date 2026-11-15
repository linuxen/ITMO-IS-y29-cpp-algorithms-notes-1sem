'use strict';

(() => {
  const canvas = document.querySelector('[data-board]');
  const topic = document.querySelector('[data-board-topic]');
  const zoomIn = document.querySelector('[data-board-action="in"]');
  const zoomOut = document.querySelector('[data-board-action="out"]');
  const tiles = Array.from(canvas.querySelectorAll('image'), (image) => ({
    image,
    x: image.x.baseVal.value,
    y: image.y.baseVal.value,
    width: image.width.baseVal.value,
    height: image.height.baseVal.value,
  }));
  const byTopic = new Map(tiles.map((tile) => [tile.image.id, tile]));
  const bounds = {
    x: Math.min(...tiles.map(({x}) => x)),
    y: Math.min(...tiles.map(({y}) => y)),
  };
  bounds.width = Math.max(...tiles.map(({x, width}) => x + width)) - bounds.x;
  bounds.height = Math.max(...tiles.map(({y, height}) => y + height)) - bounds.y;

  const points = new Map();
  const maxScale = 3;
  let scale;
  let center;
  let overview = false;
  let frame = 0;

  function fitScale(rect) {
    return Math.min(canvas.clientWidth / (rect.width + 80), canvas.clientHeight / (rect.height + 80));
  }

  function render() {
    frame = 0;
    const width = canvas.clientWidth / scale;
    const height = canvas.clientHeight / scale;
    const x = center.x - width / 2;
    const y = center.y - height / 2;
    canvas.setAttribute('viewBox', [x, y, width, height].join(' '));
    for (const tile of tiles) {
      if (tile.image.hasAttribute('href')) continue;
      if (tile.x < x + width && tile.x + tile.width > x && tile.y < y + height && tile.y + tile.height > y) {
        tile.image.setAttribute('href', tile.image.dataset.src);
      }
    }
    zoomIn.disabled = scale >= maxScale;
    zoomOut.disabled = scale <= fitScale(bounds);
  }

  function scheduleRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function fit(rect) {
    scale = Math.min(fitScale(rect), maxScale);
    center = {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2};
    scheduleRender();
  }

  function zoom(factor, x = canvas.clientWidth / 2, y = canvas.clientHeight / 2) {
    const old = scale;
    scale = Math.max(fitScale(bounds), Math.min(maxScale, scale * factor));
    center.x += (x - canvas.clientWidth / 2) * (1 / old - 1 / scale);
    center.y += (y - canvas.clientHeight / 2) * (1 / old - 1 / scale);
    overview = false;
    scheduleRender();
  }

  function pan(dx, dy) {
    overview = false;
    center.x -= dx / scale;
    center.y -= dy / scale;
    scheduleRender();
  }

  function localPoint(event) {
    const {left, top} = canvas.getBoundingClientRect();
    return {x: event.clientX - left, y: event.clientY - top};
  }

  zoomIn.addEventListener('click', () => zoom(1.5));
  zoomOut.addEventListener('click', () => zoom(1 / 1.5));
  document.querySelector('[data-board-action="all"]').addEventListener('click', () => {
    overview = true;
    fit(bounds);
  });
  topic.addEventListener('change', () => {
    if (!topic.value) return;
    overview = false;
    fit(byTopic.get(topic.value));
    topic.value = '';
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || points.size === 2) return;
    canvas.setPointerCapture(event.pointerId);
    points.set(event.pointerId, localPoint(event));
    canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', (event) => {
    const previous = points.get(event.pointerId);
    if (!previous) return;
    const next = localPoint(event);
    points.set(event.pointerId, next);
    if (points.size === 1) {
      pan(next.x - previous.x, next.y - previous.y);
      return;
    }
    const other = [...points].find(([id]) => id !== event.pointerId)[1];
    const oldDistance = Math.hypot(previous.x - other.x, previous.y - other.y);
    const newDistance = Math.hypot(next.x - other.x, next.y - other.y);
    pan((next.x - previous.x) / 2, (next.y - previous.y) / 2);
    if (oldDistance && newDistance) zoom(newDistance / oldDistance, (next.x + other.x) / 2, (next.y + other.y) / 2);
  });
  canvas.addEventListener('lostpointercapture', (event) => {
    points.delete(event.pointerId);
    if (!points.size) canvas.classList.remove('dragging');
  });

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
    if (event.ctrlKey || event.metaKey) {
      const {x, y} = localPoint(event);
      zoom(Math.exp(-event.deltaY * unit * 0.009), x, y);
    } else {
      pan(-event.deltaX * unit, -event.deltaY * unit);
    }
  }, {passive: false});

  canvas.addEventListener('keydown', (event) => {
    const offsets = {ArrowUp: [0, 64], ArrowDown: [0, -64], ArrowLeft: [64, 0], ArrowRight: [-64, 0]};
    if (Object.hasOwn(offsets, event.key)) pan(...offsets[event.key]);
    else if (event.key === '+' || event.key === '=') zoom(1.5);
    else if (event.key === '-') zoom(1 / 1.5);
    else return;
    event.preventDefault();
  });

  fit(tiles[0]);
  new ResizeObserver(() => {
    if (overview) fit(bounds);
    else if (scale < fitScale(bounds)) fit(bounds);
    else scheduleRender();
  }).observe(canvas);
})();
