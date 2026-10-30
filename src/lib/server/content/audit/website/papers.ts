// Layer 2, server. The website's publications file built from the hub: one entry per manifest that
// carries a `publication:` record, in the section of the first row of the hub's `website.kinds`
// whose stages and forms hold the manifest's, sections in the rows' order, the entries of a section
// by the record's `rank`. The record's own fields are written through as it holds them; the title,
// the year, the user's place among the authors, the words around the venue and the Code link are
// taken from the rest of the manifest. A manifest the website cannot list is no entry and a problem
// naming it, which the audit words as a finding (../publications.ts).

import type { Id, Project } from '../../../../data/model/index.ts';
import type { WebsiteKind } from '../../../../data/sources/config/settings/files.ts';
import type { AuditRules } from '../rules.ts';
import { type Problem, type SiteFile, titleOf } from './site.ts';

/** What the publications are built from. */
export type PapersInput = {
    projects: readonly Project[];
    self: ReadonlySet<Id>;
    kinds: readonly WebsiteKind[];
    rules: Pick<AuditRules, 'publicStages' | 'negativeStages' | 'deadEndStages' | 'stageLabel'>;
    site: SiteFile;
};

/** The address a DOI resolves at. */
const DOI_ORIGIN = 'https://doi.org/';

/** The name the code link is printed with. */
const CODE = 'Code';

/** The code deposit's status under which the website links the code. */
const DEPOSITED = 'deposited';

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

/**
 * The user's place among the paper's authors: first when the user leads it (co-first authors
 * included), senior when the user supervises it, coauthor when the user collaborates on it, and
 * none when the manifest names the user in none of the three.
 */
function orderOf(project: Project, self: ReadonlySet<Id>): string | undefined {
    const names = (ids: readonly Id[]): boolean => ids.some((id) => self.has(id));
    if (names(project.lead)) return 'first';
    if (names(project.supervisors)) return 'senior';
    if (names(project.collaborators)) return 'coauthor';
    return undefined;
}

/**
 * The Code link of a deposited project: the DOI's address when the deposit has a DOI that is not
 * empty, else the deposit's address; none for a deposit of any other status.
 */
function codeLink(project: Project): string | undefined {
    const deposit = project.codeAvailability;
    if (deposit?.status !== DEPOSITED) return undefined;
    const doi = deposit.doi?.trim() ?? '';
    if (doi !== '') return `${DOI_ORIGIN}${doi}`;
    return deposit.url;
}

/** The entry's links, by name in the record's order, the Code link last. */
function linksOf(project: Project): Record<string, string> | undefined {
    const links: Record<string, string> = {};
    for (const row of project.publication?.links ?? []) links[row.name] = row.url;
    const code = codeLink(project);
    if (code !== undefined) links[CODE] = code;
    return Object.keys(links).length === 0 ? undefined : links;
}

/** One entry of a section: the record's fields as held and the fields taken from the manifest. */
function entryOf(project: Project, kind: WebsiteKind, order: string | undefined) {
    const held = project.publication ?? {};
    const entry: Record<string, unknown> = {};
    const put = (key: string, value: unknown): void => {
        if (value !== undefined) entry[key] = value;
    };
    put('authors', held.authors);
    put('title', project.title);
    put('order', order);
    put('program', held.program);
    put('book', held.book);
    put('pub_pre', kind.pub_pre);
    put('pub_post', kind.pub_post);
    put('pub_date', project.year);
    put('url', held.url);
    put('links', linksOf(project));
    put('abstract', held.abstract);
    put('pub_last', held.pub_last);
    put('hide', held.hide);
    return entry;
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
    if (kind.order === true && orderOf(project, input.self) === undefined) {
        return { about: project, key: 'audit.msg_site_no_self', args: [] };
    }
    return undefined;
}

/** The research lines a record names that the website's `programs:` lacks, each a problem. */
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

/** A section of the publications file as it is built: its title, its entries and their ranks. */
type Section = { title?: string; papers: { rank: number; entry: unknown }[] };

/** The publications file the hub's manifests give, and the problems of the manifests left out. */
export function papersFile(input: PapersInput): {
    value: Record<string, unknown>;
    problems: Problem[];
} {
    const problems: Problem[] = [];
    const sections = new Map<string, Section>();
    for (const row of input.kinds) {
        const known = sections.get(row.kind);
        if (known === undefined) sections.set(row.kind, { title: row.title, papers: [] });
        else known.title ??= row.title;
    }
    for (const project of input.projects) {
        if (project.publication === undefined) continue;
        problems.push(...programProblems(project, input.site));
        const refused = refusal(project, input);
        if (refused !== undefined) {
            problems.push(refused);
            continue;
        }
        const kind = kindOf(project, input.kinds);
        const section = kind === undefined ? undefined : sections.get(kind.kind);
        if (kind === undefined || section === undefined) continue;
        const order = kind.order === true ? orderOf(project, input.self) : undefined;
        section.papers.push({
            rank: project.publication.rank ?? Number.POSITIVE_INFINITY,
            entry: entryOf(project, kind, order)
        });
    }
    const value: Record<string, unknown> = {};
    const title = titleOf(input.site, 'publications');
    if (title !== undefined) value.title = title;
    for (const [key, section] of sections) {
        const papers = [...section.papers].sort((left, right) => left.rank - right.rank);
        value[key] = {
            ...(section.title === undefined ? {} : { title: section.title }),
            papers: papers.map((one) => one.entry)
        };
    }
    return { value, problems };
}
