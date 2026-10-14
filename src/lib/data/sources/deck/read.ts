// Layer 1, data. A deck folder read into the deck the view draws, and what was wrong with it.
// Server side only: it reads the filesystem and no client module may import it.
//
// A deck is a folder holding a `present.yml` and Markdown slide files. The reader works out each
// deck it meets once and keeps it, so a deck that is a member of several groups, or is read for a
// count, a summary and its own slides, costs one read of its files. Nothing here throws and
// nothing is repaired: a file that cannot be read, an entry of a shape it does not know, a name
// that matches no deck and a path that leaves the root are each a Finding naming the file and the
// entry, the slide or group they would have made is left out, and the rest of the deck is
// read.
//
// Counts, legends, summaries and grids read any group of the deck whose slide they sit in, placed
// or not. A deck reached again while it is being read is a cycle: it is reported and places
// nothing the second time.

import { existsSync, globSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { parse } from 'yaml';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import type {
    Deck,
    DeckGroup,
    DeckIdeaCard,
    DeckOrderEntry,
    DeckSlide,
    DeckState,
    DeckSummaryRow,
    Finding
} from '../../model/index.ts';
import { fileBytesUrl } from '../../helpers/files/address.ts';
import { realOf, resolveIn, type DeckRoot } from './files.ts';
import { resolveGroups, type Doc, type Finder, type Resolved } from './groups.ts';
import { buildSlide, type DeckProject, type KindContext } from './kinds.ts';
import { orderText } from './order-text.ts';
import { orderTokens, readSpec, type OrderEntry, type Raise } from './spec.ts';
import { splitSlides, type RawSlide } from './split.ts';

/** The file that makes a folder a deck. */
export const DECK_FILE = 'present.yml';

/** The folder a project keeps its deck in; its name is then the project's. */
export const PROJECT_DECK = 'present';

/** What the reader is given besides a folder. */
export type DeckContext = {
    /** The hub's folder, and the key its files are served under. */
    hub: DeckRoot;
    projects: DeckProject[];
    /** The keys of the hub's domains registry, which a project's `domain:` is checked against. */
    domains: string[];
    /** The engine's `tag_tones`, which a deck's own `defaults` override. */
    tagTones: Record<string, string>;
    catalog: TextCatalog;
    /**
     * The text a file holds unsaved in an editor, by the file's real path. A file the deck reads
     * is read from its draft; a path the deck does not read is never looked at.
     */
    drafts?: ReadonlyMap<string, string>;
};

/** A reader that keeps what it has read. */
export type DeckReader = {
    /** One deck, by its root and its folder under it. */
    read: (root: DeckRoot, path: string) => Deck;
    /** Every finding raised so far, each once. */
    findings: () => Finding[];
    /**
     * The decks of the hub's projects, as `{ project id, folder, tags }`, the folder under the
     * root that holds the project: the hub, or the project's repository.
     */
    projectDecks: () => { id: string; path: string; tags: string[] }[];
};

const COUNT = /\{\{\s*([\w-]+)\.count\s*\}\}/g;

/** The words of a text with the count of each group in it written out. */
function counted(value: unknown, fill: (group: string, whole: string) => string): unknown {
    if (typeof value === 'string')
        return value.replace(COUNT, (whole, group: string) => fill(group, whole));
    if (Array.isArray(value)) return value.map((one) => counted(one, fill));
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value).map(([key, one]) => [key, counted(one, fill)])
        );
    }
    return value;
}

/** A reader over one hub. */
export function createReader(context: DeckContext): DeckReader {
    const raised: Finding[] = [];
    const known = new Set<string>();
    const docs = new Map<string, Doc>();
    const memo = new Map<string, DeckSlide[]>();
    const groups = new Map<string, Map<string, Resolved>>();
    const files = new Map<string, RawSlide[] | null>();
    /** The 1-based first line of each slide of a slide file, by the file's path. */
    const firstLines = new Map<string, number[]>();
    const globbed = new Map<string, Doc[]>();
    let cuts = 0;

    const raiseFor =
        (file: string): Raise =>
        (key, id, ...args) => {
            const finding = { file, key, message: findingText(context.catalog, id, ...args) };
            const identity = `${finding.file}\n${finding.key}\n${finding.message}`;
            if (known.has(identity)) return;
            known.add(identity);
            raised.push(finding);
        };

    const drafts = context.drafts ?? new Map<string, string>();

    /** A file's text: its draft when an editor holds one, else what the disk holds. */
    function textOf(path: string): string {
        return drafts.get(realOf(path) ?? path) ?? readFileSync(path, 'utf8');
    }

    /** The real folder of each project's deck, with the project and the root that holds it. */
    const projectDirs = new Map<string, { project: DeckProject; root: DeckRoot }>();
    for (const project of context.projects) {
        const root =
            project.workspaceFolder === undefined
                ? context.hub
                : { key: project.workspaceFolder.root, dir: project.workspaceFolder.dir };
        const folder = project.workspaceFolder === undefined ? project.folder : '';
        const dir = realOf(join(root.dir, folder, PROJECT_DECK));
        if (dir !== null) projectDirs.set(dir, { project, root });
    }

    /** The project a deck folder belongs to, with a domain the domains registry lacks reported. */
    function projectOf(dir: string): DeckProject | null {
        const project = projectDirs.get(dir)?.project;
        if (project === undefined) return null;
        if (project.domain !== undefined && !context.domains.includes(project.domain)) {
            raiseFor(project.file)(
                'domain',
                'findings.deck.domain_unknown',
                project.id,
                project.domain
            );
            return { ...project, domain: undefined };
        }
        return project;
    }

    /** The deck in a real folder, read once. */
    function docAt(root: DeckRoot, dir: string): Doc {
        const held = docs.get(dir);
        if (held !== undefined) return held;
        const base = realOf(root.dir) ?? root.dir;
        const name = basename(dir) === PROJECT_DECK ? basename(dirname(dir)) : basename(dir);
        const file = join(dir, DECK_FILE);
        const raise = raiseFor(file);
        const doc: Doc = {
            root,
            dir,
            path: relative(base, dir).split(/[\\/]/).join('/'),
            name,
            file,
            project: projectOf(dir),
            spec: null,
            state: 'no_file',
            title: name
        };
        docs.set(dir, doc);
        if (!existsSync(file)) {
            raise('', 'findings.deck.no_file', doc.path);
            return doc;
        }
        let value: unknown;
        try {
            value = parse(textOf(file));
        } catch {
            doc.state = 'unreadable';
            raise('', 'findings.deck.unreadable');
            return doc;
        }
        const spec = readSpec(value, raise);
        if (spec === null) {
            doc.state = 'unreadable';
            raise('', 'findings.deck.not_a_map');
            return doc;
        }
        doc.spec = spec;
        doc.title = spec.title ?? name;
        doc.state = 'empty';
        if (spec.order.length === 0) raise('order', 'findings.deck.no_order');
        return doc;
    }

    /** The project decks of the hub. */
    function projectDocs(): Doc[] {
        const found: Doc[] = [];
        for (const [dir, { root }] of projectDirs) {
            if (existsSync(join(dir, DECK_FILE))) found.push(docAt(root, dir));
        }
        return found;
    }

    /** The decks the globs of a group find under a root. */
    function under(root: DeckRoot, patterns: string[], raise: Raise): Doc[] {
        const found: Doc[] = [];
        for (const pattern of patterns) {
            if (pattern.split(/[\\/]/).includes('..') || /^([\\/]|[a-z]:)/i.test(pattern)) {
                raise('find', 'findings.deck.path_outside', pattern, root.dir);
                continue;
            }
            const cacheKey = `${root.dir}\n${pattern}`;
            let docsHere = globbed.get(cacheKey);
            if (docsHere === undefined) {
                docsHere = [];
                for (const match of globSync(pattern, { cwd: root.dir })) {
                    const at = resolveIn(root, root.dir, match);
                    if ('error' in at) {
                        if (at.error === 'outside') {
                            raise('find', 'findings.deck.path_outside', match, root.dir);
                        }
                        continue;
                    }
                    const dir = basename(at.path) === DECK_FILE ? dirname(at.path) : at.path;
                    if (existsSync(join(dir, DECK_FILE))) docsHere.push(docAt(root, dir));
                }
                globbed.set(cacheKey, docsHere);
            }
            for (const one of docsHere) if (!found.includes(one)) found.push(one);
        }
        return found;
    }

    const finder: Finder = { under, projects: projectDocs };

    /** The groups of a deck, resolved. */
    function groupsOf(doc: Doc): Map<string, Resolved> {
        const held = groups.get(doc.dir);
        if (held !== undefined) return held;
        const made =
            doc.spec === null
                ? new Map<string, Resolved>()
                : resolveGroups(doc, doc.spec.groups, finder, raiseFor(doc.file));
        groups.set(doc.dir, made);
        return made;
    }

    /** The slides of a deck's slide file, or null when the file is not usable. */
    function fileOf(doc: Doc, entry: Extract<OrderEntry, { kind: 'file' }>): RawSlide[] | null {
        const raise = raiseFor(doc.file);
        const at = resolveIn(doc.root, doc.dir, entry.file);
        if ('error' in at) {
            raise(
                entry.at,
                at.error === 'outside'
                    ? 'findings.deck.path_outside'
                    : 'findings.deck.order_file_missing',
                entry.file,
                doc.path
            );
            return null;
        }
        const held = files.get(at.path);
        if (held !== undefined) return held;
        let cut: RawSlide[] | null = null;
        try {
            const read = splitSlides(textOf(at.path));
            if (read.unreadable) raise(entry.at, 'findings.deck.front_matter', entry.file);
            if (read.slides.length === 0) raise(entry.at, 'findings.deck.file_empty', entry.file);
            cut = read.slides;
            firstLines.set(
                at.path,
                read.spans.map((span) => span.first + 1)
            );
        } catch {
            raise(entry.at, 'findings.deck.order_file_missing', entry.file, doc.path);
        }
        files.set(at.path, cut);
        return cut;
    }

    /** The number of slides a group of a deck holds, and nothing for a group the deck lacks. */
    function countOf(doc: Doc, group: string, stack: string[]): number | null {
        const found = groupsOf(doc).get(group);
        if (found === undefined) return null;
        let total = 0;
        for (const member of found.members) total += slidesOf(member.doc, stack).length;
        return total;
    }

    /** The domains of a group's member projects, each once, in member order. */
    function legendOf(doc: Doc, group: string, key: string): string[] {
        const found = groupsOf(doc).get(group);
        if (found === undefined) {
            raiseFor(doc.file)(key, 'findings.deck.legend_unknown', group);
            return [];
        }
        const domains: string[] = [];
        for (const member of found.members) {
            const domain = member.doc.project?.domain;
            if (domain !== undefined && !domains.includes(domain)) domains.push(domain);
        }
        return domains;
    }

    /** One file's slides drawn. */
    function fileSlides(doc: Doc, entry: Extract<OrderEntry, { kind: 'file' }>, stack: string[]) {
        const raw = fileOf(doc, entry);
        const raise = raiseFor(doc.file);
        const slides: DeckSlide[] = [];
        const from = resolveIn(doc.root, doc.dir, entry.file);
        const folder = 'path' in from ? dirname(from.path) : doc.dir;
        const under = 'path' in from ? from.under : null;
        const fill = (group: string, whole: string): string => {
            const count = countOf(doc, group, stack);
            if (count === null) {
                raise(entry.at, 'findings.deck.count_unknown', group);
                return whole;
            }
            return String(count);
        };
        for (const [number, slide] of (raw ?? []).entries()) {
            const key = `${entry.file}#${number}`;
            const meta =
                slide.meta === null ? null : (counted(slide.meta, fill) as Record<string, unknown>);
            const filled: RawSlide = {
                meta,
                body: counted(slide.body, fill) as string
            };
            const resolve = (name: string) => {
                const at = resolveIn(doc.root, folder, name);
                return 'error' in at ? at : { src: fileBytesUrl(doc.root.key, at.under) };
            };
            const kind: KindContext = {
                key,
                folder: doc.path,
                deck: doc.name,
                project: doc.project,
                figures: resolve,
                image: resolve,
                raise
            };
            const built = buildSlide(filled, number, kind);
            if (built === null) continue;
            if (under !== null) {
                built.slide.source = {
                    root: doc.root.key,
                    path: under,
                    index: number,
                    entry: entry.index,
                    line: firstLines.get('path' in from ? from.path : '')?.[number] ?? 1
                };
            }
            if (built.legend !== undefined && 'legend' in built.slide) {
                built.slide.legend = legendOf(doc, built.legend, key);
            }
            slides.push(built.slide);
        }
        return slides;
    }

    /** The first slide of a kind among a deck's own slides. */
    function firstOf<K extends DeckSlide['kind']>(
        doc: Doc,
        kind: K,
        stack: string[]
    ): Extract<DeckSlide, { kind: K }> | undefined {
        return slidesOf(doc, stack).find(
            (one): one is Extract<DeckSlide, { kind: K }> => one.kind === kind
        );
    }

    /** The summary table of a group. */
    function summary(
        doc: Doc,
        entry: Extract<OrderEntry, { kind: 'summary' | 'grid' }>,
        stack: string[]
    ): DeckSlide | null {
        const found = groupsOf(doc).get(entry.of);
        if (found === undefined) {
            raiseFor(doc.file)(entry.at, 'findings.deck.order_group_unknown', entry.of);
            return null;
        }
        const key = `${entry.kind}:${entry.of}`;
        const source = {
            root: doc.root.key,
            path: doc.path === '' ? DECK_FILE : `${doc.path}/${DECK_FILE}`,
            index: entry.index,
            entry: entry.index,
            line: (orderText(textOf(doc.file))?.slots.at(entry.index)?.line ?? 0) + 1
        };
        const title = entry.title.replace(/<[^>]*>/g, '');
        if (entry.kind === 'grid') {
            const cards: DeckIdeaCard[] = found.members.map((member) => {
                const idea = firstOf(member.doc, 'idea', stack);
                if (idea !== undefined) return idea.card;
                const project = member.doc.project;
                const card: DeckIdeaCard = {
                    name: project === null ? member.doc.title : project.short || project.title,
                    desc: ''
                };
                if (project?.domain !== undefined) card.domain = project.domain;
                if (project !== null && project.chips.length > 0) card.maturity = project.chips[0];
                return card;
            });
            return {
                key,
                source,
                kind: 'grid',
                title,
                heading: entry.title,
                lede: entry.lede,
                cards,
                foot: entry.foot,
                legend: found.spec.find?.status ?? []
            };
        }
        const rows: DeckSummaryRow[] = found.members.map((member) => {
            const project = member.doc.project;
            const first = firstOf(member.doc, 'project', stack);
            const row: DeckSummaryRow = {
                project: project === null ? member.doc.title : project.short || project.title,
                mechanism: first?.slide.mechanism ?? '',
                headline: first?.slide.headline ?? ''
            };
            if (project?.domain !== undefined) row.domain = project.domain;
            return row;
        });
        return {
            key,
            source,
            kind: 'summary',
            title,
            heading: entry.title,
            rows,
            foot: entry.foot
        };
    }

    /** Every slide a deck places, in order. */
    function slidesOf(doc: Doc, stack: string[]): DeckSlide[] {
        if (doc.spec === null) return [];
        if (stack.includes(doc.dir)) {
            cuts += 1;
            raiseFor(doc.file)('order', 'findings.deck.cycle', doc.name);
            return [];
        }
        const held = memo.get(doc.dir);
        if (held !== undefined) return held;
        const before = cuts;
        const inside = [...stack, doc.dir];
        const slides: DeckSlide[] = [];
        for (const entry of doc.spec.order) {
            if (entry.kind === 'file') slides.push(...fileSlides(doc, entry, inside));
            else if (entry.kind === 'group') {
                const found = groupsOf(doc).get(entry.group);
                if (found === undefined) {
                    raiseFor(doc.file)(entry.at, 'findings.deck.order_group_unknown', entry.group);
                    continue;
                }
                for (const member of found.members) {
                    for (const one of slidesOf(member.doc, inside)) {
                        const key = `${member.doc.name}/${one.key}`;
                        const source = one.source;
                        slides.push(
                            source === undefined
                                ? { ...one, key }
                                : { ...one, key, source: { ...source, entry: entry.index } }
                        );
                    }
                }
            } else {
                const one = summary(doc, entry, inside);
                if (one !== null) slides.push(one);
            }
        }
        if (cuts === before) memo.set(doc.dir, slides);
        return slides;
    }

    /** The keys of a deck's slides made unique, a repeated one given a number. */
    function unique(slides: DeckSlide[]): DeckSlide[] {
        const seen = new Map<string, number>();
        return slides.map((one) => {
            const count = seen.get(one.key) ?? 0;
            seen.set(one.key, count + 1);
            return count === 0 ? one : { ...one, key: `${one.key}~${count + 1}` };
        });
    }

    /** The groups of a deck as the Slides view lists them. */
    function groupsOfDeck(doc: Doc): DeckGroup[] {
        if (doc.spec === null) return [];
        const listed = (one: Doc) => ({ name: one.name, title: one.title, path: one.path });
        return doc.spec.groups.map((group) => {
            const found = groupsOf(doc).get(group.name);
            return {
                name: group.name,
                slides: group.slides,
                members: (found?.members ?? []).map((member) => ({
                    ...listed(member.doc),
                    named: member.named
                })),
                candidates: (found?.candidates ?? []).map((one) => ({
                    ...listed(one),
                    named: false
                })),
                missing: found?.missing ?? [],
                conflicts: (found?.conflicts ?? []).map((conflict) => ({
                    name: conflict.doc.name,
                    path: conflict.doc.path,
                    others: conflict.others
                })),
                count: countOf(doc, group.name, [doc.dir]) ?? 0
            };
        });
    }

    /** The entries of a deck's `order:` as the Slides view lists them. */
    function orderOfDeck(doc: Doc): DeckOrderEntry[] {
        if (doc.spec === null) return [];
        const tokens = orderTokens(doc.spec.order);
        return doc.spec.order.map((entry, at) => {
            const token = tokens[at];
            if (entry.kind === 'file') {
                const first = fileSlides(doc, entry, [doc.dir]).at(0);
                return { token, kind: 'file', name: entry.file, title: first?.title ?? entry.file };
            }
            if (entry.kind === 'group') {
                return { token, kind: 'group', name: entry.group, title: entry.group };
            }
            const title = entry.title.replace(/<[^>]*>/g, '');
            return { token, kind: entry.kind, name: entry.of, title };
        });
    }

    /** An answer for a folder that holds no deck. */
    function absent(root: DeckRoot, path: string, state: DeckState): Deck {
        return {
            root: root.key,
            path,
            name: basename(path) === PROJECT_DECK ? basename(dirname(path)) : basename(path),
            title: basename(path),
            state,
            slides: [],
            order: [],
            groups: [],
            tagTones: { ...context.tagTones },
            findings: [...raised]
        };
    }

    function read(root: DeckRoot, path: string): Deck {
        const at = resolveIn(root, root.dir, path);
        const raise = raiseFor(join(root.dir, path, DECK_FILE));
        if ('error' in at) {
            raise(
                '',
                at.error === 'outside'
                    ? 'findings.deck.path_outside'
                    : 'findings.deck.folder_missing',
                path,
                root.dir
            );
            return absent(root, path, 'missing');
        }
        let folder: boolean;
        try {
            folder = statSync(at.path).isDirectory();
        } catch {
            folder = false;
        }
        if (!folder) {
            raise('', 'findings.deck.folder_missing', path, root.dir);
            return absent(root, path, 'missing');
        }
        const doc = docAt(root, at.path);
        const slides = unique(slidesOf(doc, []));
        const state: DeckState = doc.spec === null ? doc.state : slides.length > 0 ? 'ok' : 'empty';
        return {
            root: root.key,
            path: doc.path,
            name: doc.name,
            title: doc.title,
            state,
            slides,
            order: orderOfDeck(doc),
            groups: groupsOfDeck(doc),
            tagTones: { ...context.tagTones, ...(doc.spec?.tagTones ?? {}) },
            findings: [...raised]
        };
    }

    return {
        read,
        findings: () => [...raised],
        projectDecks: () =>
            projectDocs().map((doc) => {
                const tags: string[] = [];
                for (const one of slidesOf(doc, [])) {
                    const name = one.kind === 'project' ? one.slide.tag?.class : undefined;
                    if (name !== undefined && name !== '' && !tags.includes(name)) tags.push(name);
                }
                return {
                    id: doc.project?.id ?? doc.name,
                    path: doc.path,
                    tags
                };
            })
    };
}
