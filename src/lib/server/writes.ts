// Layer 2, server. The write side of the application: one manifest field set from the page.
//
// routes/api/write/+server.ts is the endpoint and holds nothing but its POST, since a route module
// may export only its verbs; everything the write does is here. The order is the order of the
// refusals: the request must come from this application's own page and carry the process token, the
// body must be a write this route knows, the id must name a project the reader found, and the field
// must be one the schema names. Only then does yaml-edit touch the bytes, and only then, and only
// when something actually changed, is the file written.
//
// The path written is the reader's, never the request's: the id names a manifest readManifests
// already found under the hub's own scan directories, and the resolved path is checked against them
// again before the write. Nothing outside them is ever opened for writing.

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import { portfolioConfigFrom } from '../data/index.ts';
import { engineDir, loadConfig, loadLocal } from '../data/sources/config.ts';
import { readManifests } from '../data/sources/manifests.ts';
import { fieldNames } from '../data/validate.ts';
import { hasToken, sameOrigin } from './auth.ts';
import { setFields } from './yaml-edit.ts';
import type { FieldValue, Refusal } from './yaml-edit.ts';
import type { PortfolioConfig } from '../data/model.ts';

/** What a write needs to know: which hub to write in, and what its manifests are checked against. */
export type WriteTarget = { hub: string; config: PortfolioConfig };

export type WriteOutcome = {
    /** False when the hub holds no project with that id; then nothing was read and nothing written. */
    found: boolean;
    changed: string[];
    refused: Refusal[];
};

/** The name of the manifest file, which is the only name this module ever writes. */
const MANIFEST = 'project.yml';

/**
 * The field types, read out of the same `manifest_schema` the client's state/schema.ts reads. The
 * two readers are separate because the boundary table of DESIGN.md lets `state/` import `data/model`
 * and nothing else of layer 1, so a shared module would be a boundary violation rather than a
 * saving; what they share is the config file, which is the point of config as data.
 */
export function fieldTypes(schema: unknown): Record<string, string> {
    const types: Record<string, string> = {};
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) return types;
    const fields = (schema as Record<string, unknown>).fields;
    if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) return types;
    for (const [name, entry] of Object.entries(fields as Record<string, unknown>)) {
        if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue;
        const type = (entry as Record<string, unknown>).type;
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
    if (typeof parent !== 'object' || parent === null || Array.isArray(parent)) return undefined;
    return (parent as Record<string, unknown>)[field.slice(dot + 1)];
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
    const types = fieldTypes(config.schema);
    const refused: Refusal[] = [];
    const wanted: Record<string, unknown> = {};
    for (const [field, raw] of Object.entries(fields)) {
        if (!named.has(field)) {
            refused.push({ field, reason: 'the manifest schema does not name the field' });
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

/** The body a write carries. `kind` is the discriminator later writes are added on. */
type ManifestWrite = { kind: 'manifest'; id: string; fields: Record<string, unknown> };

/** The body as a manifest write, or null when it is not one. */
export function manifestWrite(body: unknown): ManifestWrite | null {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
    const held = body as Record<string, unknown>;
    if (held.kind !== 'manifest' || typeof held.id !== 'string' || held.id === '') return null;
    const fields = held.fields;
    if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) return null;
    return { kind: 'manifest', id: held.id, fields: fields as Record<string, unknown> };
}

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/** Where writes land on this machine: the hub of local.yml, read the way every other reader does. */
export function target(): WriteTarget {
    const engine = engineDir();
    return { hub: loadLocal(engine).hub, config: portfolioConfigFrom(loadConfig(engine).config) };
}

/**
 * The whole endpoint: refuse, or write and say what changed. A refusal names what was wrong and
 * nothing more; the page shows it beside the form.
 */
export async function handleWrite(
    request: Request,
    token: string,
    into: WriteTarget
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token))
        return json(403, { error: 'the write token is missing or stale' });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    const write = manifestWrite(body);
    if (write === null) return json(400, { error: 'the body is not a manifest write' });

    const outcome = writeManifest(into.hub, into.config, write.id, write.fields);
    if (!outcome.found) return json(404, { error: `no project with the id ${write.id}` });
    return json(200, { ok: true, changed: outcome.changed, refused: outcome.refused });
}
