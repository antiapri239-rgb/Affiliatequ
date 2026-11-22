import fs from 'node:fs';
import path from 'node:path';
import { visit, SKIP } from 'unist-util-visit';

const SKIP_TAGS = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'strong', 'b', 'script', 'style']);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function loadTerms() {
  const dir = path.join(process.cwd(), 'src', 'content', 'kamus');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const slug = f.replace(/\.mdx?$/, '');
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      let aliases = [];
      if (fm) {
        const line = fm[1].match(/^aliases:\s*(\[.*\])\s*$/m);
        if (line) {
          try {
            aliases = JSON.parse(line[1]);
          } catch {
            aliases = [];
          }
        }
      }
      return { slug, aliases: aliases.filter((a) => typeof a === 'string' && a.trim()) };
    })
    .filter((t) => t.aliases.length > 0);
}

export default function rehypeGlossaryLinks() {
  const terms = loadTerms();

  return (tree, file) => {
    if (terms.length === 0) return;

    const filePath = file && file.path ? String(file.path) : '';
    const inGlossary = filePath.includes(`${path.sep}content${path.sep}kamus${path.sep}`);
    const selfSlug = inGlossary ? path.basename(filePath).replace(/\.mdx?$/, '') : '';

    const active = terms
      .filter((t) => t.slug !== selfSlug)
      .map((t) => {
        const pattern = t.aliases
          .map(escapeRegex)
          .sort((a, b) => b.length - a.length)
          .join('|');
        return {
          slug: t.slug,
          regex: new RegExp(`(?<![\\p{L}\\p{N}])(${pattern})(?![\\p{L}\\p{N}])`, 'iu'),
        };
      });

    const done = new Set();

    visit(tree, (node, index, parent) => {
      if (node.type === 'element' && SKIP_TAGS.has(node.tagName)) return SKIP;
      if (node.type !== 'text' || !parent || index == null) return;
      if (node.value.includes('[PRODUK:')) return;

      let best = null;
      for (const term of active) {
        if (done.has(term.slug)) continue;
        const match = term.regex.exec(node.value);
        if (match && (!best || match.index < best.match.index)) {
          best = { term, match };
        }
      }
      if (!best) return;

      const { term, match } = best;
      const before = node.value.slice(0, match.index);
      const after = node.value.slice(match.index + match[0].length);
      const replacement = [];
      if (before) replacement.push({ type: 'text', value: before });
      replacement.push({
        type: 'element',
        tagName: 'a',
        properties: {
          href: `/kamus/${term.slug}/`,
          title: 'Lihat arti istilah ini di Kamus Skincare',
        },
        children: [{ type: 'text', value: match[0] }],
      });
      if (after) replacement.push({ type: 'text', value: after });

      parent.children.splice(index, 1, ...replacement);
      done.add(term.slug);
      return index;
    });
  };
}
