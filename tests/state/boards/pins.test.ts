// Layer 2, client state tests. Layout pins live on the instance, identify one tab per session and can be
// replaced in place without moving the tab or changing another tree.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    findView,
    panes,
    stateId,
    type Instance
} from '../../../src/lib/state/workbench/layout/index.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let activateInstance: ClientState['layout']['activateInstance'];
let apply: ClientState['layout']['apply'];
let instanceLayoutState: ClientState['layout']['instanceLayoutState'];
let layout: ClientState['layout']['layout'];
let openView: ClientState['layout']['openView'];
let pinInstance: ClientState['layout']['pinInstance'];
let restateInstance: ClientState['layout']['restateInstance'];
let unpinInstance: ClientState['layout']['unpinInstance'];

beforeEach(() => {
    client = createClientState();
    ({
        activateInstance,
        apply,
        instanceLayoutState,
        layout,
        openView,
        pinInstance,
        restateInstance,
        unpinInstance
    } = client.layout);
});

/** One pane holding the instances a case names, as the whole of the page's tree. */
function show(instances: Instance[]): void {
    apply({ root: { kind: 'pane', tabs: instances, active: instances[0]?.id ?? '' } });
}

describe('layout instance pins', () => {
    it.each(['session-detail', 'transcript', 'timeline', 'changes', 'agents', 'terminal'])(
        'pins and unpins a %s instance in place',
        (view) => {
            show([
                { id: 'following', view, state: {} },
                { id: 'caller', view, state: {} }
            ]);
            const session = view === 'terminal' ? 'a1b2c3-shell' : 'one';
            pinInstance('caller', session, 'One');
            expect(instanceLayoutState('caller')).toEqual({ session, label: 'One' });
            expect(instanceLayoutState('following')).toEqual({});

            unpinInstance('caller');
            expect(instanceLayoutState('caller')).toEqual({});
            expect(panes(layout()).flatMap(({ pane }) => pane.tabs.map((tab) => tab.id))).toEqual([
                'following',
                'caller'
            ]);
        }
    );

    it.each([0, 1])(
        'activates the pin in pane %i and preserves the caller on a collision',
        (at) => {
            const pinned: Instance = {
                id: 'pinned',
                view: 'session-detail',
                state: { session: 'one', label: 'Existing' }
            };
            const caller: Instance = { id: 'caller', view: 'session-detail', state: {} };
            const panesOf = [0, 1].map((index) => ({
                kind: 'pane' as const,
                tabs: [
                    ...(index === at ? [pinned] : [caller]),
                    { id: `other-${index}`, view: 'timeline', state: {} }
                ],
                active: `other-${index}`
            }));
            apply({ root: { kind: 'split', dir: 'row', sizes: [0.5, 0.5], children: panesOf } });
            pinInstance('caller', 'one', 'New label');

            expect(instanceLayoutState('caller')).toEqual({});
            expect(instanceLayoutState('pinned')).toEqual({ session: 'one', label: 'Existing' });
            expect(panes(layout())[at].pane.active).toBe('pinned');
            const pins = panes(layout()).flatMap(({ pane }) =>
                pane.tabs.filter(
                    (tab) => tab.view === 'session-detail' && stateId(tab.state) === 'one'
                )
            );
            expect(pins.map((tab) => tab.id)).toEqual(['pinned']);
        }
    );

    // The pin control of a session detail opens the area as openView does: a tab in the pane a view
    // lands in, and the same tab again on a second press.
    it('opens a labelled transcript as a tab beside the pinned detail and reactivates it on a second open', () => {
        const state = { session: 'one', label: 'One' };
        show([{ id: 'detail', view: 'session-detail', state }]);

        const transcript = openView('transcript', state);
        expect(instanceLayoutState(transcript)).toEqual(state);
        expect(findView(layout(), 'transcript', 'one')?.id).toBe(transcript);
        expect(panes(layout())).toHaveLength(1);
        expect(panes(layout())[0].pane.active).toBe(transcript);
        activateInstance('detail');
        expect(panes(layout())[0].pane.active).toBe('detail');

        expect(openView('transcript', state)).toBe(transcript);
        expect(panes(layout())[0].pane.active).toBe(transcript);
        expect(panes(layout()).flatMap(({ pane }) => pane.tabs)).toHaveLength(2);
    });

    it('activates a transcript already pinned in another pane instead of opening a second one', () => {
        const detail = {
            id: 'detail',
            view: 'session-detail',
            state: { session: 'one', label: 'One' }
        };
        const held = { id: 'held', view: 'transcript', state: { session: 'one', label: 'One' } };
        apply({
            root: {
                kind: 'split',
                dir: 'row',
                sizes: [0.5, 0.5],
                children: [
                    { kind: 'pane', tabs: [detail], active: detail.id },
                    { kind: 'pane', tabs: [held], active: held.id }
                ]
            }
        });

        expect(openView('transcript', { session: 'one', label: 'One' })).toBe('held');
        expect(panes(layout())).toHaveLength(2);
        expect(panes(layout())[1].pane.active).toBe('held');
    });

    it('reads and replaces the state of one instance in place', () => {
        show([
            { id: 'detail', view: 'session-detail', state: {} },
            { id: 'other', view: 'transcript', state: { session: 'old', label: 'Old' } }
        ]);

        restateInstance('detail', { session: 'one', label: 'One' });

        expect(instanceLayoutState('detail')).toEqual({
            session: 'one',
            label: 'One'
        });
        expect(instanceLayoutState('other')).toEqual({ session: 'old', label: 'Old' });
        expect(instanceLayoutState('missing')).toBe(undefined);
    });

    it('replaces an instance in one pane without changing the pane beside it', () => {
        const first = { id: 'first', view: 'session-detail', state: {} } satisfies Instance;
        const second = { id: 'second', view: 'terminal', state: {} } satisfies Instance;
        apply({
            root: {
                kind: 'split',
                dir: 'row',
                sizes: [0.5, 0.5],
                children: [
                    { kind: 'pane', tabs: [first], active: first.id },
                    { kind: 'pane', tabs: [second], active: second.id }
                ]
            }
        });

        restateInstance('second', { session: 'a1b2c3-shell', label: 'Shell' });

        expect(instanceLayoutState('second')).toEqual({
            session: 'a1b2c3-shell',
            label: 'Shell'
        });
        expect(instanceLayoutState('first')).toEqual({});
    });

    it('keeps one pinned tab per session and a separate unpinned tab', () => {
        show([{ id: 'following', view: 'session-detail', state: {} }]);

        const one = openView('session-detail', { session: 'one', label: 'One' });
        const same = openView('session-detail', { session: 'one', label: 'One renamed' });
        const two = openView('session-detail', { session: 'two', label: 'Two' });
        const following = openView('session-detail');

        expect(same).toBe(one);
        expect(two).not.toBe(one);
        expect(following).toBe('following');
        expect(findView(layout(), 'session-detail', null)?.id).toBe('following');
        expect(findView(layout(), 'session-detail', 'one')?.state).toEqual({
            session: 'one',
            label: 'One renamed'
        });
        const tree = layout();
        expect(
            tree.kind === 'pane' ? tree.tabs.filter((tab) => tab.view === 'session-detail') : []
        ).toHaveLength(3);
    });
});
