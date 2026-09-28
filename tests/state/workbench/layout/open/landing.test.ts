// Layer 2, client state tests. Where a view opened for something lands: the pane that last received
// one, the reader's own pane when it already holds such tabs, an empty pane, a pane of documents
// alone, and a new pane to the right of the reader's, with a pane of tool views never taking one
// unasked. The rule is checked on trees built by hand, and then through the store, where the
// registry says which views are opened for something.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    landingFor,
    type Landing
} from '../../../../../src/lib/state/workbench/layout/open/landing.ts';
import {
    panes,
    type Instance,
    type Layout
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { registerAll } from '../../../../../src/routes/views.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';

/** The views these cases treat as opened for something; every other view is a tool view. */
const OPENED = new Set(['project', 'source', 'doc']);

const opened = (view: string): boolean => OPENED.has(view);

function tab(id: string, view: string): Instance {
    return { id, view, state: { id } };
}

function pane(...tabs: Instance[]): Layout {
    return { kind: 'pane', tabs, active: tabs.at(0)?.id ?? '' };
}

function row(...children: Layout[]): Layout {
    return {
        kind: 'split',
        dir: 'row',
        sizes: children.map(() => 1 / children.length),
        children
    };
}

describe('landingFor', () => {
    const tools = pane(tab('f', 'files'), tab('r', 'repositories'));

    it('lands in the pane that last received such a tab while one of them is still there', () => {
        const tree = row(tools, pane(tab('p1', 'project')), pane(tab('p2', 'project')));
        const landing: Landing = landingFor(tree, opened, ['p1', 'p2'], [0]);
        expect(landing).toEqual({ kind: 'pane', path: [2] });
        // A received tab that has gone is passed over for the one before it.
        expect(landingFor(tree, opened, ['p2', 'gone'], [0])).toEqual({ kind: 'pane', path: [2] });
    });

    it('lands in an empty pane when no received pane is left, before a pane of documents', () => {
        const tree = row(tools, pane(tab('p1', 'project')), pane());
        expect(landingFor(tree, opened, [], [0])).toEqual({ kind: 'pane', path: [2] });
    });

    it('splits a new pane to the right of the reader when no pane may take it', () => {
        const tree = row(tools, pane(tab('c', 'calendar')));
        expect(landingFor(tree, opened, [], [1])).toEqual({ kind: 'split', path: [1] });
    });

    it('never lands in a pane of tool views, even one that received a tab, unless the reader is there', () => {
        const mixed = pane(tab('f', 'files'), tab('p1', 'project'));
        const tree = row(mixed, pane(tab('c', 'calendar')));
        expect(landingFor(tree, opened, ['p1'], [1])).toEqual({ kind: 'split', path: [1] });
        // The reader in that pane, which already holds an opened tab, keeps it there.
        expect(landingFor(tree, opened, ['p1'], [0])).toEqual({ kind: 'pane', path: [0] });
        // The reader in a pane of tool views alone never makes it a place for documents.
        expect(landingFor(row(tools, pane(tab('c', 'calendar'))), opened, [], [0])).toEqual({
            kind: 'split',
            path: [0]
        });
    });

    it("takes the reader's own pane when it already holds opened tabs, before an empty pane", () => {
        const tree = row(pane(tab('s', 'status'), tab('d', 'doc')), pane());
        expect(landingFor(tree, opened, [], [0])).toEqual({ kind: 'pane', path: [0] });
    });

    it('takes a pane of documents alone when nothing was received, as after a reload', () => {
        const tree = row(tools, pane(tab('p1', 'project')));
        expect(landingFor(tree, opened, [], [0])).toEqual({ kind: 'pane', path: [1] });
    });
});

describe('the store', () => {
    let client: ClientState;
    let apply: ClientState['layout']['apply'];
    let layout: ClientState['layout']['layout'];
    let openView: ClientState['layout']['openView'];
    let openBeside: ClientState['layout']['openBeside'];
    let activateInstance: ClientState['layout']['activateInstance'];
    let closeInstance: ClientState['layout']['closeInstance'];
    let maximisePane: ClientState['layout']['maximisePane'];
    let focused: ClientState['layout']['focused'];

    beforeEach(() => {
        client = createClientState();
        ({
            activateInstance,
            apply,
            closeInstance,
            focused,
            layout,
            maximisePane,
            openBeside,
            openView
        } = client.layout);
        client.layout.registerOpened(opened);
    });

    /** Every pane's views, in tree order. */
    function shape(): string[][] {
        return panes(layout()).map(({ pane: node }) => node.tabs.map((one) => one.view));
    }

    it('opens a document in the empty pane beside the tools, and the next one there too', () => {
        apply({ root: row(pane(tab('f', 'files'), tab('r', 'repositories')), pane()) });
        activateInstance('f');
        openView('project', { id: 'one' });
        openBeside('source', { id: 'two' });
        expect(shape()).toEqual([
            ['files', 'repositories'],
            ['project', 'source']
        ]);
    });

    it('splits one pane to the right of the reader, and lands the later ones in it', () => {
        apply({ root: row(pane(tab('c', 'calendar')), pane(tab('s', 'status'))) });
        activateInstance('c');
        openView('project', { id: 'one' });
        expect(shape()).toEqual([['calendar'], ['project'], ['status']]);
        // An empty pane added after it does not draw the next one away from the pane that received.
        const root = layout();
        if (root.kind !== 'split') throw new Error('the page is one split of three panes');
        apply({
            root: { ...root, sizes: [0.25, 0.25, 0.25, 0.25], children: [...root.children, pane()] }
        });
        activateInstance('s');
        openView('project', { id: 'two' });
        expect(shape()).toEqual([['calendar'], ['project', 'project'], ['status'], []]);
    });

    it('leaves a tool view where it lands today, in the pane the reader is in', () => {
        apply({ root: row(pane(tab('c', 'calendar')), pane()) });
        activateInstance('c');
        openView('project', { id: 'one' });
        activateInstance('c');
        openView('status');
        expect(shape()).toEqual([['calendar', 'status'], ['project']]);
    });

    it('activates a document already open where it is, whichever pane the reader is in', () => {
        apply({ root: row(pane(tab('c', 'calendar')), pane(tab('one', 'project'))) });
        activateInstance('c');
        expect(openView('project', { id: 'one' })).toBe('one');
        expect(shape()).toEqual([['calendar'], ['project']]);
    });

    it('gives the panes back before a document lands outside a maximised pane of tools', () => {
        apply({ root: row(pane(tab('c', 'calendar')), pane()) });
        maximisePane([0]);
        openView('project', { id: 'one' });
        expect(focused()).toBe(null);
        expect(shape()).toEqual([['calendar'], ['project']]);
    });

    it('lands a new pane once its received tabs are all closed, rather than a tool pane', () => {
        apply({ root: row(pane(tab('c', 'calendar')), pane(tab('s', 'status'))) });
        activateInstance('c');
        const first = openView('project', { id: 'one' });
        closeInstance(first);
        activateInstance('s');
        openView('project', { id: 'two' });
        expect(shape()).toEqual([['calendar'], ['status'], ['project']]);
    });

    it('replaces the preview tab of the pane a document lands in, rather than adding one', () => {
        apply({ root: row(pane(tab('f', 'files')), pane()) });
        activateInstance('f');
        const first = openView('source', { id: 'a' }, undefined, { preview: true });
        activateInstance('f');
        const second = openView('source', { id: 'b' }, undefined, { preview: true });
        expect(second).toBe(first);
        expect(shape()).toEqual([['files'], ['source']]);
    });

    it('reads which views are opened for something from the registry', () => {
        const real = createClientState();
        registerAll(real.registry);
        real.layout.apply({ root: row(pane(tab('f', 'files')), pane()) });
        real.layout.activateInstance('f');
        real.layout.openView('project', { id: 'one', label: 'One' });
        real.layout.activateInstance('f');
        real.layout.openView('status');
        expect(
            panes(real.layout.layout()).map(({ pane: node }) => node.tabs.map((one) => one.view))
        ).toEqual([['files', 'status'], ['project']]);
    });
});
