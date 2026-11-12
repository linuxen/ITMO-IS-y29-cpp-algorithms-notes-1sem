'use strict';

const alphabet = 'ABCDEFG';
const graphNodes = [[.12,.47], [.34,.22], [.34,.76], [.59,.17], [.59,.52], [.59,.84], [.85,.49]];
const graphEdges = [[0,1,2], [0,2,5], [1,3,4], [1,4,2], [2,4,1], [2,5,3], [3,6,2], [4,6,3], [5,6,1]];
const print = (values) => values.length ? values.join(' · ') : '∅';
const names = (vertices) => print(vertices.map((vertex) => alphabet[vertex]));
const distanceText = (values) => values.map((value, i) => alphabet[i] + ' ' + finite(value)).join(' · ');
const finite = (value) => Number.isFinite(value) ? String(value) : '∞';

function adjacency(count, edges, directed = false) {
  const neighbors = Array.from({ length: count }, () => []);
  edges.forEach(([a, b, weight], id) => {
    neighbors[a].push({ to: b, weight, id });
    if (!directed) neighbors[b].push({ to: a, weight, id });
  });
  return neighbors;
}

function traversal(mode, { start }) {
  const frames = [];
  const neighbors = adjacency(7, graphEdges);
  const seen = new Set([start]);
  const order = [start];
  const pending = [start];
  const distances = Array(7).fill(Infinity);
  distances[start] = 0;
  const tree = [];
  const bfs = mode === 'BFS';
  const save = (message, active, activeEdge) => frames.push({
    message, detail: (bfs ? 'Очередь' : 'Стек') + ' ' + names(pending) + '   |   Открыты ' + names(order),
    nodes: graphNodes, edges: graphEdges, active: [active], seen: [...seen],
    marked: [...tree], activeEdge, nodeLabels: bfs ? distances.map(finite) : [],
  });
  save('Стартуем из вершины ' + alphabet[start] + '.', start);
  if (bfs) {
    while (pending.length) {
      const from = pending.shift();
      save('Извлекаем ' + alphabet[from] + ' из очереди.', from);
      for (const { to, id } of neighbors[from]) {
        if (seen.has(to)) continue;
        seen.add(to);
        order.push(to);
        pending.push(to);
        distances[to] = distances[from] + 1;
        tree.push(id);
        save('Добавляем ' + alphabet[to] + ' с расстоянием ' + distances[to] + '.', to, id);
      }
    }
  } else {
    const visit = (from) => {
      for (const { to, id } of neighbors[from]) {
        if (seen.has(to)) continue;
        seen.add(to);
        order.push(to);
        pending.push(to);
        tree.push(id);
        save('Углубляемся по ребру ' + alphabet[from] + ' → ' + alphabet[to] + '.', to, id);
        visit(to);
      }
      pending.pop();
      save('Завершаем обработку ' + alphabet[from] + ' и выходим из её кадра.', pending.at(-1));
    };
    visit(start);
  }
  save('Обход завершён.', undefined);
  return frames;
}

function dijkstra(_, { start }) {
  const frames = [];
  const distances = Array(7).fill(Infinity);
  const parent = Array(7).fill(-1);
  const settled = new Set();
  const neighbors = adjacency(7, graphEdges);
  distances[start] = 0;
  const save = (message, active, activeEdge) => frames.push({
    message, detail: distanceText(distances), nodes: graphNodes, edges: graphEdges,
    edgeLabels: graphEdges.map((edge) => edge[2]), nodeLabels: distances.map(finite),
    active: [active], seen: [...settled], marked: [...parent], activeEdge,
  });
  save('Ставим расстояние до ' + alphabet[start] + ' равным 0.', start);
  while (settled.size < distances.length) {
    const from = distances.reduce((best, value, i) => (
      !settled.has(i) && (best < 0 || value < distances[best]) ? i : best
    ), -1);
    if (from < 0 || !Number.isFinite(distances[from])) break;
    settled.add(from);
    save('Фиксируем вершину ' + alphabet[from] + ' с минимумом ' + distances[from] + '.', from);
    for (const { to, weight, id } of neighbors[from]) {
      if (settled.has(to)) continue;
      const candidate = distances[from] + weight;
      const improves = candidate < distances[to];
      if (improves) {
        distances[to] = candidate;
        parent[to] = id;
      }
      const edge = alphabet[from] + ' → ' + alphabet[to];
      save(improves ? edge + ' улучшает оценку до ' + candidate + '.' :
        edge + ' даёт ' + candidate + '. Текущая оценка ' + distances[to] + ' уже не больше.', to, id);
    }
  }
  save('Все достижимые расстояния найдены.');
  return frames;
}

function topological(mode) {
  const cyclic = mode === 'С циклом';
  const edges = [[0,2], [1,2], [1,3], [2,4], [3,4], [4,5]];
  if (cyclic) edges.push([5, 1]);
  const nodes = [[.12,.27], [.12,.72], [.36,.25], [.36,.75], [.63,.49], [.87,.49]];
  const neighbors = adjacency(nodes.length, edges, true);
  const degree = Array(nodes.length).fill(0);
  for (const [,to] of edges) degree[to]++;
  const queue = degree.flatMap((count, i) => count === 0 ? [i] : []);
  const removed = [];
  const order = [];
  const frames = [];
  const save = (message, active) => frames.push({
    message, detail: 'Готовы ' + names(queue) + '   |   Порядок ' + names(order) +
      '   |   Степени ' + distanceText(degree),
    nodes, edges, directed: true, nodeLabels: degree.map(String), dim: [...removed],
    active: [active], seen: [...order],
  });
  save('В очередь попадают вершины с входящей степенью 0.');
  while (queue.length) {
    const from = queue.shift();
    order.push(from);
    for (const { to, id } of neighbors[from]) {
      degree[to]--;
      removed.push(id);
      if (degree[to] === 0) queue.push(to);
    }
    save('Обработали ' + alphabet[from] + ' и убрали её исходящие рёбра.', from);
  }
  save(order.length === nodes.length ? 'Топологический порядок готов.' :
    'Очередь пуста, остались вершины с входящими рёбрами. Есть цикл.');
  return frames;
}

function kruskal() {
  const parent = graphNodes.map((_, i) => i);
  const find = (i) => {
    while (i !== parent[i]) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const edges = graphEdges;
  const sorted = edges.map((_, i) => i).sort((a, b) => edges[a][2] - edges[b][2]);
  const picked = [], skipped = [], frames = [];
  let total = 0;
  const save = (message, activeEdge) => frames.push({
    message, detail: 'Вес остова ' + total + '   |   Рёбра ' +
      print(picked.map((id) => alphabet[edges[id][0]] + '–' + alphabet[edges[id][1]])),
    nodes: graphNodes, edges, edgeLabels: edges.map((edge) => edge[2]), activeEdge,
    marked: [...picked], dim: [...skipped],
  });
  save('Перебираем рёбра по неубыванию веса.');
  for (const id of sorted) {
    const [a, b, weight] = edges[id];
    const edge = alphabet[a] + '–' + alphabet[b];
    const first = find(a);
    const second = find(b);
    if (first === second) {
      skipped.push(id);
      save('Пропускаем ' + edge + ': получилось бы кольцо.', id);
    } else {
      parent[first] = second;
      picked.push(id);
      total += weight;
      save('Берём ' + edge + ' веса ' + weight + ': оно соединяет две компоненты.', id);
    }
  }
  save('Минимальный остов построен.');
  return frames;
}

function flow(mode) {
  const names = ['s','A','B','C','D','t'];
  const nodes = [[.09,.5], [.30,.23], [.30,.78], [.69,.23], [.69,.78], [.91,.5]];
  const edges = [[0,1,1],[0,2,1],[1,3,1],[1,4,1],[2,3,1],[3,5,1],[4,5,1]];
  if (mode === 'Ёмкости 2') edges.forEach((edge, i) => { if ([0,2,5].includes(i)) edge[2] = 2; });
  const flows = Array(edges.length).fill(0);
  const frames = [];
  let value = 0;
  const save = (message, path = []) => frames.push({
    message, detail: 'Поток ' + value + '   |   Метки: поток / ёмкость' +
      (path.length ? '   |   Путь ' + path.map((edge) => names[edge.from]).concat('t').join(' → ') : ''),
    nodes, names, edges, directed: true,
    edgeLabels: edges.map((edge, i) => flows[i] + '/' + edge[2]),
    marked: flows.flatMap((amount, i) => amount > 0 ? [i] : []),
    path: path.map(({ id, direction }) => [id, direction]),
  });
  save('Начинаем с нулевого потока.');
  const residual = (from) => edges.flatMap(([a, b, cap], id) => {
    if (a === from && cap > flows[id]) return [{ from, to: b, id, direction: 1, capacity: cap - flows[id] }];
    if (b === from && flows[id] > 0) return [{ from, to: a, id, direction: -1, capacity: flows[id] }];
    return [];
  });
  while (true) {
    const parents = [true, null, null, null, null, null];
    const queue = [0];
    while (queue.length && !parents[5]) {
      for (const edge of residual(queue.shift())) {
        if (parents[edge.to]) continue;
        parents[edge.to] = edge;
        queue.push(edge.to);
      }
    }
    if (!parents[5]) break;
    const path = [];
    for (let v = 5; v !== 0; v = parents[v].from) path.unshift(parents[v]);
    const added = Math.min(...path.map((edge) => edge.capacity));
    const backward = path.some((edge) => edge.direction < 0);
    save(backward ? 'BFS нашёл путь через обратное остаточное ребро.' :
      'BFS нашёл увеличивающий путь.', path);
    for (const { id, direction } of path) flows[id] += direction * added;
    value += added;
    save('Меняем поток вдоль пути на ' + added + '.', path);
  }
  save('Увеличивающих путей нет. Максимальный поток равен ' + value + '.');
  return frames;
}

function sorting(mode, { numbers }) {
  const values = [...numbers];
  const frames = [];
  const done = [];
  const save = (message, active = []) => frames.push({
    message, detail: 'Массив ' + print(values), bars: [...values], active, seen: [...done],
  });
  save('Исходный массив. Сделайте первый шаг.');
  if (mode === 'Вставки') {
    done.push(0);
    for (let i = 1; i < values.length; i++) {
      let j = i;
      while (j > 0) {
        save('Сравниваем ' + values[j - 1] + ' и ' + values[j] + '.', [j - 1, j]);
        if (values[j - 1] <= values[j]) break;
        [values[j - 1], values[j]] = [values[j], values[j - 1]];
        save('Сдвигаем больший элемент вправо.', [j - 1, j]);
        j--;
      }
      done.push(i);
      save('Префикс до позиции ' + i + ' упорядочен.', [j]);
    }
  } else if (mode === 'Слияние') {
    for (let size = 1; size < values.length; size *= 2) {
      for (let lo = 0; lo + size < values.length; lo += 2 * size) {
        const mid = lo + size;
        const hi = Math.min(lo + 2 * size, values.length);
        const left = values.slice(lo, mid);
        const right = values.slice(mid, hi);
        let a = 0, b = 0;
        save('Сливаем [' + lo + ', ' + mid + ') и [' + mid + ', ' + hi + ').',
          Array.from({ length: hi - lo }, (_, i) => i + lo));
        for (let i = lo; i < hi; i++) {
          const fromLeft = b === right.length || (a < left.length && left[a] <= right[b]);
          values[i] = fromLeft ? left[a++] : right[b++];
          save('Записываем ' + values[i] + ' в позицию ' + i + '.', [i]);
        }
      }
    }
  } else {
    const quick = (lo, hi) => {
      if (lo > hi) return;
      if (lo === hi) {
        done.push(lo);
        return;
      }
      const pivot = values[hi];
      let boundary = lo;
      save('Опорный элемент ' + pivot + ' на позиции ' + hi + '.', [hi]);
      for (let j = lo; j < hi; j++) {
        save('Сравниваем ' + values[j] + ' с ' + pivot + '.', [j, hi]);
        if (values[j] <= pivot) {
          [values[boundary], values[j]] = [values[j], values[boundary]];
          save('Помещаем элемент в левую часть.', [boundary++, hi]);
        }
      }
      [values[boundary], values[hi]] = [values[hi], values[boundary]];
      done.push(boundary);
      save('Опорный элемент встал на позицию ' + boundary + '.', [boundary]);
      quick(lo, boundary - 1);
      quick(boundary + 1, hi);
    };
    quick(0, values.length - 1);
  }
  save('Массив отсортирован.');
  frames.at(-1).seen = values.map((_, i) => i);
  return frames;
}

function linear(mode, { numbers }) {
  const values = [];
  const removed = [];
  const frames = [];
  const save = (message, active = []) => frames.push({
    message, detail: 'Содержимое ' + print(values) + '   |   Извлечены ' + print(removed),
    rows: [{ values: [...values], active }],
  });
  save(mode === 'Стек' ? 'Вершина стека справа.' : 'Начало очереди слева, добавляем справа.');
  for (const value of numbers) {
    values.push(value);
    save('Добавили ' + value + '.', [values.length - 1]);
  }
  while (values.length) {
    const value = mode === 'Стек' ? values.pop() : values.shift();
    removed.push(value);
    save('Извлекли ' + value + '.');
  }
  return frames;
}

function heap(mode, { numbers }) {
  const values = [...numbers];
  const frames = [];
  const coords = [[.50,.18], [.27,.46], [.73,.46], [.13,.77], [.38,.77], [.62,.77], [.87,.77]];
  const save = (message, active = []) => frames.push({
    message, detail: 'Массив кучи ' + print(values), nodes: coords.slice(0, values.length),
    names: values.map(String), edges: values.slice(1).map((_, i) => [Math.floor(i / 2), i + 1]), active,
  });
  const siftDown = (index) => {
    while (index * 2 + 1 < values.length) {
      let child = index * 2 + 1;
      if (child + 1 < values.length && values[child + 1] < values[child]) child++;
      save('Сравниваем родителя с меньшим ребёнком.', [index, child]);
      if (values[index] <= values[child]) break;
      [values[index], values[child]] = [values[child], values[index]];
      save('Меняем местами родителя и ребёнка.', [index, child]);
      index = child;
    }
  };
  save('Массив представлен как полное двоичное дерево.');
  for (let i = Math.floor(values.length / 2) - 1; i >= 0; i--) {
    save('Просеиваем вниз узел с индексом ' + i + '.', [i]);
    siftDown(i);
  }
  save('Min-heap готова. В корне минимум ' + values[0] + '.', [0]);
  if (mode === 'Извлечь минимум') {
    const minimum = values[0];
    values[0] = values.pop();
    save('Удалили ' + minimum + ' и перенесли последний элемент в корень.', [0]);
    siftDown(0);
    save('Свойство кучи восстановлено.', [0]);
  }
  return frames;
}

function dynamic(mode, { target }) {
  const coins = mode === '1, 3, 4' ? [1, 3, 4] : [2, 5, 7];
  const dp = Array(target + 1).fill(Infinity);
  const frames = [];
  dp[0] = 0;
  const save = (message, filled, active, from = []) => frames.push({
    message, detail: 'dp[' + active + '] = ' + finite(dp[active]) + '   |   Монеты ' + print(coins),
    rows: [{ values: dp.map((value, i) => i > filled ? '·' : finite(value)),
      labels: dp.map((_, i) => i), active: [active], seen: from }],
  });
  save('База: для суммы 0 нужно 0 монет.', 0, 0);
  for (let sum = 1; sum <= target; sum++) {
    const from = coins.filter((coin) => coin <= sum && Number.isFinite(dp[sum - coin])).map((coin) => sum - coin);
    dp[sum] = Math.min(...from.map((i) => dp[i] + 1));
    save(from.length ? 'Выбираем минимум по достижимым предыдущим суммам.' :
      'Сумма ' + sum + ' недостижима этими монетами.', sum, sum, from);
  }
  save(Number.isFinite(dp[target]) ? 'Минимум для суммы ' + target + ': ' + dp[target] + '.' :
    'Целевая сумма недостижима.', target, target);
  return frames;
}

function kmp(_, options) {
  const pattern = Array.from(options.pattern);
  const text = Array.from(options.text);
  const prefix = Array(pattern.length).fill(0);
  for (let i = 1, length = 0; i < pattern.length; i++) {
    while (length > 0 && pattern[i] !== pattern[length]) length = prefix[length - 1];
    if (pattern[i] === pattern[length]) length++;
    prefix[i] = length;
  }
  const frames = [];
  const hits = [];
  const save = (message, index, length) => frames.push({
    message, detail: 'π = [' + prefix.join(', ') + ']   |   Вхождения с индексов ' + print(hits),
    rows: [
      { values: text, labels: text.map((_, i) => i), active: [index],
        seen: text.flatMap((_, i) => hits.some((start) => i >= start && i < start + pattern.length) ? [i] : []) },
      { values: pattern, active: [length], seen: pattern.flatMap((_, i) => i < length ? [i] : []) },
    ],
  });
  save('Префикс-функция шаблона вычислена. Начинаем просмотр текста.', 0, 0);
  for (let i = 0, length = 0; i < text.length; i++) {
    while (length > 0 && text[i] !== pattern[length]) {
      const previous = length;
      length = prefix[length - 1];
      save('Символы различаются. Откат длины ' + previous + ' → ' + length + '.', i, length);
    }
    if (text[i] === pattern[length]) {
      length++;
      if (length === pattern.length) {
        hits.push(i - pattern.length + 1);
        save('Найдено полное вхождение.', i, length);
        length = prefix[length - 1];
      } else {
        save('Совпало символов подряд: ' + length + '.', i, length);
      }
    } else {
      save('Совпадения с первым символом шаблона нет.', i, length);
    }
  }
  save(hits.length ? 'Найдены все вхождения, включая перекрывающиеся.' :
    'Вхождений не найдено.', -1, -1);
  return frames;
}

function hashTable(mode, { numbers }) {
  const buckets = Array.from({ length: 7 }, () => []);
  const frames = [];
  const save = (message, active = []) => frames.push({
    message, detail: 'h(x) = x mod 7   |   ' + (mode === 'Цепочки' ? 'Метод цепочек' : 'Линейное пробирование'),
    rows: [{ values: buckets.map((bucket) => bucket.length ? bucket.join(', ') : '∅'),
      labels: buckets.map((_, i) => i), active }],
  });
  save('Таблица из семи ячеек пока пуста.');
  for (const value of new Set(numbers)) {
    let index = ((value % 7) + 7) % 7;
    save('Ключ ' + value + ' даёт индекс ' + index + '.', [index]);
    if (mode === 'Пробирование') {
      while (buckets[index].length) {
        index = (index + 1) % buckets.length;
        save('Коллизия. Проверяем следующую ячейку ' + index + '.', [index]);
      }
    }
    buckets[index].push(value);
    save('Ключ ' + value + ' помещён в ячейку ' + index + '.', [index]);
  }
  save('Все ключи размещены.');
  return frames;
}

const numberField = (value, min, max, positive = false) => ({
  key: 'numbers', label: 'Числа через запятую', value,
  parse(text) {
    const parts = text.trim().split(/[\s,]+/);
    const values = parts.map(Number);
    if (parts.length < min || parts.length > max ||
        parts.some((part, i) => !/^-?\d{1,2}$/.test(part) || (positive && values[i] < 1))) {
      throw new Error('Введите от ' + min + ' до ' + max +
        (positive ? ' целых чисел от 1 до 99.' : ' целых чисел от −99 до 99.'));
    }
    return values;
  },
});
const shortText = (key, label, value, max) => ({
  key, label, value,
  parse(text) {
    if (!text.trim() || Array.from(text).length > max) {
      throw new Error(label + ' должен содержать от 1 до ' + max + ' символов.');
    }
    return text;
  },
});
const startField = { key: 'start', label: 'Старт', values: Array.from(alphabet) };
const labs = {
  traversal: { title: 'Обход графа', run: traversal, modes: ['BFS', 'DFS'], select: startField },
  dijkstra: { title: 'Дейкстра', run: dijkstra, select: startField },
  topo: { title: 'Порядок зависимостей', run: topological, modes: ['DAG', 'С циклом'] },
  mst: { title: 'Краскал', run: kruskal },
  flow: { title: 'Эдмондс — Карп', run: flow, modes: ['Ёмкости 1', 'Ёмкости 2'] },
  sorting: { title: 'Сортировки', run: sorting, modes: ['Вставки', 'Слияние', 'Быстрая'],
    fields: [numberField('7, 2, 5, 3, 6, 1, 4', 2, 10, true)] },
  linear: { title: 'Стек и очередь', run: linear, modes: ['Стек', 'Очередь'],
    fields: [numberField('3, 5, 8', 1, 8)] },
  heap: { title: 'Двоичная куча', run: heap, modes: ['Построение', 'Извлечь минимум'],
    fields: [numberField('8, 4, 6, 3, 5, 2, 7', 2, 7)] },
  dp: { title: 'Размен монет', run: dynamic, modes: ['1, 3, 4', '2, 5, 7'],
    fields: [{ key: 'target', label: 'Целевая сумма', value: '6',
      parse(text) {
        const value = Number(text);
        if (!/^\d{1,2}$/.test(text) || value > 18) throw new Error('Введите целую сумму от 0 до 18.');
        return value;
      } }] },
  kmp: { title: 'Поиск КМП', run: kmp,
    fields: [shortText('text', 'Текст', 'ABABABACABA', 22), shortText('pattern', 'Шаблон', 'ABA', 11)] },
  hash: { title: 'Хеш-таблица', run: hashTable, modes: ['Цепочки', 'Пробирование'],
    fields: [numberField('3, 10, 17, 4, 11', 1, 6)] },
};

function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function drawGraph(canvas, frame) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = rect.width;
  const height = rect.height;
  if (!width || !height) return;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  const radius = Math.max(12, Math.min(20, width / 25));
  const coords = frame.nodes.map(([x, y]) => [x * width, y * height]);
  const highlights = new Map(frame.path || []);

  function arrow(x, y, angle, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 9 * Math.cos(angle - .44), y - 9 * Math.sin(angle - .44));
    ctx.lineTo(x - 9 * Math.cos(angle + .44), y - 9 * Math.sin(angle + .44));
    ctx.closePath();
    ctx.fill();
  }

  frame.edges.forEach(([a, b], id) => {
    const [x, y] = coords[a], [endX, endY] = coords[b];
    const angle = Math.atan2(endY - y, endX - x);
    const marked = frame.marked?.includes(id);
    const active = frame.activeEdge === id || highlights.has(id);
    const dim = frame.dim?.includes(id);
    const color = active ? '#98bb6c' : marked ? '#7e9cd8' : dim ? '#363646' : '#54546d';
    const gap = radius + 3;
    const dx = Math.cos(angle) * gap;
    const dy = Math.sin(angle) * gap;
    ctx.strokeStyle = color;
    ctx.lineWidth = active ? 2.8 : marked ? 2.2 : 1.3;
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(endX - dx, endY - dy);
    ctx.stroke();
    if (frame.directed) {
      if (highlights.get(id) === -1) arrow(x + dx, y + dy, angle + Math.PI, color);
      else arrow(endX - dx, endY - dy, angle, color);
    }
    const label = frame.edgeLabels?.[id];
    if (label !== undefined) {
      const centerX = (x + endX) / 2, centerY = (y + endY) / 2;
      ctx.font = '11px ui-monospace, monospace';
      const textWidth = ctx.measureText(String(label)).width;
      ctx.fillStyle = '#181820';
      ctx.fillRect(centerX - textWidth / 2 - 3, centerY - 8, textWidth + 6, 16);
      ctx.fillStyle = active ? '#98bb6c' : '#c8c093';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(label), centerX, centerY);
    }
  });
  coords.forEach(([x, y], i) => {
    const active = frame.active?.includes(i);
    const seen = frame.seen?.includes(i);
    if (active) {
      ctx.fillStyle = '#98bb6c25';
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = active ? '#98bb6c' : seen ? '#223249' : '#2a2a37';
    ctx.strokeStyle = active ? '#98bb6c' : seen ? '#7e9cd8' : '#938aa9';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 ' + (radius > 16 ? 14 : 12) + 'px ui-monospace, monospace';
    ctx.fillStyle = active ? '#16161d' : '#dcd7ba';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frame.names?.[i] ?? alphabet[i], x, y + .5);
    const label = frame.nodeLabels?.[i];
    if (label !== undefined) {
      const labelY = y > height * .7 ? y - radius - 9 : y + radius + 9;
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillStyle = active ? '#98bb6c' : '#9cabca';
      ctx.fillText(label, x, labelY);
    }
  });
}

function drawArray(stage, frame) {
  stage.replaceChildren();
  if (frame.bars) {
    const bars = element('div', 'bars');
    const scale = Math.max(...frame.bars);
    frame.bars.forEach((value, i) => {
      const bar = element('div', 'bar', value);
      bar.classList.toggle('done', frame.seen.includes(i));
      bar.classList.toggle('active', frame.active.includes(i));
      bar.style.setProperty('--bar', Math.round(23 + 76 * value / scale) + '%');
      bars.append(bar);
    });
    stage.append(bars);
    return;
  }
  for (const row of frame.rows) {
    const cells = element('div', 'cells');
    row.values.forEach((value, i) => {
      const cell = element('div', 'cell', value);
      cell.classList.toggle('done', row.seen?.includes(i) ?? false);
      cell.classList.toggle('active', row.active?.includes(i) ?? false);
      if (row.labels) cell.append(element('small', '', row.labels[i]));
      cells.append(cell);
    });
    if (!row.values.length) cells.append(element('span', 'stage-note', 'Пусто'));
    stage.append(cells);
  }
}

function mountLab(container) {
  const config = labs[container.dataset.demo];
  const compact = container.classList.contains('compact');
  const header = element('div', 'lab-head');
  const title = element('strong', '', config.title);
  const modes = element('div', 'lab-modes');
  const stage = element('div', 'lab-stage');
  const canvas = element('canvas');
  const info = element('div', 'lab-info');
  const status = element('p', 'lab-status');
  const detail = element('p', 'lab-detail');
  const controls = element('div', 'lab-controls');
  const previous = element('button', '', '←');
  const next = element('button', '', 'Шаг →');
  const reset = element('button', '', 'Сначала');
  const autoplay = element('button', '', 'Пуск');
  const count = element('span');
  const options = {};
  const modeButtons = [];
  let mode = config.modes?.[0] ?? '';
  let frames = [];
  let position = 0;
  let timer;

  for (const button of [previous, next, reset, autoplay]) button.type = 'button';
  previous.setAttribute('aria-label', 'Предыдущий шаг');
  next.setAttribute('aria-label', 'Следующий шаг');
  next.dataset.next = '';
  canvas.setAttribute('aria-hidden', 'true');
  info.setAttribute('aria-live', 'polite');
  info.setAttribute('aria-atomic', 'true');

  for (const name of config.modes || []) {
    const button = element('button', '', name);
    button.type = 'button';
    button.addEventListener('click', () => {
      mode = name;
      restart();
    });
    modes.append(button);
    modeButtons.push(button);
  }
  if (config.select) {
    const { key, label, values } = config.select;
    options[key] = 0;
    const select = element('select');
    select.setAttribute('aria-label', label + 'овая вершина');
    values.forEach((value, i) => {
      const option = element('option', '', label + ' ' + value);
      option.value = i;
      select.append(option);
    });
    select.addEventListener('change', () => {
      options[key] = Number(select.value);
      restart();
    });
    if (!compact) modes.append(select);
  }
  header.append(title, modes);
  info.append(status, detail);
  controls.append(previous, next, reset);
  if (!compact) controls.append(autoplay);
  controls.append(count);
  container.replaceChildren(header, stage, info, controls);

  if (config.fields) {
    const form = element('form', 'lab-input');
    const fields = config.fields.map((field) => {
      const label = element('label', '', field.label);
      const input = element('input');
      input.value = field.value;
      input.autocomplete = 'off';
      input.spellcheck = false;
      label.append(input);
      form.append(label);
      options[field.key] = field.parse(field.value);
      return [field, input];
    });
    const apply = element('button', '', 'Применить');
    const error = element('p', 'lab-error');
    error.hidden = true;
    error.setAttribute('role', 'alert');
    form.append(apply, error);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        const values = fields.map(([field, input]) => [field.key, field.parse(input.value)]);
        Object.assign(options, Object.fromEntries(values));
        error.hidden = true;
        restart();
      } catch (problem) {
        error.textContent = problem.message;
        error.hidden = false;
      }
    });
    stage.before(form);
  }

  function pause() {
    window.clearInterval(timer);
    timer = undefined;
    autoplay.textContent = 'Пуск';
  }

  function render() {
    const frame = frames[position];
    modeButtons.forEach((button) => button.setAttribute('aria-pressed', button.textContent === mode));
    status.textContent = frame.message;
    detail.textContent = frame.detail;
    count.textContent = position + 1 + ' / ' + frames.length;
    previous.disabled = position === 0;
    next.disabled = position === frames.length - 1;
    if (next.disabled && timer !== undefined) pause();
    if (frame.nodes) {
      if (!stage.contains(canvas)) stage.replaceChildren(canvas);
      drawGraph(canvas, frame);
    } else {
      drawArray(stage, frame);
    }
  }

  function restart() {
    pause();
    frames = config.run(mode, options);
    position = 0;
    render();
  }

  previous.addEventListener('click', () => {
    pause();
    position--;
    render();
  });
  next.addEventListener('click', () => {
    pause();
    position++;
    render();
  });
  reset.addEventListener('click', restart);
  autoplay.addEventListener('click', () => {
    if (timer !== undefined) {
      pause();
      return;
    }
    if (position === frames.length - 1) position = 0;
    autoplay.textContent = 'Пауза';
    timer = window.setInterval(() => {
      position++;
      render();
    }, 740);
    render();
  });
  restart();
  if (frames[0].nodes && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => drawGraph(canvas, frames[position])).observe(canvas);
  }
}

document.querySelectorAll('[data-demo]').forEach(mountLab);
