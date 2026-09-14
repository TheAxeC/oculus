// Layer 2, client state tests. Layout pins live on the instance, identify one tab per session and can be
// replaced in place without moving the tab or changing another tree.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    defaultWorkbench,
    findView,
    panes,
    stateId,
    type Instance,
    type Target
} from '../../src/lib/state/layout/index.ts';
import { createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let activateInstance: ClientState['layout']['activateInstance'];
let apply: ClientState['layout']['apply'];
let instanceLayoutState: ClientState['layout']['instanceLayoutState'];
let layout: ClientState['layout']['layout'];
let openPinnedView: ClientState['layout']['openPinnedView'];
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
        openPinnedView,
        openView,
        pinInstance,
        restateInstance,
        unpinInstance
    } = client.layout);
});

/** One main pane holding the instances a case names, around the ordinary default panel. */
function show(instances: Instance[]): void {
    const base = defaultWorkbench();
    apply({
        ...base,
        main: { kind: 'pane', tabs: instances, active: instances[0]?.id ?? '' }
    });
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

    it.each<[Target, Target]>([
        ['main', 'main'],
        ['main', 'panel'],
        ['panel', 'main'],
        ['panel', 'panel']
    ])(
        'activates the pin in %s and preserves the caller in %s on a collision',
        (target, callerTarget) => {
            const pinned: Instance = {
                id: 'pinned',
                view: 'session-detail',
                state: { session: 'one', label: 'Existing' }
            };
            const caller: Instance = { id: 'caller', view: 'session-detail', state: {} };
            const current = defaultWorkbench();
            for (const where of ['main', 'panel'] as const) {
                const tabs = [
                    ...(where === target ? [pinned] : []),
                    ...(where === callerTarget ? [caller] : []),
                    { id: `other-${where}`, view: 'timeline', state: {} }
                ];
                current[where] = { kind: 'pane', tabs, active: `other-${where}` };
            }
            apply(current);
            pinInstance('caller', 'one', 'New label');

            expect(instanceLayoutState('caller')).toEqual({});
            expect(instanceLayoutState('pinned')).toEqual({ session: 'one', label: 'Existing' });
            expect(panes(layout(target))[0].pane.active).toBe('pinned');
            const pins = [layout('main'), layout('panel')].flatMap((tree) =>
                panes(tree).flatMap(({ pane }) =>
                    pane.tabs.filter(
                        (tab) => tab.view === 'session-detail' && stateId(tab.state) === 'one'
                    )
                )
            );
            expect(pins.map((tab) => tab.id)).toEqual(['pinned']);
        }
    );

    it('opens a labelled transcript for the pinned detail and reactivates it on a second open', () => {
        const state = { session: 'one', label: 'One' };
        show([{ id: 'detail', view: 'session-detail', state }]);

        const transcript = openPinnedView('transcript', state.session, state.label);
        expect(instanceLayoutState(transcript)).toEqual(state);
        expect(findView(layout(), 'transcript', 'one')?.id).toBe(transcript);
        activateInstance('main', 'detail');
        expect(panes(layout())[0].pane.active).toBe('detail');

        expect(openPinnedView('transcript', state.session, state.label)).toBe(transcript);
        expect(panes(layout())[0].pane.active).toBe(transcript);
        expect(panes(layout()).flatMap(({ pane }) => pane.tabs)).toHaveLength(2);
    });

    it('activates a transcript already pinned in the panel instead of opening a second one', () => {
        const base = defaultWorkbench();
        const detail = {
            id: 'detail',
            view: 'session-detail',
            state: { session: 'one', label: 'One' }
        };
        const held = { id: 'held', view: 'transcript', state: { session: 'one', label: 'One' } };
        apply({
            ...base,
            main: { kind: 'pane', tabs: [detail], active: detail.id },
            panel: { kind: 'pane', tabs: [held], active: held.id }
        });

        expect(openPinnedView('transcript', 'one', 'One')).toBe('held');
        expect(findView(layout('main'), 'transcript')).toBe(null);
        expect(panes(layout('panel'))[0].pane.active).toBe('held');
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

    it('replaces an instance in the panel without changing the main tree', () => {
        const base = defaultWorkbench();
        const main = { id: 'main', view: 'session-detail', state: {} } satisfies Instance;
        const panel = { id: 'panel', view: 'terminal', state: {} } satisfies Instance;
        apply({
            ...base,
            main: { kind: 'pane', tabs: [main], active: main.id },
            panel: { kind: 'pane', tabs: [panel], active: panel.id }
        });

        restateInstance('panel', { session: 'a1b2c3-shell', label: 'Shell' });

        expect(instanceLayoutState('panel')).toEqual({
            session: 'a1b2c3-shell',
            label: 'Shell'
        });
        expect(instanceLayoutState('main')).toEqual({});
    });

    it('keeps one pinned tab per session and a separate unpinned tab', () => {
        show([{ id: 'following', view: 'session-detail', state: {} }]);

        const one = openView('session-detail', 'main', { session: 'one', label: 'One' });
        const same = openView('session-detail', 'main', { session: 'one', label: 'One renamed' });
        const two = openView('session-detail', 'main', { session: 'two', label: 'Two' });
        const following = openView('session-detail', 'main');

        expect(same).toBe(one);
        expect(two).not.toBe(one);
        expect(following).toBe('following');
        expect(findView(layout('main'), 'session-detail', null)?.id).toBe('following');
        expect(findView(layout('main'), 'session-detail', 'one')?.state).toEqual({
            session: 'one',
            label: 'One renamed'
        });
        const tree = layout('main');
        expect(
            tree.kind === 'pane' ? tree.tabs.filter((tab) => tab.view === 'session-detail') : []
        ).toHaveLength(3);
    });
});
