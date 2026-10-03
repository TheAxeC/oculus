// Layer 2, client state. Layout invariants and saved-form parsing live here because changes to the
// persisted shape do not change workbench operations.
//
// A saved value is read part by part, each part through its own schema, so the sentence a refusal
// gives names the part that failed first. A parsed value is taken for a map by
// data/helpers/guards.ts's `isMap`; what the schemas leave to the checks below is how the parts
// add up: sizes that sum to one, a minimum size, a folded index inside the children.

import { z } from 'zod';
import { tabsOf } from '../instance.ts';
import {
    FLOATLESS_VERSION,
    LAYOUT_VERSION,
    MIN_SIZE,
    PAGES_VERSION,
    WORKBENCH_VERSION,
    newPage,
    pageLeaf,
    show,
    type Float,
    type Instance,
    type Layout,
    type Page,
    type Pages,
    type Pane,
    type Workbench
} from '../model.ts';
import { placeFits } from '../open/floats.ts';
import { withInfoFolded, withSystemLabel } from './fold.ts';
import { treeWithoutConfig, withoutConfigTabs } from './migrate.ts';
import { refusedLeaves, settlePageLeaves, type Refusal } from '../nested.ts';
import { normaliseSizes } from '../tree.ts';
import { focusedPane, settleFocus } from '../workbench.ts';
import { isMap } from '../../../../data/helpers/guards.ts';
import { filledTextShape, mapShape, readAs, unchanged } from '../../../../data/shapes/shapes.ts';

const SUM_EPS = 1e-6;
const EPS = 1e-9;

/** A list of anything; the items are read one by one where their sentence is. */
const listShape = z.array(z.unknown());

/** A page leaf's page: a name that carries something. */
const leafPageShape = z.string().min(1);

/** A split's direction. */
const dirShape = z.enum(['row', 'col']);

/** A split's sizes: finite numbers, answered as the list the file held. */
const sizesShape = unchanged(z.array(z.number()));

/** A whole number, which is what a folded index and a step of a path are. */
const wholeNumberShape = z.number().refine(Number.isInteger);

/** A tab's identity: an id that carries something, with the fields the tab keeps beside it. */
const tabIdShape = z.object({
    id: z.string().min(1),
    view: z.unknown().optional(),
    state: z.unknown().optional(),
    preview: z.unknown().optional()
});

/** A tab's view, which is any text. */
const tabViewShape = z.string();

/** The id of the tab that is active: any text, the empty text for a pane with no tab. */
const activeShape = z.string();

/** A saved focus path: whole, non-negative steps, answered as the list the file held. */
const pathShape = unchanged(z.array(wholeNumberShape.pipe(z.number().nonnegative())));

/** A saved focus: the path of the pane it names. */
const focusShape = z.object({ path: pathShape });

/** A saved focus of two trees: which tree it named and the path inside it. */
const dockedFocusShape = z.object({ target: z.enum(['main', 'panel']), path: pathShape });

/** A saved one-tree workbench: its tree and its focus, each read where it is used. */
const workbenchShape = z.object({
    root: z.unknown().optional(),
    focus: z.unknown().optional()
});

/** The share of the window a saved panel took when its own share cannot be read. */
const PANEL_SHARE = 0.3;

/** A saved workbench of two trees: where the panel docks, and how much of the window it took. */
const dockedShape = z.object({
    main: z.unknown().optional(),
    panel: z.unknown().optional(),
    dock: z.enum(['right', 'bottom', 'hidden']),
    panelSize: z.number().catch(PANEL_SHARE),
    focus: z.unknown().optional()
});

/** A page of the pages envelope: its id and label, with its tree and its rail key read apart. */
const savedPageShape = z.object({
    id: z.string(),
    label: z.string(),
    workbench: z.unknown().optional(),
    rail: filledTextShape
});

/** The pages envelope's own fields: the saved pages, the id of the current one and the floats. */
const pagesEnvelopeShape = z.object({
    pages: listShape,
    current: z.string(),
    floats: z.unknown().optional()
});

/** A saved float: its id, with its pane and its place read apart. */
const savedFloatShape = z.object({
    id: z.string().min(1),
    pane: z.unknown().optional(),
    place: z.unknown().optional()
});

/** A saved place: a free rectangle or a dock; whether it fits the window is placeFits'. */
const placeShape = z.union([
    z.object({
        kind: z.literal('free'),
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number()
    }),
    z.object({
        kind: z.literal('dock'),
        edge: z.enum(['left', 'right', 'bottom']),
        size: z.number()
    })
]);

/** A saved envelope: a map, or the text of one. */
const envelopeShape = z.union([mapShape, z.string().transform(jsonOf).pipe(mapShape)]);

/** The value a text parses to, or undefined for text that is not JSON. */
function jsonOf(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}

/**
 * Every violation in a tree, and an empty array for a tree the shell can render. Handed the page
 * list and the id of the page whose tree it is, it also reads the page leaves: a leaf must name a
 * page the list holds, and no leaf may make the host page show itself.
 */
export function checkLayout(layout: Layout, known?: Pages, host?: string): string[] {
    const problems: string[] = [];
    readNode(layout, [], problems, new Set());
    problems.push(...checkPageLeaves(layout, known, host));
    return problems;
}

/** The words for each way a leaf can be one its page may not draw. */
const REFUSALS: Record<Refusal, string> = {
    unknown: 'which is not a page',
    loop: 'which shows this page',
    twice: 'which this page already shows'
};

/** Every page leaf of a tree that its page may not draw, in the order the tree draws them. */
function checkPageLeaves(layout: Layout, known?: Pages, host?: string): string[] {
    if (known === undefined || host === undefined) return [];
    return refusedLeaves(known.pages, host, layout).map(
        (leaf) =>
            `node at ${show(leaf.path)}: shows ${JSON.stringify(leaf.page)}, ${REFUSALS[leaf.why]}`
    );
}

/** Build and validate one tree node while collecting every recoverable violation. */
function readNode(
    value: unknown,
    path: number[],
    problems: string[],
    ids: Set<string>
): Layout | null {
    const where = `node at ${show(path)}`;
    if (!isMap(value)) {
        problems.push(`${where}: not an object`);
        return null;
    }
    if (value.kind === 'split') return readSplit(value, path, problems, ids, where);
    if (value.kind === 'pane') return readPane(value, problems, ids, where);
    if (value.kind === 'page') return readPageLeaf(value, problems, where);
    problems.push(`${where}: kind is ${JSON.stringify(value.kind)}, not split, pane or page`);
    return null;
}

/** Build and validate one page leaf: it names another page and holds nothing else. */
function readPageLeaf(
    value: Record<string, unknown>,
    problems: string[],
    where: string
): Layout | null {
    const page = readAs(leafPageShape, value.page);
    if (page === null) {
        problems.push(`${where}: page is ${JSON.stringify(value.page)}, which names no page`);
        return null;
    }
    return pageLeaf(page);
}

/** Build and validate one split node. */
function readSplit(
    value: Record<string, unknown>,
    path: number[],
    problems: string[],
    ids: Set<string>,
    where: string
): Layout | null {
    const dir = readAs(dirShape, value.dir);
    if (dir === null) {
        problems.push(`${where}: dir is ${JSON.stringify(value.dir)}, not row or col`);
        return null;
    }
    const rawChildren = readAs(listShape, value.children);
    if (rawChildren === null) {
        problems.push(`${where}: children is not an array`);
        return null;
    }
    if (rawChildren.length < 2) {
        problems.push(`${where}: a split holds ${rawChildren.length} children, two is the least`);
    }
    const children: Layout[] = [];
    for (const [index, raw] of rawChildren.entries()) {
        const child = readNode(raw, [...path, index], problems, ids);
        if (child === null) return null;
        children.push(child);
    }
    const sizes = readAs(sizesShape, value.sizes);
    if (sizes === null) {
        problems.push(`${where}: sizes is not an array of numbers`);
        return null;
    }
    if (sizes.length !== children.length) {
        problems.push(`${where}: ${sizes.length} sizes for ${children.length} children`);
    } else {
        const total = sizes.reduce((sum, size) => sum + size, 0);
        if (Math.abs(total - 1) > SUM_EPS) problems.push(`${where}: sizes sum to ${total}, not 1`);
    }
    for (const [index, size] of sizes.entries()) {
        if (size < MIN_SIZE - EPS) {
            problems.push(`${where}: child ${index} holds ${size}, under the minimum ${MIN_SIZE}`);
        }
    }
    const folded = readFolded(value.folded, children.length, problems, where);
    const split: Layout = { kind: 'split', dir, sizes, children };
    if (folded === null) return null;
    if (folded.length > 0) split.folded = folded;
    return split;
}

/**
 * The collapsed children of a split: whole indexes inside its children, each once, and never all of
 * them.
 */
function readFolded(
    value: unknown,
    count: number,
    problems: string[],
    where: string
): number[] | null {
    if (value === undefined) return [];
    const listed = readAs(listShape, value);
    if (listed === null) {
        problems.push(`${where}: folded is not an array`);
        return null;
    }
    const folded: number[] = [];
    for (const raw of listed) {
        const index = readAs(wholeNumberShape, raw);
        if (index === null || index < 0 || index >= count) {
            problems.push(`${where}: folded names ${JSON.stringify(raw)}, which is not a child`);
            return null;
        }
        if (!folded.includes(index)) folded.push(index);
    }
    if (folded.length >= count) {
        problems.push(`${where}: every child is folded, which leaves the split nothing to show`);
        return null;
    }
    return folded;
}

/** Build and validate one pane node. */
function readPane(
    value: Record<string, unknown>,
    problems: string[],
    ids: Set<string>,
    where: string
): Layout | null {
    const rawTabs = readAs(listShape, value.tabs);
    if (rawTabs === null) {
        problems.push(`${where}: tabs is not an array`);
        return null;
    }
    const tabs: Instance[] = [];
    for (const [index, raw] of rawTabs.entries()) {
        const held = readAs(tabIdShape, raw);
        if (held === null) {
            problems.push(`${where}: tab ${index} has no id`);
            return null;
        }
        const view = readAs(tabViewShape, held.view);
        if (view === null) {
            problems.push(`${where}: tab ${index} has no view`);
            return null;
        }
        if (ids.has(held.id))
            problems.push(`${where}: tab ${index} repeats the instance id ${held.id}`);
        ids.add(held.id);
        const tab: Instance = { id: held.id, view, state: held.state };
        // The flag is optional, so a layout saved before there were preview tabs reads as one whose
        // tabs are all kept, and a reader who left one open finds it as it was.
        if (held.preview === true) tab.preview = true;
        tabs.push(tab);
    }
    const active = readAs(activeShape, value.active);
    if (active === null) {
        problems.push(`${where}: active is not a string`);
        return null;
    }
    if (tabs.length === 0) {
        if (active !== '') problems.push(`${where}: an empty pane calls ${active} active`);
    } else if (!tabs.some((tab) => tab.id === active)) {
        problems.push(
            `${where}: active is ${JSON.stringify(active)}, which is not one of its tabs`
        );
    }
    const read: Pane = { kind: 'pane', tabs, active };
    // Only an empty pane keeps a kind: the pane a Terminal tab left stays a terminals pane.
    if (tabs.length === 0 && value.keeps === 'terminals') read.keeps = 'terminals';
    // A pane saved before panes could be locked has no field, which reads as unlocked.
    if (value.locked === true) read.locked = true;
    return read;
}

/** Every violation in a whole workbench: its tree, and a focus that names no pane of it. */
export function checkWorkbench(workbench: Workbench, known?: Pages, host?: string): string[] {
    const problems: string[] = [];
    readTree(workbench.root, 'root', problems, new Set<string>());
    for (const problem of checkPageLeaves(workbench.root, known, host)) {
        problems.push(`root ${problem}`);
    }
    const focus = workbench.focus;
    if (focus !== undefined && focusedPane(workbench) === null) {
        problems.push(`focus names ${show(focus.path)}, which is not a pane`);
    }
    return problems;
}

/** Every violation in the page collection and its workbenches. */
export function checkPages(pages: Pages): string[] {
    const problems: string[] = [];
    if (pages.pages.length === 0) problems.push('no page');
    const ids = new Set<string>();
    const rails = new Set<string>();
    const instances = new Set<string>();
    for (const page of pages.pages) {
        if (ids.has(page.id)) problems.push(`page id ${JSON.stringify(page.id)} is used twice`);
        ids.add(page.id);
        if (page.rail !== undefined) {
            if (page.rail === '') {
                problems.push(`page ${JSON.stringify(page.label)} has an empty rail key`);
            } else if (rails.has(page.rail)) {
                problems.push(`rail key ${JSON.stringify(page.rail)} is on two pages`);
            }
            rails.add(page.rail);
        }
        for (const problem of checkWorkbench(page.workbench, pages, page.id)) {
            problems.push(`page ${JSON.stringify(page.label)} ${problem}`);
        }
        for (const tab of tabsOf(page.workbench.root)) {
            if (instances.has(tab.id)) {
                problems.push(`instance ${JSON.stringify(tab.id)} is on two pages`);
            }
            instances.add(tab.id);
        }
    }
    if (!ids.has(pages.current)) {
        problems.push(`current is ${JSON.stringify(pages.current)}, which is not a page`);
    }
    problems.push(...checkFloats(pages.floats, ids, instances));
    return problems;
}

/**
 * Every violation in the floats beside the pages: an id that is a page's or another float's, a pane
 * that is not one pane of at least one tab, a tab a page or another float holds too, a place that
 * does not fit the window, and a second float on one edge.
 */
function checkFloats(floats: Float[], pageIds: Set<string>, tabIds: Set<string>): string[] {
    const problems: string[] = [];
    const floatIds = new Set<string>();
    const edges = new Set<string>();
    for (const float of floats) {
        const name = JSON.stringify(float.id);
        if (float.id === '') problems.push('a float has an empty id');
        if (pageIds.has(float.id)) problems.push(`float id ${name} is also a page id`);
        if (floatIds.has(float.id)) problems.push(`float id ${name} is used twice`);
        floatIds.add(float.id);
        problems.push(...checkFloatPane(float, tabIds));
        if (!placeFits(float.place)) problems.push(`float ${name} has a place that does not fit`);
        if (float.place.kind === 'dock') {
            if (edges.has(float.place.edge)) {
                problems.push(`two floats are docked on the ${float.place.edge} edge`);
            }
            edges.add(float.place.edge);
        }
    }
    return problems;
}

/** The violations in one float's pane, and its tab ids added to the ones the layout holds. */
function checkFloatPane(float: Float, tabIds: Set<string>): string[] {
    const problems: string[] = [];
    readTree(float.pane, `float ${JSON.stringify(float.id)}`, problems, new Set<string>());
    if (float.pane.tabs.length === 0) {
        problems.push(`float ${JSON.stringify(float.id)} holds no tab`);
    }
    for (const tab of float.pane.tabs) {
        if (tabIds.has(tab.id)) {
            problems.push(`instance ${JSON.stringify(tab.id)} is held by a float and another host`);
        }
        tabIds.add(tab.id);
    }
    return problems;
}

/** Wrap the pages in the versioned JSON envelope stored by the browser. */
export function serialiseLayout(pages: Pages): string {
    return JSON.stringify({
        version: LAYOUT_VERSION,
        pages: pages.pages,
        current: pages.current,
        floats: pages.floats
    });
}

/**
 * The pages in the envelope of the version before floats, for a layout read from one that has not
 * yet taken the shipped floats in: it holds the pages and nothing else, as it was read.
 */
export function serialiseFloatless(pages: Pages): string {
    return JSON.stringify({
        version: FLOATLESS_VERSION,
        pages: pages.pages,
        current: pages.current
    });
}

/**
 * Whether a saved envelope was written before floats: the layout holds none, so the shipped floats
 * are still to be taken in by the store that loaded it.
 */
export function needsFloats(value: unknown): boolean {
    const version = asEnvelope(value)?.version;
    return typeof version === 'number' && version < LAYOUT_VERSION;
}

/**
 * Read valid pages from the current envelope, or from either supported older one by migration: a
 * page that held two trees and a docked panel becomes a page holding one tree. A page is read as
 * its id, label, tree and rail key; any other field a saved page carries is dropped, so the next
 * save writes it no more.
 */
export function parseLayout(value: unknown, label: string): Pages | null {
    const envelope = asEnvelope(value);
    if (envelope === null) return null;
    if (envelope.version === WORKBENCH_VERSION) {
        const only = readDockedWorkbench(envelope.workbench);
        return only === null
            ? null
            : defaultPagesOf(newPage(label, { ...only, root: treeWithoutConfig(only.root) }));
    }
    const version = envelope.version;
    if (version !== LAYOUT_VERSION && version !== FLOATLESS_VERSION && version !== PAGES_VERSION) {
        return null;
    }
    const held = readAs(pagesEnvelopeShape, envelope);
    if (held === null) return null;
    const { current } = held;
    const pages: Page[] = [];
    for (const raw of held.pages) {
        const entry = readAs(savedPageShape, raw);
        if (entry === null) return null;
        const workbench =
            version === PAGES_VERSION
                ? readDockedWorkbench(entry.workbench)
                : readWorkbench(entry.workbench);
        if (workbench === null) return null;
        const page: Page = { id: entry.id, label: entry.label, workbench };
        const rail = railKey(entry.rail, pages);
        if (rail !== null) page.rail = rail;
        pages.push(page);
    }
    // A saved info page is folded into the views page, which takes the System label (fold.ts), and
    // a `config` tab becomes a `settings` tab (migrate.ts); a leaf naming a page this envelope does
    // not hold, or one that would make a page show itself, then becomes an empty pane: the rest of
    // the arrangement is still the one the viewer left.
    const floats = version === LAYOUT_VERSION ? readFloats(held.floats, pages) : [];
    const migrated = withSystemLabel(withInfoFolded(withoutConfigTabs({ pages, current, floats })));
    const read: Pages = settlePageLeaves(migrated);
    return checkPages(read).length === 0 ? read : null;
}

/**
 * The floats of a saved envelope: a value that is not a list holds none, and a float that does not
 * add up is dropped with the rest kept. A float is dropped for an id that is a page's or an earlier
 * float's, a pane that is not one pane of at least one tab, a tab id the pages or an earlier float
 * hold, a place that does not fit the window, and an edge an earlier float is docked on.
 */
function readFloats(value: unknown, pages: Page[]): Float[] {
    const listed = readAs(listShape, value) ?? [];
    const floats: Float[] = [];
    const ids = new Set(pages.map((page) => page.id));
    const tabs = new Set(pages.flatMap((page) => tabsOf(page.workbench.root).map((tab) => tab.id)));
    for (const raw of listed) {
        const float = readFloat(raw, ids, tabs, floats);
        if (float === null) continue;
        floats.push(float);
        ids.add(float.id);
        for (const tab of float.pane.tabs) tabs.add(tab.id);
    }
    return floats;
}

/** One saved float, or null for one that does not add up against what is already held. */
function readFloat(
    raw: unknown,
    ids: Set<string>,
    tabs: Set<string>,
    earlier: Float[]
): Float | null {
    const held = readAs(savedFloatShape, raw);
    const place = readAs(placeShape, held?.place);
    if (held === null || place === null || ids.has(held.id) || !placeFits(place)) return null;
    if (place.kind === 'dock' && earlier.some((one) => dockedOn(one, place.edge))) return null;
    const problems: string[] = [];
    const own = new Set(tabs);
    const pane = readNode(held.pane, [], problems, own);
    if (pane?.kind !== 'pane' || pane.tabs.length === 0 || problems.length > 0) {
        return null;
    }
    return { id: held.id, pane, place };
}

/** Whether a float is docked on this edge. */
function dockedOn(float: Float, edge: string): boolean {
    return float.place.kind === 'dock' && float.place.edge === edge;
}

/**
 * The rail key a saved page carries, or null for none. A key that is not a non-empty string, or one
 * an earlier page already carries, is read as none: one rail button is one page, and the later of
 * two becomes a page of its own rather than a second page behind the same button.
 */
function railKey(value: string | undefined, earlier: Page[]): string | null {
    if (value === undefined) return null;
    return earlier.some((page) => page.rail === value) ? null : value;
}

/** Make a one-page collection from a supported one-workbench envelope. */
function defaultPagesOf(page: Page): Pages {
    return { pages: [page], current: page.id, floats: [] };
}

/** Read an envelope object, parsing JSON when needed. */
function asEnvelope(value: unknown): Record<string, unknown> | null {
    return readAs(envelopeShape, value);
}

/** Read one workbench from the envelope a browser held before a page was one tree. */
export function parseWorkbench(value: unknown): Workbench | null {
    const envelope = asEnvelope(value);
    if (envelope?.version !== WORKBENCH_VERSION) return null;
    return readDockedWorkbench(envelope.workbench);
}

/** Read one saved workbench after its envelope has been removed. */
function readWorkbench(value: unknown): Workbench | null {
    const held = readAs(workbenchShape, value);
    if (held === null) return null;
    const problems: string[] = [];
    const root = readTree(held.root, 'root', problems, new Set<string>());
    if (root === null || problems.length > 0) return null;
    const workbench: Workbench = { root };
    const focus = readAs(focusShape, held.focus);
    return focus === null ? workbench : settleFocus({ ...workbench, focus: { path: focus.path } });
}

/**
 * One saved workbench of two trees as one tree. A panel holding no tab at all is dropped and the
 * main area is the root; otherwise the root is a split of the two, a row for a panel on the right
 * and a column for one along the bottom, at the shares the panel had. A hidden panel that still
 * holds tabs is that same split with the panel child folded, so no tab is lost; a pane maximised
 * inside that hidden panel is not carried, since a folded child cannot be the one shown alone.
 */
function readDockedWorkbench(value: unknown): Workbench | null {
    const saved = readAs(dockedShape, value);
    if (saved === null) return null;
    const { dock } = saved;
    const problems: string[] = [];
    const ids = new Set<string>();
    const main = readTree(saved.main, 'main', problems, ids);
    const panel = readTree(saved.panel, 'panel', problems, ids);
    if (main === null || panel === null || problems.length > 0) return null;
    const held = tabsOf(panel).length > 0;
    const focus = readAs(dockedFocusShape, saved.focus);
    if (!held) {
        const only: Workbench = { root: main };
        const inMain = focus !== null && focus.target === 'main';
        return settleFocus(inMain ? { ...only, focus: { path: focus.path } } : only);
    }
    const size = saved.panelSize;
    const split: Layout = {
        kind: 'split',
        dir: dock === 'bottom' ? 'col' : 'row',
        sizes: normaliseSizes([1 - size, size]),
        children: [main, panel]
    };
    if (dock === 'hidden') split.folded = [1];
    const workbench: Workbench = { root: split };
    if (focus === null || (dock === 'hidden' && focus.target === 'panel')) return workbench;
    const at = focus.target === 'main' ? 0 : 1;
    return settleFocus({ ...workbench, focus: { path: [at, ...focus.path] } });
}

/** Read one saved tree and prefix its violations with the tree name. */
function readTree(
    value: unknown,
    which: string,
    problems: string[],
    ids: Set<string>
): Layout | null {
    const found: string[] = [];
    const tree = readNode(value, [], found, ids);
    for (const problem of found) problems.push(`${which} ${problem}`);
    return tree;
}
