// Layer 2, server. The audit's sections over the projects and collections: the open markers left in
// a document, a manifest field a live project has not filled in, a manifest naming no lead, a
// project no board takes, a project at a terminal stage carrying the chip of a Focus chip lane, a
// field long enough to stop being a glance, a collection entry whose date or link wants doing, and
// the conventions the hub's own `audit:` setting names (setting.ts): a file a project must hold, a
// heading a file must hold while a manifest key has a value, the folders a project at a stage is
// kept under, and every part of the setting that is not of its shape. A hub that sets no `audit:`
// is held to none of those conventions. A stage word or a form written as a chip, and a tier that
// is missing or no word of `tiers`, are the manifest check's findings (data/snapshot/validate.ts
// and the manifest schema), drawn in the Findings view, and are not scanned here.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`).

import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';
import { z } from 'zod';
import { localDate } from '../../../data/helpers/dates.ts';
import { byKey, isMap } from '../../../data/helpers/guards.ts';
import { bareId, HUB_FILE, resolvedId } from '../../../data/helpers/hub-names.ts';
import { folderOnDisk } from '../../../data/places/folder-on-disk.ts';
import { isHubPath } from '../../../data/places/hub-address.ts';
import type { Project } from '../../../data/model/index.ts';
import { PROJECT_DECK } from '../../../data/sources/deck/read.ts';
import { projectRole } from '../../../data/shapes/boards/takes.ts';
import { blockHolds, wordList, type WordBlock } from '../../../data/shapes/boards/words.ts';
import {
    type AuditInput,
    sentence,
    type Raised,
    scopeOf,
    isPersonal,
    slurp,
    isFolder,
    fileIn,
    fileOf,
    NO_FILE,
    namesShape,
    printed,
    scalarShape
} from './rules.ts';
import { below } from '../../core/paths.ts';
import { words } from '../../core/words.ts';

/** The markers a document is scanned for, as whole words where they are ordinary English. */
const MARKERS = /%TODO|%VERIFY|%FIXME|\bTODO\b|\bFIXME\b|\bTBD\b|\bXXX\b/g;

/** A result the author has tagged as not final. */
const PROVISIONAL = /\[PROVISIONAL\]/i;

/**
 * The documents of a project folder the markers are read from, folder-relative. The portfolio
 * watcher (server/root/watch/portfolio/audited.ts) rebuilds on an event on one of them, with the
 * files and folders the hubs' `audit:` settings name, since a marker added to a README is no
 * `.yml` it would otherwise notice.
 */
export const AUDIT_PATHS: readonly string[] = ['README.md', 'code/README.md'];

/**
 * The Markdown slide files of a project's deck folder, as folder-relative names, which are scanned
 * for the same markers as its README.
 */
function deckDocuments(folder: string): string[] {
    try {
        return readdirSync(join(folder, PROJECT_DECK))
            .filter((name) => name.endsWith('.md'))
            .sort()
            .map((name) => `${PROJECT_DECK}/${name}`);
    } catch {
        return [];
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

/** The open markers of one project's documents and of every collection entry. */
export function markers(input: AuditInput, add: (f: Raised) => void): void {
    for (const project of input.projects) {
        if (isPersonal(project, input.rules)) continue;
        const folder = folderOnDisk(input.hub, project);
        for (const name of [...AUDIT_PATHS, ...deckDocuments(folder)]) {
            const path = join(folder, name);
            if (!existsSync(path)) continue;
            const text = slurp(path);
            const count = markerCount(text);
            if (count === 0) continue;
            add({
                scope: scopeOf(project),
                where: name,
                kind: 'todo',
                ...fileIn(input.hub, project, path),
                ...(count === 1
                    ? sentence('audit.msg_markers_one', count, firstMarker(text))
                    : sentence('audit.msg_markers', count, firstMarker(text)))
            });
        }
    }
    for (const collection of input.collections) {
        for (const entry of collection.entries) {
            const blob = stringify(entry.fields);
            if (markerCount(blob) === 0) continue;
            add({
                scope: bareId(collection),
                where: labelOf(entry.title, entry.index),
                kind: 'todo',
                file: fileOf(input.hub, collection.file),
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
        if (isPersonal(project, input.rules)) continue;
        const scope = scopeOf(project);
        if (
            project.stage !== undefined &&
            rules.placedStages.has(project.stage) &&
            project.venueId === undefined
        ) {
            add({
                scope,
                where: 'venue',
                kind: 'data',
                ...fileIn(input.hub, project, project.file),
                ...sentence('audit.msg_no_venue', rules.stageLabel(project.stage)),
                // The signature reads no argument, so a stored mute holds when a label is reworded.
                signed: []
            });
        }
        if (project.stage !== undefined && rules.liveStages.has(project.stage)) {
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
                    ...fileIn(input.hub, project, project.file),
                    ...sentence('audit.msg_missing_field', field)
                });
            }
            const provisional = project.results.filter((one) => PROVISIONAL.test(one));
            if (provisional.length > 0) {
                add({
                    scope,
                    where: 'project.yml',
                    kind: 'data',
                    ...fileIn(input.hub, project, project.file),
                    ...(provisional.length === 1
                        ? sentence('audit.msg_provisional_one', provisional.length)
                        : sentence('audit.msg_provisional', provisional.length))
                });
            }
            const lag = project.staleDays ?? 0;
            const when = newestDoc(project);
            if (lag >= rules.staleLagDays && lag > 0 && when !== '') {
                add({
                    scope,
                    where: 'project.yml',
                    kind: 'data',
                    ...fileIn(input.hub, project, project.file),
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
                ...fileIn(input.hub, project, project.file),
                ...sentence('audit.msg_deposit_before_reproduction', deposited, reproduced)
            });
        }
    }
}

/**
 * Whether a project lies under one of the hub's folders, by whole path segments: a project read
 * from a repository lies under none of them.
 */
function underFolders(project: Project, folders: readonly string[]): boolean {
    if (project.workspaceFolder !== undefined) return false;
    return folders.some((one) => project.folder === one || project.folder.startsWith(`${one}/`));
}

/** Whether a project's stage meets a word block of the setting, no block placing no condition. */
function stageMeets(input: AuditInput, project: Project, block: WordBlock | undefined): boolean {
    return block === undefined || blockHolds(block, wordList(project.stage), input.rules.stages);
}

/**
 * The files the hub's `required_files` rows require: a row requires its file of a project when
 * every key it names holds, the stage meeting `stages`, the folder `folder` there in the project
 * and the project lying under one of `folders`.
 */
export function requiredFiles(input: AuditInput, add: (f: Raised) => void): void {
    for (const project of input.projects) {
        if (isPersonal(project, input.rules)) continue;
        const folder = folderOnDisk(input.hub, project);
        for (const row of input.setting.requiredFiles) {
            if (!stageMeets(input, project, row.stages)) continue;
            if (row.folder !== undefined && !isFolder(join(folder, row.folder))) continue;
            if (row.folders !== undefined && !underFolders(project, row.folders)) continue;
            if (existsSync(join(folder, row.file))) continue;
            add({
                scope: scopeOf(project),
                where: row.file,
                kind: 'conform',
                file: NO_FILE,
                ...sentence('audit.msg_required_file', row.file)
            });
        }
    }
}

/**
 * The value at a dotted key of a project's manifest as its `project.yml` writes it, undefined when
 * the file does not parse or holds nothing there.
 */
function manifestValue(input: AuditInput, project: Project, key: string): unknown {
    let node: unknown;
    try {
        node = parse(slurp(resolve(input.hub, project.file)));
    } catch {
        return undefined;
    }
    for (const step of key.split('.')) {
        if (!isMap(node) || !Object.hasOwn(node, step)) return undefined;
        node = node[step];
    }
    return node;
}

/** Whether a manifest value asks for a section: a list with an item, a text, a number or `true`. */
function hasValue(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value !== '';
    return typeof value === 'number' || value === true;
}

/**
 * Whether a text holds a heading: a line of it, trimmed, is the heading or starts with the heading
 * and a space, which keeps the level, so `## Data + reproduction` holds `## Data` and neither
 * `## Database` nor `### Data notes` does.
 */
function holdsHeading(text: string, heading: string): boolean {
    return text.split('\n').some((line) => {
        const trimmed = line.trim();
        return trimmed === heading || trimmed.startsWith(`${heading} `);
    });
}

/**
 * The headings the hub's `required_sections` rows require: a row whose manifest key holds a value
 * for a project, the project under one of its `folders` when it names them, asks its file to hold
 * its heading. A manifest that does not parse asks for none; the manifest check reports it.
 */
export function requiredSections(input: AuditInput, add: (f: Raised) => void): void {
    for (const project of input.projects) {
        if (isPersonal(project, input.rules)) continue;
        const folder = folderOnDisk(input.hub, project);
        for (const row of input.setting.requiredSections) {
            if (row.folders !== undefined && !underFolders(project, row.folders)) continue;
            if (!hasValue(manifestValue(input, project, row.key))) continue;
            const path = join(folder, row.file);
            if (existsSync(path) && holdsHeading(slurp(path), row.heading)) continue;
            add({
                scope: scopeOf(project),
                where: row.file,
                kind: 'data',
                ...fileIn(input.hub, project, path),
                ...sentence('audit.msg_required_section', row.key, row.file, row.heading)
            });
        }
    }
}

/**
 * The folders the hub's `stage_folders` rows keep a project in: a project read from the hub's own
 * folders whose stage meets a row's `stages` and that lies under none of its `folders`, a project
 * with no stage meeting a block that names only `not_` lists. A project read from a repository is
 * held to no row, whose folders are the hub's.
 */
export function stageFolders(input: AuditInput, add: (f: Raised) => void): void {
    for (const project of input.projects) {
        if (isPersonal(project, input.rules) || project.workspaceFolder !== undefined) continue;
        const stage = project.stage ?? words(input.catalog, 'audit.no_stage');
        for (const row of input.setting.stageFolders) {
            if (!stageMeets(input, project, row.stages)) continue;
            if (underFolders(project, row.folders)) continue;
            add({
                scope: scopeOf(project),
                where: 'stage',
                kind: 'manifest',
                ...fileIn(input.hub, project, project.file),
                ...sentence('audit.msg_stage_folder', stage, printed(row.folders)),
                // A project with no stage is signed by none, so rewording "no stage" keeps a mute.
                signed: [project.stage ?? '', printed(row.folders)]
            });
        }
    }
}

/**
 * Every part of the hub's `audit:` setting that is not of its shape, named by its dotted key in the
 * hub's settings file; that part is off, and the rest of the setting runs.
 */
export function settingProblems(input: AuditInput, add: (f: Raised) => void): void {
    for (const key of input.setting.problems) {
        add({
            scope: HUB_FILE,
            where: key,
            kind: 'conform',
            file: fileOf(input.hub, join(input.hub, HUB_FILE)),
            ...sentence('audit.msg_setting_shape', HUB_FILE, key)
        });
    }
}

/**
 * The placement of a project on every tier: a manifest naming no lead; a project no board of
 * `boards:` takes, named by its tier, the user's role on it and its stage, each read as "no tier",
 * "no role" or "no stage" where it has none; and a project at a stage carrying `terminal` that
 * carries a chip of a Focus chip lane, which the lane does not hold.
 */
function placement(input: AuditInput, project: Project, add: (f: Raised) => void): void {
    const { rules, catalog } = input;
    const scope = scopeOf(project);
    const file = fileIn(input.hub, project, project.file);
    if (project.lead.length === 0) {
        add({ scope, where: 'lead', kind: 'manifest', ...file, ...sentence('audit.msg_no_lead') });
    }
    if (rules.boardsOf(project, input.self).length === 0) {
        const role = projectRole(project, rules.roles, input.self)?.key;
        add({
            scope,
            where: 'tier',
            kind: 'manifest',
            ...file,
            ...sentence(
                'audit.msg_no_board',
                project.tier ?? words(catalog, 'audit.no_tier'),
                role ?? words(catalog, 'audit.no_role'),
                project.stage ?? words(catalog, 'audit.no_stage')
            ),
            signed: [project.tier ?? '', role ?? '', project.stage ?? '']
        });
    }
    if (project.stage === undefined || !rules.terminalStages.has(project.stage)) return;
    for (const chip of project.chips.filter((one) => rules.laneChips.has(one))) {
        add({
            scope,
            where: 'status.chips',
            kind: 'manifest',
            ...file,
            ...sentence('audit.msg_terminal_lane_chip', project.stage, chip)
        });
    }
}

/**
 * The status guardrails: the placement of every project (`placement`), and the one field a live
 * project of a tier the research rules cover must fill in. They are soft: drift to clear, never a
 * bad value.
 */
export function guardrails(input: AuditInput, add: (f: Raised) => void): void {
    for (const project of input.projects) {
        placement(input, project, add);
        if (isPersonal(project, input.rules)) continue;
        const scope = scopeOf(project);
        if (
            project.stage !== undefined &&
            input.rules.liveStages.has(project.stage) &&
            (project.eli5 ?? '') === ''
        ) {
            add({
                scope,
                where: 'eli5',
                kind: 'manifest',
                ...fileIn(input.hub, project, project.file),
                ...sentence('audit.msg_missing')
            });
        }
    }
}

/** The manifest fields that are a glance, and how long each has grown. */
export function readability(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    for (const project of input.projects) {
        if (isPersonal(project, input.rules)) continue;
        const scope = scopeOf(project);
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
                ...fileIn(input.hub, project, project.file),
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
                ...fileIn(input.hub, project, project.file),
                ...sentence('audit.msg_result_too_long', result.length, limit)
            });
        });
    }
}

/**
 * The fields of a collection entry the checks read. A scalar reads as the text it is written as and
 * as the empty text when it is any other value; `related` is one name or a list of names, and the
 * items of it that are not names are left out.
 */
const entryFieldsShape = z.object({
    status: scalarShape,
    date: scalarShape,
    link: scalarShape,
    related: namesShape
});

/**
 * The collection invariants: the file is there, and every entry says what it is and where it is.
 */
export function collections(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    for (const collection of input.collections) {
        const where = relative(input.hub, collection.file);
        if (!existsSync(collection.file)) {
            add({
                scope: bareId(collection),
                where,
                kind: 'data',
                file: NO_FILE,
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
                    scope: bareId(collection),
                    where: `entry #${entry.index + 1}`,
                    kind: 'data',
                    file: fileOf(input.hub, collection.file),
                    ...sentence('audit.msg_entry_no_title')
                });
            }
            const fields = entryFieldsShape.parse(entry.fields);
            const status = fields.status;
            if (status === '' && tracked) {
                add({
                    scope: bareId(collection),
                    where: label,
                    kind: 'data',
                    file: fileOf(input.hub, collection.file),
                    ...sentence('audit.msg_entry_no_status')
                });
            } else if (rules.waitingStatus.has(status.toLowerCase()) && fields.date === '') {
                add({
                    scope: bareId(collection),
                    where: label,
                    kind: 'data',
                    file: fileOf(input.hub, collection.file),
                    ...sentence('audit.msg_entry_no_date', status)
                });
            }
            for (const related of fields.related) {
                if (resolvedId(input.held, input.root, related) !== null) continue;
                add({
                    scope: bareId(collection),
                    where: label,
                    kind: 'data',
                    file: fileOf(input.hub, collection.file),
                    ...sentence('audit.msg_entry_related', related)
                });
            }
            // A link is looked for on disk only when the card would open it as a file of the hub:
            // trimmed as the card trims it, never a web address (the scan fetches nothing), and
            // never a path that climbs out of the hub, which the card draws no file link for.
            const link = fields.link.trim();
            const path = resolve(input.hub, link);
            const inHub = below(path, input.hub);
            if (isHubPath(link) && inHub && !existsSync(path)) {
                add({
                    scope: bareId(collection),
                    where: label,
                    kind: 'data',
                    file: fileOf(input.hub, collection.file),
                    ...sentence('audit.msg_entry_link', link)
                });
            }
        }
    }
}
