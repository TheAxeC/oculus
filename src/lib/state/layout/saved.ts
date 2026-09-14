// Layer 2, client state. Layout invariants and saved-form parsing live here because changes to the
// persisted shape do not change workbench operations.

import { panes } from '../instance.ts';
import {
    LAYOUT_VERSION,
    MIN_SIZE,
    PANEL_MAX,
    PANEL_MIN,
    WORKBENCH_VERSION,
    isRecord,
    newPage,
    show,
    type Dock,
    type Focus,
    type Instance,
    type Layout,
    type Page,
    type Pages,
    type Workbench
} from './model.ts';
import { focusedPane, settleFocus } from './workbench.ts';

const SUM_EPS = 1e-6;
const EPS = 1e-9;

/** Every violation in a tree, and an empty array for a tree the shell can render. */
export function checkLayout(layout: Layout): string[] {
    const problems: string[] = [];
    readNode(layout, [], problems, new Set());
    return problems;
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
    problems.push(`${where}: kind is ${JSON.stringify(value.kind)}, not split or pane`);
    return null;
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
    return { kind: 'split', dir, sizes, children };
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
        tabs.push({ id: raw.id, view: raw.view, state: raw.state });
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

/** Where the panel may sit in a saved workbench. */
export const DOCKS: Dock[] = ['right', 'bottom', 'hidden'];

/** Every violation in a whole workbench, including ids shared by its two trees. */
export function checkWorkbench(workbench: Workbench): string[] {
    const problems: string[] = [];
    const ids = new Set<string>();
    readTree(workbench.main, 'main', problems, ids);
    readTree(workbench.panel, 'panel', problems, ids);
    if (!DOCKS.includes(workbench.dock)) {
        problems.push(`dock is ${JSON.stringify(workbench.dock)}, not right, bottom or hidden`);
    }
    if (workbench.panelSize < PANEL_MIN || workbench.panelSize > PANEL_MAX) {
        problems.push(`panelSize is ${workbench.panelSize}, outside ${PANEL_MIN} to ${PANEL_MAX}`);
    }
    const focus = workbench.focus;
    if (focus !== undefined && focusedPane(workbench) === null) {
        problems.push(`focus names ${focus.target} ${show(focus.path)}, which is not a pane`);
    }
    return problems;
}

/** Every violation in the page collection and its workbenches. */
export function checkPages(pages: Pages): string[] {
    const problems: string[] = [];
    if (pages.pages.length === 0) problems.push('no page');
    const ids = new Set<string>();
    const instances = new Set<string>();
    for (const page of pages.pages) {
        if (ids.has(page.id)) problems.push(`page id ${JSON.stringify(page.id)} is used twice`);
        ids.add(page.id);
        for (const problem of checkWorkbench(page.workbench)) {
            problems.push(`page ${JSON.stringify(page.label)} ${problem}`);
        }
        for (const { pane } of [...panes(page.workbench.main), ...panes(page.workbench.panel)]) {
            for (const tab of pane.tabs) {
                if (instances.has(tab.id)) {
                    problems.push(`instance ${JSON.stringify(tab.id)} is on two pages`);
                }
                instances.add(tab.id);
            }
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

/** Read valid pages from the current envelope or the supported one-workbench envelope. */
export function parseLayout(value: unknown, label: string): Pages | null {
    const envelope = asEnvelope(value);
    if (envelope === null) return null;
    if (envelope.version === WORKBENCH_VERSION) {
        const only = readWorkbench(envelope.workbench);
        return only === null ? null : defaultPagesOf(newPage(label, only));
    }
    if (envelope.version !== LAYOUT_VERSION) return null;
    const saved = envelope.pages;
    const current = envelope.current;
    if (!Array.isArray(saved) || typeof current !== 'string') return null;
    const pages: Page[] = [];
    for (const entry of saved) {
        if (!isRecord(entry)) return null;
        if (typeof entry.id !== 'string' || typeof entry.label !== 'string') return null;
        const workbench = readWorkbench(entry.workbench);
        if (workbench === null) return null;
        pages.push({ id: entry.id, label: entry.label, workbench });
    }
    const read: Pages = { pages, current };
    return checkPages(read).length === 0 ? read : null;
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

/** Read one valid workbench from its versioned envelope. */
export function parseWorkbench(value: unknown): Workbench | null {
    const envelope = asEnvelope(value);
    if (envelope === null || envelope.version !== WORKBENCH_VERSION) return null;
    return readWorkbench(envelope.workbench);
}

/** Read one saved workbench after its envelope has been removed. */
function readWorkbench(value: unknown): Workbench | null {
    if (!isRecord(value)) return null;
    const problems: string[] = [];
    const ids = new Set<string>();
    const main = readTree(value.main, 'main', problems, ids);
    const panel = readTree(value.panel, 'panel', problems, ids);
    const dock = value.dock;
    if (typeof dock !== 'string' || !DOCKS.includes(dock as Dock)) return null;
    const panelSize = value.panelSize;
    if (typeof panelSize !== 'number' || !Number.isFinite(panelSize)) return null;
    if (panelSize < PANEL_MIN || panelSize > PANEL_MAX) return null;
    if (main === null || panel === null || problems.length > 0) return null;
    const workbench: Workbench = { main, panel, dock: dock as Dock, panelSize };
    const focus = readFocus(value.focus);
    return focus === null ? workbench : settleFocus({ ...workbench, focus });
}

/** Read a saved focus when it names one tree and a non-negative integer path. */
function readFocus(value: unknown): Focus | null {
    if (!isRecord(value)) return null;
    const target = value.target;
    if (target !== 'main' && target !== 'panel') return null;
    const path = value.path;
    if (!Array.isArray(path)) return null;
    if (!path.every((step) => typeof step === 'number' && Number.isInteger(step) && step >= 0)) {
        return null;
    }
    return { target, path: path as number[] };
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
