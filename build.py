#!/usr/bin/env python3
"""Build the static C++ and algorithms handbook."""
import argparse
import html
import hashlib
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree.ElementTree import Element, SubElement, tostring

from markdown_it import MarkdownIt
from markdown_it.token import Token

ROOT = Path(__file__).resolve().parent
GROUPS = [
    ('cpp1', 'C++ · 1 семестр', 'Основы C++', 'Типы, память, классы и первые шаблоны.', 'C++', 'green'),
    ('algo1', 'Алгоритмы · 1 семестр', 'Алгоритмы и структуры', 'Сложность, сортировки, кучи и динамика.', '[ ]', 'blue'),
    ('cpp2', 'C++ · 2 семестр', 'Продвинутый C++', 'STL, владение, move, шаблоны и потоки.', 'C++', 'green'),
    ('algo2', 'Алгоритмы · 2 семестр', 'Графы и строки', 'Обходы, кратчайшие пути, потоки и хеширование.', '{ }', 'blue'),
    ('tools', 'Практика', 'Инструменты C++', 'Стиль кода, сборка и тестирование.', '>_', 'amber'),
]
TITLE = 'C++ и алгоритмы'
CONFIG = json.loads((ROOT / 'site.json').read_text(encoding='utf-8'))
REPO = CONFIG['repository']
SITE_URL = CONFIG['url']
AI_API_URL = CONFIG.get('ai_api_url', '').rstrip('/')
AI_WEB = ROOT / 'ai-assistant' / 'web'
ASSET_VERSION = ''
DEMOS = {
    'traversal': 'BFS и DFS', 'sorting': 'Сортировки', 'linear': 'Стек и очередь',
    'heap': 'Двоичная куча', 'dp': 'Таблица DP', 'topo': 'Топологическая сортировка',
    'dijkstra': 'Дейкстра', 'mst': 'Краскал', 'flow': 'Максимальный поток',
    'kmp': 'Поиск КМП', 'hash': 'Хеш-таблица',
}


def e(value):
    return html.escape(str(value))


def inline(text):
    tokens = re.split(r'(`[^`]+\x60|\*\*[^*]+\*\*|\[[^\]]+\]\(https://[^\s)]+\))', text)
    out = []
    for token in tokens:
        if token.startswith('`') and token.endswith('`'):
            out.append(f'<code>{e(token[1:-1])}</code>')
        elif token.startswith('**') and token.endswith('**'):
            out.append(f'<strong>{e(token[2:-2])}</strong>')
        elif match := re.fullmatch(r'\[([^\]]+)\]\((https://[^\s)]+)\)', token):
            out.append(f'<a href="{e(match[2])}">{e(match[1])}</a>')
        else:
            out.append(e(token))
    return ''.join(out)


def highlight(source, language):
    if language != 'cpp':
        return e(source)
    token = re.compile(
        r'(?P<comment>//[^\n]*|/\*[\s\S]*?\*/)'
        r'|(?P<string>"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')'
        r'|(?P<directive>\#[a-zA-Z_]+)'
        r'|(?P<number>\b\d+(?:\.\d+)?\b)'
        r'|(?P<word>\b[A-Za-z_]\w*\b)'
    )
    keywords = set('if else for while return class struct public private protected '
                   'const constexpr static virtual override final template typename '
                   'namespace using throw try catch noexcept nullptr true false '
                   'explicit auto include static_assert'.split())
    types = set('int bool char double float void size_t string vector queue '
                'optional atomic thread unique_ptr shared_ptr weak_ptr'.split())
    output = []
    end = 0
    for match in token.finditer(source):
        output.append(e(source[end:match.start()]))
        kind = match.lastgroup
        value = match[0]
        if kind == 'word':
            if value in keywords:
                kind = 'keyword'
            elif value in types:
                kind = 'type'
            elif re.match(r'\s*\(', source[match.end():]):
                kind = 'function'
            else:
                kind = None
        output.append(f'<span class="tok-{kind}">{e(value)}</span>' if kind else e(value))
        end = match.end()
    output.append(e(source[end:]))
    return ''.join(output)


def topics():
    for group, *_ in GROUPS:
        for section in re.split(r'^@@ ', (ROOT / 'content' / f'{group}.md').read_text(encoding='utf-8'), flags=re.M)[1:]:
            slug, heading, description, body = section.strip().split('\n', 3)
            if not re.fullmatch('[a-z0-9-]+', slug) or not heading.startswith('# ') or not description.startswith('> '):
                raise ValueError(f'Invalid topic header for {slug}')
            yield {'slug': slug, 'title': heading[2:], 'description': description[2:],
                   'body': body, 'group': group,
                   'demos': re.findall(r'^!demo ([a-z0-9-]+)$', body, re.M)}


def demo(kind, compact=False):
    tag = 'section' if not compact else 'div'
    anchor = '' if compact else ' id="interactive"'
    return f'''<{tag}{anchor} class="lab{' compact' if compact else ''}" data-demo="{kind}" aria-label="{e(DEMOS[kind])}">
      <noscript>Включите JavaScript, чтобы управлять схемой.</noscript>
    </{tag}>'''


def render_fence(tokens, index, options, env):
    token = tokens[index]
    lang = token.info.split()[0] if token.info.strip() else 'text'
    source = highlight(token.content.rstrip('\n'), lang)
    return (
        f'<div class="code-block"><div class="code-bar">{e(lang)}'
        '<button type="button" data-copy>Копировать</button></div>'
        f'<pre tabindex="0"><code>{source}</code></pre></div>\n'
    )


def render_figure(tokens, index, options, env):
    token = tokens[index]
    source = e(token.attrGet('src'))
    alt = e(token.content)
    return (
        f'<figure class="note-figure"><a href="{source}" target="_blank" '
        f'rel="noopener"><img src="{source}" alt="{alt}" loading="lazy" '
        'decoding="async"></a></figure>\n'
    )


MARKDOWN = MarkdownIt('commonmark', {'html': False}).enable('table')
MARKDOWN.renderer.rules['fence'] = render_fence
MARKDOWN.renderer.rules['note_figure'] = render_figure
MARKDOWN.renderer.rules['interactive_demo'] = (
    lambda tokens, index, options, env: demo(tokens[index].content)
)


def render(body):
    headings = []
    tokens = MARKDOWN.parse(body)
    output = []
    index = 0
    while index < len(tokens):
        token = tokens[index]
        if token.type == 'heading_open' and token.tag == 'h2':
            anchor = 'section-' + str(len(headings) + 1)
            token.attrSet('id', anchor)
            headings.append((anchor, tokens[index + 1].content))
        if token.type == 'paragraph_open' and tokens[index + 2].type == 'paragraph_close':
            inline_token = tokens[index + 1]
            if match := re.fullmatch(r'!demo ([a-z0-9-]+)', inline_token.content):
                interactive = Token('interactive_demo', 'section', 0)
                interactive.content = match[1]
                output.append(interactive)
                index += 3
                continue
            if len(inline_token.children or []) == 1 and inline_token.children[0].type == 'image':
                image = inline_token.children[0]
                image.type = 'note_figure'
                output.append(image)
                index += 3
                continue
        output.append(token)
        index += 1
    return MARKDOWN.renderer.render(output, MARKDOWN.options, {}), headings


def shell(title, description, body, filename=''):
    github = (
        f'<a class="repo" href="{e(REPO)}" target="_blank" rel="noopener" '
        'aria-label="Поставить звезду на GitHub" title="Поставить звезду на GitHub">'
        '<span class="repo-star" aria-hidden="true">☆</span>'
        '<span class="repo-label">Поставить звезду</span></a>'
    ) if REPO else ''
    url = SITE_URL + filename
    chapter = '' if filename == 'laboratory.html' else filename.removesuffix('.html')
    return f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{e(description)}">
<meta name="theme-color" content="#1f1f28">
<title>{e(title)}</title>
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Первый курс · ИТМО ИС">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{e(url)}">
<link rel="icon" href="assets/favicon.svg?v={ASSET_VERSION}" type="image/svg+xml">
<link rel="stylesheet" href="assets/site.css?v={ASSET_VERSION}">
<script defer src="assets/site.js?v={ASSET_VERSION}" data-search-version="{ASSET_VERSION}"></script>
<script defer src="assets/labs.js?v={ASSET_VERSION}"></script>
<link rel="stylesheet" href="assets/assistant.css?v={ASSET_VERSION}">
<script defer src="assets/assistant.js?v={ASSET_VERSION}" data-api-url="{e(AI_API_URL)}" data-chapter="{e(chapter)}"></script>
</head>
<body>
<a class="skip" href="#main">К содержанию</a>
<header class="topbar"><div class="top-inner">
  <a class="brand" href="./" aria-label="Первый курс — главная"><span class="mark" aria-hidden="true">&lt;/&gt;</span> Первый курс</a>
  <nav class="top-nav" aria-label="Навигация">
    <a class="nav-catalogue" href="./#semester-1">Конспект</a>
    <a href="laboratory.html">Тренажёры</a>
    {github}
  </nav>
</div></header>
{body}
<footer class="site-footer"><div><span>{TITLE} · 1 курс</span><a href="./#main">К конспекту ↑</a></div></footer>
</body>
</html>'''


def topic_links(items):
    return ''.join(f'<li><a href="{item["slug"]}.html">{e(item["title"])}<span aria-hidden="true">↗</span></a></li>' for item in items)


def card(group_info, items):
    group, label, title, subtitle, symbol, color = group_info
    with_demos = sum(len(item['demos']) for item in items)
    demo_text = f'<span class="card-meta"><i></i> {with_demos} {noun(with_demos, "схема", "схемы", "схем")}</span>' if with_demos else ''
    return f'''<section class="course {color}" id="{group}">
    <div class="course-intro">
      <div class="course-top"><span class="course-icon" aria-hidden="true">{e(symbol)}</span>{demo_text}</div>
      <h3>{e(title)}</h3><p>{e(subtitle)}</p>
    </div><ul>{topic_links(items)}</ul>
    </section>'''


def noun(n, one, few, many):
    if 11 <= n % 100 <= 14:
        return many
    if n % 10 == 1:
        return one
    if n % 10 in (2, 3, 4):
        return few
    return many


def catalogue(by_group):
    cards = [card(group, by_group[group[0]]) for group in GROUPS]
    body = f'''<main class="home page" id="main">
<section class="hero" aria-labelledby="hero-title">
  <div class="hero-copy">
    <p class="overline"><span></span> ИТМО · ИС · ПЕРВЫЙ КУРС</p>
    <h1 id="hero-title">C++ и<br><em>алгоритмы</em></h1>
    <p class="hero-summary">Первый и второй семестры. Теория, примеры на C++ и схемы, которые можно пройти шаг за шагом.</p>
    <div class="hero-actions"><a class="button primary" href="#semester-1">Открыть конспект <span aria-hidden="true">↓</span></a>
    <a class="button secondary" href="laboratory.html">Все тренажёры <span aria-hidden="true">↗</span></a></div>
  </div>
  {demo('traversal', compact=True)}
</section>
<section class="search-wrap" aria-label="Поиск по конспекту">
  <label class="searchbox"><span aria-hidden="true"></span><input type="search" id="search" autocomplete="off" placeholder="Поиск по темам…" aria-label="Поиск по темам" aria-controls="search-results"><kbd>/</kbd></label>
  <div id="search-results" class="search-results" hidden><p id="search-status" role="status"></p><ul id="search-list"></ul></div>
</section>
<div id="catalogue">
  <section class="semester" id="semester-1" aria-labelledby="sem1-title">
    <div class="section-head"><h2 id="sem1-title">1 семестр</h2><span>Язык и структуры данных</span></div>
    <div class="course-grid">{cards[0]}{cards[1]}</div>
  </section>
  <section class="semester" id="semester-2" aria-labelledby="sem2-title">
    <div class="section-head"><h2 id="sem2-title">2 семестр</h2><span>Современный C++ и графы</span></div>
    <div class="course-grid">{cards[2]}{cards[3]}</div>
  </section>
  <section class="semester" id="practice" aria-labelledby="practice-title">
    <div class="section-head"><h2 id="practice-title">Практика</h2></div>
    <div class="course-grid practice">{cards[4]}</div>
  </section>
</div>
</main>'''
    return shell('Конспекты по C++ и алгоритмам — 1 и 2 семестры | ИТМО ИС', 'Конспекты для первого курса ИТМО ИС по C++, алгоритмам и структурам данных. Первый и второй семестры, примеры кода и интерактивные схемы.', body)


def article(item, group, group_items):
    title = item['title']
    label = group[1]
    slug = item['slug']
    content, headings = render(item['body'])
    sidebar = ''.join(f'<li><a {"aria-current=page" if entry is item else ""} href="{entry["slug"]}.html">{e(entry["title"])}</a></li>' for entry in group_items)
    toc = ''.join(f'<li><a href="#{anchor}">{e(name)}</a></li>' for anchor, name in headings)
    index = group_items.index(item)
    adjacent = []
    for direction, delta in [('← Назад', -1), ('Дальше →', 1)]:
        if 0 <= index + delta < len(group_items):
            entry = group_items[index + delta]
            adjacent.append(f'<a href="{entry["slug"]}.html"><small>{direction}</small>{e(entry["title"])}</a>')
    toc_markup = f'<aside class="toc"><p>На этой странице</p><ul>{toc}</ul></aside>' if toc else ''
    body = f'''<main class="page chapter" id="main">
<nav class="crumbs" aria-label="Хлебные крошки"><a href="./">Конспект</a><span>/</span><a href="./#{group[0]}">{e(label)}</a></nav>
<div class="chapter-grid">
<aside class="chapter-sidebar"><details open><summary>{e(label)}</summary><ul>{sidebar}</ul></details></aside>
<article class="reading"><header class="chapter-header {group[-1]}"><h1>{e(title)}</h1><p>{e(item["description"])}</p></header>
<div class="prose">{content}</div>
<nav class="adjacent" aria-label="Соседние главы">{"".join(adjacent)}</nav>
</article>
{toc_markup}
</div></main>'''
    return shell(f'{title} · {TITLE}', item['description'], body, slug + '.html')


def laboratory(items):
    cards = []
    for item in items:
        for kind in item['demos']:
            cards.append(f'''<li><a href="{item["slug"]}.html#interactive">
              <span class="course-icon" aria-hidden="true">▶</span>
              <span><strong>{e(DEMOS[kind])}</strong><small>{e(item["description"])}</small></span>
              <span aria-hidden="true">↗</span>
            </a></li>''')
    body = f'''<main class="page lab-index" id="main">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="./">Конспект</a><span>/</span><span>Тренажёры</span></nav>
    <header class="chapter-header blue"><h1>Тренажёры по алгоритмам</h1><p>Выберите схему, меняйте входные данные и проходите алгоритм по шагам.</p></header>
    <ul class="lab-list">{''.join(cards)}</ul>
    </main>'''
    return shell(f'Тренажёры · {TITLE}', 'Интерактивные алгоритмы с пошаговым выполнением.', body, 'laboratory.html')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', default=CONFIG['repository'], help='Public GitHub repository URL for the header link')
    parser.add_argument('--site-url', default=CONFIG['url'], help='Public URL of the site')
    parser.add_argument('--out', type=Path, default=ROOT / 'docs')
    args = parser.parse_args()
    if args.repo and not re.fullmatch(r'https://github\.com/[A-Za-z0-9-]+/[A-Za-z0-9_.-]+', args.repo):
        parser.error('--repo must be a GitHub repository URL without a trailing slash')
    site = urlsplit(args.site_url)
    if site.scheme != 'https' or not site.hostname or site.query or site.fragment:
        parser.error('--site-url must be an HTTPS URL without a query or fragment')
    global REPO, SITE_URL, ASSET_VERSION
    REPO = args.repo
    SITE_URL = args.site_url.rstrip('/') + '/'
    if AI_API_URL and (urlsplit(AI_API_URL).scheme != 'https' or not urlsplit(AI_API_URL).hostname):
        parser.error('ai_api_url must be an HTTPS URL')
    assets = sorted((ROOT / 'assets').glob('*')) + sorted(AI_WEB.glob('*'))
    sources = assets + sorted((ROOT / 'content').glob('*.md'))
    digest = hashlib.sha256()
    for asset in sources:
        if asset.is_file():
            digest.update(asset.read_bytes())
    ASSET_VERSION = digest.hexdigest()[:12]
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    items = list(topics())
    if len({item['slug'] for item in items}) != len(items):
        raise ValueError('Duplicate topic slug')
    by_group = {group[0]: [item for item in items if item['group'] == group[0]] for group in GROUPS}

    def write(name, contents):
        (out / name).write_text(contents, encoding='utf-8')

    write('index.html', catalogue(by_group))
    write('laboratory.html', laboratory(items))
    index = []
    for group in GROUPS:
        for item in by_group[group[0]]:
            write(item['slug'] + '.html', article(item, group, by_group[group[0]]))
            headings = re.findall(r'^## (.*)$', item['body'], flags=re.M)
            search = re.sub(r'```.*?```', '', item['body'], flags=re.S)
            search = re.sub(r'!\[[^\n]*?\]\(assets/media/[^)]+\)', '', search)
            search = re.sub(r'https://[^\s)]+', '', search)
            index.append({
                'url': item['slug'] + '.html', 'title': item['title'], 'group': group[1],
                'description': item['description'], 'headings': ' '.join(headings),
                'text': ' '.join(search.split()),
            })
    (out / 'assets').mkdir(exist_ok=True)
    write('assets/search-index.js', 'const topicIndex = ' + json.dumps(index, ensure_ascii=False) + ';\n')
    for asset in assets:
        if asset.is_file():
            (out / 'assets' / asset.name).write_bytes(asset.read_bytes())
    media = ROOT / 'assets' / 'media'
    if media.is_dir():
        shutil.copytree(media, out / 'assets' / 'media', dirs_exist_ok=True)
    (out / '.nojekyll').touch()
    sitemap = Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    paths = ['', 'laboratory.html'] + [item['slug'] + '.html' for item in items]
    for path in paths:
        entry = SubElement(sitemap, 'url')
        SubElement(entry, 'loc').text = SITE_URL + path
    write('sitemap.xml', tostring(sitemap, encoding='unicode'))
    print(f'Built {len(items)} chapters and {sum(len(x["demos"]) for x in items)} labs in {out}')


if __name__ == '__main__':
    main()
