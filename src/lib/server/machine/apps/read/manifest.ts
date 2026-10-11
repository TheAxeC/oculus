// Layer 2, server. The reader of one app's `app.yml`: the map a folder's manifest holds, checked
// against the zod shape of the whole file (`appShape`) and then against what only the folder and
// the install know, and every refusal as a finding keyed `apps[<id>]`. The shape is what the
// editor's JSON Schema of `app.yml` is made from, so a key the editor marks is a key this reader
// refuses.
//
// A manifest that names anything this oculus does not have, or anything closed to the app, refuses
// the app when its folder is read, before there is anything to approve, so the reader never
// approves something other than what runs. A refused folder is not offered, registered or served.
// The rules of what an app may name (the name pattern, the channels, the write kinds, the path
// segment rule) are `data/helpers/files/apps.ts`'s, which the page applies too. Only a glyph that
// is not usable leaves the app offered: it is drawn with the default glyph and the finding says so.
//
// The keys of the host are checked here too: `host` names a recorded file, `files` the folders a
// machine app's page may read (the root of an entry is the longest shown root key it starts with,
// and an entry naming no shown root is kept), `secrets` is `true` or absent, `activation` lists
// events and needs a `host`, and `depends` lists the machine apps the host needs. A dependency that
// is absent, refused, disabled or unapproved does not refuse the folder: the host waits.

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import {
    APP_NAME,
    channelAccess,
    inClosedPaths,
    filesPlace,
    pathSegmentsOpen,
    writeAccess
} from '../../../../data/helpers/files/apps.ts';
import { findingText, type TextCatalog } from '../../../../data/helpers/finding-text.ts';
import type { AppRow, Finding } from '../../../../data/model/index.ts';
import { parseYamlMap, errorLine } from '../../../../data/sources/yaml-file.ts';
import { ENGINE_ROOT } from '../../../files/files.ts';
import { DEFAULT_ACTIVATION, parseEvent } from './activation.ts';

/** The version of the bridge this oculus speaks, the only value `bridge` may hold. */
const BRIDGE = 1;

/** The glyph an app is drawn with when its manifest names none that it may use. */
const DEFAULT_GLYPH = 'app_view';

/** The glyph name the group heading draws, which no app may take. */
const RESERVED_GLYPH = 'app';

const TITLE_MAX = 40;
const DESCRIPTION_MAX = 200;
const DEFAULT_ENTRY = 'index.html';

/** Whether a text holds a control character, which a title may not. */
function hasControl(text: string): boolean {
    for (const char of text) {
        const code = char.codePointAt(0) ?? 0;
        if (code < 0x20 || (code >= 0x7f && code < 0xa0)) return true;
    }
    return false;
}

/** Whether a title, trimmed, is one to forty characters and holds no control character. */
function fitsTitle(title: string): boolean {
    const trimmed = title.trim();
    return trimmed.length >= 1 && trimmed.length <= TITLE_MAX && !hasControl(trimmed);
}

/**
 * The whole of an `app.yml`: the keys an app may name and what each one holds. What needs the
 * folder (the name is the folder's), the install (the glyphs, the port) or the channel tables is
 * checked after the shape. A key left out is its default, except `name`, `title` and `bridge`.
 */
export const appShape = z.strictObject({
    name: z.string().regex(APP_NAME),
    title: z.string().refine(fitsTitle),
    description: z.string().max(DESCRIPTION_MAX).optional(),
    glyph: z.string().optional(),
    bridge: z.literal(BRIDGE),
    entry: z
        .string()
        .regex(/\.html$/)
        .refine((entry) => pathSegmentsOpen(entry))
        .optional(),
    reads: z.array(z.string()).optional(),
    writes: z.array(z.string()).optional(),
    connects: z.array(z.string()).optional(),
    host: z
        .string()
        .regex(/\.m?js$/)
        .refine((host) => pathSegmentsOpen(host))
        .optional(),
    files: z.array(z.string()).optional(),
    secrets: z.literal(true).optional(),
    activation: z.array(z.string()).optional(),
    depends: z.array(z.string().regex(APP_NAME)).optional()
});

/** What the shape refuses of a manifest: the keys it does not name and the keys that do not fit. */
type Flaws = { unknown: string[]; bad: Set<string> };

/** The flaws of a manifest map against `appShape`. */
function flawsOf(map: Record<string, unknown>): Flaws {
    const flaws: Flaws = { unknown: [], bad: new Set() };
    const read = appShape.safeParse(map);
    if (read.success) return flaws;
    for (const issue of read.error.issues) {
        if (issue.code === 'unrecognized_keys') flaws.unknown.push(...issue.keys);
        else if (typeof issue.path[0] === 'string') flaws.bad.add(issue.path[0]);
    }
    return flaws;
}

/** What a manifest says once every key passed: the fields of a row that the manifest names. */
type Manifest = Pick<
    AppRow,
    | 'name'
    | 'title'
    | 'description'
    | 'glyph'
    | 'entry'
    | 'reads'
    | 'writes'
    | 'connects'
    | 'host'
    | 'readFolders'
    | 'secrets'
    | 'activation'
    | 'depends'
>;

/** What the reader needs to know about the folder and the install around the manifest. */
export type ManifestInput = {
    /** The manifest's path. */
    file: string;
    /** The folder's name, which the manifest's `name` must equal. */
    folder: string;
    /** The root key, and the empty string for a machine app. */
    root: string;
    /** The paths of the app's recorded files, for the `entry` and `host` checks. */
    files: ReadonlySet<string>;
    /** The keys of the roots the file browser shows, which the roots of `files` entries are. */
    rootKeys: readonly string[];
    /** The folders `closed_paths` names, or null while the key is missing or is no list. */
    closedPaths: readonly string[] | null;
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
    'app-hosts': (catalog) => findingText(catalog, 'findings.apps.carries.app_hosts'),
    'app-messages': (catalog) => findingText(catalog, 'findings.apps.carries.app_messages'),
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

/** The strings of a list key the shape passed, and none when the key is missing. */
function stringList(value: unknown): string[] {
    return Array.isArray(value) ? (value as string[]) : [];
}

/**
 * The names a `reads` or `writes` list holds, each once. A value that is no list of strings gives
 * no names and one refusal, and a name written twice gives a refusal for the repeat.
 */
function namesOf(
    value: unknown,
    list: 'reads' | 'writes',
    flaws: Flaws,
    catalog: TextCatalog,
    refuse: (message: string) => void
): string[] {
    if (flaws.bad.has(list)) {
        refuse(findingText(catalog, 'findings.apps.list_shape', list));
        return [];
    }
    const seen = new Set<string>();
    for (const name of stringList(value)) {
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
    flaws: Flaws,
    catalog: TextCatalog,
    refuse: (message: string) => void
): string[] {
    if (flaws.bad.has('connects')) {
        refuse(findingText(catalog, 'findings.apps.list_shape', 'connects'));
        return [];
    }
    const origins: string[] = [];
    for (const text of stringList(value)) {
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

/** The strings of a list key, or null with one refusal when the value is no list of strings. */
function stringsOf(
    value: unknown,
    key: string,
    catalog: TextCatalog,
    refuse: (message: string) => void
): string[] | null {
    if (value === undefined) return [];
    if (Array.isArray(value) && value.every((one) => typeof one === 'string')) {
        return value;
    }
    refuse(findingText(catalog, 'findings.apps.list_shape', key));
    return null;
}

/** The entries of a list each once, and a refusal for an entry written twice. */
function onceEach(
    entries: string[],
    key: string,
    catalog: TextCatalog,
    refuse: (message: string) => void
): string[] {
    const seen = new Set<string>();
    for (const entry of entries) {
        if (seen.has(entry))
            refuse(findingText(catalog, 'findings.apps.list_repeated', entry, key));
        seen.add(entry);
    }
    return [...seen];
}

/**
 * The `files` entries of a machine app, each once and each checked: not the root `engine`, a path
 * of the segment rule that `closed_paths` does not close. An entry naming no shown root is kept.
 */
function foldersOf(
    value: unknown,
    input: ManifestInput,
    refuse: (message: string) => void
): string[] {
    const { catalog } = input;
    const listed = stringsOf(value, 'files', catalog, refuse);
    if (listed === null) return [];
    if (listed.length > 0 && input.root !== '') {
        refuse(findingText(catalog, 'findings.apps.files_root_app'));
        return [];
    }
    const entries = onceEach(listed, 'files', catalog, refuse);
    for (const entry of entries) {
        const place = filesPlace(entry, input.rootKeys);
        if (place.root === ENGINE_ROOT) {
            refuse(findingText(catalog, 'findings.apps.files_engine', entry));
        } else if (place.root === '' || (place.path !== '' && !pathSegmentsOpen(place.path))) {
            refuse(findingText(catalog, 'findings.apps.files_shape', entry));
        } else if (input.closedPaths === null || inClosedPaths(place.path, input.closedPaths)) {
            refuse(findingText(catalog, 'findings.apps.files_closed', entry));
        }
    }
    return entries;
}

/** The activation events of a host, each once and each an event the grammar reads. */
function eventsOf(
    value: unknown,
    hasHost: boolean,
    catalog: TextCatalog,
    refuse: (message: string) => void
): string[] {
    const listed = stringsOf(value, 'activation', catalog, refuse);
    if (listed === null) return [];
    if (value !== undefined && !hasHost) {
        refuse(findingText(catalog, 'findings.apps.activation_no_host'));
        return [];
    }
    for (const text of listed) {
        const event = parseEvent(text);
        if (event === 'unknown') refuse(findingText(catalog, 'findings.apps.event_unknown', text));
        else if (event === 'empty') refuse(findingText(catalog, 'findings.apps.event_empty', text));
        else if (event === 'glob') refuse(findingText(catalog, 'findings.apps.event_glob', text));
    }
    const events = onceEach(listed, 'activation', catalog, refuse);
    return events.length === 0 ? [DEFAULT_ACTIVATION] : events;
}

/** The names of the machine apps a host depends on, each once, none the app's own name. */
function dependenciesOf(
    value: unknown,
    own: string,
    catalog: TextCatalog,
    refuse: (message: string) => void
): string[] {
    const listed = stringsOf(value, 'depends', catalog, refuse);
    if (listed === null) return [];
    for (const name of listed) {
        if (!APP_NAME.test(name)) refuse(findingText(catalog, 'findings.apps.depends_name', name));
        else if (name === own) refuse(findingText(catalog, 'findings.apps.depends_self', name));
    }
    return onceEach(listed, 'depends', catalog, refuse);
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

    const flaws = flawsOf(map);
    for (const one of flaws.unknown) {
        refuse(findingText(catalog, 'findings.apps.key_unknown', one));
    }

    const rawName = map.name;
    if (flaws.bad.has('name') || rawName === undefined) {
        refuse(
            rawName === undefined || rawName === null || rawName === ''
                ? findingText(catalog, 'findings.apps.name_empty')
                : findingText(catalog, 'findings.apps.name_shape', shown(rawName))
        );
    } else if (rawName !== input.folder) {
        refuse(findingText(catalog, 'findings.apps.name_not_folder', shown(rawName), input.folder));
    }

    let title = '';
    if (flaws.bad.has('title') || map.title === undefined) {
        refuse(
            map.title === undefined
                ? findingText(catalog, 'findings.apps.key_missing', 'title')
                : findingText(catalog, 'findings.apps.title_shape')
        );
    } else {
        title = shown(map.title).trim();
    }

    let description = '';
    if (flaws.bad.has('description')) {
        refuse(findingText(catalog, 'findings.apps.description_shape'));
    } else if (map.description !== undefined) {
        description = shown(map.description);
    }

    if (flaws.bad.has('bridge') || map.bridge === undefined) {
        refuse(
            map.bridge === undefined
                ? findingText(catalog, 'findings.apps.key_missing', 'bridge')
                : findingText(catalog, 'findings.apps.bridge_unknown', shown(map.bridge))
        );
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
    if (flaws.bad.has('entry')) {
        refuse(findingText(catalog, 'findings.apps.entry_shape', entry));
    } else if (!input.files.has(entry)) {
        refuse(findingText(catalog, 'findings.apps.entry_missing', entry));
    }

    const reads = namesOf(map.reads, 'reads', flaws, catalog, refuse);
    const writes = namesOf(map.writes, 'writes', flaws, catalog, refuse);
    const connects = originsOf(map.connects, input.port, flaws, catalog, refuse);
    let host = '';
    if (map.host !== undefined) {
        host = shown(map.host);
        if (flaws.bad.has('host') || typeof map.host !== 'string') {
            refuse(findingText(catalog, 'findings.apps.host_shape', host));
        } else if (!input.files.has(host)) {
            refuse(findingText(catalog, 'findings.apps.host_missing', host));
        }
    }
    const readFolders = foldersOf(map.files, input, refuse);
    if (map.secrets !== undefined && map.secrets !== true) {
        refuse(findingText(catalog, 'findings.apps.secrets_value', shown(map.secrets)));
    }
    const activation = eventsOf(map.activation, map.host !== undefined, catalog, refuse);
    const depends = dependenciesOf(map.depends, input.folder, catalog, refuse);
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
        manifest: {
            name: input.folder,
            title,
            description,
            glyph,
            entry,
            reads,
            writes,
            connects,
            host,
            readFolders,
            secrets: map.secrets === true,
            activation,
            depends
        },
        findings: found,
        bytes
    };
}
