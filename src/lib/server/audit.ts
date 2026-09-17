// Layer 2, server. The deterministic scan of what the hub is missing: open markers left in a
// document, a manifest field a live project has not filled in, a folder that is not the one the tier
// standard names, a status chip the project's own tier and type contradict, a field long enough to
// stop being a glance, and the public website's publication list against the portfolio.
//
// It is not the Findings view's list and does not repeat it. Findings is what data/validate.ts found
// wrong in the files themselves, a bad id or an unknown chip; this is what is true of the files and
// still wants doing. The two kinds the data layer already reports, the manifest schema errors and
// the references that resolve to nothing, are therefore not scanned again here.
//
// Every finding carries a signature, twelve hex characters of a sha1 over its scope, place, kind and
// message. It is what the mute list in config/behavior.yml holds, so a muted finding is still muted
// after a rebuild, and it is the same signature the research cockpit computes over the same four
// fields, so a mute made in one tool holds in the other.
//
// The scan reads the disk (a document's text, whether a folder is there), so it runs once per
// rebuild in the portfolio watcher and never per request. It is pure over its arguments: the hub
// path, the projects and collections of the snapshot, the rules read out of the configuration, and
// the text catalog the messages are written in.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { localDate } from '../data/dates.ts';
import { byKey } from '../data/guards.ts';
import { findingText } from '../data/finding-text.ts';
import type { AuditFinding, AuditKind, Collection, Project } from '../data/model.ts';

/** The markers a document is scanned for, as whole words where they are ordinary English. */
const MARKERS = /%TODO|%VERIFY|%FIXME|\bTODO\b|\bFIXME\b|\bTBD\b|\bXXX\b/g;

/** A result the author has tagged as not final. */
const PROVISIONAL = /\[PROVISIONAL\]/i;

/** The documents of a project folder the markers are read from. */
const SCANNED = ['README.md', 'code/README.md', 'PRESENT.md'];

/** The document a project may keep its data notes in, beside the README's own section. */
const DATA_DOC = 'DATA.md';

/** The documents the one-README standard retired; one still there is folded back in. */
const RETIRED = ['IDEA.md', 'notes/METHOD_NOTES.md', 'notes/RELATED_WORK.md'];

/** A folder name that is not the canonical one, and the folder it should be. */
const FOLDERS: [string, string][] = [
    ['paper', 'manuscript/'],
    ['experiment', 'code/'],
    ['pipeline', 'code/']
];

/** The project types a live project is, which are the ones asked for results and a dataset. */
const LIVE = ['active', 'manuscript'];

/** The project types that should carry a venue once they are out of the author's hands. */
const PLACED = ['published', 'submitted'];

/** The tiers whose work the one-README standard covers. */
const STANDARD = ['idea', 'active', 'manuscript'];

/** Hub types that should have a public entry on the website. */
const PUBLIC = ['published', 'phd', 'submitted'];

/** Hub-private negative results that must never appear on the public site. */
const NEGATIVE = ['nogo', 'disproved'];

/** Dead ends: public would mean a real publication typed as one, which is a thing to reconcile. */
const DEADEND = ['dropped', 'abandoned'];

/** Where a published work may sit when its chips do not say which section it belongs in. */
const PUB_SECTIONS = [
    'journal',
    'conference',
    'other-publications',
    'thesis',
    'abstracts',
    'posters'
];

/** Title words carrying no meaning for matching one paper to another. */
const STOPWORDS = new Set([
    'the',
    'a',
    'an',
    'of',
    'and',
    'in',
    'for',
    'to',
    'from',
    'using',
    'with',
    'on',
    'via',
    'by',
    'at'
]);

/** A word overlap at or above this is the same paper; below it and above LOOSE, a near miss. */
const SAME = 0.72;

/** A word overlap at or above this is close enough to say the two titles should be reconciled. */
const LOOSE = 0.45;

/**
 * Every folder-relative path and folder name the scan reads off the disk. The portfolio watcher
 * imports it so that an event on one of them under a scan tier rebuilds: a marker added to a README,
 * a retired document put back, a `paper/` folder made, all of which the scan reports and none of
 * which is a `.yml` the watcher would otherwise notice.
 */
export const AUDIT_PATHS: string[] = [
    ...SCANNED,
    DATA_DOC,
    ...RETIRED,
    ...FOLDERS.map(([bad]) => bad)
];

/** The thresholds and vocabularies the rules read, out of the merged configuration. */
export type AuditRules = {
    /** The soft character limits per manifest field, `read_limits` of config/behavior.yml. */
    readLimits: Record<string, number>;
    /** Whole days a document may be ahead of its own manifest before the manifest is behind. */
    staleLagDays: number;
    /** The domains a project is expected to name a dataset in. */
    dataDomains: Set<string>;
    /** The collection-entry statuses that wait on someone else, so a date is asked for. */
    waitingStatus: Set<string>;
    /** The website's publication feed, hub-relative; the empty string means there is none. */
    publicationsFile: string;
    /** In-flight chips a finished project must not still carry, `lifecycle.live_chips`. */
    liveChips: Set<string>;
    /** The types that are a closed outcome, `lifecycle.terminal_types`. */
    terminalTypes: Set<string>;
    /** The chips one of which marks the author role, `lifecycle.author_chips`. */
    authorChips: string[];
    /** Chip pairs that cannot both be true, `lifecycle.contradictory_chips`. */
    contradictory: [string, string][];
};

/** A list as Python prints one, which is the form the cockpit's messages carry. */
function printed(items: string[]): string {
    return `[${items.map((item) => `'${item}'`).join(', ')}]`;
}

/** A finite number of the merged config, or the fallback when the key is absent or not a number. */
function number(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** The strings of a configured list, lowercased and trimmed, as a set. */
function wordSet(value: unknown): Set<string> {
    if (!Array.isArray(value)) return new Set();
    return new Set(
        value
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim().toLowerCase())
    );
}

/** The rules the scan runs under, read out of the merged configuration. */
export function auditRules(config: Record<string, unknown>): AuditRules {
    const limits = config.read_limits;
    const readLimits: Record<string, number> = {};
    if (typeof limits === 'object' && limits !== null && !Array.isArray(limits)) {
        for (const [key, value] of Object.entries(limits as Record<string, unknown>)) {
            if (typeof value === 'number' && Number.isFinite(value)) readLimits[key] = value;
        }
    }
    const lifecycle = mapOf(config.lifecycle);
    return {
        readLimits,
        staleLagDays: number(config.stale_lag_days, 1),
        dataDomains: wordSet(config.data_domains),
        waitingStatus: wordSet(config.waiting_status),
        publicationsFile:
            typeof config.publications_file === 'string' ? config.publications_file : '',
        liveChips: new Set(wordList(lifecycle.live_chips)),
        terminalTypes: new Set(wordList(lifecycle.terminal_types)),
        authorChips: wordList(lifecycle.author_chips),
        contradictory: chipPairs(lifecycle.contradictory_chips)
    };
}

/** A map of the merged config, or an empty one for anything that is not one. */
function mapOf(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

/** The strings of a configured list, in the order the file writes them. */
function wordList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((one): one is string => typeof one === 'string' && one !== '');
}

/** The two-chip rows of a configured list of pairs; a row that is not a pair is left out. */
function chipPairs(value: unknown): [string, string][] {
    if (!Array.isArray(value)) return [];
    const pairs: [string, string][] = [];
    for (const row of value) {
        const words = wordList(row);
        if (words.length === 2) pairs.push([words[0], words[1]]);
    }
    return pairs;
}

/** The signatures config/behavior.yml's `audit_ignore:` holds, in the order the file lists them. */
export function mutedSignatures(config: Record<string, unknown>): string[] {
    const held = config.audit_ignore;
    if (!Array.isArray(held)) return [];
    return held.filter((one): one is string => typeof one === 'string' && SIGNATURE.test(one));
}

/** What a signature looks like, which is what the write accepts and what the config may hold. */
export const SIGNATURE = /^[0-9a-f]{12}$/;

/**
 * One finding's stable short key: sha1 over the scope, the place, the kind, the catalog key of its
 * message and the arguments the rule filled the message with, twelve hex characters of it. The key
 * and the arguments are in it so two gaps on one file are two findings and a changed marker count
 * comes back as a new one; the rendered sentence is not, so rewording a message in the catalog
 * keeps every mute.
 */
export function signatureOf(
    scope: string,
    where: string,
    kind: string,
    key: string,
    args: readonly (string | number)[]
): string {
    const raw = [scope, where, kind, key, ...args.map(String)].join('\u001f');
    return createHash('sha1').update(raw, 'utf8').digest('hex').slice(0, 12);
}

/** What the scan is run over: the hub on disk, the snapshot's entities, the rules and the words. */
export type AuditInput = {
    hub: string;
    projects: Project[];
    collections: Collection[];
    rules: AuditRules;
    catalog: Record<string, string>;
};

/** The catalog sentence a finding is worded by: its key and the arguments that fill it. */
type Sentence = { key: string; args: readonly (string | number)[] };

/** A rule names its sentence by key, so the key and the arguments are what the signature reads. */
function sentence(key: string, ...args: (string | number)[]): Sentence {
    return { key, args };
}

/** What a rule hands the collector: where the finding is and which catalog sentence says it. */
type Raised = Omit<AuditFinding, 'signature' | 'message'> & Sentence;

/** A collector, so a rule adds a finding without knowing how one is keyed or worded. */
function collector(catalog: Record<string, string>): {
    found: AuditFinding[];
    add: (f: Raised) => void;
} {
    const found: AuditFinding[] = [];
    return {
        found,
        add({ key, args, ...finding }) {
            found.push({
                ...finding,
                message: findingText(catalog, key, ...args),
                signature: signatureOf(finding.scope, finding.where, finding.kind, key, args)
            });
        }
    };
}

/** One file's text, and the empty string for anything that cannot be read. */
function slurp(path: string): string {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return '';
    }
}

/** Whether the path is a directory. */
function isFolder(path: string): boolean {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

/**
 * The first line of a text that carries a marker, collapsed to one line, cut to 110 characters and
 * left as letters and ASCII so the quoted snippet does not carry a document's typography.
 */
export function firstMarker(text: string): string {
    for (const line of text.split('\n')) {
        MARKERS.lastIndex = 0;
        if (!MARKERS.test(line)) continue;
        const one = line
            .split(/\s+/)
            .filter((part) => part !== '')
            .join(' ')
            .slice(0, 110);
        const kept = one.replace(/./gu, (character) =>
            (character.codePointAt(0) ?? 0) < 128 || /[\p{L}\p{M}]/u.test(character)
                ? character
                : ' '
        );
        return kept
            .split(/\s+/)
            .filter((part) => part !== '')
            .join(' ');
    }
    return '';
}

/** How many markers a text carries. */
function markerCount(text: string): number {
    MARKERS.lastIndex = 0;
    return [...text.matchAll(MARKERS)].length;
}

/** An ISO date from a value that is one, and null for anything else. */
function asDate(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return Number.isNaN(Date.parse(value)) ? null : value;
}

/** The newest of a project's present documents, as a local date, and the empty string for none. */
function newestDoc(project: Project): string {
    const newest = project.docs.reduce(
        (held, doc) => (doc.present && (doc.mtime ?? 0) > held ? (doc.mtime ?? 0) : held),
        0
    );
    return newest === 0 ? '' : localDate(newest);
}

/** Whether the project's README names a Data section, or the folder carries the retired DATA.md. */
function hasDataSection(folder: string): boolean {
    if (existsSync(join(folder, DATA_DOC))) return true;
    const readme = join(folder, 'README.md');
    return existsSync(readme) && slurp(readme).includes('## Data');
}

/** The open markers of one project's documents and of every collection entry. */
function markers(input: AuditInput, add: (f: Raised) => void): void {
    for (const project of input.projects) {
        if (project.ghost) continue;
        const folder = join(input.hub, project.folder);
        for (const name of SCANNED) {
            const path = join(folder, name);
            if (!existsSync(path)) continue;
            const text = slurp(path);
            const count = markerCount(text);
            if (count === 0) continue;
            add({
                scope: project.folder,
                where: name,
                kind: 'todo',
                ...sentence('audit.msg_markers', count, firstMarker(text))
            });
        }
    }
    for (const collection of input.collections) {
        const intro = collection.intro ?? '';
        if (intro !== '' && markerCount(intro) > 0) {
            add({
                scope: collection.id,
                where: relative(input.hub, collection.file),
                kind: 'todo',
                ...sentence('audit.msg_intro_marker', firstMarker(intro))
            });
        }
        for (const entry of collection.entries) {
            const blob = stringify(entry.fields);
            if (markerCount(blob) === 0) continue;
            add({
                scope: collection.id,
                where: labelOf(entry.title, entry.index),
                kind: 'todo',
                ...sentence('audit.msg_entry_marker', firstMarker(blob))
            });
        }
    }
}

/** How an entry is named in a finding: its title, or its place in the file when it has none. */
function labelOf(title: string, index: number): string {
    return title === '' ? `entry #${index + 1}` : title;
}

/** A path under the hub, as the hub-relative one a finding names. */
function relative(hub: string, path: string): string {
    const root = hub.endsWith('/') ? hub : `${hub}/`;
    return path.startsWith(root) ? path.slice(root.length) : path;
}

/** The manifest gaps of every project: what a live project has not filled in. */
function gaps(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    for (const project of input.projects) {
        if (project.ghost) continue;
        const scope = project.folder;
        const folder = join(input.hub, project.folder);
        if (
            project.type !== undefined &&
            PLACED.includes(project.type) &&
            project.venueId === undefined
        ) {
            add({
                scope,
                where: 'venue_id',
                kind: 'data',
                ...sentence('audit.msg_no_venue')
            });
        }
        if (project.type !== undefined && LIVE.includes(project.type)) {
            const wanted = project.domainIds.some((id) => rules.dataDomains.has(id))
                ? ['datasets', 'results']
                : ['results'];
            for (const field of wanted) {
                const held = field === 'datasets' ? project.datasetIds : project.results;
                if (held.length > 0) continue;
                add({
                    scope,
                    where: 'project.yml',
                    kind: 'data',
                    ...sentence('audit.msg_missing_field', field)
                });
            }
            const provisional = project.results.filter((one) => PROVISIONAL.test(one));
            if (provisional.length > 0) {
                add({
                    scope,
                    where: 'project.yml',
                    kind: 'data',
                    ...sentence('audit.msg_provisional', provisional.length)
                });
            }
            if (project.datasetIds.length > 0 && !hasDataSection(folder)) {
                add({
                    scope,
                    where: 'project',
                    kind: 'data',
                    ...sentence('audit.msg_no_data_section')
                });
            }
            const lag = project.staleDays ?? 0;
            const when = newestDoc(project);
            if (lag >= rules.staleLagDays && lag > 0 && when !== '') {
                add({
                    scope,
                    where: 'project.yml',
                    kind: 'data',
                    ...sentence('audit.msg_docs_ahead', when, lag)
                });
            }
        }
        const deposit = project.codeAvailability;
        const reproduced = asDate(project.reproduced?.date);
        const deposited = asDate(deposit?.date);
        if (
            deposit !== undefined &&
            (deposit.status === 'deposited' || deposit.status === 'review-anon') &&
            deposited !== null &&
            reproduced !== null &&
            deposited < reproduced
        ) {
            add({
                scope,
                where: 'project.yml',
                kind: 'data',
                ...sentence('audit.msg_deposit_before_reproduction', deposited, reproduced)
            });
        }
    }
}

/** The tier-conformance rules: the one README, the retired documents and the folder names. */
function conformance(input: AuditInput, add: (f: Raised) => void): void {
    for (const project of input.projects) {
        if (project.ghost) continue;
        const scope = project.folder;
        const folder = join(input.hub, project.folder);
        if (
            project.type !== undefined &&
            STANDARD.includes(project.type) &&
            !existsSync(join(folder, 'README.md'))
        ) {
            add({
                scope,
                where: 'README.md',
                kind: 'conform',
                ...sentence('audit.msg_no_readme')
            });
        }
        for (const name of RETIRED) {
            if (!existsSync(join(folder, name))) continue;
            add({
                scope,
                where: name,
                kind: 'conform',
                ...sentence('audit.msg_retired_doc')
            });
        }
        for (const [bad, good] of FOLDERS) {
            if (!isFolder(join(folder, bad))) continue;
            add({
                scope,
                where: `${bad}/`,
                kind: 'conform',
                ...sentence('audit.msg_bad_folder', good)
            });
        }
        if (isFolder(join(folder, 'code')) && !existsSync(join(folder, 'code', 'README.md'))) {
            add({
                scope,
                where: 'code/',
                kind: 'conform',
                ...sentence('audit.msg_code_no_readme')
            });
        }
    }
}

/**
 * The status guardrails: what a project's tier and type say its chips cannot be, and the one field a
 * live project must fill in. They are soft, as the cockpit's are: drift to clear, never a bad value.
 */
function guardrails(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    for (const project of input.projects) {
        if (project.ghost) continue;
        const scope = project.folder;
        const chips = new Set(project.chips);
        const finished = project.tier === 'archive' || project.tier === 'coauthor';
        const named = rules.authorChips.some((chip) => chips.has(chip));
        if (finished && rules.authorChips.length > 0 && !named) {
            add({
                scope,
                where: 'status.chips',
                kind: 'manifest',
                ...sentence('audit.msg_no_author_chip')
            });
        }
        const live = [...chips].filter((chip) => rules.liveChips.has(chip)).sort();
        if (finished && project.type !== undefined && rules.terminalTypes.has(project.type)) {
            if (live.length > 0) {
                add({
                    scope,
                    where: 'status.chips',
                    kind: 'manifest',
                    ...sentence('audit.msg_terminal_live', project.type, printed(live))
                });
            }
        }
        // The cockpit's `projects` tier is oculus's three open ones: a project that has been
        // accepted belongs under archive/published/ rather than on the board it was written on.
        if (!finished && chips.has('published')) {
            add({
                scope,
                where: 'status.chips',
                kind: 'manifest',
                ...sentence('audit.msg_projects_published')
            });
        }
        for (const [one, other] of rules.contradictory) {
            if (!chips.has(one) || !chips.has(other)) continue;
            add({
                scope,
                where: 'status.chips',
                kind: 'manifest',
                ...sentence('audit.msg_contradictory_chips', one, other)
            });
        }
        if (
            project.type !== undefined &&
            LIVE.includes(project.type) &&
            (project.eli5 ?? '') === ''
        ) {
            add({
                scope,
                where: 'eli5',
                kind: 'manifest',
                ...sentence('audit.msg_missing')
            });
        }
    }
}

/** The manifest fields that are a glance, and how long each has grown. */
function readability(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    for (const project of input.projects) {
        if (project.ghost) continue;
        const scope = project.folder;
        const fields: [string, string | undefined][] = [
            ['status.line', project.statusLine],
            ['next', project.next],
            ['latest', project.latest],
            ['eli5', project.eli5]
        ];
        for (const [field, value] of fields) {
            const limit = byKey(rules.readLimits, field);
            if (limit === undefined) continue;
            const length = (value ?? '').length;
            if (length <= limit) continue;
            add({
                scope,
                where: `\`${field}\``,
                kind: 'readability',
                ...sentence('audit.msg_too_long', length, limit)
            });
        }
        const limit = byKey(rules.readLimits, 'results');
        if (limit === undefined) continue;
        project.results.forEach((result, at) => {
            if (result.length <= limit) return;
            add({
                scope,
                where: `results[${at}]`,
                kind: 'readability',
                ...sentence('audit.msg_result_too_long', result.length, limit)
            });
        });
    }
}

/** The collection invariants: the file is there, and every entry says what it is and where it is. */
function collections(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    const ids = new Set(input.projects.filter((one) => !one.ghost).map((one) => one.id));
    for (const collection of input.collections) {
        const where = relative(input.hub, collection.file);
        if (!existsSync(collection.file)) {
            add({
                scope: collection.id,
                where,
                kind: 'data',
                ...sentence('audit.msg_collection_missing')
            });
            continue;
        }
        // A registry is a collection here too, and a venue or a dataset has no status to be missing:
        // the file's own `schema:` is what says whether its entries are tracked by one.
        const tracked = (collection.schema ?? []).some((field) => field.field === 'status');
        for (const entry of collection.entries) {
            const label = labelOf(entry.title, entry.index);
            if (entry.title === '') {
                add({
                    scope: collection.id,
                    where: `entry #${entry.index + 1}`,
                    kind: 'data',
                    ...sentence('audit.msg_entry_no_title')
                });
            }
            const status = scalar(entry.fields.status);
            if (status === '' && tracked) {
                add({
                    scope: collection.id,
                    where: label,
                    kind: 'data',
                    ...sentence('audit.msg_entry_no_status')
                });
            } else if (
                rules.waitingStatus.has(status.toLowerCase()) &&
                scalar(entry.fields.date) === ''
            ) {
                add({
                    scope: collection.id,
                    where: label,
                    kind: 'data',
                    ...sentence('audit.msg_entry_no_date', status)
                });
            }
            for (const related of listOf(entry.fields.related)) {
                if (ids.has(related)) continue;
                add({
                    scope: collection.id,
                    where: label,
                    kind: 'data',
                    ...sentence('audit.msg_entry_related', related)
                });
            }
            const link = scalar(entry.fields.link);
            if (link !== '' && !existsSync(join(input.hub, link))) {
                add({
                    scope: collection.id,
                    where: label,
                    kind: 'data',
                    ...sentence('audit.msg_entry_link', link)
                });
            }
        }
    }
}

/** A scalar field of an entry as the text it reads as, and the empty string for anything else. */
function scalar(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

/** A field that is one value or a list of them, as a list of the strings in it. */
function listOf(value: unknown): string[] {
    const items = Array.isArray(value) ? value : [value];
    return items.filter((one): one is string => typeof one === 'string' && one !== '');
}

/** A title folded to a comparison key: NFKD, lowercase, letters and digits only. */
export function normalTitle(value: string): string {
    return value
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '');
}

/** The content words of a title, for matching one paper to another through a rewording. */
export function titleWords(value: string): Set<string> {
    return new Set(
        value
            .normalize('NFKD')
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    );
}

/** How much two word sets overlap, as the share of their union that is in both. */
export function jaccard(left: Set<string>, right: Set<string>): number {
    if (left.size === 0 || right.size === 0) return 0;
    const shared = [...left].filter((word) => right.has(word)).length;
    return shared / (left.size + right.size - shared);
}

/** One paper of the public website: its key, its section, its words. */
type SitePaper = { key: string; section: string; title: string; words: Set<string> };

/** The papers of the website's feed, one record each, in the order the file lists them. */
function sitePapers(data: unknown): SitePaper[] {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return [];
    const found: SitePaper[] = [];
    for (const [section, block] of Object.entries(data as Record<string, unknown>)) {
        if (typeof block !== 'object' || block === null || Array.isArray(block)) continue;
        const papers = (block as Record<string, unknown>).papers;
        if (!Array.isArray(papers)) continue;
        for (const paper of papers) {
            if (typeof paper !== 'object' || paper === null || Array.isArray(paper)) continue;
            const title = scalar((paper as Record<string, unknown>).title).trim();
            const key = normalTitle(title);
            if (key !== '') found.push({ key, section, title, words: titleWords(title) });
        }
    }
    return found;
}

/** The sections a hub project of this type and these chips is expected to appear in. */
function expectedSections(project: Project): string[] {
    const chips = new Set(project.chips);
    if (project.type === 'phd' || chips.has('thesis')) return ['thesis'];
    if (project.type === 'submitted') {
        return chips.has('submitted') || chips.has('revision')
            ? ['papers-in-review']
            : ['papers-in-preparation'];
    }
    if (project.type === 'abandoned') return ['abandoned-papers'];
    if (chips.has('abstract')) return ['abstracts'];
    if (chips.has('poster')) return ['posters'];
    if (chips.has('conference')) return ['conference'];
    if (chips.has('journal')) return ['journal', 'other-publications'];
    return [...PUB_SECTIONS].sort();
}

/** The best match of a hub title against a pool of site papers, exact key first. */
function match(
    key: string,
    wordsOf: Set<string>,
    pool: SitePaper[]
): { score: number; hit: SitePaper | null } {
    for (const paper of pool) {
        if (paper.key === key) return { score: 1, hit: paper };
    }
    let score = 0;
    let hit: SitePaper | null = null;
    for (const paper of pool) {
        const overlap = jaccard(wordsOf, paper.words);
        if (overlap > score) {
            score = overlap;
            hit = paper;
        }
    }
    return { score, hit };
}

/**
 * The website's publication feed against the portfolio. Every flag is soft: the matching is by
 * title and is never certain, so nothing here is an error, only something to look at. The check is
 * skipped without a word when the site repository is not checked out beside the hub.
 */
function publications(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    if (rules.publicationsFile === '') return;
    const path = join(input.hub, rules.publicationsFile);
    if (!existsSync(path)) return;
    let data: unknown;
    try {
        data = parse(slurp(path));
    } catch (error) {
        const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
        add({
            scope: 'website',
            where: rules.publicationsFile,
            kind: 'publink',
            ...sentence('audit.msg_site_unreadable', reason)
        });
        return;
    }
    const site = sitePapers(data);
    /** Every section a normalised title appears in, since one paper can be listed twice. */
    const sections = new Map<string, Set<string>>();
    for (const paper of site) {
        sections.set(paper.key, (sections.get(paper.key) ?? new Set()).add(paper.section));
    }
    const sectionsOf = (paper: SitePaper): string[] =>
        [...(sections.get(paper.key) ?? new Set([paper.section]))].sort();

    const live = input.projects.filter((one) => !one.ghost);
    const claimed = new Set<string>();
    for (const project of live) {
        const type = project.type ?? '';
        const key = normalTitle(project.title);
        if (key === '' || NEGATIVE.includes(type) || DEADEND.includes(type)) continue;
        const found = match(key, titleWords(project.title), site);
        const hit = found.hit;
        if (hit !== null && found.score >= SAME) {
            claimed.add(hit.key);
            const wanted = expectedSections(project);
            if (PUBLIC.includes(type) && !sectionsOf(hit).some((one) => wanted.includes(one))) {
                add({
                    scope: project.folder,
                    where: 'publications.yml',
                    kind: 'publink',
                    ...sentence(
                        'audit.msg_site_wrong_section',
                        printed(sectionsOf(hit)),
                        type,
                        printed(wanted)
                    )
                });
            }
        } else if (hit !== null && found.score >= LOOSE) {
            claimed.add(hit.key);
            if (PUBLIC.includes(type)) {
                add({
                    scope: project.folder,
                    where: 'publications.yml',
                    kind: 'publink',
                    ...sentence('audit.msg_site_title_differs', hit.title, printed(sectionsOf(hit)))
                });
            }
        } else if (PUBLIC.includes(type)) {
            add({
                scope: project.folder,
                where: 'publications.yml',
                kind: 'publink',
                ...sentence('audit.msg_site_missing', type, expectedSections(project).join('/'))
            });
        }
    }

    const deadClaimed = new Set<string>();
    for (const project of live) {
        const type = project.type ?? '';
        if (!NEGATIVE.includes(type) && !DEADEND.includes(type)) continue;
        const key = normalTitle(project.title);
        if (key === '') continue;
        const pool = site.filter((paper) => !claimed.has(paper.key));
        const found = match(key, titleWords(project.title), pool);
        const hit = found.hit;
        if (hit === null || found.score < SAME) continue;
        deadClaimed.add(hit.key);
        add({
            scope: project.folder,
            where: 'publications.yml',
            kind: 'publink',
            ...(NEGATIVE.includes(type)
                ? sentence('audit.msg_site_negative', type, printed(sectionsOf(hit)))
                : sentence('audit.msg_site_deadend', type, printed(sectionsOf(hit))))
        });
    }

    const untracked: string[] = [];
    const seen = new Set<string>();
    for (const paper of site) {
        if (claimed.has(paper.key) || deadClaimed.has(paper.key) || seen.has(paper.key)) continue;
        seen.add(paper.key);
        untracked.push(paper.title);
    }
    if (untracked.length === 0) return;
    const shown = untracked.slice(0, 12);
    const more =
        untracked.length > shown.length ? ` (+${untracked.length - shown.length} more)` : '';
    add({
        scope: 'website',
        where: 'publications.yml',
        kind: 'publink',
        ...sentence(
            'audit.msg_site_untracked',
            untracked.length,
            `${shown.map((title) => `"${title}"`).join('; ')}${more}`
        )
    });
}

/** The order the Audit view draws the sections in, and the order the findings come back in. */
const KINDS: AuditKind[] = ['todo', 'data', 'conform', 'manifest', 'readability', 'publink'];

/**
 * The whole scan: every rule over the hub on disk and the snapshot's entities, the findings in
 * section order and, inside a section, by the project or collection they are about.
 */
export function auditFindings(input: AuditInput): AuditFinding[] {
    const { found, add } = collector(input.catalog);
    markers(input, add);
    gaps(input, add);
    conformance(input, add);
    guardrails(input, add);
    readability(input, add);
    collections(input, add);
    publications(input, add);
    return found.sort(
        (left, right) =>
            KINDS.indexOf(left.kind) - KINDS.indexOf(right.kind) ||
            left.scope.localeCompare(right.scope) ||
            left.where.localeCompare(right.where) ||
            left.message.localeCompare(right.message)
    );
}
