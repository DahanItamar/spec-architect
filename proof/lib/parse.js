import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SKILLS_DIR = join(REPO_ROOT, 'skills');

export function read(...segments) {
  return readFileSync(join(REPO_ROOT, ...segments), 'utf8');
}

export function lineCount(text) {
  return text.replace(/\n$/, '').split('\n').length;
}

/** Directories under skills/ that contain a SKILL.md. */
export function listSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(SKILLS_DIR, e.name, 'SKILL.md')))
    .map((e) => e.name)
    .sort();
}

/** Every directory under skills/, including ones missing a SKILL.md — so we can catch those. */
export function listSkillDirs() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export function listReferences(skill) {
  const dir = join(SKILLS_DIR, skill, 'references');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

/** YAML-ish frontmatter. Only the flat `key: value` form skills are allowed to use. */
export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

/**
 * Path-shaped references into another skill's directory.
 * Prose mentions of a sibling skill's name are fine; reading its files is not (AC-012).
 */
export function crossSkillPaths(text, ownName) {
  const found = new Set();
  for (const m of text.matchAll(/(?:\.\.|skills)\/([a-z][a-z0-9-]*)\//g)) {
    if (m[1] !== ownName && listSkillDirs().includes(m[1])) found.add(m[1]);
  }
  return [...found];
}

const CRITERION_ROW = /^\|\s*(~~)?(AC-\d+)\1?~*\s*\|\s*(.+?)\s*\|\s*$/gm;

/** Extract §2.1 rows. Retired criteria are struck through and kept as tombstones. */
export function extractCriteria(markdown) {
  const out = [];
  for (const m of markdown.matchAll(CRITERION_ROW)) {
    out.push({ id: m[2], text: m[3].trim(), status: m[1] ? 'retired' : 'active' });
  }
  return out;
}

export function hasCriteriaSection(markdown) {
  return /^###\s+2\.1\s+Acceptance Criteria\s*$/m.test(markdown);
}

export const AC_ID = /^AC-\d{3}$/;

/**
 * Which EARS pattern a criterion uses, or null if it is not a well-formed criterion.
 * The obligation word is always "shall" — that is what makes requirements greppable.
 */
export function classifyEars(text) {
  const t = text.trim();
  if (!/\bshall\b/.test(t)) return null;
  if (!t.endsWith('.')) return null;
  if (/^When\b/.test(t)) return /,/.test(t) ? 'event' : null;
  if (/^While\b/.test(t)) return /,/.test(t) ? 'state' : null;
  if (/^If\b/.test(t)) return /\bthen\b/.test(t) ? 'unwanted' : null;
  if (/^Where\b/.test(t)) return /,/.test(t) ? 'optional' : null;
  return 'ubiquitous';
}

const TASK_ROW = /^\s*-\s*\[( |x)\]\s*(T-\d+)\s+(.+)$/gm;

/** Extract tasks from a TASKS.md body. `closes:` is required (AC-005). */
export function extractTasks(markdown) {
  const out = [];
  for (const m of markdown.matchAll(TASK_ROW)) {
    const body = m[3];
    const closes = [...body.matchAll(/\bAC-\d+\b/g)].map((x) => x[0]);
    const dependsOn = [...body.matchAll(/depends:\s*((?:T-\d+(?:,\s*)?)+)/g)]
      .flatMap((x) => [...x[1].matchAll(/T-\d+/g)])
      .map((x) => x[0]);
    const files = (/files:\s*([^—|]+)/.exec(body)?.[1] ?? '')
      .split(/[,\s]+/)
      .filter((f) => f.includes('/') || f.includes('.'));
    out.push({
      id: m[2],
      done: m[1] === 'x',
      title: body.split(' — ')[0].trim(),
      closes,
      dependsOn,
      files,
    });
  }
  return out;
}
