// Layer 3, shell test. The status bar the shell draws along the foot of the window, rendered on the
// server: its two groups and their order, the words the page hands in, each drawn as its item's
// short words with the long ones as its name or tooltip, the branch and sync items for a
// repository, the source tab's items while a source tab is on screen, the items the reader hid,
// the unsaved tabs and the bell's count.
//
// What this does NOT cover: how the page makes the words, which is
// tests/state/workbench/navigation/status.test.ts's, and an item pressed, its size on screen and a
// menu opened, which are tests/browser/status/'s.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import StatusBar from '../../../src/lib/shell/status/StatusBar.svelte';
import { LEFT_ITEMS, RIGHT_ITEMS } from '../../../src/lib/shell/status/status-items.ts';
import {
    NO_STATUS,
    type RepoStatus,
    type StatusWords
} from '../../../src/lib/state/workbench/navigation/status.ts';
import type { EditorStatus } from '../../../src/lib/state/workbench/navigation/editor-status.svelte.ts';
import { fakeStorage } from '../../state/workbench/layout/layout-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { words as t } from '../../views/system/workbench/workbench-fixture.ts';
import { setGlyphMode } from '../../../src/lib/state/shared/words/text.ts';

const STATUS: StatusWords = {
    ...NO_STATUS,
    host: { name: 'desk', address: 'http://127.0.0.1:8790' },
    socket: 'up',
    usage: 'ok',
    hpc: { short: '2 running, 1 pending', long: '2 running | 1 pending | 3 total' },
    live: 2,
    findings: 5
};

const REPO: RepoStatus = {
    root: '/work/hub',
    name: 'hub',
    branch: 'main',
    head: '',
    tracked: true,
    upstream: 'origin/main',
    ahead: 2,
    behind: 1,
    branches: ['main', 'draft'],
    remotes: ['origin']
};

const SOURCE: EditorStatus = {
    caret: { line: 12, column: 4, selected: 0 },
    lines: 40,
    indent: { tabs: true, size: 4 },
    ending: 'CRLF',
    language: 'python',
    writable: true,
    blame: ''
};

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    client.ui.loadUi({ getItem: () => null, setItem: () => undefined });
});

function draw(status: StatusWords = STATUS): string {
    return render(StatusBar, { context: clientContext(client), props: { status } }).body;
}

/**
 * The markup of the item a `data-status` names, up to the end of its button, without the comments
 * the server render puts around every block.
 */
function item(body: string, name: string): string {
    const at = body.indexOf(`data-status="${name}"`);
    if (at < 0) return '';
    return body.slice(at, body.indexOf('</button>', at)).replace(/<!--[\s\S]*?-->/g, '');
}

/** The `data-status` names in the order the markup draws them. */
function order(body: string): string[] {
    return [...body.matchAll(/data-status="([a-z_]+)"/g)].map((match) => match[1]);
}

/** A source tab on screen that has said what it holds. */
function sourceTab(said: EditorStatus = SOURCE): string {
    const id = client.layout.openView('source', { root: 'hub', path: 'run.py', label: 'run.py' });
    client.editorStatus.publish(id, said);
    return id;
}

describe('the status bar', () => {
    it('draws the left group and the right group, every item in its place', () => {
        // revert: src/lib/shell/status/status-items.ts "export const LEFT_ITEMS = ['host', 'branch', 'sync', 'findings', 'hpc', 'usage', 'server'] as const;" => export const LEFT_ITEMS = ['branch', 'host', 'sync', 'findings', 'hpc', 'usage', 'server'] as const;
        sourceTab({ ...SOURCE, blame: 'Ada, 2 days ago: Fix the reader' });
        const body = draw({ ...STATUS, repo: REPO });
        const left = body.slice(
            body.indexOf('data-status-group="left"'),
            body.indexOf('data-status-group="right"')
        );
        const right = body.slice(body.indexOf('data-status-group="right"'));
        expect(order(left)).toEqual([...LEFT_ITEMS]);
        expect(order(right)).toEqual([...RIGHT_ITEMS]);
        expect(LEFT_ITEMS).toEqual([
            'host',
            'branch',
            'sync',
            'findings',
            'hpc',
            'usage',
            'server'
        ]);
        expect(RIGHT_ITEMS.at(-1)).toBe('bell');
    });

    it('draws the words the page hands it, each item a glyph, short words and long ones in its tooltip', () => {
        // revert: src/lib/shell/status/StatusBar.svelte "title={t('statusbar.hpc_tip', status.hpc.long)}" => title={t('statusbar.hpc_tip', status.hpc.short)}
        const body = draw();
        expect(item(body, 'host')).toContain('data-glyph="host"');
        expect(item(body, 'host')).toContain('>desk</span>');
        expect(body).toContain(t('statusbar.host_tip', 'desk', 'http://127.0.0.1:8790'));
        expect(item(body, 'findings')).toContain(`aria-label="${t('statusbar.findings_name', 5)}"`);
        expect(item(body, 'findings')).toMatch(/>\s*5\s*<\/span>/);
        expect(item(body, 'hpc')).toContain('>2 running, 1 pending</span>');
        expect(body).toContain(t('statusbar.hpc_tip', '2 running | 1 pending | 3 total'));
        expect(item(body, 'usage')).toContain('>ok</span>');
        expect(item(body, 'server')).toContain('>up</span>');
        expect(item(body, 'sessions')).toContain(`aria-label="${t('statusbar.sessions_name', 2)}"`);
        for (const name of [
            'host',
            'findings',
            'hpc',
            'usage',
            'server',
            'sessions',
            'unsaved',
            'bell'
        ]) {
            expect(item(body, name)).toMatch(/class="tool [^"]*\bstatus\b/);
            expect(item(body, name)).toContain('data-glyph=');
        }
    });

    it('says the machine is not known yet before the first config push', () => {
        // revert: src/lib/shell/status/StatusBar.svelte "label={status.host?.name ?? t('statusbar.host_waiting')}" => label={status.host?.name ?? ''}
        const body = draw({ ...STATUS, host: null });
        expect(item(body, 'host')).toContain(`>${t('statusbar.host_waiting')}</span>`);
        expect(body).toContain(t('statusbar.host_waiting_tip'));
    });

    it('draws the branch and how far it is behind and ahead, and no sync for a branch that tracks none', () => {
        // revert: src/lib/shell/status/RepoItems.svelte "{#if sync && repo.tracked && !detached}" => {#if sync && !detached}
        const body = draw({ ...STATUS, repo: REPO });
        expect(item(body, 'branch')).toContain('data-glyph="branch"');
        expect(item(body, 'branch')).toMatch(/>\s*main\s*<\/span>/);
        expect(body).toContain(t('statusbar.branch_tip', 'main', 'hub'));
        expect(item(body, 'sync')).toMatch(/data-sync="behind">1</);
        expect(item(body, 'sync')).toMatch(/data-sync="ahead">2</);
        expect(body).toContain(t('statusbar.sync_tip_sync', 1, 2, 'origin/main'));
        const untracked = draw({
            ...STATUS,
            repo: { ...REPO, tracked: false, upstream: '', remotes: [] }
        });
        expect(item(untracked, 'branch')).not.toBe('');
        expect(item(untracked, 'sync')).toBe('');
        expect(item(draw(), 'branch')).toBe('');
    });

    it('offers a push for a branch only ahead, and names the commit of a detached head', () => {
        // revert: src/lib/shell/status/RepoItems.svelte "const pushes = $derived(repo.ahead > 0 && repo.behind === 0);" => const pushes = $derived(repo.ahead > 0);
        const ahead = draw({ ...STATUS, repo: { ...REPO, behind: 0 } });
        expect(ahead).toContain(t('statusbar.sync_tip_push', 2, 'origin/main'));
        // Ahead and behind at once is no push: the item syncs, a pull then a push.
        const both = draw({ ...STATUS, repo: REPO });
        expect(both).not.toContain(t('statusbar.sync_tip_push', 2, 'origin/main'));
        expect(both).toContain(t('statusbar.sync_tip_sync', 1, 2, 'origin/main'));
        const loose = draw({
            ...STATUS,
            repo: { ...REPO, branch: '', head: 'abc1234', tracked: false, upstream: '' }
        });
        expect(item(loose, 'branch')).toContain('data-glyph="commit"');
        expect(item(loose, 'branch')).toMatch(/>\s*abc1234\s*<\/span>/);
        expect(loose).toContain(t('statusbar.branch_detached_tip', 'abc1234', 'hub'));
    });

    it('draws Publish Branch where the sync item is for a branch that tracks none', () => {
        // revert: src/lib/shell/status/RepoItems.svelte "{:else if sync && !detached && repo.remotes.length === 1}" => {:else if false}
        const lone = { ...REPO, tracked: false, upstream: '', ahead: 0, behind: 0 };
        const one = draw({ ...STATUS, repo: lone });
        expect(item(one, 'sync')).toBe('');
        expect(item(one, 'publish')).toContain('data-glyph="publish"');
        expect(one).toContain(t('statusbar.publish_tip', 'main', 'origin'));
        // With two remotes the item lists them, one Publish Branch to each.
        const two = draw({ ...STATUS, repo: { ...lone, remotes: ['origin', 'fork'] } });
        expect(item(two, 'publish')).toContain('data-glyph="publish"');
        expect(two).toContain(t('statusbar.publish_tip_many', 'main'));
        // A branch with no remote has nowhere to publish, and a detached head has no branch.
        expect(item(draw({ ...STATUS, repo: { ...lone, remotes: [] } }), 'publish')).toBe('');
        const loose = { ...lone, branch: '', head: 'abc1234' };
        expect(item(draw({ ...STATUS, repo: loose }), 'publish')).toBe('');
    });

    it('draws the caret line blame while the tab says one, and no blame item while it says none', () => {
        // revert: src/lib/shell/status/SourceItems.svelte "{#if shown('blame') && status.blame !== ''}" => {#if false}
        sourceTab({ ...SOURCE, blame: 'Ada, 2 days ago: Fix the reader' });
        const body = draw();
        expect(item(body, 'blame')).toContain('data-glyph="blame"');
        expect(item(body, 'blame')).toContain('Ada, 2 days ago: Fix the reader');
        expect(body).toContain(t('statusbar.blame_tip'));
        sourceTab();
        expect(item(draw(), 'blame')).toBe('');
    });

    it('draws the source items while a source tab is on screen, and none for another tab', () => {
        // revert: src/lib/state/workbench/navigation/editor-status.svelte.ts "if (tab?.view !== 'source') return null;" => if (tab === null) return null;
        expect(item(draw(), 'caret')).toBe('');
        const id = sourceTab();
        const body = draw();
        expect(item(body, 'caret')).toContain('>Ln 12, Col 4</span>');
        expect(item(body, 'indent')).toMatch(/>\s*Tab Size: 4\s*<\/span>/);
        expect(item(body, 'encoding')).toMatch(/>\s*UTF-8\s*<\/span>/);
        expect(item(body, 'line_ending')).toMatch(/>\s*CRLF\s*<\/span>/);
        expect(item(body, 'language')).toContain('>Python</span>');
        // Another view's tab on screen draws none of them, the source tab still open behind it,
        // even where something has said a status under that tab's id.
        const help = client.layout.openView('help');
        client.editorStatus.publish(help, SOURCE);
        expect(item(draw(), 'indent')).toBe('');
        // A source tab that has said nothing yet draws none either.
        client.layout.activateInstance(id);
        client.editorStatus.forget(id);
        expect(item(draw(), 'indent')).toBe('');
    });

    it('draws no caret for a source tab that may not write its file, and says why its lists offer no change', () => {
        // revert: src/lib/shell/status/SourceItems.svelte "{#if shown('caret') && status.caret !== null}" => {#if shown('caret')}
        sourceTab({ ...SOURCE, caret: null, writable: false });
        const body = draw();
        expect(item(body, 'caret')).toBe('');
        expect(item(body, 'indent')).not.toBe('');
        expect(body).toContain(t('statusbar.indent_readonly'));
        expect(body).toContain(t('statusbar.line_ending_readonly'));
    });

    it('draws no item the reader hid, and every other', () => {
        // revert: src/lib/shell/status/StatusBar.svelte "return !hidden.includes(item);" => return true;
        sourceTab({ ...SOURCE, blame: 'Ada, 2 days ago: Fix the reader' });
        client.ui.setStatusHidden('host', true);
        client.ui.setStatusHidden('language', true);
        client.ui.setStatusHidden('bell', true);
        const body = draw({ ...STATUS, repo: REPO });
        expect(order(body)).toEqual(
            [...LEFT_ITEMS, ...RIGHT_ITEMS].filter(
                (name) => !['host', 'language', 'bell'].includes(name)
            )
        );
    });

    it('counts the tabs holding unsaved text, and holds the item back at none', () => {
        // revert: src/lib/shell/status/StatusBar.svelte "disabled={dirty === 0}" => disabled={false}
        const quiet = item(draw(), 'unsaved');
        expect(quiet).toContain(`aria-label="${t('statusbar.unsaved_name', 0)}"`);
        expect(quiet).toMatch(/\sdisabled/);
        const tab = client.layout.activeInstance()?.id ?? '';
        client.ui.registerUnsaved((id) => id === tab);
        const held = item(draw(), 'unsaved');
        expect(held).toContain(`aria-label="${t('statusbar.unsaved_name', 1)}"`);
        expect(held).not.toMatch(/\sdisabled/);
    });

    it('draws under a terminal palette no stand-in that reads as a separator between items', () => {
        // revert: config/catalogs/glyphs.yml "caret: \"[I]\"" =>   caret: "|"
        // revert: config/catalogs/glyphs.yml "branch: \"[Y]\"" =>   branch: "|-"
        sourceTab();
        client.notices.post('one');
        setGlyphMode('ascii');
        try {
            const body = draw({ ...STATUS, repo: REPO });
            const drawn = [
                ...body.matchAll(/data-glyph="([a-z_]+)" aria-hidden="true">([^<]*)</g)
            ].map((match) => [match[1], match[2]]);
            expect(drawn.map(([name]) => name)).toEqual(
                expect.arrayContaining(['host', 'branch', 'caret', 'indent', 'bell_unread'])
            );
            for (const [name, text] of drawn) {
                // A vertical bar reads as the divider between two items, and so does a stand-in
                // made of nothing but strokes and dots.
                const divider = text.includes('|') || /^[-_:./\\]+$/.test(text);
                expect({ name, text, divider }).toEqual({ name, text, divider: false });
            }
        } finally {
            setGlyphMode('icon');
        }
    });

    it('counts on the bell what has not been seen, and draws its quiet face under Do Not Disturb', () => {
        // revert: src/lib/shell/status/Bell.svelte "{count > 0 ? count : ''}" => {''}
        expect(item(draw(), 'bell')).toContain('data-glyph="bell"');
        client.notices.post('one');
        client.notices.post('two');
        const told = item(draw(), 'bell');
        expect(told).toContain('data-glyph="bell_unread"');
        expect(told).toMatch(/>\s*2\s*<\/span>/);
        client.ui.setStatusQuiet(true);
        expect(item(draw(), 'bell')).toContain('data-glyph="bell_quiet"');
    });
});
