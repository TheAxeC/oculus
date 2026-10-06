// Layer 2, server. The reader of one app's `app.yml`: the map a folder's manifest holds, checked
// key by key against what an app may name, and every refusal as a finding keyed `apps[<id>]`.
//
// A manifest that names anything this oculus does not have, or anything closed to the app, refuses
// the app when its folder is read, before there is anything to approve, so the reader never
// approves something other than what runs. A refused folder is not offered, registered or served.
// The rules of what an app may name (the name pattern, the channels, the write kinds, the path
// segment rule) are `data/helpers/files/apps.ts`'s, which the page applies too. Only a glyph that
// is not usable leaves the app offered: it is drawn with the default glyph and the finding says so.

import { readFileSync } from 'node:fs';
import {
    APP_NAME,
    channelAccess,
    pathSegmentsOpen,
    writeAccess
} from '../../../data/helpers/files/apps.ts';
import { findingText, type TextCatalog } from '../../../data/helpers/finding-text.ts';
import type { Finding } from '../../../data/model/index.ts';
import { parseYamlMap, errorLine } from '../../../data/sources/yaml-file.ts';

/** The keys a manifest may hold. */
const KEYS = [
    'name',
    'title',
    'description',
    'glyph',
    'bridge',
    'entry',
    'reads',
    'writes',
    'connects'
];

/** The version of the bridge this oculus speaks, the only value `bridge` may hold. */
const BRIDGE = 1;

/** The glyph an app is drawn with when its manifest names none that it may use. */
const DEFAULT_GLYPH = 'app_view';

/** The glyph name the group heading draws, which no app may take. */
const RESERVED_GLYPH = 'app';

const TITLE_MAX = 40;
const DESCRIPTION_MAX = 200;
const DEFAULT_ENTRY = 'index.html';

/** What a manifest says once every key passed. */
type Manifest = {
    name: string;
    title: string;
    description: string;
    glyph: string;
    entry: string;
    reads: string[];
    writes: string[];
    connects: string[];
};

/** What the reader needs to know about the folder and the install around the manifest. */
export type ManifestInput = {
    /** The manifest's path. */
    file: string;
    /** The folder's name, which the manifest's `name` must equal. */
    folder: string;
    /** The root key, and the empty string for a machine app. */
    root: string;
    /** The paths of the app's recorded files, for the `entry` check. */
    files: ReadonlySet<string>;
    /** The glyph names of config/catalogs/glyphs.yml. */
    glyphs: ReadonlySet<string>;
    /** The port oculus listens on, which an `http:` origin may not name. */
    port: number;
    catalog: TextCatalog;
};

/**
 * What one read of a manifest gave: the manifest, the findings, and the bytes of the file that were
 * parsed, which are what the caller hashes, so the permissions shown and the hash approved come
 * from the same bytes. The bytes are null for a file that could not be read.
 */
export type ManifestRead = { manifest: Manifest | null; findings: Finding[]; bytes: Buffer | null };

/** The finding key of an app or folder: `apps[<root key>/<name>]`, or `apps[<name>]`. */
export function findingKey(root: string, name: string): string {
    return root === '' ? `apps[${name}]` : `apps[${root}/${name}]`;
}

/** Whether a text holds a control character, which a title may not. */
function hasControl(text: string): boolean {
    for (const char of text) {
        const code = char.codePointAt(0) ?? 0;
        if (code < 0x20 || (code >= 0x7f && code < 0xa0)) return true;
    }
    return false;
}

/**
 * The origin an `connects` entry stands for, written without a trailing slash, or null when the
 * entry is not an origin of the allowed form: `https://host` or `https://host:port`, or `http:` to
 * `localhost` or `127.0.0.1` on a port other than oculus's own, with no user name, path, query,
 * fragment or wildcard.
 */
function originOf(text: string, ownPort: number): string | null {
    if (text.includes('*')) return null;
    let url: URL;
    try {
        url = new URL(text);
    } catch {
        return null;
    }
    const bare = text.endsWith('/') ? text.slice(0, -1) : text;
    if (url.origin !== bare) return null;
    if (url.protocol === 'https:') return bare;
    if (url.protocol !== 'http:') return null;
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return null;
    return (url.port === '' ? 80 : Number(url.port)) === ownPort ? null : bare;
}

/** What a channel carries, in the words of its finding, by the name the reason is kept under. */
const CARRIES: Record<string, (catalog: TextCatalog) => string> = {
    apps: (catalog) => findingText(catalog, 'findings.apps.carries.apps'),
    pty: (catalog) => findingText(catalog, 'findings.apps.carries.pty'),
    processes: (catalog) => findingText(catalog, 'findings.apps.carries.processes'),
    inbox: (catalog) => findingText(catalog, 'findings.apps.carries.inbox'),
    calendar: (catalog) => findingText(catalog, 'findings.apps.carries.calendar'),
    sessions: (catalog) => findingText(catalog, 'findings.apps.carries.sessions'),
    usage: (catalog) => findingText(catalog, 'findings.apps.carries.usage')
};

/** The words for a channel closed to an app: whom it is closed to and what it carries. */
function closedWords(
    catalog: TextCatalog,
    name: string,
    root: boolean
): { who: string; carries: string } {
    const access = channelAccess(name);
    const reason = access.access === 'closed' ? access.carries : name;
    return {
        who: root
            ? findingText(catalog, 'findings.apps.who_root')
            : findingText(catalog, 'findings.apps.who_every'),
        carries: (Object.hasOwn(CARRIES, reason) ? CARRIES[reason](catalog) : reason).trim()
    };
}

/** A manifest value as the finding quotes it: a string as it is, anything else as JSON. */
function shown(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
}

/** The strings of a list key, or null when the value is no list of strings. */
function stringList(value: unknown): string[] | null {
    if (value === undefined) return [];
    return Array.isArray(value) && value.every((one) => typeof one === 'string') ? value : null;
}

/**
 * The names a `reads` or `writes` list holds, each once. A value that is no list of strings gives
 * no names and one refusal, and a name written twice gives a refusal for the repeat.
 */
function namesOf(
    value: unknown,
    list: 'reads' | 'writes',
    catalog: TextCatalog,
    refuse: (message: string) => void
): string[] {
    const names = stringList(value);
    if (names === null) {
        refuse(findingText(catalog, 'findings.apps.list_shape', list));
        return [];
    }
    const seen = new Set<string>();
    for (const name of names) {
        if (seen.has(name)) refuse(findingText(catalog, 'findings.apps.list_repeated', name, list));
        seen.add(name);
    }
    return [...seen];
}

/**
 * The origins a `connects` list holds, each once and without a trailing slash. An entry that is no
 * origin of the allowed form, and an origin written twice, are refusals.
 */
function originsOf(
    value: unknown,
    port: number,
    catalog: TextCatalog,
    refuse: (message: string) => void
): string[] {
    const entries = stringList(value);
    if (entries === null) {
        refuse(findingText(catalog, 'findings.apps.list_shape', 'connects'));
        return [];
    }
    const origins: string[] = [];
    for (const text of entries) {
        const origin = originOf(text, port);
        if (origin === null) {
            refuse(findingText(catalog, 'findings.apps.connect_shape', text));
        } else if (origins.includes(origin)) {
            refuse(findingText(catalog, 'findings.apps.list_repeated', origin, 'connects'));
        } else {
            origins.push(origin);
        }
    }
    return origins;
}

/**
 * Read the manifest of the app folder `input.folder`. Every key is checked and every refusal is a
 * finding; the manifest is null when any key refuses the app.
 */
export function readManifest(input: ManifestInput): ManifestRead {
    const { catalog, root } = input;
    const key = findingKey(root, input.folder);
    const found: Finding[] = [];
    const parsed: Finding[] = [];
    let bytes: Buffer;
    try {
        bytes = readFileSync(input.file);
    } catch (error) {
        const message = findingText(catalog, 'findings.file.does_not_parse', errorLine(error));
        return { manifest: null, findings: [{ file: input.file, key, message }], bytes: null };
    }
    const map = parseYamlMap(input.file, bytes.toString('utf8'), catalog, parsed);
    if (map === null) {
        return {
            manifest: null,
            findings: parsed.map((finding) => ({ ...finding, key })),
            bytes
        };
    }
    const outcome = { refused: false };
    const note = (message: string): void => {
        found.push({ file: input.file, key, message });
    };
    const refuse = (message: string): void => {
        outcome.refused = true;
        note(message);
    };

    for (const one of Object.keys(map)) {
        if (!KEYS.includes(one)) refuse(findingText(catalog, 'findings.apps.key_unknown', one));
    }

    const rawName = map.name;
    if (rawName === undefined || rawName === null || rawName === '') {
        refuse(findingText(catalog, 'findings.apps.name_empty'));
    } else if (typeof rawName !== 'string' || !APP_NAME.test(rawName)) {
        refuse(findingText(catalog, 'findings.apps.name_shape', shown(rawName)));
    } else if (rawName !== input.folder) {
        refuse(findingText(catalog, 'findings.apps.name_not_folder', rawName, input.folder));
    }

    let title = '';
    if (map.title === undefined) {
        refuse(findingText(catalog, 'findings.apps.key_missing', 'title'));
    } else if (typeof map.title !== 'string') {
        refuse(findingText(catalog, 'findings.apps.title_shape'));
    } else {
        title = map.title.trim();
        if (title.length < 1 || title.length > TITLE_MAX || hasControl(title)) {
            title = '';
            refuse(findingText(catalog, 'findings.apps.title_shape'));
        }
    }

    let description = '';
    if (map.description !== undefined) {
        if (typeof map.description === 'string' && map.description.length <= DESCRIPTION_MAX) {
            description = map.description;
        } else {
            refuse(findingText(catalog, 'findings.apps.description_shape'));
        }
    }

    if (map.bridge === undefined) {
        refuse(findingText(catalog, 'findings.apps.key_missing', 'bridge'));
    } else if (map.bridge !== BRIDGE) {
        refuse(findingText(catalog, 'findings.apps.bridge_unknown', shown(map.bridge)));
    }

    let glyph = DEFAULT_GLYPH;
    if (map.glyph !== undefined) {
        const wanted = map.glyph;
        if (typeof wanted === 'string' && wanted !== RESERVED_GLYPH && input.glyphs.has(wanted)) {
            glyph = wanted;
        } else {
            note(findingText(catalog, 'findings.apps.glyph_unknown', shown(wanted)));
        }
    }

    const entry = map.entry === undefined ? DEFAULT_ENTRY : shown(map.entry);
    if (typeof map.entry === 'object' || !pathSegmentsOpen(entry) || !entry.endsWith('.html')) {
        refuse(findingText(catalog, 'findings.apps.entry_shape', entry));
    } else if (!input.files.has(entry)) {
        refuse(findingText(catalog, 'findings.apps.entry_missing', entry));
    }

    const reads = namesOf(map.reads, 'reads', catalog, refuse);
    const writes = namesOf(map.writes, 'writes', catalog, refuse);
    const connects = originsOf(map.connects, input.port, catalog, refuse);
    for (const name of reads) {
        const access = channelAccess(name);
        if (access.access === 'unknown') {
            refuse(findingText(catalog, 'findings.apps.channel_unknown', name));
        } else if (access.access === 'closed' || (access.access === 'machine' && root !== '')) {
            const words = closedWords(catalog, name, access.access === 'machine');
            refuse(
                findingText(catalog, 'findings.apps.channel_closed', name, words.who, words.carries)
            );
        }
    }
    for (const name of writes) {
        const access = writeAccess(name);
        if (access === 'unknown') {
            refuse(findingText(catalog, 'findings.apps.write_unknown', name));
        } else if (access === 'closed') {
            refuse(findingText(catalog, 'findings.apps.write_closed', name));
        }
    }

    if (outcome.refused) return { manifest: null, findings: found, bytes };
    return {
        manifest: { name: input.folder, title, description, glyph, entry, reads, writes, connects },
        findings: found,
        bytes
    };
}
