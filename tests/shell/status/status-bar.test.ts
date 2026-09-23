// Layer 3, shell test. The status bar the shell draws along the foot of the window: the four items
// whose words the page hands in, each drawn in the catalog's frame, and the unsaved tabs the shell
// counts itself from the layout and ui stores.
//
// What this does NOT cover: how the page makes the four items' words, which is
// tests/state/workbench/navigation/status.test.ts's, and an item pressed and the view it opens,
// which is tests/browser/shell/settings.spec.ts's.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import StatusBar from '../../../src/lib/shell/status/StatusBar.svelte';
import { fakeStorage } from '../../state/workbench/layout/layout-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { words as t } from '../../views/system/workbench/workbench-fixture.ts';

const STATUS = { socket: 'up', usage: 'ok', hpc: 'starting', live: 2 };

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
});

function draw(): string {
    return render(StatusBar, { context: clientContext(client), props: { status: STATUS } }).body;
}

/** The words of the item a `data-status` names. */
function item(body: string, name: string): string {
    const at = body.indexOf(`data-status="${name}"`);
    return at < 0 ? '' : body.slice(at, body.indexOf('</button>', at));
}

describe('the status bar', () => {
    it('draws the words the page hands it, each in its item', () => {
        // revert: src/lib/shell/status/StatusBar.svelte:60 => label={t('workbench.status_live', 0)}
        const body = draw();
        expect(item(body, 'socket')).toContain(t('workbench.status_socket', 'up'));
        expect(item(body, 'usage')).toContain(t('workbench.status_usage', 'ok'));
        expect(item(body, 'hpc')).toContain(t('workbench.status_hpc', 'starting'));
        expect(item(body, 'sessions')).toContain(t('workbench.status_live', 2));
        expect(item(body, 'sessions')).toContain('live sessions: 2');
    });

    it('counts the tabs holding unsaved text, and holds the item back at none', () => {
        // revert: src/lib/shell/status/StatusBar.svelte:70 => disabled={false}
        const quiet = item(draw(), 'unsaved');
        expect(quiet).toContain(t('workbench.status_unsaved', 0));
        expect(quiet).toMatch(/\sdisabled/);
        const tab = client.layout.activeInstance()?.id ?? '';
        client.ui.registerUnsaved((id) => id === tab);
        const held = item(draw(), 'unsaved');
        expect(held).toContain('unsaved tabs: 1');
        expect(held).not.toMatch(/\sdisabled/);
    });
});
