// Layer 2, server. The website's publications file built from the hub: one entry per manifest that
// carries a `publication:` record, in the section of the first row of the hub's `website.kinds`
// whose stages and forms hold the manifest's, sections in the rows' order, the entries of a section
// by the record's `rank`, each section's list under `website.paper_list`. An entry's fields are the
// rows of `website.paper_fields` in their order: a row with no `from` takes the record's own field
// of its key, as it holds it, and a row with a `from` takes that word's value out of the manifest,
// the kinds row or the settings. The code link's name, the statuses it links by and the address of
// a DOI are the settings' too, so no field name or word of the file stands here. A manifest the
// website cannot list is no entry and a problem naming it, which the audit words as a finding
// (../publications.ts), and a word a setting does not hold is left out with one problem per setting
// key per build. The headings of the sections are the website's, which its templates read from its
// own file.

import { byKey } from '../../../../data/helpers/guards.ts';
import type { Id, Project } from '../../../../data/model/index.ts';
import type {
    AuthorPlaces,
    CodeStatuses,
    PaperField,
    PaperFrom,
    WebsiteKind
} from '../../../../data/sources/config/settings/files.ts';
import type { AuditRules } from '../rules.ts';
import type { Problem, SiteFile } from './site.ts';

/** What the publications are built from. */
export type PapersInput = {
    projects: readonly Project[];
    self: ReadonlySet<Id>;
    kinds: readonly WebsiteKind[];
    /** The rows of `website.paper_fields`, in the file's order. */
    paperFields: readonly PaperField[];
    /** The key each section holds its entries under, `website.paper_list`. */
    paperList: string;
    /** The name the code link is printed with, `website.code_link_name`; empty for none. */
    codeLinkName: string;
    /** The words of the user's place among the authors, `website.author_places`. */
    authorPlaces: AuthorPlaces;
    /** The code deposit's statuses the website links by, `website.code_statuses`. */
    codeStatuses: CodeStatuses;
    /** The address a DOI resolves at, `website.doi_origin`. */
    doiOrigin: string;
    /** The key of the website's own file that holds the research lines, `website.site_programs`. */
    sitePrograms: string;
    rules: Pick<AuditRules, 'publicStages' | 'negativeStages' | 'deadEndStages' | 'stageLabel'>;
    site: SiteFile;
};

/** The setting the code link's name is read from. */
const CODE_LINK_NAME_KEY = 'website.code_link_name';

/** The setting the place words are read from. */
const AUTHOR_PLACES_KEY = 'website.author_places';

/** The setting the code deposit's statuses are read from. */
const CODE_STATUSES_KEY = 'website.code_statuses';

/** The setting the key of the research lines in the website's own file is read from. */
const SITE_PROGRAMS_KEY = 'website.site_programs';

/** The setting that holds the address a DOI resolves at. */
const DOI_ORIGIN_KEY = 'website.doi_origin';

/** The first kinds row whose stages and forms hold the manifest's; a side left out holds all. */
function kindOf(project: Project, kinds: readonly WebsiteKind[]): WebsiteKind | undefined {
    const stage = project.stage ?? '';
    const form = project.form ?? '';
    return kinds.find(
        (row) =>
            (row.stages === undefined || row.stages.includes(stage)) &&
            (row.forms === undefined || row.forms.includes(form))
    );
}

/** The user's place among the paper's authors, a key of `website.author_places`. */
type Place = keyof AuthorPlaces;

/**
 * The user's place among the paper's authors: the lead when the user leads it (co-first authors
 * included), the supervisor when the user supervises it, the collaborator when the user
 * collaborates on it, and none when the manifest names the user in none of the three.
 */
function placeOf(project: Project, self: ReadonlySet<Id>): Place | undefined {
    const names = (ids: readonly Id[]): boolean => ids.some((id) => self.has(id));
    if (names(project.lead)) return 'lead';
    if (names(project.supervisors)) return 'supervisor';
    if (names(project.collaborators)) return 'collaborator';
    return undefined;
}

/** What the values of one entry's rows are read from. */
type EntrySource = {
    project: Project;
    kind: WebsiteKind;
    /** The user's place where the kinds row says the place, else none. */
    place: Place | undefined;
    input: PapersInput;
    /** Report the setting key `key` as lacking a word this entry needs. */
    noWord: (key: string) => void;
};

/** The word of the user's place, and the setting's key as lacking when it holds none. */
function authorPlace({ place, input, noWord }: EntrySource): string | undefined {
    if (place === undefined) return undefined;
    const word = input.authorPlaces[place];
    if (word !== '') return word;
    noWord(`${AUTHOR_PLACES_KEY}.${place}`);
    return undefined;
}

/**
 * The code link of a deposited project, by the words of `website.code_statuses`: the DOI's address
 * when the Zenodo deposit is published (its status the word `deposited`) with a DOI that is not
 * empty, whatever the deposit's own status holds. Under the deposit's own status `deposited` it is
 * the DOI's address when a DOI is set, which holds for a DOI of any service, else the deposit's
 * address; none otherwise. A DOI under the Zenodo status `review_copy` is never linked, since that
 * record is the anonymous review copy. A status left empty gives no link and its setting's key as
 * lacking, so a review copy's DOI is never linked for want of the word that names it; so does an
 * empty `website.doi_origin` where the link is by DOI.
 */
function codeLink({ project, input, noWord }: EntrySource): string | undefined {
    const deposit = project.codeAvailability;
    if (deposit === undefined) return undefined;
    const { deposited, review_copy: reviewCopy } = input.codeStatuses;
    if (deposited === '' || reviewCopy === '') {
        if (deposited === '') noWord(`${CODE_STATUSES_KEY}.deposited`);
        if (reviewCopy === '') noWord(`${CODE_STATUSES_KEY}.review_copy`);
        return undefined;
    }
    const doi = deposit.doi?.trim() ?? '';
    const byDoi =
        doi !== '' &&
        (deposit.zenodoStatus === deposited ||
            (deposit.status === deposited && deposit.zenodoStatus !== reviewCopy));
    if (!byDoi) return deposit.status === deposited ? deposit.url : undefined;
    if (input.doiOrigin === '') noWord(DOI_ORIGIN_KEY);
    return input.doiOrigin === '' ? undefined : `${input.doiOrigin}${doi}`;
}

/**
 * The entry's links by name in the record's order, the code link last under
 * `website.code_link_name`, and the setting's key as lacking when it names none; the entries are
 * built whole, so a name `__proto__` is an own key.
 */
function linksWithCode(source: EntrySource): Record<string, string> | undefined {
    const { project, input, noWord } = source;
    const rows = (project.publication?.links ?? []).map((row) => [row.name, row.url] as const);
    const code = codeLink(source);
    const named = code !== undefined && input.codeLinkName !== '';
    if (code !== undefined && !named) noWord(CODE_LINK_NAME_KEY);
    const links = named ? [...rows, [input.codeLinkName, code] as const] : rows;
    return links.length === 0 ? undefined : Object.fromEntries(links);
}

/** The value each `from` of `website.paper_fields` takes. */
const FROM: Record<PaperFrom, (source: EntrySource) => unknown> = {
    project_title: ({ project }) => project.title,
    project_year: ({ project }) => project.year,
    author_place: authorPlace,
    kind_pre: ({ kind }) => kind.pub_pre,
    kind_post: ({ kind }) => kind.pub_post,
    links_with_code: linksWithCode
};

/**
 * One entry of a section: a key per row of `website.paper_fields`, in the rows' order, with its
 * value; a value that is undefined writes no key. A row with no `from` reads only an own property
 * of the record, so a key such as `constructor` reads nothing, and the entry is built whole so a
 * row's key lands as an own key whatever it is.
 */
function entryOf(source: EntrySource): Record<string, unknown> {
    const held: Readonly<Record<string, unknown>> = source.project.publication ?? {};
    const pairs = source.input.paperFields
        .map(({ key, from }): [string, unknown] => [
            key,
            from === undefined ? byKey(held, key) : FROM[from](source)
        ])
        .filter(([, value]) => value !== undefined);
    return Object.fromEntries(pairs);
}

/** Why a manifest that carries a record gives no entry, or undefined when it gives one. */
function refusal(project: Project, input: PapersInput): Problem | undefined {
    const { rules } = input;
    const stage = project.stage ?? '';
    if (
        !rules.publicStages.has(stage) ||
        rules.negativeStages.has(stage) ||
        rules.deadEndStages.has(stage)
    ) {
        return { about: project, key: 'audit.msg_site_stage', args: [rules.stageLabel(stage)] };
    }
    const kind = kindOf(project, input.kinds);
    if (kind === undefined) {
        return {
            about: project,
            key: 'audit.msg_site_no_kind',
            args: [stage, project.form ?? '']
        };
    }
    if (kind.order === true && placeOf(project, input.self) === undefined) {
        return { about: project, key: 'audit.msg_site_no_self', args: [] };
    }
    return undefined;
}

/** The research lines a record names that the website's own file lacks, each a problem. */
function programProblems(project: Project, site: SiteFile): Problem[] {
    return (project.publication?.program ?? [])
        .filter((word) => !site.programs.includes(word))
        .map((word): Problem => ({
            about: project,
            key: 'audit.msg_site_program',
            args: [word, site.path],
            kind: 'data'
        }));
}

/** A section of the publications file as it is built: its entries and their ranks. */
type Section = { rank: number; entry: unknown }[];

/** The publications file the hub's manifests give, and the problems of the manifests left out. */
export function papersFile(input: PapersInput): {
    value: Record<string, unknown>;
    problems: Problem[];
} {
    const problems: Problem[] = [];
    const lacking = new Set<string>();
    const noWord = (key: string): void => {
        if (lacking.has(key)) return;
        lacking.add(key);
        problems.push({ about: null, key: 'audit.msg_site_no_word', args: [key] });
    };
    const sections = new Map<string, Section>(input.kinds.map((row) => [row.kind, []]));
    for (const project of input.projects) {
        if (project.publication === undefined) continue;
        if (input.sitePrograms !== '') problems.push(...programProblems(project, input.site));
        else if (project.publication.program?.length) noWord(SITE_PROGRAMS_KEY);
        const refused = refusal(project, input);
        if (refused !== undefined) {
            problems.push(refused);
            continue;
        }
        const kind = kindOf(project, input.kinds);
        const section = kind === undefined ? undefined : sections.get(kind.kind);
        if (kind === undefined || section === undefined) continue;
        const place = kind.order === true ? placeOf(project, input.self) : undefined;
        section.push({
            rank: project.publication.rank ?? Number.POSITIVE_INFINITY,
            entry: entryOf({ project, kind, place, input, noWord })
        });
    }
    const value: Record<string, unknown> = {};
    for (const [key, section] of sections) {
        const papers = [...section].sort((left, right) => left.rank - right.rank);
        value[key] = { [input.paperList]: papers.map((one) => one.entry) };
    }
    return { value, problems };
}
