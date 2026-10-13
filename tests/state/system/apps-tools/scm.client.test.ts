// Layer 2, client state test. The source controls of the apps as the Repositories view reads them
// (lib/state/system/apps/tools/scm.svelte.ts): the controls come from the `app-tools` payload in
// the hosts' order, a menu command goes to the server as the command the picked entry names (the
// alternative one with Alt), a pick that names no entry sends nothing, a refusal is said as a
// sentence with the command's title, and the status bar commands are those of the selected control
// only. These are the source control rows of G77 on the page's side.
//
// What this does NOT cover: the view that draws the controls, and the server's refusal itself
// (tests/server/machine/apps/tools/scm.test.ts).

import { describe, expect, vi } from 'vitest';
import type {
    AppScmState,
    AppToolsHost,
    AppToolsPayload
} from '../../../../src/lib/data/model/index.ts';
import type { MenuOffer } from '../../../../src/lib/state/system/apps/shell/contributions.ts';
import {
    createScm,
    scmKey,
    scmReason
} from '../../../../src/lib/state/system/apps/tools/scm.svelte.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { it } from '../../../fixtures/scratch.ts';
import { installRealText } from '../../../views/shared/real-text.ts';

installRealText();

const command = (id: string, title: string) => ({
    command: id,
    title,
    category: '',
    icon: '',
    enablement: ''
});

const offer = (id: string, title: string, alt: string | null = null): MenuOffer => ({
    app: 'app:notes',
    appTitle: 'Notes',
    entry: { command: id, when: '', group: '', alt: alt ?? '' },
    command: command(id, title),
    alt: alt === null ? null : command(alt, `${title} (alt)`),
    group: '',
    order: 0
});

function control(id: string, over: Partial<AppScmState> = {}): AppScmState {
    return {
        app: id.startsWith('other') ? 'app:other' : 'app:notes',
        id,
        label: id,
        root: 'r',
        rootUri: 'file:///r',
        input: { value: '', placeholder: '', enabled: true, visible: true, writes: 0 },
        count: 2,
        acceptCommand: null,
        statusCommands: [{ command: 'notes.sync', title: 'Sync', tooltip: 'Sync now' }],
        commitTemplate: '',
        quickDiff: false,
        groups: [],
        ...over
    };
}

function hostWith(app: string, sources: AppScmState[]): AppToolsHost {
    return {
        app,
        servers: [],
        providers: null,
        collections: [],
        debuggers: [],
        taskTypes: [],
        sources,
        decorations: false,
        contentSchemes: []
    };
}

/** A store over two controls of one app and one of another, with the posts and lines it made. */
function store(
    answer: { ok: boolean; body: Record<string, unknown> } = {
        ok: true,
        body: { ok: true, value: null }
    }
) {
    const payload: AppToolsPayload = {
        hosts: [
            hostWith('app:notes', [control('notes.a', { count: 3 }), control('notes.b')]),
            hostWith('app:other', [control('other.c', { count: null })])
        ],
        decorations: { epoch: 0, allAt: 0, files: [] }
    };
    const posts: Record<string, unknown>[] = [];
    const said: string[] = [];
    const post = vi.fn((_path: string, body: unknown) => {
        posts.push(body as Record<string, unknown>);
        return Promise.resolve({ ...answer, status: 200, failed: '' as const });
    });
    const made = createScm({ payload: () => payload, post, say: (line) => said.push(line) });
    return { made, posts, said };
}

describe('the controls the hosts created', () => {
    it('are listed in the order of the hosts, counted together, and found by app and id', () => {
        const { made } = store();
        expect([
            made.sources().map((one) => one.id),
            made.count(),
            made.stateOf('app:other', 'other.c')?.id,
            made.stateOf('app:notes', 'other.c')
        ]).toEqual([['notes.a', 'notes.b', 'other.c'], 5, 'other.c', undefined]);
    });

    it('show the status bar commands of the selected control only, and leave the selection when it is deselected', () => {
        const { made } = store();
        const before = made.statusItems().length;
        made.select(scmKey('app:notes', 'notes.a'));
        const items = made.statusItems().map((one) => [one.app, one.item.id, one.item.text]);
        made.select(scmKey('app:other', 'other.c'));
        made.deselect(scmKey('app:notes', 'notes.a'));
        const kept = made.selected()?.id;
        made.deselect(scmKey('app:other', 'other.c'));
        expect([before, items, kept, made.selected()]).toEqual([
            0,
            [['app:notes', 'scm.notes.a.0', 'Sync']],
            'other.c',
            undefined
        ]);
    });
});

describe('a menu command on a control', () => {
    it('is sent as the command the picked entry names, and as its alternative with Alt', async () => {
        const { made, posts } = store();
        const state = made.stateOf('app:notes', 'notes.a');
        if (state === undefined) throw new Error('no control');
        const offers = [offer('notes.stage', 'Stage', 'notes.unstage')];
        await made.execute(state, offers, '0', { scope: 'sourceControl' });
        await made.execute(state, offers, 'menu:0', { scope: 'group', group: 'changes' }, true);
        expect(posts).toEqual([
            {
                action: 'scm',
                app: 'app:notes',
                id: 'notes.a',
                op: { kind: 'execute', command: 'notes.stage', scope: 'sourceControl' }
            },
            {
                action: 'scm',
                app: 'app:notes',
                id: 'notes.a',
                op: {
                    kind: 'execute',
                    command: 'notes.unstage',
                    scope: 'group',
                    group: 'changes'
                }
            }
        ]);
    });

    it('sends nothing for a pick that names no entry, and answers missing', async () => {
        const { made, posts } = store();
        const state = made.stateOf('app:notes', 'notes.a');
        if (state === undefined) throw new Error('no control');
        const answer = await made.execute(state, [offer('notes.stage', 'Stage')], '4', {
            scope: 'sourceControl'
        });
        expect([answer, posts]).toEqual([{ ok: false, word: 'missing' }, []]);
    });

    it('is said as a sentence that names the command and why, when the server refuses it', async () => {
        const { made, said } = store({ ok: true, body: { ok: false, word: 'not_declared' } });
        const state = made.stateOf('app:notes', 'notes.a');
        if (state === undefined) throw new Error('no control');
        await made.execute(state, [offer('notes.stage', 'Stage')], '0', { scope: 'sourceControl' });
        expect(said).toEqual([
            t(
                'repositories.app_source_refused',
                'Stage',
                t('repositories.app_source_word_not_declared')
            )
        ]);
    });
});

describe('the sentence for a refusal word', () => {
    it.each([
        ['closed', 'repositories.app_source_word_closed'],
        ['host_down', 'repositories.app_source_word_host_down'],
        ['missing', 'repositories.app_source_word_missing'],
        ['not_declared', 'repositories.app_source_word_not_declared'],
        ['outside', 'repositories.app_source_word_outside'],
        ['timeout', 'repositories.app_source_word_timeout']
    ])('%s is %s', (word, key) => {
        expect(scmReason(word)).toBe(t(key));
    });

    it('names a word it has no sentence for', () => {
        expect(scmReason('refused:registered')).toBe(
            t('repositories.app_source_word_other', 'refused:registered')
        );
    });
});
