// Layer 4, test fixture. Readers and builders for the saved-arrangement refusal suites: a tree,
// a workbench or a page list as one line of text, and envelopes of the version two and four with
// the fields handed in laid over them. Nothing here touches localStorage or the DOM.

import {
    LAYOUT_VERSION,
    WORKBENCH_VERSION,
    checkLayout,
    parseLayout,
    parseWorkbench,
    type Layout,
    type Pages,
    type Workbench
} from '../../../../../../src/lib/state/workbench/layout/index.ts';
import { docked, pane, split } from '../../layout-fixture.ts';

/** A tab's state as text: nothing for null, `:undefined` for an absent one, else its JSON. */
export const stateText = (state: unknown): string =>
    state === null ? '' : state === undefined ? ':undefined' : `:${JSON.stringify(state)}`;

/** A tree as one line: a split as direction, sizes and folded children, a pane as its tabs. */
export function treeText(node: Layout): string {
    if (node.kind === 'page') return `page ${node.page}`;
    if (node.kind === 'split') {
        const folded = node.folded === undefined ? '' : ` folded ${node.folded.join(',')}`;
        return `${node.dir} ${node.sizes.join(',')}${folded} (${node.children.map(treeText).join(' | ')})`;
    }
    const tabs = node.tabs.map(
        (tab) => `${tab.id}/${tab.view}${tab.preview === true ? '~' : ''}${stateText(tab.state)}`
    );
    return `[${tabs.join(' ')}]@${node.active}`;
}

/** A workbench as one line: its tree, and the path of its focus when it has one. */
export const benchText = (workbench: Workbench): string =>
    `${treeText(workbench.root)}${workbench.focus === undefined ? '' : ` focus [${workbench.focus.path.join(',')}]`}`;

/** The ids a page minted for an envelope that carries none. */
export const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;

/** Pages as one line: each page's id, label, rail key and workbench, then the current page. */
export function pagesText(read: Pages | null): string {
    if (read === null) return 'null';
    const pages = read.pages.map((page) => {
        const rail = page.rail === undefined ? '' : ` rail ${page.rail}`;
        return `${page.id}=${page.label}${rail}: ${benchText(page.workbench)}`;
    });
    return `${pages.join(' ; ')} current ${read.current}`.replace(UUID, '<uuid>');
}

/** The sentences checkLayout says about a value taken for a tree. */
export const problems = (value: unknown, known?: Pages, host?: string): string[] =>
    checkLayout(value as Layout, known, host);

/** A split of two panes, with the fields handed in laid over it. */
export const splitOf = (over: Record<string, unknown> = {}): unknown => ({
    ...split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]),
    ...over
});

/** A pane holding one tab, with the fields handed in laid over it. */
export const paneOf = (over: Record<string, unknown> = {}): unknown => ({
    kind: 'pane',
    tabs: [{ id: 'a', view: 'v', state: null }],
    active: 'a',
    ...over
});

/** A pane whose one tab has the fields handed in laid over it. */
export const tabOf = (over: Record<string, unknown>): unknown =>
    paneOf({ tabs: [{ id: 'a', view: 'v', state: null, ...over }] });

/** The pages of a list, each a page of one pane. */
export const pagesOf = (...held: Record<string, unknown>[]): Pages => ({
    pages: held.map((page, at) => ({
        id: `p${at}`,
        label: `Page ${at}`,
        workbench: { root: pane([`t${at}`]) },
        ...page
    })),
    current: 'p0',
    floats: []
});

/** A version 4 envelope of one page, with the fields handed in laid over it. */
export const envelopeOf = (over: Record<string, unknown> = {}): unknown => ({
    version: LAYOUT_VERSION,
    pages: [{ id: 'p', label: 'P', workbench: { root: pane(['a']) } }],
    current: 'p',
    ...over
});

/** A version 4 envelope whose one page holds the workbench handed in. */
export const holding = (workbench: unknown): unknown =>
    envelopeOf({ pages: [{ id: 'p', label: 'P', workbench }] });

/** What parseLayout makes of a value, as one line. */
export const parsed = (value: unknown): string => pagesText(parseLayout(value, 'Label'));

/** The first page parseLayout reads from an envelope. */
export const firstPage = (value: unknown) => parseLayout(value, 'Label')?.pages[0];

/** What parseWorkbench makes of a value, as one line. */
export const parsedBench = (value: unknown): string => {
    const read = parseWorkbench(value);
    return read === null ? 'null' : benchText(read);
};

/** A version 2 envelope over a two-tree workbench with the fields handed in laid over it. */
export const dockedOf = (over: Record<string, unknown> = {}): unknown => ({
    version: WORKBENCH_VERSION,
    workbench: { ...docked(pane(['a']), pane(['b'])), ...over }
});

/** A page of one pane, with the fields handed in laid over it. */
export const pageWith = (over: Record<string, unknown>): unknown => ({
    id: 'p',
    label: 'P',
    workbench: { root: pane(['a']) },
    ...over
});
