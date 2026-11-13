'use strict';

(() => {
  const script = document.currentScript;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const base = local ? '' : script.dataset.apiUrl;
  if (!local && !base) return;

  const chapter = script.dataset.chapter;
  const chapterTitle = document.querySelector('.reading h1')?.textContent;
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'ai-open';
  open.textContent = 'Спросить AI';
  open.setAttribute('aria-haspopup', 'dialog');

  const panel = document.createElement('dialog');
  panel.className = 'ai-panel';
  panel.setAttribute('aria-labelledby', 'ai-title');
  panel.innerHTML = `
    <header class="ai-head">
      <div><h2 id="ai-title">AI по конспекту</h2><p class="ai-context"></p></div>
      <button type="button" class="ai-close" aria-label="Закрыть чат">×</button>
    </header>
    <div class="ai-tools">
      <label>Режим
        <select class="ai-mode">
          <option value="explain">Объяснение</option>
          <option value="review">Разбор кода</option>
          <option value="quiz">Самопроверка</option>
        </select>
      </label>
      <button type="button" class="ai-reset">Очистить чат</button>
    </div>
    <div class="ai-messages" role="log" aria-label="Диалог" tabindex="0">
      <div class="ai-suggestions">
        <button type="button" data-prompt="explain"></button>
        <button type="button" data-prompt="quiz">Задай вопрос для самопроверки</button>
      </div>
    </div>
    <form class="ai-form">
      <label class="ai-access" hidden>Код доступа
        <input type="password" maxlength="200" autocomplete="off">
      </label>
      <label for="ai-question">Вопрос</label>
      <p class="ai-privacy">Вопрос и контекст диалога передаются языковой модели.</p>
      <textarea id="ai-question" maxlength="3600" rows="2" required
        placeholder="Например, почему BFS находит кратчайший путь?"></textarea>
      <div class="ai-send">
        <p role="status" class="ai-status"></p>
        <button type="submit">Отправить</button>
      </div>
    </form>
  `;

  const find = (selector) => panel.querySelector(selector);
  const messages = find('.ai-messages');
  const suggestions = find('.ai-suggestions');
  const explain = find('[data-prompt="explain"]');
  const form = find('.ai-form');
  const question = find('#ai-question');
  const mode = find('.ai-mode');
  const status = find('.ai-status');
  const send = find('[type="submit"]');
  const access = find('.ai-access');
  const token = access.querySelector('input');
  const reset = find('.ai-reset');
  let history = [];
  let pending = false;

  find('.ai-context').textContent = chapterTitle || 'C++ и алгоритмы · 1 и 2 семестры';
  explain.textContent = chapterTitle ? 'Объясни эту главу' : 'Чем отличаются BFS и DFS?';
  document.querySelector('.top-nav').prepend(open);
  document.body.append(panel);

  async function checkStatus() {
    const response = await fetch(base + '/api/ai/status', {signal: AbortSignal.timeout(5000)});
    if (!response.ok) throw new Error();
    const result = await response.json();
    if (result.ready !== true) throw new Error();
    access.hidden = !result.requires_token;
    token.required = Boolean(result.requires_token);
  }

  open.hidden = !base;
  if (!base) {
    checkStatus().then(() => { open.hidden = false; }).catch(() => {});
  }
  open.addEventListener('click', () => {
    panel.showModal();
    question.focus();
    checkStatus().catch(() => {
      status.textContent = 'Сервис помощника сейчас недоступен.';
    });
  });
  find('.ai-close').addEventListener('click', () => panel.close());
  reset.addEventListener('click', () => {
    history = [];
    messages.replaceChildren(suggestions);
    status.textContent = '';
    question.value = '';
    question.focus();
  });
  suggestions.addEventListener('click', (event) => {
    const preset = event.target.closest('[data-prompt]');
    if (!preset) return;
    mode.value = preset.dataset.prompt;
    question.value = preset.textContent;
    form.requestSubmit();
  });
  question.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  function addMessage(role, text, sources = []) {
    const article = document.createElement('article');
    article.className = 'ai-message ai-' + role;
    const label = document.createElement('strong');
    label.textContent = role === 'user' ? 'Вы' : 'Помощник';
    article.append(label);
    const blocks = role === 'assistant' ? text.split(/(```[^\n]*\n[\s\S]*?(?:```|$))/g) : [text];
    for (const block of blocks) {
      if (!block.trim()) continue;
      if (block.startsWith('```') && block.includes('\n')) {
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = block.slice(block.indexOf('\n') + 1).replace(/```$/, '');
        pre.append(code);
        article.append(pre);
      } else {
        const body = document.createElement('p');
        if (role === 'assistant') {
          const inline = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
          for (const [index, part] of block.trim().split(inline).entries()) {
            if (index % 2 === 0) {
              body.append(part);
            } else {
              const bold = part.startsWith('**');
              const tag = document.createElement(part.startsWith('`') ? 'code' : bold ? 'strong' : 'em');
              const edge = bold ? 2 : 1;
              tag.textContent = part.slice(edge, -edge);
              body.append(tag);
            }
          }
        } else {
          body.textContent = block.trim();
        }
        article.append(body);
      }
    }
    const links = document.createElement('ul');
    for (const source of sources) {
      if (!/^[a-z0-9-]+\.html(?:#section-\d+)?$/.test(source.url)) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.textContent = '[' + source.id + '] ' + source.title +
        (source.section ? ' · ' + source.section : '');
      link.addEventListener('click', () => panel.close());
      item.append(link);
      links.append(item);
    }
    if (links.children.length) article.append(links);
    messages.append(article);
    messages.scrollTop = messages.scrollHeight;
    return article;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = question.value.trim();
    if (!text || pending) return;
    pending = true;
    send.disabled = true;
    reset.disabled = true;
    mode.disabled = true;
    status.textContent = 'Ищу материал и готовлю ответ…';
    suggestions.remove();
    const userMessage = addMessage('user', text);
    try {
      const headers = {'Content-Type': 'application/json'};
      if (!access.hidden && token.value.trim()) headers.Authorization = 'Bearer ' + token.value.trim();
      const response = await fetch(base + '/api/ai/ask', {
        method: 'POST',
        headers,
        body: JSON.stringify({question: text, chapter, mode: mode.value, history}),
        signal: AbortSignal.timeout(180000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Не удалось получить ответ.');
      if (typeof result.answer !== 'string' || !Array.isArray(result.sources)) throw new Error();
      addMessage('assistant', result.answer, result.sources);
      history.push({role: 'user', content: text}, {role: 'assistant', content: result.answer.slice(0, 2800)});
      while (history.length > 6 || history.reduce((sum, row) => sum + row.content.length, 0) > 6400) {
        history.splice(0, 2);
      }
      if (question.value.trim() === text) question.value = '';
      status.textContent = result.truncated ? 'Достигнут лимит длины ответа.' : '';
    } catch (error) {
      userMessage.remove();
      if (!history.length) messages.replaceChildren(suggestions);
      status.textContent = error instanceof SyntaxError || error instanceof TypeError
        ? 'Сервис помощника сейчас недоступен.'
        : (error.message || 'Не удалось получить ответ. Попробуйте ещё раз.');
    } finally {
      pending = false;
      send.disabled = false;
      reset.disabled = false;
      mode.disabled = false;
    }
  });
})();
