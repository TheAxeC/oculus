// Layer 4, view test. A press on a terminal row of the sessions list: the row selects its
// terminal, and the stop control arms on the first press and stops the terminal on the second.
//
// The row and the stop control are ui/ primitives, each wrapped by a recorder that renders the
// real one and keeps the calls the view made to it, so a case presses a control by calling the
// handler the view handed it. What this does NOT cover: the pointer and the keyboard reaching the
// control, which need a DOM; the look on landing sees them.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SessionList from '../../../src/lib/views/sessions/session-list/SessionList.svelte';
import TerminalRows from '../../../src/lib/views/sessions/session-list/TerminalRows.svelte';
import RowButton from '../../../src/lib/ui/controls/RowButton.svelte';
import ToolButton from '../../../src/lib/ui/controls/ToolButton.svelte';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { terminal } from '../../fixtures/sessions-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { catalog, installFixture } from './views-fixture.ts';

vi.mock('../../../src/lib/ui/controls/RowButton.svelte', async (original) =>
    (await import('../../checks/diagrams/counted.ts')).counted(
        await original<Record<string, unknown>>(),
        'default'
    )
);

vi.mock('../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('../../checks/diagrams/counted.ts')).counted(
        await original<Record<string, unknown>>(),
        'default'
    )
);

/** The props each drawn row was given, in the order they were drawn. */
function drawnRows(): Record<string, unknown>[] {
    return vi
        .mocked(RowButton as unknown as (...args: unknown[]) => unknown)
        .mock.calls.map((call) => call[1] as Record<string, unknown>);
}

/** The props each drawn tool button was given, in the order they were drawn. */
function drawnButtons(): Record<string, unknown>[] {
    return vi
        .mocked(ToolButton as unknown as (...args: unknown[]) => unknown)
        .mock.calls.map((call) => call[1] as Record<string, unknown>);
}

/** Call the press handler a recorded control was given. */
function press(props: Record<string, unknown> | undefined): void {
    const onclick = props?.onclick as ((event: MouseEvent) => void) | undefined;
    expect(onclick).toBeTypeOf('function');
    onclick?.({} as MouseEvent);
}

const ONE = terminal('term-one', { name: 'build' });

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    installFixture(client);
    vi.mocked(RowButton as unknown as (...args: unknown[]) => unknown).mockClear();
    vi.mocked(ToolButton as unknown as (...args: unknown[]) => unknown).mockClear();
});

/** The terminal rows drawn over the one terminal, with the stop control armed on `arming`. */
function rows(arming = ''): string {
    return render(TerminalRows, {
        context: clientContext(client),
        props: {
            entries: [ONE],
            now: Date.parse('2026-09-11T09:00:00.000Z'),
            arming,
            onstop: () => undefined,
            onpinned: () => undefined
        }
    }).body;
}

/** The stop control of the terminal's row, as the view last drew it. */
function stopControl(): Record<string, unknown> | undefined {
    return drawnButtons().findLast(
        (one) =>
            one.label === catalog['sessions.stop_terminal'] ||
            one.label === catalog['ui.confirm_stop']
    );
}

describe('a terminal row', () => {
    it('selects its terminal when it is pressed', () => {
        const body = rows();
        expect(body).toContain('build');
        expect(drawnRows()).toHaveLength(1);
        expect(drawnRows()[0]).toMatchObject({
            selected: false,
            title: catalog['sessions.select_tip']
        });
        press(drawnRows()[0]);
        expect(client.selection.selected()).toBe('term-one');
        rows();
        expect(drawnRows().at(-1)).toMatchObject({ selected: true });
    });

    it('names the stop and, once armed, the word that confirms it', () => {
        rows();
        expect(stopControl()).toMatchObject({ label: catalog['sessions.stop_terminal'] });
        rows('term-one');
        expect(stopControl()).toMatchObject({
            label: catalog['ui.confirm_stop'],
            title: catalog['sessions.confirm_stop']
        });
    });
});

describe('the stop control of a terminal row', () => {
    /** The stop controls the last render drew, whichever words they carried. */
    function stopControls(): Record<string, unknown>[] {
        return drawnButtons().filter(
            (one) =>
                one.label === catalog['sessions.stop_terminal'] ||
                one.label === catalog['ui.confirm_stop']
        );
    }

    it('is one control, unarmed and armed, its words following the arming', () => {
        rows();
        expect(stopControls()).toHaveLength(1);
        expect(stopControls()[0]).toMatchObject({
            label: catalog['sessions.stop_terminal'],
            glyph: catalog['sessions.dismiss_glyph'],
            compact: true
        });
        vi.mocked(ToolButton as unknown as (...args: unknown[]) => unknown).mockClear();
        rows('term-one');
        expect(stopControls()).toHaveLength(1);
        expect(stopControls()[0]).toMatchObject({
            label: catalog['ui.confirm_stop'],
            title: catalog['sessions.confirm_stop'],
            glyph: undefined,
            compact: false
        });
    });

    it('arms on the first press and stops the terminal on the second', async () => {
        const stopped: string[] = [];
        const context = clientContext({
            ...client,
            terminals: {
                ...client.terminals,
                terminals: () => [ONE],
                stopTerminal: (id: string) => {
                    stopped.push(id);
                    return Promise.resolve({ ok: true, id, error: '' });
                }
            }
        });
        const instance: Instance = { id: 'list-one', view: 'session-list', state: {} };
        expect(render(SessionList, { context, props: { instance } }).body).toContain('build');
        const control = stopControl();
        press(control);
        await Promise.resolve();
        expect(stopped).toEqual([]);
        press(control);
        await vi.waitFor(() => {
            expect(stopped).toEqual(['term-one']);
        });
    });
});
