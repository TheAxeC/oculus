// Layer 2, client-state tests. The source tab's drafts: the unsaved-text rule a close asks, and
// what a tab does when the file it holds changes on disk (state/sessions/source/source.svelte.ts
// and disk.svelte.ts) over a fake server that holds files by root and path, answers the page's
// reads and saves as the server does, and tells the tabs what the file's channel says.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { TEXT_LIMIT } from '../../../src/lib/data/file-ops.ts';
import { LIFETIME, type SourceDraft } from '../../../src/lib/state/sessions/source/draft.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { hashOf, server } from './source-server.ts';

let client: ClientState;
let editSourceDraft: ClientState['source']['editSourceDraft'];
let sourceDraft: ClientState['source']['sourceDraft'];
let sourceDirty: ClientState['source']['sourceDirty'];
let loadUi: ClientState['ui']['loadUi'];

beforeEach(() => {
    client = createClientState();
    ({ editSourceDraft, sourceDraft, sourceDirty } = client.source);
    ({ loadUi } = client.ui);
});

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

beforeEach(() => loadUi({ getItem: () => null, setItem: noop }));

describe('an untitled source tab', () => {
    it('is unsaved once the reader types, which is what closing it asks about', () => {
        client.source.loadUntitledDraft('one');
        expect(sourceDirty('one')).toBe(false);
        editSourceDraft('one', 'typed');
        expect(sourceDirty('one')).toBe(true);
        expect(client.ui.unsaved('one')).toBe(true);
    });

    it('keeps the typed text when it is opened again', () => {
        client.source.loadUntitledDraft('one');
        editSourceDraft('one', 'typed');
        client.source.loadUntitledDraft('one');
        expect(sourceDraft('one').text).toBe('typed');
    });
});

/** One thing done to the fake server or the store, in the order a row lists them. */
type Step =
    /** A tab over fixture/a.md holding `text` ('one' and a line ending by default) or `bytes`. */
    | { open: string; text?: string; bytes?: Uint8Array }
    | { type: string; text: string }
    | { outside: string | null }
    /** The channel carries this hash, as it does for a file the server did not read. */
    | { said: string }
    /** The file is replaced by a folder, which the channel says as a file that is gone. */
    | { folder: true }
    | { ownWrites: true }
    | { save: string; overwrite?: true }
    | { revert: string }
    | { restore: string; onDisk: string; held: { text: string; saved: string; base: string } };

/** What a row expects once its steps are done and every request is answered. */
type Row = {
    title: string;
    steps: Step[];
    drafts?: Record<string, Partial<SourceDraft>>;
    dirty?: Record<string, boolean>;
    /** The answers of the saves, in the order the steps made them. */
    saved?: boolean[];
    /** The bodies the store sent, in order, each a subset of the body. */
    sent?: Record<string, unknown>[];
    /** The indexes of the bodies that carry no base. */
    unbased?: number[];
    /** What the file holds at the end. */
    file?: string;
    /** The text the first tab's edits record starts from. */
    reachFrom?: string;
    /** The edits record the store hands the editor for the first tab, after the steps. */
    reach?: { from: string; edits: unknown[] };
    /** The save rules of the tab's language: whitespace at a line's end, final newline, format. */
    rules?: { trim: boolean; finalNewline: boolean };
    /** How many times the page read the file. */
    reads?: number;
    /** The rules of the tab's language fail with an error the first time a save asks for them. */
    rulesFailOnce?: true;
    gone?: boolean;
    subscribed?: string[];
};

const KEY = 'fixture/a.md';
const ONE = hashOf('one\n');

/** Nine thousand ASCII bytes and then a Latin-1 e acute, which is no UTF-8. */
const LATIN_1 = new Uint8Array([...new Uint8Array(9000).fill(97), 0xe9, 0x0a]);

/** Ten thousand ASCII bytes and then a NUL byte. */
const WITH_NUL = new Uint8Array([...new Uint8Array(10000).fill(97), 0x00, 0x0a]);

/** A file over the read limit, which the page reads only the first part of. */
const OVER_LIMIT = new Uint8Array(TEXT_LIMIT + 10).fill(97);
const CONFLICT = t('source.save_conflict', 'a.md');

const rows: Row[] = [
    {
        title: 'takes the new text into a clean tab, with its edits, and keeps no unsaved mark',
        steps: [{ open: 'one' }, { outside: 'one\ntwo\n' }],
        drafts: {
            one: {
                text: 'one\ntwo\n',
                saved: 'one\ntwo\n',
                disk: 'same',
                base: hashOf('one\ntwo\n')
            }
        },
        dirty: { one: false },
        reachFrom: 'one\n'
    },
    {
        title: 'keeps the typed text of a dirty tab and marks it changed',
        steps: [
            { open: 'one' },
            { type: 'one', text: 'typed\n' },
            { outside: 'another program\n' }
        ],
        drafts: { one: { text: 'typed\n', disk: 'changed', conflict: false, base: ONE } },
        dirty: { one: true }
    },
    {
        title: 'moves nothing for a message that carries the hash the tab read',
        steps: [{ open: 'one' }, { type: 'one', text: 'typed\n' }, { outside: 'one\n' }],
        drafts: { one: { text: 'typed\n', disk: 'same' } }
    },
    {
        title: 'follows one channel for two tabs over one file: the clean one reads, the dirty one is marked',
        steps: [
            { open: 'one' },
            { open: 'two' },
            { type: 'two', text: 'typed\n' },
            { outside: 'another program\n' }
        ],
        subscribed: [`source:${KEY}`],
        drafts: {
            one: { text: 'another program\n', disk: 'same' },
            two: { text: 'typed\n', disk: 'changed' }
        }
    },
    {
        title: 'refuses the save of a changed file on the base the tab read, and says the conflict',
        steps: [
            { open: 'one' },
            { type: 'one', text: 'typed\n' },
            { outside: 'another program\n' },
            { save: 'one' }
        ],
        saved: [false],
        sent: [{ content: 'typed\n', base: ONE }],
        file: 'another program\n',
        drafts: {
            one: {
                conflict: true,
                disk: 'changed',
                text: 'typed\n',
                message: CONFLICT,
                failed: true
            }
        }
    },
    {
        title: 'writes the tab text over the file with no base when the reader overwrites',
        steps: [
            { open: 'one' },
            { type: 'one', text: 'typed\n' },
            { outside: 'another program\n' },
            { save: 'one' },
            { save: 'one', overwrite: true }
        ],
        saved: [false, true],
        sent: [{ content: 'typed\n', base: ONE }, { content: 'typed\n' }],
        unbased: [1],
        file: 'typed\n',
        drafts: {
            one: { conflict: false, disk: 'same', saved: 'typed\n', base: hashOf('typed\n') }
        }
    },
    {
        title: 'takes the file as the disk holds it now when the reader reverts',
        steps: [
            { open: 'one' },
            { type: 'one', text: 'typed\n' },
            { outside: 'another program\n' },
            { revert: 'one' }
        ],
        drafts: {
            one: {
                text: 'another program\n',
                saved: 'another program\n',
                disk: 'same',
                conflict: false
            }
        },
        dirty: { one: false }
    },
    {
        title: 'marks a tab gone when the file is deleted and keeps its text',
        steps: [{ open: 'one' }, { type: 'one', text: 'typed\n' }, { outside: null }],
        drafts: { one: { text: 'typed\n', disk: 'gone' } },
        gone: true
    },
    {
        title: 'makes the file again when the tab of a deleted file is saved',
        steps: [
            { open: 'one' },
            { type: 'one', text: 'typed\n' },
            { outside: null },
            { save: 'one' }
        ],
        saved: [true],
        sent: [{ create: true, content: 'typed\n', base: ONE }],
        file: 'typed\n',
        drafts: { one: { disk: 'same' } }
    },
    {
        title: 'draws no change for the message of the tab own save, even ahead of the answer',
        steps: [
            { open: 'one' },
            { ownWrites: true },
            { type: 'one', text: 'typed\n' },
            { save: 'one' }
        ],
        saved: [true],
        drafts: {
            one: { text: 'typed\n', saved: 'typed\n', disk: 'same', base: hashOf('typed\n') }
        }
    },
    {
        title: 'serializes the saves of one tab so each sends the hash the save ahead of it answered',
        steps: [
            { open: 'one' },
            { type: 'one', text: 'first\n' },
            { save: 'one' },
            { type: 'one', text: 'second\n' },
            { save: 'one' }
        ],
        saved: [true, true],
        sent: [{ base: ONE }, { base: hashOf('second\n'), content: 'second\n' }],
        file: 'second\n'
    },
    {
        title: 'marks a draft restored with unsaved text over another file than the one it was typed against',
        steps: [
            {
                restore: 'one',
                onDisk: 'other\n',
                held: { text: 'typed\n', saved: 'one\n', base: ONE }
            }
        ],
        drafts: { one: { text: 'typed\n', disk: 'changed' } }
    },
    {
        title: 'marks a draft restored with unsaved text over the same file as it was typed against',
        steps: [
            {
                restore: 'one',
                onDisk: 'one\n',
                held: { text: 'typed\n', saved: 'one\n', base: ONE }
            }
        ],
        drafts: { one: { text: 'typed\n', disk: 'same' } }
    },
    {
        title: 'shows the new text in a draft restored with no unsaved text',
        steps: [
            {
                restore: 'one',
                onDisk: 'new\n',
                held: { text: 'old\n', saved: 'old\n', base: hashOf('old\n') }
            }
        ],
        drafts: { one: { text: 'new\n', disk: 'same' } }
    },
    {
        title: 'hands the editor the smallest edits of a save that trims whitespace',
        rules: { trim: true, finalNewline: false },
        steps: [
            { open: 'one', text: 'a  \nb\n' },
            { type: 'one', text: 'a  \nbb  \n' },
            { save: 'one' }
        ],
        saved: [true],
        file: 'a\nbb\n',
        reach: {
            from: 'a  \nbb  \n',
            edits: [
                {
                    newText: '',
                    range: { start: { line: 0, character: 1 }, end: { line: 0, character: 3 } }
                },
                {
                    newText: '',
                    range: { start: { line: 1, character: 2 }, end: { line: 1, character: 4 } }
                }
            ]
        }
    },
    {
        title: 'says on the tab that a save which threw failed, and sends nothing',
        rulesFailOnce: true,
        steps: [{ open: 'one' }, { type: 'one', text: 'typed\n' }, { save: 'one' }],
        saved: [false],
        sent: [],
        drafts: { one: { text: 'typed\n', message: t('source.save_failed'), failed: true } }
    },
    {
        title: 'goes on with the saves queued behind a save that threw',
        rulesFailOnce: true,
        steps: [
            { open: 'one' },
            { type: 'one', text: 'typed\n' },
            { save: 'one' },
            { save: 'one' }
        ],
        saved: [false, true],
        sent: [{ content: 'typed\n', base: ONE }],
        file: 'typed\n'
    },
    {
        title: 'marks a file that is not UTF-8 text, and sends no save for it',
        steps: [{ open: 'one', bytes: LATIN_1 }, { type: 'one', text: 'typed\n' }, { save: 'one' }],
        saved: [false],
        sent: [],
        drafts: { one: { notText: true, message: t('source.not_text') } }
    },
    {
        title: 'marks a file holding a NUL byte, and sends no save for it',
        steps: [
            { open: 'one', bytes: WITH_NUL },
            { type: 'one', text: 'typed\n' },
            { save: 'one' }
        ],
        saved: [false],
        sent: [],
        drafts: { one: { notText: true, message: t('source.not_text') } }
    },
    {
        title: 'marks the tab gone when a folder takes the place of its file, keeps its text, and says so for a save',
        steps: [
            { open: 'one' },
            { type: 'one', text: 'typed\n' },
            { folder: true },
            { save: 'one' }
        ],
        saved: [false],
        sent: [{ create: true, content: 'typed\n' }],
        drafts: {
            one: {
                disk: 'gone',
                text: 'typed\n',
                conflict: false,
                message: t('source.save_folder', 'a.md'),
                failed: true
            }
        }
    },
    {
        title: 'takes the first message a cut read hears as the state it was read at, and reads nothing',
        steps: [{ open: 'one', bytes: OVER_LIMIT }, { said: 'stat:first' }],
        reads: 1,
        drafts: { one: { truncated: true, disk: 'same' } }
    },
    {
        title: 'reads a cut file again for a message that differs from the last one it heard, once',
        steps: [
            { open: 'one', bytes: OVER_LIMIT },
            { said: 'stat:first' },
            { said: 'stat:second' },
            { said: 'stat:second' }
        ],
        reads: 2,
        drafts: { one: { truncated: true, disk: 'same' } }
    },
    {
        title: 'shows the Save of a draft restored with no base as the conflict, without a request',
        steps: [
            {
                restore: 'one',
                onDisk: 'one\n',
                held: { text: 'typed\n', saved: 'one\n', base: '' }
            },
            { save: 'one' }
        ],
        saved: [false],
        sent: [],
        drafts: { one: { text: 'typed\n', disk: 'changed', conflict: true } }
    }
];

describe('a source tab over a file that changes on disk', () => {
    afterEach(() => vi.unstubAllGlobals());

    it.each(rows)('$title', async (row) => {
        let failures = row.rulesFailOnce === true ? 1 : 0;
        const env = server({
            rules: () => {
                if (failures > 0) {
                    failures -= 1;
                    throw new Error('the rules of the language could not be read');
                }
                return {
                    ...(row.rules ?? { trim: false, finalNewline: false }),
                    formatOnSave: false
                };
            }
        });
        const saves: Promise<boolean>[] = [];
        for (const step of row.steps) {
            if ('open' in step) {
                env.files.set(KEY, step.text ?? 'one\n');
                if (step.bytes !== undefined) env.raw.set(KEY, step.bytes);
                await env.source.loadSourceDraft(step.open, 'fixture', 'a.md');
            } else if ('type' in step) {
                env.source.editSourceDraft(step.type, step.text);
            } else if ('outside' in step) {
                env.outside(KEY, step.outside);
                await env.settled();
            } else if ('said' in step) {
                env.said(KEY, step.said);
                await env.settled();
            } else if ('folder' in step) {
                env.folders.add(KEY);
                env.outside(KEY, null);
                await env.settled();
            } else if ('ownWrites' in step) {
                env.tellOwnWrites();
            } else if ('save' in step) {
                saves.push(
                    env.source.saveSourceDraft(step.save, 'fixture', 'a.md', {
                        overwrite: step.overwrite
                    })
                );
            } else if ('revert' in step) {
                await env.source.revertSourceDraft(step.revert);
            } else {
                env.files.set(KEY, step.onDisk);
                env.states.set(step.restore, {
                    file: KEY,
                    ...step.held,
                    loaded: true,
                    readIn: 'an earlier page'
                });
                expect(LIFETIME).not.toBe('an earlier page');
                await env.source.loadSourceDraft(step.restore, 'fixture', 'a.md');
            }
        }
        const answers = await Promise.all(saves);
        await env.settled();
        if (row.saved !== undefined) expect(answers).toEqual(row.saved);
        if (row.sent !== undefined) {
            expect(env.sent).toHaveLength(row.sent.length);
            row.sent.forEach((body, index) => expect(env.sent[index]).toMatchObject(body));
        }
        for (const index of row.unbased ?? []) expect(env.sent[index]).not.toHaveProperty('base');
        if (row.file !== undefined) expect(env.files.get(KEY)).toBe(row.file);
        for (const [id, fields] of Object.entries(row.drafts ?? {})) {
            expect(env.source.sourceDraft(id)).toMatchObject(fields);
        }
        for (const [id, dirty] of Object.entries(row.dirty ?? {})) {
            expect(env.source.sourceDirty(id)).toBe(dirty);
        }
        if (row.reach !== undefined) expect(env.source.sourceReach('one')).toEqual(row.reach);
        if (row.reads !== undefined) expect(env.fileReads).toHaveLength(row.reads);
        if (row.reachFrom !== undefined)
            expect(env.source.sourceReach('one')?.from).toBe(row.reachFrom);
        if (row.gone !== undefined) expect(env.source.fileGone('fixture', 'a.md')).toBe(row.gone);
        if (row.subscribed !== undefined) expect(env.subscribed).toEqual(row.subscribed);
    });
});
