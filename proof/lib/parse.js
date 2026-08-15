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

/** The body of a heading, up to the next heading of the same or higher level. */
export function sliceSection(markdown, headingPattern) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => headingPattern.test(l));
  if (start === -1) return '';
  const level = (/^(#+)/.exec(lines[start]) ?? ['', ''])[1].length;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^(#+)\s/.exec(lines[i]);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join('\n');
}

const EDIT_HEADING = /^###\s+§(\d+(?:\.\d+)?)\s+(.+?)\s+—\s+(add|replace|remove)\s*$/gm;

/** Sections whose entries record a reason. Changing one silently is a regression. */
export const REASONED_SECTIONS = ['3', '8', '9'];

export function parseProposal(markdown) {
  const ordinal = /^#\s+(\d{4})\s+—\s+(.+)$/m.exec(markdown);
  const status = /^>\s*Status:\s*([a-z-]+)/m.exec(markdown);
  const edits = [];
  for (const m of markdown.matchAll(EDIT_HEADING)) {
    const body = sliceSection(markdown, new RegExp(`^${escapeRegExp(m[0].trim())}$`));
    edits.push({
      section: m[1],
      title: m[2],
      operation: m[3],
      hasReason: /\*\*Reason:\*\*/.test(body),
    });
  }
  return {
    ordinal: ordinal?.[1] ?? null,
    title: ordinal?.[2] ?? null,
    status: status?.[1] ?? null,
    added: extractCriteria(sliceSection(markdown, /^##\s+Criteria added/)),
    retired: extractCriteria(sliceSection(markdown, /^##\s+Criteria retired/)),
    edits,
  };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Everything that must be true before a shipped proposal may be merged. */
export function proposalViolations(proposal, specCriteria) {
  const specIds = specCriteria.map((c) => c.id);
  const problems = [];

  for (const c of proposal.added) {
    if (specIds.includes(c.id)) problems.push(`${c.id} already exists in the spec`);
    if (!AC_ID.test(c.id)) problems.push(`${c.id} is not a valid identifier`);
    if (!classifyEars(c.text)) problems.push(`${c.id} is not well-formed EARS`);
  }

  for (const c of proposal.retired) {
    if (!specIds.includes(c.id)) problems.push(`${c.id} is retired but never existed`);
  }

  for (const e of proposal.edits) {
    if (e.operation === 'remove' && !e.hasReason) {
      problems.push(`§${e.section} remove has no reason`);
    }
    if (e.operation === 'replace' && REASONED_SECTIONS.includes(e.section) && !e.hasReason) {
      problems.push(`§${e.section} replace has no reason, and §${e.section} records reasons`);
    }
  }

  return problems;
}

/** Section overlaps between unarchived proposals. A sequencing decision, not a merge. */
export function findConflicts(proposals) {
  const out = [];
  for (let i = 0; i < proposals.length; i++) {
    for (let j = i + 1; j < proposals.length; j++) {
      const a = new Set(proposals[i].edits.map((e) => e.section));
      const shared = [...new Set(proposals[j].edits.map((e) => e.section))].filter((s) => a.has(s));
      if (shared.length) {
        out.push({ a: proposals[i].ordinal, b: proposals[j].ordinal, sections: shared });
      }
    }
  }
  return out;
}

export function renderTombstone(id, ordinal, reason) {
  return `| ~~${id}~~ | *Retired in ${ordinal} — ${reason}* |`;
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
