// Layer 2, server. The audit's publications section: the website's publications feed the hub's
// `audit.website` setting names (setting.ts) against the hub's projects, matched by title. The
// setting says which file the feed is, which key of each section holds its entries, which key of an
// entry holds its title, and which sections a project is expected in by its stage and form. Every
// hub that sets it is checked against its own feed. A project of a tier `research_audit.skip_tiers`
// names gets no finding, and the paper it matches counts as matched. Every flag is soft, since a
// title match is never certain.

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
    sentence,
    type Raised,
    scopeOf,
    isPersonal,
    slurp,
    scalarShape
} from './rules.ts';
import type { PublicationKind, Website } from './setting.ts';

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

/** One paper of the website's feed: its key, its section, its words. */
type SitePaper = { key: string; section: string; title: string; words: Set<string> };

/** The feed: a map of sections, read from its own keys. */
const feedShape = z.custom<Record<string, unknown>>(isMap);

/** A section of the feed: a map, whose list of entries is read from its own keys. */
const sectionShape = z.custom<Record<string, unknown>>(isMap);

/** A list of entries of a section. */
const entriesShape = z.array(z.unknown());

/**
 * The papers of the website's feed, one record each, in the order the file lists them: each
 * section's entries under the setting's `list` key, each entry's title under its `title` key, read
 * as the text it is written as.
 */
function sitePapers(data: unknown, website: Website): SitePaper[] {
    const feed = feedShape.safeParse(data);
    if (!feed.success) return [];
    const found: SitePaper[] = [];
    for (const [section, block] of Object.entries(feed.data)) {
        const held = sectionShape.safeParse(block);
        if (!held.success || !Object.hasOwn(held.data, website.list)) continue;
        const entries = entriesShape.safeParse(held.data[website.list]);
        if (!entries.success) continue;
        for (const item of entries.data) {
            if (!isMap(item) || !Object.hasOwn(item, website.title)) continue;
            const title = scalarShape.parse(item[website.title]).trim();
            const key = normalTitle(title);
            if (key !== '') found.push({ key, section, title, words: titleWords(title) });
        }
    }
    return found;
}

/**
 * The sections a hub project at this stage and of this form is expected to appear in: the `kind`
 * of the first row of the setting's `kinds` whose `stages` holds the stage and whose `forms` holds
 * the form, a side the row leaves out holding to nothing; none when no row matches.
 */
function expectedSections(project: Project, kinds: readonly PublicationKind[]): string[] {
    const stage = project.stage ?? '';
    const form = project.form ?? '';
    for (const row of kinds) {
        if (row.stages !== undefined && !row.stages.includes(stage)) continue;
        if (row.forms !== undefined && !row.forms.includes(form)) continue;
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
 * The website's publications feed against the hub's projects. Every flag is soft: the matching is
 * by title and is never certain, so nothing here is an error, only something to look at. The check
 * is skipped without a word when the hub names no feed in its `audit.website`, or the file is not
 * there.
 */
export function publications(input: AuditInput, add: (f: Raised) => void): void {
    const { rules } = input;
    const website = input.setting.website;
    if (website === null) return;
    const where = website.file;
    const path = join(input.hub, where);
    if (!existsSync(path)) return;
    const file = fileOf(input.hub, path);
    let data: unknown;
    try {
        data = parse(slurp(path));
    } catch (error) {
        const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
        add({
            scope: 'website',
            where,
            kind: 'publink',
            file,
            ...sentence('audit.msg_site_unreadable', where, reason)
        });
        return;
    }
    const site = sitePapers(data, website);
    /** Every section a normalised title appears in, since one paper can be listed twice. */
    const sections = new Map<string, Set<string>>();
    for (const paper of site) {
        sections.set(paper.key, (sections.get(paper.key) ?? new Set()).add(paper.section));
    }
    const sectionsOf = (paper: SitePaper): string[] =>
        [...(sections.get(paper.key) ?? new Set([paper.section]))].sort();

    const claimed = new Set<string>();
    for (const project of input.projects) {
        const stage = project.stage ?? '';
        const key = normalTitle(project.title);
        if (isPersonal(project, rules)) {
            // A project of a skipped tier is held to nothing, and the paper it matches is not one
            // that no project of the hub matches.
            const found = match(key, titleWords(project.title), site);
            if (key !== '' && found.hit !== null && found.score >= LOOSE) {
                claimed.add(found.hit.key);
            }
            continue;
        }
        if (key === '' || rules.negativeStages.has(stage) || rules.deadEndStages.has(stage))
            continue;
        const found = match(key, titleWords(project.title), site);
        const hit = found.hit;
        if (hit !== null && found.score >= SAME) {
            claimed.add(hit.key);
            const wanted = expectedSections(project, website.kinds);
            if (
                rules.publicStages.has(stage) &&
                !sectionsOf(hit).some((one) => wanted.includes(one))
            ) {
                add({
                    scope: scopeOf(project),
                    where,
                    kind: 'publink',
                    file,
                    ...sentence(
                        'audit.msg_site_wrong_section',
                        printed(sectionsOf(hit)),
                        stage,
                        printed(wanted)
                    )
                });
            }
        } else if (hit !== null && found.score >= LOOSE) {
            claimed.add(hit.key);
            if (rules.publicStages.has(stage)) {
                add({
                    scope: scopeOf(project),
                    where,
                    kind: 'publink',
                    file,
                    ...sentence('audit.msg_site_title_differs', hit.title, printed(sectionsOf(hit)))
                });
            }
        } else if (rules.publicStages.has(stage)) {
            add({
                scope: scopeOf(project),
                where,
                kind: 'publink',
                file,
                ...sentence(
                    'audit.msg_site_missing',
                    stage,
                    expectedSections(project, website.kinds).join('/')
                )
            });
        }
    }

    const deadClaimed = new Set<string>();
    /** The stages a publication takes, by their labels, which the dead-end finding offers. */
    const published = [...rules.publicStages].map((one) => `"${rules.stageLabel(one)}"`).join(', ');
    for (const project of input.projects) {
        if (isPersonal(project, rules)) continue;
        const stage = project.stage ?? '';
        if (!rules.negativeStages.has(stage) && !rules.deadEndStages.has(stage)) continue;
        const key = normalTitle(project.title);
        if (key === '') continue;
        const pool = site.filter((paper) => !claimed.has(paper.key));
        const found = match(key, titleWords(project.title), pool);
        const hit = found.hit;
        if (hit === null || found.score < SAME) continue;
        deadClaimed.add(hit.key);
        const shown = printed(sectionsOf(hit));
        add({
            scope: scopeOf(project),
            where,
            kind: 'publink',
            file,
            ...(rules.negativeStages.has(stage)
                ? sentence('audit.msg_site_negative', rules.stageLabel(stage), shown)
                : sentence('audit.msg_site_deadend', rules.stageLabel(stage), shown, published)),
            // Signed by the stage word, so rewording a stage's label keeps a mute.
            signed: [stage, shown]
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
        where,
        kind: 'publink',
        file,
        ...(untracked.length === 1
            ? sentence('audit.msg_site_untracked_one', untracked.length, listed)
            : sentence('audit.msg_site_untracked', untracked.length, listed))
    });
}
