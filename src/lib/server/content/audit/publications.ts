// Layer 2, server. The audit's publications section: the public website's publication feed against
// the portfolio, matched by title. Every flag is soft, since a title match is never certain.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { isMap } from '../../../data/helpers/guards.ts';
import type { Project } from '../../../data/model/index.ts';
import {
    fileOf,
    printed,
    type AuditInput,
    type PublicationKind,
    sentence,
    type Raised,
    scopeOf,
    isPersonal,
    slurp,
    scalarShape
} from './rules.ts';

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

/** The feed: a map of sections, read from its own keys. */
const feedShape = z.custom<Record<string, unknown>>(isMap);

/** One section of the feed: a map that holds a list of papers. */
const sectionShape = z.object({ papers: z.array(z.unknown()) });

/** One paper of a section: a map, whose title reads as the text it is written as. */
const paperShape = z.object({ title: scalarShape });

/** The papers of the website's feed, one record each, in the order the file lists them. */
function sitePapers(data: unknown): SitePaper[] {
    const feed = feedShape.safeParse(data);
    if (!feed.success) return [];
    const found: SitePaper[] = [];
    for (const [section, block] of Object.entries(feed.data)) {
        const held = sectionShape.safeParse(block);
        if (!held.success) continue;
        for (const item of held.data.papers) {
            const paper = paperShape.safeParse(item);
            if (!paper.success) continue;
            const title = paper.data.title.trim();
            const key = normalTitle(title);
            if (key !== '') found.push({ key, section, title, words: titleWords(title) });
        }
    }
    return found;
}

/**
 * The sections a hub project of this type and these chips is expected to appear in: the `kind` of
 * the first row of `publication_kinds` whose `types` holds the type and whose `chips` shares one
 * of the chips, a side the row leaves out holding to nothing; none when no row matches.
 */
function expectedSections(project: Project, kinds: readonly PublicationKind[]): string[] {
    const type = project.type ?? '';
    for (const row of kinds) {
        if (row.types !== undefined && !row.types.includes(type)) continue;
        if (row.chips !== undefined && !row.chips.some((chip) => project.chips.includes(chip))) {
            continue;
        }
        return row.kind;
    }
    return [];
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
export function publications(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    if (rules.publicationsFile === '') return;
    const path = join(input.hub, rules.publicationsFile);
    if (!existsSync(path)) return;
    const file = fileOf(input.hub, path);
    let data: unknown;
    try {
        data = parse(slurp(path));
    } catch (error) {
        const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
        add({
            scope: 'website',
            where: rules.publicationsFile,
            kind: 'publink',
            file,
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

    const claimed = new Set<string>();
    for (const project of input.projects) {
        if (isPersonal(project, rules)) continue;
        const type = project.type ?? '';
        const key = normalTitle(project.title);
        if (key === '' || rules.negativeTypes.has(type) || rules.deadEndTypes.has(type)) continue;
        const found = match(key, titleWords(project.title), site);
        const hit = found.hit;
        if (hit !== null && found.score >= SAME) {
            claimed.add(hit.key);
            const wanted = expectedSections(project, rules.publicationKinds);
            if (
                rules.publicTypes.has(type) &&
                !sectionsOf(hit).some((one) => wanted.includes(one))
            ) {
                add({
                    scope: scopeOf(project),
                    where: 'publications.yml',
                    kind: 'publink',
                    file,
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
            if (rules.publicTypes.has(type)) {
                add({
                    scope: scopeOf(project),
                    where: 'publications.yml',
                    kind: 'publink',
                    file,
                    ...sentence('audit.msg_site_title_differs', hit.title, printed(sectionsOf(hit)))
                });
            }
        } else if (rules.publicTypes.has(type)) {
            add({
                scope: scopeOf(project),
                where: 'publications.yml',
                kind: 'publink',
                file,
                ...sentence(
                    'audit.msg_site_missing',
                    type,
                    expectedSections(project, rules.publicationKinds).join('/')
                )
            });
        }
    }

    const deadClaimed = new Set<string>();
    for (const project of input.projects) {
        if (isPersonal(project, rules)) continue;
        const type = project.type ?? '';
        if (!rules.negativeTypes.has(type) && !rules.deadEndTypes.has(type)) continue;
        const key = normalTitle(project.title);
        if (key === '') continue;
        const pool = site.filter((paper) => !claimed.has(paper.key));
        const found = match(key, titleWords(project.title), pool);
        const hit = found.hit;
        if (hit === null || found.score < SAME) continue;
        deadClaimed.add(hit.key);
        add({
            scope: scopeOf(project),
            where: 'publications.yml',
            kind: 'publink',
            file,
            ...(rules.negativeTypes.has(type)
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
    const listed = `${shown.map((title) => `"${title}"`).join('; ')}${more}`;
    add({
        scope: 'website',
        where: 'publications.yml',
        kind: 'publink',
        file,
        ...(untracked.length === 1
            ? sentence('audit.msg_site_untracked_one', untracked.length, listed)
            : sentence('audit.msg_site_untracked', untracked.length, listed))
    });
}
