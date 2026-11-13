"""Section search adapted from the bot's MaterialsSource."""

import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

WORDS = re.compile(r"c\+\+|[a-zа-я0-9_]+", re.I)
STOPWORDS = set(
    "а без бы был в во вот вы где да для до его ее если еще же за и из или их к как "
    "какой какая какое ли мне мой на не но о об он она они от по при про с со так "
    "то у что это эту этот этих этого я объясни объясните расскажи покажи вопрос "
    "тему теме главы глава код чем почему отличается чем помоги the a an and or in of".split()
)
SLUG = re.compile(r"[a-z0-9][a-z0-9-]{0,79}")


def words(text: str) -> set[str]:
    return {
        word[:6] if len(word) > 6 and re.fullmatch(r"[а-я]+", word) else word
        for word in WORDS.findall(text.casefold().replace("ё", "е"))
        if len(word) > 1 and word not in STOPWORDS
    }


@dataclass(frozen=True)
class Section:
    chapter: str
    title: str
    heading: str
    url: str
    body: str

    def source(self, number: int) -> dict:
        return {"id": number, "title": self.title, "section": self.heading, "url": self.url}


class Corpus:
    def __init__(self, sections: list[Section]):
        if not sections:
            raise ValueError("Не найдены главы конспекта.")
        self.sections = tuple(sections)
        self.chapters = {section.chapter: section.title for section in sections}
        self.terms = [words(section.title + " " + section.heading + " " + section.body)
                      for section in sections]
        self.heading_terms = [words(section.title + " " + section.heading) for section in sections]
        counts = Counter(term for terms in self.terms for term in terms)
        self.weights = {
            term: 1 + math.log((1 + len(sections)) / (1 + count))
            for term, count in counts.items()
        }

    @classmethod
    def from_directory(cls, directory: Path) -> "Corpus":
        sections = []
        seen = set()
        for path in sorted(directory.glob("*.md")):
            if path.is_symlink() or path.stat().st_size > 512_000:
                raise ValueError("Недопустимый файл конспекта.")
            text = path.read_text(encoding="utf-8")
            for topic in re.split(r"^@@ ", text, flags=re.M)[1:]:
                slug, title, summary, body = topic.strip().split("\n", 3)
                if (not SLUG.fullmatch(slug) or slug in seen or not title.startswith("# ")
                        or not summary.startswith("> ")):
                    raise ValueError("Недопустимый заголовок главы.")
                seen.add(slug)
                parts = [""]
                in_code = False
                for line in body.splitlines(keepends=True):
                    if line.startswith("```"):
                        in_code = not in_code
                    if not in_code and line.startswith("## "):
                        parts.extend((line[3:].strip(), ""))
                    else:
                        parts[-1] += line
                title = title[2:]
                prefix = (summary[2:] + "\n\n" + parts[0]).strip()
                if len(parts) == 1:
                    sections.append(Section(slug, title, "", slug + ".html", prefix))
                for index, (heading, content) in enumerate(zip(parts[1::2], parts[2::2]), 1):
                    content = re.sub(r"^!demo .*$", "", content, flags=re.M)
                    content = re.sub(r"!\[[^\n]*?\]\(assets/media/[^)]+\)", "", content)
                    content = content.strip()
                    if index == 1:
                        content = prefix + "\n\n" + content
                    sections.append(Section(
                        slug, title, heading, f"{slug}.html#section-{index}", content,
                    ))
        return cls(sections)

    def search(self, question: str, chapter: str = "", *, limit: int = 4) -> list[Section]:
        query = words(question)
        matches = []
        for index, section in enumerate(self.sections):
            overlap = self.terms[index] & query
            if not overlap and section.chapter != chapter:
                continue
            score = sum(self.weights[term] for term in sorted(overlap))
            score += 1.6 * len(self.heading_terms[index] & query)
            matches.append((score, index, section))

        matches.sort(key=lambda item: (-item[0], item[1]))
        # Keep context for references like «здесь» without letting the page drown out
        # a question explicitly naming a topic from another chapter.
        current = [entry for entry in matches if chapter and entry[2].chapter == chapter]
        selected = [current[0]] if current else []
        selected.extend(entry for entry in matches if entry[0] > 0 and entry not in selected)
        selected.extend(entry for entry in current if entry not in selected)
        result = []
        chapter_counts = Counter()
        for _, _, section in selected:
            if chapter_counts[section.chapter] < 2:
                result.append(section)
                chapter_counts[section.chapter] += 1
            if len(result) == limit:
                break
        return result
