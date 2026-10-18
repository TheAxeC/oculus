// Layer 2, client-state tests. The autosave store (state/sessions/source/autosave.svelte.ts), in
// Svelte's client runtime since it registers an effect: which tabs `editor.autosave` saves, when,
// and what it refuses, and a note's own wait, which saves it whatever the mode. The store runs on a
// pair of timers the test moves by hand, over the fake server of source-server.ts, so each case
// says exactly how much time has passed.
//
// It does not cover the editor's blur or the window's focus events, which the look does.

import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { Autosave } from '../../../src/lib/data/helpers/editor/editor.ts';
import { createAutosave } from '../../../src/lib/state/sessions/source/autosave.svelte.ts';
import type { SourceDraft } from '../../../src/lib/state/sessions/source/draft.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { cell, rooted } from '../../ui/frame/rooted.svelte.ts';
import { hashOf, server } from './source/source-server.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));
afterEach(() => vi.unstubAllGlobals());

const KEY = 'fixture/a.md';
const ONE = hashOf('one\n');

/** The wait of a note, as `notes.autosave_ms` ships it. */
const NOTE_WAIT = 800;

type Timers = Parameters<typeof createAutosave>[0]['timers'];

/** Timers that run a call only when the test moves time on to it. */
function clock(settled: () => Promise<void>): Timers & { advance: (ms: number) => Promise<void> } {
    let now = 0;
    let next = 1;
    const waiting = new Map<number, { at: number; run: () => void }>();
    return {
        setTimeout: (run, ms) => {
            const id = next++;
            waiting.set(id, { at: now + ms, run });
            return id;
        },
        clearTimeout: (handle) => void waiting.delete(handle as number),
        advance: async (ms) => {
            now += ms;
            for (const [id, one] of [...waiting]) {
                if (one.at > now) continue;
                waiting.delete(id);
                one.run();
            }
            await settled();
        }
    };
}

/**
 * An autosave store over a fake server, in a mode and with a delay the test can change; with
 * `note`, fixture/a.md is a note that waits NOTE_WAIT.
 */
function make(over: { mode: Autosave; delay: number; format: boolean; note: boolean }) {
    const env = server({
        rules: () => ({ trim: false, finalNewline: false, formatOnSave: over.format })
    });
    const mode = cell<Autosave>(over.mode);
    const delay = cell(over.delay);
    const time = clock(() => env.settled());
    const made = rooted(() =>
        createAutosave({
            source: env.source,
            options: () => ({ autosave: mode.get(), autosaveDelay: delay.get() }),
            rules: () => ({ trim: false, finalNewline: false, formatOnSave: over.format }),
            timers: time,
            note: (file) => (over.note && file === KEY ? NOTE_WAIT : null)
        })
    );
    flushSync();
    const formatted = vi.fn(() => Promise.resolve());
    return { ...env, autosave: made.value, mode, time, formatted, stop: made.stop };
}

/** One thing done to the tabs, the files or the clock, in the order a row lists them. */
type Step =
    /** A tab over fixture/a.md ('one') or fixture/b.md ('two'), read in; `bare` has no editor. */
    | { open: 'one' | 'two'; bare?: true }
    | { edit: string; text: string }
    | { advance: number }
    | { blur: string }
    | { pageBlur: true }
    | { mode: Autosave }
    /** Another program wrote fixture/a.md and the file's channel said so. */
    | { outside: string }
    /** The file changed and the channel has not told the tab yet. */
    | { silently: string }
    /** The saved state of the first tab with these fields set. */
    | { patch: Record<string, unknown> }
    /** The reader's own Save. */
    | { save: string }
    /** A close of these tabs asks the autosave store to save the ones its mode covers. */
    | { close: string[] }
    /** The tab's file was removed, and its waiting save is dropped. */
    | { drop: string }
    /** The number of saves the store has sent so far. */
    | { sentSoFar: number };

/** What a row expects once its steps are done and every request is answered. */
type Row = {
    title: string;
    mode: Autosave;
    delay?: number;
    format?: boolean;
    /** Whether fixture/a.md is a note. */
    note?: true;
    steps: Step[];
    sent?: Record<string, unknown>[];
    files?: Record<string, string>;
    formatted?: number;
    dirty?: Record<string, boolean>;
    drafts?: Record<string, Partial<SourceDraft>>;
};

const TYPED = [{ open: 'one' }, { edit: 'one', text: 'typed\n' }] as const;

/** Six edits, 500 ms apart. */
const KEYSTROKES = Array.from({ length: 6 }, (_, at): Step[] => [
    { edit: 'one', text: `typed ${String(at + 1)}\n` },
    { advance: 500 }
]).flat();

/** Fields of a tab's saved state that make an automatic save write nothing. */
const NOT_SAVED: [string, Record<string, unknown>][] = [
    ['read-only', { readonly: true }],
    ['truncated', { truncated: true }],
    ['not UTF-8 text', { notText: true }],
    ['at HEAD', { file: 'head:fixture/a.md' }],
    ['at the index', { file: 'index:fixture/a.md' }],
    ['untitled', { file: 'untitled:one' }]
];

/** The closes: the mode, the delay and whether the close saves the tab in place of the question. */
const CLOSES = [
    ['on_focus_change', 0, true],
    ['after_delay', 1000, true],
    ['after_delay', 1001, false],
    ['off', 0, false]
] as const;

const rows: Row[] = [
    {
        title: 'saves nothing under off, however long the reader waits',
        mode: 'off',
        steps: [...TYPED, { advance: 5000 }],
        sent: []
    },
    {
        title: 'saves once, a delay after the last edit, and not before',
        mode: 'after_delay',
        steps: [
            ...TYPED,
            { advance: 999 },
            { sentSoFar: 0 },
            { advance: 1 },
            { sentSoFar: 1 },
            { advance: 5000 }
        ],
        sent: [{ content: 'typed\n', base: ONE }],
        dirty: { one: false }
    },
    {
        title: 'starts the wait again at each edit, so typing every 500 ms for 3 s saves once',
        mode: 'after_delay',
        steps: [{ open: 'one' }, ...KEYSTROKES, { sentSoFar: 0 }, { advance: 500 }],
        sent: [{ content: 'typed 6\n' }]
    },
    {
        title: 'never formats the document, whatever the language says',
        mode: 'after_delay',
        format: true,
        steps: [...TYPED, { advance: 1000 }],
        sent: [{ content: 'typed\n' }],
        formatted: 0
    },
    {
        title: 'saves each edit at a delay of 0, every save sending the hash the save ahead of it answered',
        mode: 'after_delay',
        delay: 0,
        steps: [
            { open: 'one' },
            { edit: 'one', text: 'first\n' },
            { advance: 0 },
            { edit: 'one', text: 'second\n' },
            { advance: 0 }
        ],
        sent: [
            { content: 'first\n', base: ONE },
            { content: 'second\n', base: hashOf('first\n') }
        ],
        files: { [KEY]: 'second\n' }
    },
    {
        title: 'saves a tab when its editor loses focus, formatting the document when the language says so',
        mode: 'on_focus_change',
        format: true,
        steps: [...TYPED, { blur: 'one' }],
        formatted: 1,
        sent: [{ content: 'typed\n' }],
        files: { [KEY]: 'typed\n' }
    },
    {
        title: 'saves a tab whose editor is not open unformatted and says so on its line',
        mode: 'on_focus_change',
        format: true,
        steps: [{ open: 'one', bare: true }, { edit: 'one', text: 'typed\n' }, { blur: 'one' }],
        formatted: 0,
        sent: [{ content: 'typed\n' }],
        files: { [KEY]: 'typed\n' },
        drafts: {
            one: { message: t('source.format_failed', t('source.format_unmounted')) }
        }
    },
    {
        title: 'saves every tab holding unsaved text when the page loses focus',
        mode: 'on_focus_change',
        steps: [
            { open: 'one' },
            { open: 'two' },
            { edit: 'one', text: 'typed\n' },
            { edit: 'two', text: 'typed b\n' },
            { pageBlur: true }
        ],
        files: { [KEY]: 'typed\n', 'fixture/b.md': 'typed b\n' }
    },
    {
        title: 'saves nothing for a blur under off',
        mode: 'off',
        steps: [...TYPED, { blur: 'one' }, { pageBlur: true }],
        sent: []
    },
    {
        title: 'from off to after_delay saves the tabs that hold unsaved text at once',
        mode: 'off',
        steps: [
            { open: 'one' },
            { open: 'two' },
            { edit: 'one', text: 'typed\n' },
            { edit: 'two', text: 'typed b\n' },
            { mode: 'after_delay' }
        ],
        files: { [KEY]: 'typed\n', 'fixture/b.md': 'typed b\n' }
    },
    {
        title: "writes nothing for a tab marked changed, and the reader's own Save shows the conflict",
        mode: 'after_delay',
        delay: 0,
        steps: [
            { open: 'one' },
            { mode: 'off' },
            { edit: 'one', text: 'typed\n' },
            { outside: 'another program\n' },
            { mode: 'after_delay' },
            { advance: 0 },
            { blur: 'one' },
            { sentSoFar: 0 },
            { save: 'one' }
        ],
        drafts: { one: { disk: 'changed', message: t('source.save_conflict', 'a.md') } }
    },
    ...NOT_SAVED.map(([what, patch]): Row => ({
        title: `writes nothing for a tab that is ${what}`,
        mode: 'on_focus_change',
        steps: [...TYPED, { patch }, { blur: 'one' }, { pageBlur: true }],
        sent: []
    })),
    {
        title: 'does not try a refused save again until the reader types',
        mode: 'after_delay',
        delay: 100,
        steps: [
            ...TYPED,
            { silently: 'another program\n' },
            { advance: 100 },
            { sentSoFar: 1 },
            { blur: 'one' },
            { pageBlur: true },
            { advance: 5000 }
        ],
        sent: [{ content: 'typed\n' }],
        drafts: { one: { conflict: true } }
    },
    ...CLOSES.map(([mode, delay, saves]): Row => ({
        title: `under ${mode} with a delay of ${String(delay)} saves the tab first: ${String(saves)}`,
        mode,
        delay,
        steps: [...TYPED, { close: ['one'] }],
        dirty: { one: !saves },
        sent: saves ? [{ content: 'typed\n' }] : []
    })),
    {
        title: 'saves a note once, notes.autosave_ms after its last edit, under off',
        mode: 'off',
        note: true,
        steps: [
            ...TYPED,
            { advance: NOTE_WAIT - 1 },
            { sentSoFar: 0 },
            { advance: 1 },
            { sentSoFar: 1 },
            { advance: 5000 }
        ],
        sent: [{ content: 'typed\n', base: ONE }],
        dirty: { one: false }
    },
    {
        title: "starts a note's wait again at each edit, so typing every 500 ms for 3 s saves it once",
        mode: 'off',
        note: true,
        steps: [
            { open: 'one' },
            ...KEYSTROKES,
            { sentSoFar: 0 },
            { advance: NOTE_WAIT - 500 - 1 },
            { sentSoFar: 0 },
            { advance: 1 }
        ],
        sent: [{ content: 'typed 6\n' }]
    },
    {
        title: 'writes nothing for a note marked changed, and keeps its text',
        mode: 'off',
        note: true,
        steps: [...TYPED, { outside: 'another program\n' }, { advance: 5000 }],
        sent: [],
        files: { [KEY]: 'another program\n' },
        dirty: { one: true },
        drafts: { one: { disk: 'changed', text: 'typed\n' } }
    },
    {
        title: 'writes nothing for a note whose file was removed while its save waited',
        mode: 'off',
        note: true,
        steps: [...TYPED, { drop: 'one' }, { advance: 5000 }],
        sent: []
    },
    {
        title: "under off saves a note's tab first on a close",
        mode: 'off',
        note: true,
        steps: [...TYPED, { close: ['one'] }],
        dirty: { one: false },
        sent: [{ content: 'typed\n', base: ONE }]
    },
    {
        title: 'leaves a tab whose save is refused unsaved, for the question to ask about',
        mode: 'on_focus_change',
        steps: [...TYPED, { silently: 'another program\n' }, { close: ['one'] }],
        dirty: { one: true },
        drafts: { one: { conflict: true } }
    }
];

describe('the autosave store', () => {
    it.each(rows)('$title', async (row) => {
        const env = make({
            mode: row.mode,
            delay: row.delay ?? 1000,
            format: row.format === true,
            note: row.note === true
        });
        for (const step of row.steps) {
            if ('open' in step) {
                const [path, text] = step.open === 'one' ? ['a.md', 'one\n'] : ['b.md', 'b\n'];
                env.files.set(`fixture/${path}`, text);
                await env.source.loadSourceDraft(step.open, 'fixture', path);
                if (step.bare !== true) env.source.registerFormat(step.open, env.formatted);
            } else if ('edit' in step) {
                env.source.editSourceDraft(step.edit, step.text);
            } else if ('advance' in step) {
                await env.time.advance(step.advance);
            } else if ('blur' in step) {
                env.autosave.blurred(step.blur);
                await env.settled();
            } else if ('pageBlur' in step) {
                env.autosave.pageBlurred();
                await env.settled();
            } else if ('mode' in step) {
                env.mode.set(step.mode);
                flushSync();
                await env.settled();
            } else if ('outside' in step) {
                env.outside(KEY, step.outside);
                await env.settled();
            } else if ('silently' in step) {
                env.files.set(KEY, step.silently);
            } else if ('patch' in step) {
                env.states.set('one', { ...(env.states.get('one') as object), ...step.patch });
            } else if ('save' in step) {
                await env.source.saveSourceDraft(step.save, 'fixture', 'a.md');
            } else if ('close' in step) {
                await env.autosave.saveBeforeClose(step.close);
            } else if ('drop' in step) {
                env.autosave.drop(step.drop);
            } else {
                expect(env.sent).toHaveLength(step.sentSoFar);
            }
        }
        await env.settled();
        if (row.sent !== undefined) {
            expect(env.sent).toHaveLength(row.sent.length);
            row.sent.forEach((body, index) => expect(env.sent[index]).toMatchObject(body));
        }
        for (const [key, text] of Object.entries(row.files ?? {})) {
            expect(env.files.get(key)).toBe(text);
        }
        if (row.formatted !== undefined) expect(env.formatted).toHaveBeenCalledTimes(row.formatted);
        for (const [id, dirty] of Object.entries(row.dirty ?? {})) {
            expect(env.source.sourceDirty(id)).toBe(dirty);
        }
        for (const [id, fields] of Object.entries(row.drafts ?? {})) {
            expect(env.source.sourceDraft(id)).toMatchObject(fields);
        }
        env.stop();
    });
});
