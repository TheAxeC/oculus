// Layer 2, server. The audit's sections over the projects and collections: the open markers left in
// a document, a manifest field a live project has not filled in, a folder that is not the one the
// tier standard names, a status chip the project's own tier and type contradict, a field long
// enough to stop being a glance, and a collection entry whose date or link wants doing.

import { existsSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { stringify } from 'yaml';
import { localDate } from '../../../data/helpers/dates.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { isHubPath } from '../../../data/hub-address.ts';
import type { Project } from '../../../data/model/index.ts';
import {
    printed,
    type AuditInput,
    sentence,
    type Raised,
    slurp,
    isFolder,
    scalar,
    listOf
} from './rules.ts';

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

/**
 * Every folder-relative path and folder name the scan reads off the disk. The portfolio watcher
 * imports it so that an event on one of them under a scan tier rebuilds: a marker added to a
 * README, a retired document put back, a `paper/` folder made, all of which the scan reports and
 * none of which is a `.yml` the watcher would otherwise notice.
 */
export const AUDIT_PATHS: string[] = [
    ...SCANNED,
    DATA_DOC,
    ...RETIRED,
    ...FOLDERS.map(([bad]) => bad)
];

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
export function markers(input: AuditInput, add: (f: Raised) => void): void {
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
export function gaps(input: AuditInput, add: (f: Raised) => void): void {
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
export function conformance(input: AuditInput, add: (f: Raised) => void): void {
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
 * The status guardrails: what a project's tier and type say its chips cannot be, and the one field
 * a live project must fill in. They are soft: drift to clear, never a bad value.
 */
export function guardrails(input: AuditInput, add: (f: Raised) => void): void {
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
        // A project on one of the three open tiers that has been accepted belongs under
        // archive/published/ rather than on the board it was written on.
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
export function readability(input: AuditInput, add: (f: Raised) => void): void {
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

/**
 * The collection invariants: the file is there, and every entry says what it is and where it is.
 */
export function collections(input: AuditInput, add: (f: Raised) => void): void {
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
        // A registry is a collection here too, and a venue or a dataset has no status to be
        // missing: the file's own `schema:` is what says whether its entries are tracked by one.
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
            // A link is looked for on disk only when the card would open it as a file of the hub:
            // trimmed as the card trims it, never a web address (the scan fetches nothing), and
            // never a path that climbs out of the hub, which the card draws no file link for.
            const link = scalar(entry.fields.link).trim();
            const path = resolve(input.hub, link);
            const inHub = path.startsWith(resolve(input.hub) + sep);
            if (isHubPath(link) && inHub && !existsSync(path)) {
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
