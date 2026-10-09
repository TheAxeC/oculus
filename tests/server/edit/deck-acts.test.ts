// Layer 2, server test. The acts of the `deck-edit` write over the files of one deck: New,
// Duplicate and Delete Slide, an image dropped on a slide, a deck made in a folder and a deck made
// from an outline. Each act changes the files it names and no other byte, a request over a file
// that is not what the page read is refused with nothing written, a path outside the served roots
// is refused, and every act is taken back from the change log with every file it changed.
//
// The hub is a temporary directory (deckTarget); the Trash is a folder of that directory, handed in
// as the writer's `trash`, so no case moves a file to the reader's own Trash.
// @module-tag slow: each act is written and then taken back through the change log and the Trash.

import { mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { describe, expect } from 'vitest';
import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, test } from '../../fixtures/scratch.ts';
import {
    TOKEN,
    changesOf,
    deckTarget,
    request,
    warmConfig
} from '../../routes/edit/write-fixture.ts';

test.beforeAll(warmConfig);

const DECK = 'talk';
const ORDER_FILE = `${DECK}/present.yml`;
const PRESENT =
    '# the talk\ndeck:\n    title: A talk\n\norder:\n    - engine.md\n    - closing.md\n';
const ENGINE = '# Engine\n\nOne slide.\n';
const CLOSING = '---\nkind: closing\n---\n# Thanks\n';

/** A deck target that holds the deck `talk` and a Trash folder the writer moves files to. */
function made(): { into: WriteTarget; trash: (path: string) => Promise<void> } {
    const into = deckTarget();
    mkdirSync(join(into.hub, DECK), { recursive: true });
    writeFileSync(join(into.hub, ORDER_FILE), PRESENT);
    writeFileSync(join(into.hub, DECK, 'engine.md'), ENGINE);
    writeFileSync(join(into.hub, DECK, 'closing.md'), CLOSING);
    const bin = join(into.hub, '.trash');
    mkdirSync(bin);
    return {
        into,
        trash: (path) => {
            renameSync(path, join(bin, `${readdirSync(bin).length}-${basename(path)}`));
            return Promise.resolve();
        }
    };
}

type Answer = { changed?: string[]; refused?: { reason: string }[] };

/** One request to the write route, with the Trash handed in. */
async function sent(
    held: ReturnType<typeof made>,
    body: unknown
): Promise<{ status: number; answer: Answer }> {
    const response = await handleWrite(request(body), TOKEN, held.into, { trash: held.trash });
    return { status: response.status, answer: (await response.json()) as Answer };
}

/** The undo of the change at `at`. */
async function undoneAt(held: ReturnType<typeof made>, at: string): Promise<Answer> {
    const response = await handleWrite(request({ kind: 'undo', at }), TOKEN, held.into, {
        trash: held.trash
    });
    expect(response.status).toBe(200);
    return (await response.json()) as Answer;
}

/**
 * Every file under the hub's folders, by its path and its text, the Trash and the machine's own
 * state files left out.
 */
function files(held: ReturnType<typeof made>): Record<string, string> {
    const state = new Set(
        [
            held.into.bookmarks,
            held.into.behaviorFile,
            held.into.layoutFile,
            held.into.overrides,
            held.into.changes?.file
        ].filter((one) => one !== undefined)
    );
    const found: Record<string, string> = {};
    const walk = (dir: string): void => {
        for (const name of readdirSync(dir)) {
            const path = join(dir, name);
            if (name === '.trash' || name === '.undo' || state.has(path)) continue;
            if (statSync(path).isDirectory()) walk(path);
            else found[relative(held.into.hub, path)] = readFileSync(path, 'latin1');
        }
    };
    walk(held.into.hub);
    return found;
}

/** What `after` holds that `before` does not hold as it is: the paths of files added or changed. */
function touched(before: Record<string, string>, after: Record<string, string>): string[] {
    return Object.keys(after)
        .filter((path) => before[path] !== after[path])
        .sort();
}

const BASE = { kind: 'deck-edit', root: 'hub', path: ORDER_FILE };

describe('the acts of the deck write', () => {
    it('changes the files each act names and no other byte, and refuses a request over a file that is not what the page read', async () => {
        const held = made();
        const start = files(held);
        const NEW = '---\nkind: text\n---\n# New slide\n';

        const added = await sent(held, { ...BASE, act: 'new', after: 'engine.md#0' });
        expect(added.answer.changed).toEqual(['talk/slide-1.md', ORDER_FILE]);
        let now = files(held);
        expect(touched(start, now)).toEqual(['talk/present.yml', 'talk/slide-1.md']);
        expect(now['talk/slide-1.md']).toBe(NEW);
        expect(now[ORDER_FILE]).toBe(
            PRESENT.replace('    - closing.md', '    - slide-1.md\n    - closing.md')
        );

        const second = await sent(held, { ...BASE, act: 'new' });
        expect(second.answer.changed).toEqual(['talk/slide-2.md', ORDER_FILE]);
        now = files(held);
        expect(now[ORDER_FILE]).toMatch(/- closing\.md\n {4}- slide-2\.md\n$/);

        const copied = await sent(held, {
            ...BASE,
            act: 'duplicate',
            slide: 'engine.md#0',
            base: ENGINE
        });
        expect(copied.answer.changed).toEqual(['talk/engine-copy.md', ORDER_FILE]);
        now = files(held);
        expect(now['talk/engine-copy.md']).toBe(ENGINE);
        expect(now[ORDER_FILE]).toContain('    - engine.md\n    - engine-copy.md\n');

        const stale = await sent(held, {
            ...BASE,
            act: 'delete',
            slide: 'slide-1.md#0',
            base: '# not what the file holds\n'
        });
        expect(stale.answer.changed).toEqual([]);
        expect(stale.answer.refused?.map((one) => one.reason)).toEqual([
            'The file talk/slide-1.md changed on disk while you were working. Read the deck again and make the change again.'
        ]);
        expect(files(held)).toEqual(now);

        const removed = await sent(held, {
            ...BASE,
            act: 'delete',
            slide: 'slide-1.md#0',
            base: NEW
        });
        expect(removed.answer.changed).toEqual(['talk/slide-1.md', ORDER_FILE]);
        const after = files(held);
        expect(after['talk/slide-1.md']).toBeUndefined();
        expect(after[ORDER_FILE]).toBe(now[ORDER_FILE].replace('    - slide-1.md\n', ''));
        expect(readdirSync(join(held.into.hub, '.trash'))).toEqual(['0-slide-1.md']);
    });

    it('copies a dropped image beside the slide and links it, under a free name, and refuses what is no image or no name', async () => {
        const held = made();
        const drop = (name: string): Promise<{ status: number; answer: Answer }> =>
            sent(held, {
                ...BASE,
                act: 'image',
                slide: 'engine.md#0',
                base: files(held)['talk/engine.md'],
                name,
                data: 'AAAA'
            });
        const first = await drop('fig.png');
        expect(first.answer.changed).toEqual(['talk/fig.png', 'talk/engine.md']);
        expect(readFileSync(join(held.into.hub, 'talk', 'fig.png')).length).toBe(3);
        expect(files(held)['talk/engine.md']).toBe(`${ENGINE}\n![fig](fig.png)\n`);
        const again = await drop('fig.png');
        expect(again.answer.changed).toEqual(['talk/fig-2.png', 'talk/engine.md']);
        const spaced = await drop('my fig.png');
        expect(spaced.answer.changed).toEqual(['talk/my fig.png', 'talk/engine.md']);
        expect(files(held)['talk/engine.md']).toContain('![my fig](my%20fig.png)\n');
        const hashed = await drop('fig#1.png');
        expect(hashed.answer.changed).toEqual(['talk/fig#1.png', 'talk/engine.md']);
        expect(files(held)['talk/engine.md']).toContain('![fig#1](fig%231.png)\n');
        const bracketed = await drop('fig(1).png');
        expect(bracketed.answer.changed).toEqual(['talk/fig(1).png', 'talk/engine.md']);
        expect(files(held)['talk/engine.md']).toContain('![fig(1)](fig%281%29.png)\n');

        const before = files(held);
        for (const name of ['../x.png', 'paper.pdf']) {
            const refused = await drop(name);
            expect(refused.answer.changed, name).toEqual([]);
            expect(refused.answer.refused, name).toHaveLength(1);
        }
        expect(files(held)).toEqual(before);
    });

    it('makes a deck in an existing folder with the title as the text of the file and refuses an empty title and a folder that holds a deck', async () => {
        const held = made();
        mkdirSync(join(held.into.hub, 'fresh'));
        const create = (title: string): Promise<{ status: number; answer: Answer }> =>
            sent(held, { kind: 'deck-edit', act: 'create', root: 'hub', folder: 'fresh', title });
        const empty = await create('  ');
        expect(empty.answer.refused?.map((one) => one.reason)).toEqual([
            'A presentation needs a title'
        ]);
        expect(files(held)['fresh/present.yml']).toBeUndefined();

        const made1 = await create("Axel's talk");
        expect(made1.answer.changed).toEqual(['fresh/present.yml', 'fresh/closing.md']);
        const now = files(held);
        expect(now['fresh/present.yml']).toContain("title: 'Axel''s talk'");
        expect(now['fresh/present.yml']).toMatch(/order:\n\s+- closing\.md\n$/);
        expect(now['fresh/closing.md']).toContain('kind: closing');
        expect(now['fresh/closing.md']).toContain("# Axel's talk");
        const twice = await create('Another');
        expect(twice.answer.refused?.map((one) => one.reason)).toEqual([
            'The folder fresh already holds a present.yml'
        ]);
        expect(files(held)).toEqual(now);
    });

    it('makes a deck beside an outline file and leaves the file as it was', async () => {
        const held = made();
        const outline = 'intro line\n\n# A\n\n```\n# not a heading\n```\n\n## B\n\n# C\n';
        writeFileSync(join(held.into.hub, 'notes.md'), outline);
        const start = files(held);
        const made1 = await sent(held, {
            kind: 'deck-edit',
            act: 'outline',
            root: 'hub',
            file: 'notes.md'
        });
        expect(made1.answer.changed).toEqual([
            'notes-slides/present.yml',
            'notes-slides/slides.md',
            'notes-slides/closing.md'
        ]);
        const now = files(held);
        expect(touched(start, now)).toEqual([
            'notes-slides/closing.md',
            'notes-slides/present.yml',
            'notes-slides/slides.md'
        ]);
        expect(now['notes.md']).toBe(outline);
    });
});

describe('taking an act of the deck write back', () => {
    it('puts every file an act changed back, and the files it made go to the Trash', async () => {
        const held = made();
        mkdirSync(join(held.into.hub, 'fresh'));
        writeFileSync(join(held.into.hub, 'notes.md'), '# A\n\ntext\n');
        const acts: { act: string; body: unknown }[] = [
            { act: 'new', body: { ...BASE, act: 'new', after: 'engine.md#0' } },
            {
                act: 'duplicate',
                body: { ...BASE, act: 'duplicate', slide: 'closing.md#0', base: CLOSING }
            },
            {
                act: 'delete',
                body: { ...BASE, act: 'delete', slide: 'closing.md#0', base: CLOSING }
            },
            {
                act: 'image',
                body: {
                    ...BASE,
                    act: 'image',
                    slide: 'engine.md#0',
                    base: ENGINE,
                    name: 'fig.png',
                    data: 'AAAA'
                }
            },
            {
                act: 'create',
                body: { kind: 'deck-edit', act: 'create', root: 'hub', folder: 'fresh', title: 'T' }
            },
            {
                act: 'outline',
                body: { kind: 'deck-edit', act: 'outline', root: 'hub', file: 'notes.md' }
            }
        ];
        for (const { act, body } of acts) {
            const before = files(held);
            const done = await sent(held, body);
            expect(done.answer.changed?.length, act).toBeGreaterThan(0);
            expect(files(held), act).not.toEqual(before);
            const undone = await undoneAt(held, changesOf(held.into)[0].at);
            expect(undone.refused, act).toEqual([]);
            expect(files(held), act).toEqual(before);
        }
    });
});

describe('taking an act back when the Trash fails', () => {
    it('leaves every file as the act left it, and a later undo works once the Trash does', async () => {
        const held = made();
        await sent(held, { ...BASE, act: 'new', after: 'engine.md#0' });
        const afterAct = files(held);
        const at = changesOf(held.into)[0].at;
        const failing = await handleWrite(request({ kind: 'undo', at }), TOKEN, held.into, {
            trash: () => Promise.reject(new Error('no Trash on this volume'))
        });
        expect(failing.status).not.toBe(200);
        expect(files(held)).toEqual(afterAct);
        const retried = await undoneAt(held, at);
        expect(retried.refused).toEqual([]);
        expect(Object.keys(files(held))).not.toContain(join(DECK, 'slide-1.md'));
        expect(files(held)[ORDER_FILE]).toBe(PRESENT);
    });
});

describe('the deck write and the served roots', () => {
    it('refuses a path outside the roots in every act, and writes nothing', async () => {
        const held = made();
        const before = files(held);
        const logged = changesOf(held.into).length;
        const outside = 'That path is outside the folders oculus serves';
        const bodies: { row: string; body: unknown; reason: string }[] = [
            {
                row: 'new on a deck that leaves the root',
                body: { kind: 'deck-edit', act: 'new', root: 'hub', path: '../../etc/present.yml' },
                reason: outside
            },
            {
                row: 'delete in a root nothing serves',
                body: {
                    ...BASE,
                    act: 'delete',
                    root: 'nowhere',
                    slide: 'engine.md#0',
                    base: ENGINE
                },
                reason: outside
            },
            {
                row: 'an image over a path that climbs out',
                body: {
                    kind: 'deck-edit',
                    act: 'image',
                    root: 'hub',
                    path: 'talk/../../present.yml',
                    slide: 'engine.md#0',
                    base: ENGINE,
                    name: 'a.png',
                    data: 'AAAA'
                },
                reason: outside
            },
            {
                row: 'a deck made in a folder outside the roots',
                body: {
                    kind: 'deck-edit',
                    act: 'create',
                    root: 'hub',
                    folder: '../elsewhere',
                    title: 'T'
                },
                reason: outside
            },
            {
                row: 'an outline of a file outside the roots',
                body: { kind: 'deck-edit', act: 'outline', root: 'hub', file: '../x.md' },
                reason: outside
            }
        ];
        for (const { row, body, reason } of bodies) {
            const { answer } = await sent(held, body);
            expect(answer.changed, row).toEqual([]);
            expect(
                answer.refused?.map((one) => one.reason),
                row
            ).toEqual([reason]);
        }
        expect(files(held)).toEqual(before);
        expect(changesOf(held.into)).toHaveLength(logged);
    });
});
