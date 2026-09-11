// Layer 2, server. The manifest half of the write path: what a form value becomes, which paths may
// be written at all, one project.yml edited, and one new idea folder scaffolded.
//
// The path written is the reader's, never the request's: the id names a manifest readManifests
// already found under the hub's own scan directories, and insideHub checks the resolved path against
// them again before the write. Nothing outside them is ever opened for writing.
//
// server/writes.ts is the route and re-exports everything here, so an importer names either file.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { isMap } from '../../data/guards.ts';
import { readManifests } from '../../data/sources/manifests.ts';
import { fieldNames } from '../../data/validate.ts';
import { renderScalar, setFields } from '../yaml-edit.ts';
import type { FieldValue, Refusal } from '../yaml-edit.ts';
import type { PortfolioConfig } from '../../data/model.ts';
import type { WriteOutcome } from '../writes.ts';

/** The name of the manifest file, which is the only name this module ever writes. */
const MANIFEST = 'project.yml';

/**
 * The field types, read out of the same `manifest_schema` the client's state/schema.ts reads. The
 * two readers are separate because the boundary table of DESIGN.md lets `state/` import `data/model`
 * and `data/guards` and nothing else of layer 1, so a shared module would be a boundary violation
 * rather than a saving; what they share is the config file, which is the point of config as data.
 */
export function fieldTypes(schema: unknown): Record<string, string> {
    const types: Record<string, string> = {};
    if (!isMap(schema)) return types;
    const fields = schema.fields;
    if (!isMap(fields)) return types;
    for (const [name, entry] of Object.entries(fields)) {
        if (!isMap(entry)) continue;
        const type = entry.type;
        if (typeof type === 'string') types[name] = type;
    }
    return types;
}

/** The words a checkbox is true in: what a form posts, and what YAML already holds. */
const TRUE = [true, 'true', 'True', '1', 'on', 1];

/** Types whose value is one line of text. */
const TEXTS = ['text', 'textarea', 'date', 'select'];

/** Types whose value is a list of strings. */
const LISTS = ['tags', 'chips', 'lines'];

/** A refusal reason, or the value to write. The two are told apart by the shape. */
type Coerced = { value: FieldValue } | { reason: string };

/**
 * One form value as the manifest's own kind of value. An empty text, an empty list and an unticked
 * checkbox all clear the field, which is what the form means by leaving a control empty. A number
 * the manifest holds as a number (`year`) stays a number, so editing the title beside it does not
 * turn it into a string.
 */
export function coerce(type: string, raw: unknown, current: unknown): Coerced {
    if (type === 'readonly') return { reason: 'the field is read-only' };
    if (type === 'keymap') return { reason: 'a map field is not written by the form' };
    if (type === 'checkbox') {
        return { value: TRUE.includes(raw as string | number | boolean) ? true : null };
    }
    if (LISTS.includes(type)) {
        const items =
            typeof raw === 'string'
                ? raw.split(type === 'lines' ? '\n' : ',')
                : Array.isArray(raw)
                  ? raw
                  : null;
        if (items === null) return { reason: 'the value is not a list' };
        const strings: string[] = [];
        for (const item of items) {
            if (typeof item !== 'string')
                return { reason: 'the list holds something not a string' };
            const trimmed = item.trim();
            if (trimmed !== '') strings.push(trimmed);
        }
        return { value: strings.length === 0 ? null : strings };
    }
    if (!TEXTS.includes(type)) return { reason: `unknown field type ${type}` };
    if (raw === null || raw === undefined) return { value: null };
    if (typeof raw === 'boolean' || typeof raw === 'number') return { value: raw };
    if (typeof raw !== 'string') return { reason: 'the value is not text' };
    const text = raw.trim();
    if (text === '') return { value: null };
    if (typeof current === 'number' && /^-?\d+(?:\.\d+)?$/.test(text))
        return { value: Number(text) };
    return { value: text };
}

/** The value a dotted field currently holds in a manifest record, or undefined. */
function currentOf(manifest: Record<string, unknown>, field: string): unknown {
    const dot = field.indexOf('.');
    if (dot < 0) return manifest[field];
    const parent = manifest[field.slice(0, dot)];
    if (!isMap(parent)) return undefined;
    return parent[field.slice(dot + 1)];
}

/** Whether a path is a manifest inside one of the hub's own scan directories. */
export function insideHub(hub: string, config: PortfolioConfig, file: string): boolean {
    const path = resolve(file);
    if (basename(path) !== MANIFEST) return false;
    return config.scan.some((rule) => path.startsWith(resolve(join(hub, rule.dir)) + sep));
}

/**
 * Set fields of one project's manifest. The file is written only when the edit changed something,
 * so a form saved with nothing altered leaves the file's mtime alone.
 */
export function writeManifest(
    hub: string,
    config: PortfolioConfig,
    id: string,
    fields: Record<string, unknown>
): WriteOutcome {
    const { manifests } = readManifests(hub, config.scan);
    const manifest = manifests.find((one) => one.id === id);
    if (manifest === undefined) return { found: false, changed: [], refused: [] };
    if (!insideHub(hub, config, manifest.file)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: 'the manifest is not inside the hub' }]
        };
    }

    const named = new Set(fieldNames(config.schema));
    // The parents of the dotted names, `followup` for `followup.do` and `followup.after`: a group
    // the schema names by its children may be cleared whole by its parent name, since the file may
    // hold it as a bare note, a map or a list and clearing one child of a note is not a write the
    // editor can make. A value for the parent is still refused: only its children take one.
    const groups = new Set(
        [...named].filter((one) => one.includes('.')).map((one) => one.slice(0, one.indexOf('.')))
    );
    const types = fieldTypes(config.schema);
    const refused: Refusal[] = [];
    const wanted: Record<string, unknown> = {};
    for (const [field, raw] of Object.entries(fields)) {
        if (!named.has(field)) {
            const clearing = raw === null || raw === undefined || raw === '';
            if (groups.has(field) && clearing) {
                wanted[field] = null;
                continue;
            }
            refused.push({
                field,
                reason: groups.has(field)
                    ? 'the field is a group; set its children, or clear it whole'
                    : 'the manifest schema does not name the field'
            });
            continue;
        }
        const out = coerce(types[field] ?? 'text', raw, currentOf(manifest, field));
        if ('reason' in out) {
            refused.push({ field, reason: out.reason });
            continue;
        }
        wanted[field] = out.value;
    }

    let source: string;
    try {
        source = readFileSync(manifest.file, 'utf8');
    } catch {
        return {
            found: true,
            changed: [],
            refused: [...refused, { field: '', reason: 'the manifest could not be read' }]
        };
    }

    const edit = setFields(source, wanted);
    if (edit.changed.length > 0) writeFileSync(manifest.file, edit.text, 'utf8');
    return { found: true, changed: edit.changed, refused: [...refused, ...edit.refused] };
}

/** Where a new idea is scaffolded, and what an idea id may be. */
const IDEA_DIR = 'projects/ideas';
const IDEA_ID = /^[a-z0-9][a-z0-9-]*$/;

/** The two lines the scaffold states for itself; the user rewrites them when the idea is scoped. */
const IDEA_STATUS = 'New idea - scope + novelty check open.';
const IDEA_NEXT = 'Scope the idea; cited-novelty lit check; decide go/no-go.';

/** One text field of a form, trimmed, or the empty string when it is not text. */
function text(raw: unknown): string {
    return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * Scaffold one idea project: `projects/ideas/<id>/project.yml` and a README beside it. A bad id and
 * a folder that is already there are both refused, so nothing existing is ever written over.
 */
export function createIdea(hub: string, fields: Record<string, unknown>): WriteOutcome {
    const id = text(fields.id);
    if (!IDEA_ID.test(id)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: 'an id is lower case letters, digits and hyphens' }]
        };
    }
    const folder = resolve(join(hub, IDEA_DIR, id));
    if (!folder.startsWith(resolve(join(hub, IDEA_DIR)) + sep)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: 'not a folder name' }]
        };
    }
    if (existsSync(folder)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: `${IDEA_DIR}/${id} is already there` }]
        };
    }

    const title = text(fields.title) || id;
    const eli5 = text(fields.eli5) || title;
    const lines = [`id: ${id}`, 'type: idea'];
    const short = text(fields.short);
    const domain = text(fields.domain);
    if (short !== '') lines.push(`short: ${renderScalar(short)}`);
    if (domain !== '') lines.push(`domain: ${renderScalar(domain)}`);
    lines.push(
        `title: ${renderScalar(title)}`,
        'focus: holding',
        'status:',
        '  chips: [exploring]',
        `  line: ${renderScalar(IDEA_STATUS)}`,
        `eli5: ${renderScalar(eli5)}`,
        `next: ${renderScalar(IDEA_NEXT)}`
    );
    const manifest = `${lines.join('\n')}\n`;
    let parsed: unknown;
    try {
        parsed = parse(manifest);
    } catch {
        parsed = undefined;
    }
    if (!isMap(parsed)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: 'the scaffold did not parse; nothing was written' }]
        };
    }
    const readme = `# ${title}\n\n${eli5}\n\n## Next\n\n${IDEA_NEXT}\n`;

    mkdirSync(dirname(folder), { recursive: true });
    mkdirSync(folder);
    writeFileSync(join(folder, 'project.yml'), manifest, 'utf8');
    writeFileSync(join(folder, 'README.md'), readme, 'utf8');
    return {
        found: true,
        changed: [`${IDEA_DIR}/${id}/project.yml`, `${IDEA_DIR}/${id}/README.md`],
        refused: []
    };
}
