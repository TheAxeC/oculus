// Layer 1, data. A side project as the Personal board and the Focus ticker read it, out of the map
// sources/manifests.ts parsed from a hub folder's project.yml or a repository's
// .oculus/project.yml. Pure, like normalise: one reading serves both sources, so the snapshot's
// SideProject and the findings that word what was wrong with its manifest come from the same pass
// and cannot disagree.
//
// A manifest holds the five keys of a side project and the eleven research keys that apply to it
// (`deadline`, `subtasks`, `followup`, `snooze`, `priority`, `pin`, `short`, `latest`,
// `collaborators`, `waiting-on` and `related`), under the names and in the shapes the research
// manifest gives them, read by the same functions. Each key is read for its own type, and a value
// of the wrong type costs that field alone: the card is drawn, with the field empty or left out of
// the record, and one finding names what was wrong. A key outside the sixteen is named and not
// read, which is how a research key that a side project does not take (`venue`, `type`, `id`) is
// told apart from the fields the board draws.

import { z } from 'zod';
import type { TextCatalog } from '../../helpers/finding-text.ts';
import { findingText } from '../../helpers/finding-text.ts';
import type { Finding, PersonalSource, RawPersonal, SideProject } from '../../model/index.ts';
import { isMap, str, strings } from '../../helpers/guards.ts';
import { readAs } from '../../shapes/shapes.ts';
import { compact } from '../compact.ts';
import { followups, subtasks } from './plans.ts';

/** A field that is a text, and a field that is a list of anything. */
const textShape = z.string();
const listShape = z.array(z.unknown());

/** The status a card takes when its manifest names none the vocabulary holds. */
export const UNKNOWN_STATUS = 'unknown';

/** The keys of a side project's manifest: its own five, then the research manifest's eleven. */
const FIELDS = [
    'title',
    'status',
    'eli5',
    'next',
    'links',
    'deadline',
    'subtasks',
    'followup',
    'snooze',
    'priority',
    'pin',
    'short',
    'latest',
    'collaborators',
    'waiting-on',
    'related'
];

/** The part of a finding's sentence that differs by problem; the catalog holds the sentences. */
export type ProblemWord = 'no_title' | 'status' | 'field_type' | 'links' | 'key';

/** One thing wrong with one manifest: the key it is about, which sentence, and its arguments. */
export type Problem = { key: string; word: ProblemWord; args: (string | number)[] };

/** A side project read from one manifest, with what was wrong with the manifest. */
export type ReadSideProject = { project: SideProject; problems: Problem[] };

/** The id of a side project and the title it takes when its manifest names none. */
function identity(source: PersonalSource): { id: string; fallback: string } {
    if (source.kind === 'root') return { id: `root:${source.key}`, fallback: source.key };
    const slug = source.folder.split('/').pop() ?? source.folder;
    return { id: `side:${slug}`, fallback: slug };
}

/** A status value written out for the sentence that names it. */
function shown(value: unknown): string {
    if (value === undefined || value === null) return '';
    const text = readAs(textShape, value);
    if (text !== null) return text;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}

/**
 * A free-text field, read by `str` as the research manifest's is: absent and null hold nothing and
 * give no finding, a text is kept as written, and any other type holds nothing and is one finding
 * naming the field and the type it takes.
 */
function textField(
    data: Record<string, unknown>,
    key: string,
    problems: Problem[]
): string | undefined {
    const value = data[key];
    if (value === undefined || value === null) return undefined;
    const text = str(value);
    if (text !== undefined) return text;
    problems.push({ key, word: 'field_type', args: [key, 'text'] });
    return undefined;
}

/** A field whose value is a flag: only `true` is held, and `false` holds nothing. */
function flagField(
    data: Record<string, unknown>,
    key: string,
    problems: Problem[]
): true | undefined {
    const value = data[key];
    if (value === undefined || value === null || value === false) return undefined;
    if (value === true) return true;
    problems.push({ key, word: 'field_type', args: [key, 'flag'] });
    return undefined;
}

/**
 * A field that is a list of texts, read by `strings` as the research manifest's is: the entries
 * that are texts are kept, and a value that is no list, or a list with an entry that is no text, is
 * one finding naming the field. Absent and null hold nothing.
 */
function textsField(
    data: Record<string, unknown>,
    key: string,
    problems: Problem[]
): string[] | undefined {
    const value = data[key];
    if (value === undefined || value === null) return undefined;
    const texts = strings(value);
    const whole = Array.isArray(value) && texts.length === value.length;
    if (!whole) problems.push({ key, word: 'field_type', args: [key, 'texts'] });
    return Array.isArray(value) ? texts : undefined;
}

/**
 * A field read by the research manifest's own reader (`followups`, `subtasks`) from a value of the
 * container type the key takes: a text, a map or a list for `followup`, a map or a list for
 * `subtasks`. A value of another type holds nothing and is one finding naming the field.
 */
function planField<T>(
    data: Record<string, unknown>,
    key: string,
    type: 'followup' | 'subtasks',
    read: (value: unknown) => T,
    problems: Problem[]
): T | undefined {
    const value = data[key];
    if (value === undefined || value === null) return undefined;
    const fits =
        Array.isArray(value) || isMap(value) || (type === 'followup' && typeof value === 'string');
    if (fits) return read(value);
    problems.push({ key, word: 'field_type', args: [key, type] });
    return undefined;
}

/**
 * The links of a manifest: the entries that are texts. A value that is no list, and each entry that
 * is no text, is one finding on `links`.
 */
function linkList(data: Record<string, unknown>, problems: Problem[]): string[] {
    const value = data.links;
    if (value === undefined || value === null) return [];
    const list = readAs(listShape, value);
    if (list === null) {
        problems.push({ key: 'links', word: 'links', args: [] });
        return [];
    }
    const texts = list.flatMap((entry) => readAs(textShape, entry) ?? []);
    if (texts.length !== list.length) problems.push({ key: 'links', word: 'links', args: [] });
    return texts;
}

/**
 * One side project from one raw manifest. `statuses` are the keys of `side_project_status`; a
 * status outside them is drawn as `unknown` and named. When the config holds no vocabulary the
 * status is any text and nothing is checked.
 */
export function sideProject(raw: RawPersonal, statuses: string[] | undefined): ReadSideProject {
    const problems: Problem[] = [];
    const { id, fallback } = identity(raw.source);
    const data = raw.data;

    const written = readAs(textShape, data.title)?.trim() ?? '';
    if (written === '') problems.push({ key: 'title', word: 'no_title', args: [fallback] });

    const given = readAs(textShape, data.status);
    let status = UNKNOWN_STATUS;
    if (statuses === undefined) {
        if (given !== null && given !== '') status = given;
    } else if (given !== null && statuses.includes(given)) {
        status = given;
    } else {
        problems.push({
            key: 'status',
            word: 'status',
            args: [shown(data.status), statuses.join(', ')]
        });
    }

    const eli5 = textField(data, 'eli5', problems) ?? '';
    const next = textField(data, 'next', problems) ?? '';
    const links = linkList(data, problems);
    for (const key of Object.keys(data)) {
        if (!FIELDS.includes(key)) problems.push({ key, word: 'key', args: [key] });
    }

    const project: SideProject = compact({
        id,
        title: written === '' ? fallback : written,
        status,
        eli5,
        next,
        links,
        short: textField(data, 'short', problems),
        pin: flagField(data, 'pin', problems),
        priority: textField(data, 'priority', problems),
        latest: textField(data, 'latest', problems),
        deadline: textField(data, 'deadline', problems),
        waitingOn: textsField(data, 'waiting-on', problems),
        followups: planField(data, 'followup', 'followup', followups, problems),
        snooze: textField(data, 'snooze', problems),
        subtasks: planField(data, 'subtasks', 'subtasks', subtasks, problems),
        relatedIds: textsField(data, 'related', problems),
        collaborators: textsField(data, 'collaborators', problems),
        source: raw.source,
        file: raw.file
    });
    return { project, problems };
}

/** The side projects of the raw manifests, in the order given. */
export function sideProjects(raws: RawPersonal[], statuses: string[] | undefined): SideProject[] {
    return raws.map((raw) => sideProject(raw, statuses).project);
}

/** The words that name the type a field takes, from the catalog. */
function typeWords(type: string | number, catalog: TextCatalog): string {
    switch (type) {
        case 'flag':
            return findingText(catalog, 'findings.manifests.personal_type_flag');
        case 'texts':
            return findingText(catalog, 'findings.manifests.personal_type_texts');
        case 'followup':
            return findingText(catalog, 'findings.manifests.personal_type_followup');
        case 'subtasks':
            return findingText(catalog, 'findings.manifests.personal_type_subtasks');
        default:
            return findingText(catalog, 'findings.manifests.personal_type_text');
    }
}

/** The sentence of one problem, from the catalog. */
function wording(problem: Problem, catalog: TextCatalog): string {
    const args = problem.args;
    switch (problem.word) {
        case 'no_title':
            return findingText(catalog, 'findings.manifests.personal_no_title', ...args);
        case 'status':
            return findingText(catalog, 'findings.manifests.personal_status', ...args);
        case 'field_type':
            return findingText(
                catalog,
                'findings.manifests.personal_field_type',
                args[0],
                typeWords(args[1], catalog)
            );
        case 'links':
            return findingText(catalog, 'findings.manifests.personal_links', ...args);
        case 'key':
            return findingText(catalog, 'findings.manifests.personal_key', ...args);
    }
}

/**
 * The findings of every raw manifest, each worded from the catalog and carrying the manifest's path
 * and the key it is about, sorted by path then key so two runs agree.
 */
export function personalFindings(
    raws: RawPersonal[],
    statuses: string[] | undefined,
    catalog: TextCatalog
): Finding[] {
    const found: Finding[] = [];
    for (const raw of raws) {
        for (const problem of sideProject(raw, statuses).problems) {
            found.push({ file: raw.file, key: problem.key, message: wording(problem, catalog) });
        }
    }
    return found.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
}
