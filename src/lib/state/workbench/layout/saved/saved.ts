// Layer 2, client state. Layout invariants and saved-form parsing live here because changes to the
// persisted shape do not change workbench operations.

import { tabsOf } from '../instance.ts';
import {
    LAYOUT_VERSION,
    MIN_SIZE,
    PAGES_VERSION,
    WORKBENCH_VERSION,
    isRecord,
    newPage,
    pageLeaf,
    show,
    type Instance,
    type Layout,
    type Page,
    type Pages,
    type Workbench
} from '../model.ts';
import { refusedLeaves, settlePageLeaves, type Refusal } from '../nested.ts';
import { normaliseSizes } from '../tree.ts';
import { focusedPane, settleFocus } from '../workbench.ts';

const SUM_EPS = 1e-6;
const EPS = 1e-9;

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
    if (!isRecord(value)) {
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
    const page = value.page;
    if (typeof page !== 'string' || page === '') {
        problems.push(`${where}: page is ${JSON.stringify(page)}, which names no page`);
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
    const dir = value.dir;
    if (dir !== 'row' && dir !== 'col') {
        problems.push(`${where}: dir is ${JSON.stringify(dir)}, not row or col`);
        return null;
    }
    const rawChildren = value.children;
    if (!Array.isArray(rawChildren)) {
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
    const rawSizes = value.sizes;
    const numbers =
        Array.isArray(rawSizes) &&
        rawSizes.every((size) => typeof size === 'number' && Number.isFinite(size));
    if (!numbers) {
        problems.push(`${where}: sizes is not an array of numbers`);
        return null;
    }
    const sizes = rawSizes as number[];
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
    if (!Array.isArray(value)) {
        problems.push(`${where}: folded is not an array`);
        return null;
    }
    const folded: number[] = [];
    for (const index of value) {
        if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= count) {
            problems.push(`${where}: folded names ${JSON.stringify(index)}, which is not a child`);
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
    const rawTabs = value.tabs;
    if (!Array.isArray(rawTabs)) {
        problems.push(`${where}: tabs is not an array`);
        return null;
    }
    const tabs: Instance[] = [];
    for (const [index, raw] of rawTabs.entries()) {
        if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id === '') {
            problems.push(`${where}: tab ${index} has no id`);
            return null;
        }
        if (typeof raw.view !== 'string') {
            problems.push(`${where}: tab ${index} has no view`);
            return null;
        }
        if (ids.has(raw.id))
            problems.push(`${where}: tab ${index} repeats the instance id ${raw.id}`);
        ids.add(raw.id);
        const tab: Instance = { id: raw.id, view: raw.view, state: raw.state };
        // The flag is optional, so a layout saved before there were preview tabs reads as one whose
        // tabs are all kept, and a reader who left one open finds it as it was.
        if (raw.preview === true) tab.preview = true;
        tabs.push(tab);
    }
    const active = value.active;
    if (typeof active !== 'string') {
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
    return { kind: 'pane', tabs, active };
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
    return problems;
}

/** Wrap the pages in the versioned JSON envelope stored by the browser. */
export function serialiseLayout(pages: Pages): string {
    return JSON.stringify({ version: LAYOUT_VERSION, pages: pages.pages, current: pages.current });
}

/**
 * Read valid pages from the current envelope, or from either supported older one by migration: a
 * page that held two trees and a docked panel becomes a page holding one tree.
 */
export function parseLayout(value: unknown, label: string): Pages | null {
    const envelope = asEnvelope(value);
    if (envelope === null) return null;
    if (envelope.version === WORKBENCH_VERSION) {
        const only = readDockedWorkbench(envelope.workbench);
        return only === null ? null : defaultPagesOf(newPage(label, only));
    }
    const version = envelope.version;
    if (version !== LAYOUT_VERSION && version !== PAGES_VERSION) return null;
    const saved = envelope.pages;
    const current = envelope.current;
    if (!Array.isArray(saved) || typeof current !== 'string') return null;
    const pages: Page[] = [];
    for (const entry of saved) {
        if (!isRecord(entry)) return null;
        if (typeof entry.id !== 'string' || typeof entry.label !== 'string') return null;
        const workbench =
            version === LAYOUT_VERSION
                ? readWorkbench(entry.workbench)
                : readDockedWorkbench(entry.workbench);
        if (workbench === null) return null;
        const page: Page = { id: entry.id, label: entry.label, workbench };
        const rail = railKey(entry.rail, pages);
        if (rail !== null) page.rail = rail;
        pages.push(page);
    }
    // A leaf naming a page this envelope does not hold, or one that would make a page show itself,
    // becomes an empty pane: the rest of the arrangement is still the one the viewer left.
    const read: Pages = settlePageLeaves({ pages, current });
    return checkPages(read).length === 0 ? read : null;
}

/**
 * The rail key a saved page carries, or null for none. A key that is not a non-empty string, or one
 * an earlier page already carries, is read as none: one rail button is one page, and the later of
 * two becomes a page of its own rather than a second page behind the same button.
 */
function railKey(value: unknown, earlier: Page[]): string | null {
    if (typeof value !== 'string' || value === '') return null;
    return earlier.some((page) => page.rail === value) ? null : value;
}

/** Make a one-page collection from a supported one-workbench envelope. */
function defaultPagesOf(page: Page): Pages {
    return { pages: [page], current: page.id };
}

/** Read an envelope object, parsing JSON when needed. */
function asEnvelope(value: unknown): Record<string, unknown> | null {
    let envelope: unknown = value;
    if (typeof envelope === 'string') {
        try {
            envelope = JSON.parse(envelope);
        } catch {
            return null;
        }
    }
    return isRecord(envelope) ? envelope : null;
}

/** Read one workbench from the envelope a browser held before a page was one tree. */
export function parseWorkbench(value: unknown): Workbench | null {
    const envelope = asEnvelope(value);
    if (envelope?.version !== WORKBENCH_VERSION) return null;
    return readDockedWorkbench(envelope.workbench);
}

/** Read one saved workbench after its envelope has been removed. */
function readWorkbench(value: unknown): Workbench | null {
    if (!isRecord(value)) return null;
    const problems: string[] = [];
    const root = readTree(value.root, 'root', problems, new Set<string>());
    if (root === null || problems.length > 0) return null;
    const workbench: Workbench = { root };
    const focus = readPath(value.focus);
    return focus === null ? workbench : settleFocus({ ...workbench, focus: { path: focus } });
}

/** The share of the window a saved panel took when its own share cannot be read. */
const PANEL_SHARE = 0.3;

/**
 * One saved workbench of two trees as one tree. A panel holding no tab at all is dropped and the
 * main area is the root; otherwise the root is a split of the two, a row for a panel on the right
 * and a column for one along the bottom, at the shares the panel had. A hidden panel that still
 * holds tabs is that same split with the panel child folded, so no tab is lost; a pane maximised
 * inside that hidden panel is not carried, since a folded child cannot be the one shown alone.
 */
function readDockedWorkbench(value: unknown): Workbench | null {
    if (!isRecord(value)) return null;
    const problems: string[] = [];
    const ids = new Set<string>();
    const main = readTree(value.main, 'main', problems, ids);
    const panel = readTree(value.panel, 'panel', problems, ids);
    const dock = value.dock;
    if (dock !== 'right' && dock !== 'bottom' && dock !== 'hidden') return null;
    if (main === null || panel === null || problems.length > 0) return null;
    const held = tabsOf(panel).length > 0;
    const focus = readDockedFocus(value.focus);
    if (!held) {
        const only: Workbench = { root: main };
        const inMain = focus !== null && focus.target === 'main';
        return settleFocus(inMain ? { ...only, focus: { path: focus.path } } : only);
    }
    const share = value.panelSize;
    const size = typeof share === 'number' && Number.isFinite(share) ? share : PANEL_SHARE;
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

/** A saved focus of two trees: which tree it named and the path inside it. */
function readDockedFocus(value: unknown): { target: 'main' | 'panel'; path: number[] } | null {
    if (!isRecord(value)) return null;
    const target = value.target;
    if (target !== 'main' && target !== 'panel') return null;
    const path = readPath(value);
    return path === null ? null : { target, path };
}

/** A saved focus path: a list of whole, non-negative steps. */
function readPath(value: unknown): number[] | null {
    if (!isRecord(value)) return null;
    const path = value.path;
    if (!Array.isArray(path)) return null;
    if (!path.every((step) => typeof step === 'number' && Number.isInteger(step) && step >= 0)) {
        return null;
    }
    return path as number[];
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
