import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const postsDirectory = 'src/content/blog';
const now = Date.now();

function listBlogFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listBlogFiles(path);
    return /\.(md|mdx)$/.test(entry.name) ? [path] : [];
  });
}

function parsePublishAt(value, path) {
  const trimmed = value.trim();
  const scalar = trimmed.startsWith('"') && trimmed.endsWith('"')
    ? JSON.parse(trimmed)
    : trimmed.startsWith("'") && trimmed.endsWith("'")
      ? trimmed.slice(1, -1).replaceAll("''", "'")
      : trimmed;
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(scalar);
  const timestamp = Date.parse(hasTimezone ? scalar : `${scalar}+07:00`);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid publishAt value in "${path}": ${scalar}`);
  }

  return timestamp;
}

const duePosts = listBlogFiles(postsDirectory).flatMap((path) => {
  const content = readFileSync(path, 'utf8');
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1];
  if (!frontmatter || /^\s*draft:\s*true\s*$/m.test(frontmatter)) return [];

  const publishAt = frontmatter.match(/^\s+publishAt:\s*(.*?)\s*$/m)?.[1]
    ?? frontmatter.match(/^publishAt:\s*(.*?)\s*$/m)?.[1];
  if (!publishAt) return [];

  return parsePublishAt(publishAt, path) <= now ? [`${path}:${publishAt}`] : [];
});

const hash = duePosts.length
  ? createHash('sha256').update(duePosts.sort().join('\n')).digest('hex').slice(0, 20)
  : 'none';

if (duePosts.length) {
  console.log(`Due scheduled blog posts: ${duePosts.map((post) => post.split(':')[0]).join(', ')}`);
} else {
  console.log('No scheduled blog posts are due.');
}

if (process.env.GITHUB_OUTPUT) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_OUTPUT, `hash=${hash}\n`);
}
