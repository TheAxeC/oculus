// Showing a path in the file browser: the ask the layout store's showInFiles writes into the Files
// instance of the page the reader is in, the folders state/sources/fs.ts's resolveReveal reads on
// the way and what the path comes to, what an answer writes and when it writes nothing, the rule
// that tells a path from an address on a card, and the store's awaited listing read.
//
// Nothing here touches the network or the real hub: the reader is a stub over synthetic listings,
// and the store's fetch a stub that records what it was asked. What this does NOT cover: the effect
// of views/sources/files/tree/ShowPath.svelte that runs the read and the scroll, and the controls
// pressed on the cards, which need a DOM and are tests/browser/sources/show-in-files.spec.ts. Each
// case names the change that turns it red.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ancestorsOf,
    filesViewOf,
    resolveReveal,
    revealAsked,
    revealScrolled,
    revealSettled,
    rootsUnread,
    type FsEntry,
    type RevealAsk,
    type RevealOutcome
} from '../../../../../src/lib/state/sources/fs.ts';
import { hubPathsOf, normalisePath } from '../../../../../src/lib/state/boards/collection.ts';
import {
    findInstance,
    findView,
    panes,
    tabsOf
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/words/text.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

function file(name: string): FsEntry {
    return { name, kind: 'file', size: 1, mtime: 1 };
}

function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 1 };
}

/** The hub the reader stub answers from: a funding folder holding one scheme folder and a file. */
const LISTINGS: Record<string, FsEntry[]> = {
    'hub:': [dir('funding'), dir('projects'), file('README.md')],
    'hub:funding': [dir('2026-veni'), file('funding.yml')],
    'hub:funding/2026-veni': [file('CALL.md')],
    'hub:projects': [],
    'notes:': [dir('sub')],
    'notes:sub': [file('inner.txt')]
};

/** A reader over LISTINGS that records every folder it was asked for, in order. */
function reader(failing: string[] = []): {
    read: (root: string, path: string) => Promise<{ entries: FsEntry[]; error: string }>;
    asked: string[];
} {
    const asked: string[] = [];
    return {
        asked,
        read: (root: string, path: string) => {
            const key = `${root}:${path}`;
            asked.push(key);
            if (failing.includes(key)) return Promise.resolve({ entries: [], error: 'EACCES' });
            return Promise.resolve({ entries: LISTINGS[key] ?? [], error: '' });
        }
    };
}

const ROOTS = ['hub', 'engine', 'notes'];

describe('the ask showInFiles writes', () => {
    let client: ClientState;

    beforeEach(() => {
        client = createClientState();
    });

    // Revert: in showInFiles of state/workbench/layout/open/show-in-files.ts, open the view with
    // openBeside, or write the ask into an instance id of its own instead of the one openView
    // answered.
    it('opens the Files tab of the page and writes one ask into its own state', () => {
        const before = panes(client.layout.layout()).length;
        const id = client.layout.showInFiles('funding/2026-veni');
        expect(panes(client.layout.layout())).toHaveLength(before);
        expect(id).not.toBe('');
        expect(client.layout.activeInstance()?.id).toBe(id);
        expect(client.layout.activeInstance()?.view).toBe('files');
        expect(filesViewOf(client.ui.instanceState(id)).reveal).toEqual({
            root: 'hub',
            path: 'funding/2026-veni',
            asked: 1,
            settled: false
        });
    });

    // Revert: in showInFiles, call openView with a state carrying an id, so each ask opens a tab.
    it('reuses the Files tab the page already has, and counts the second ask as a later one', () => {
        const first = client.layout.showInFiles('funding');
        client.layout.openView('tasks');
        const second = client.layout.showInFiles('funding/funding.yml');
        expect(second).toBe(first);
        const tabs = tabsOf(client.layout.layout());
        expect(tabs.filter((tab) => tab.view === 'files')).toHaveLength(1);
        expect(filesViewOf(client.ui.instanceState(second)).reveal).toEqual({
            root: 'hub',
            path: 'funding/funding.yml',
            asked: 2,
            settled: false
        });
    });

    // Revert: in showInFiles, open the view on the first page instead of the page in use.
    it('leaves a Files tab on another page alone and opens one on the page in use', () => {
        const away = client.layout.openView('files');
        const first = client.layout.currentPage().id;
        client.layout.openPage('second');
        const id = client.layout.showInFiles('README.md');
        expect(id).not.toBe(away);
        expect(findView(client.layout.layout(first), 'files', null)?.id).toBe(away);
        expect(findView(client.layout.layout(), 'files', null)?.id).toBe(id);
        expect(filesViewOf(client.ui.instanceState(away)).reveal).toBeNull();
    });

    // Revert: in showInFiles of state/workbench/layout/open/show-in-files.ts, drop the restorePanes
    // call.
    it('gives the panes back and activates the Files tab a maximised pane hides, opening no second one', () => {
        const projects = client.layout.openView('projects');
        const files = client.layout.openView('files');
        client.layout.splitInstance(files, [], 'right');
        expect(panes(client.layout.layout())).toHaveLength(2);
        const held = findInstance(client.layout.layout(), projects);
        expect(held).not.toBeNull();
        client.layout.maximisePane(held?.path ?? []);
        expect(client.layout.focused()).not.toBeNull();

        const id = client.layout.showInFiles('funding');
        expect(id).toBe(files);
        expect(tabsOf(client.layout.layout()).filter((tab) => tab.view === 'files')).toHaveLength(
            1
        );
        expect(client.layout.focused()).toBeNull();
        expect(client.layout.activeInstance()?.id).toBe(files);
        expect(filesViewOf(client.ui.instanceState(files)).reveal?.path).toBe('funding');
    });

    // Revert: in showInFiles of state/workbench/layout/open/show-in-files.ts, give the panes back
    // whenever the page's first Files tab is outside the maximised pane, whatever that pane holds.
    it('keeps a maximised pane that holds a Files tab of its own and shows the path there', () => {
        client.layout.openView('files');
        const projects = client.layout.openView('projects');
        client.layout.splitInstance(projects, [], 'right');
        const held = findInstance(client.layout.layout(), projects);
        expect(held).not.toBeNull();
        client.layout.maximisePane(held?.path ?? []);
        const inside = client.layout.openView('files');
        expect(findInstance(client.layout.layout(), inside)?.path).toEqual(held?.path);

        const id = client.layout.showInFiles('funding');
        expect(id).toBe(inside);
        expect(client.layout.focused()).not.toBeNull();
        expect(filesViewOf(client.ui.instanceState(inside)).reveal?.path).toBe('funding');
    });

    // Revert: in revealAsked of state/sources/fs.ts, keep the filter and the last outcome as they
    // were, or drop the keys the instance already held.
    it('keeps what the tab held, clears its filter and the last outcome, and names the root given', () => {
        const id = client.layout.openView('files');
        client.ui.setInstanceState(id, {
            expanded: ['hub:'],
            filter: 'veni',
            collapsed: ['notes'],
            revealed: { kind: 'missing', asked: { root: 'hub', path: 'x' }, shown: null },
            revealing: 4
        });
        client.layout.showInFiles('./sub//inner.txt/', 'notes');
        const view = filesViewOf(client.ui.instanceState(id));
        expect(view.expanded).toEqual(['hub:']);
        expect(view.collapsed).toEqual(['notes']);
        expect(view.filter).toBe('');
        expect(view.revealed).toBeNull();
        expect(view.reveal).toEqual({
            root: 'notes',
            path: 'sub/inner.txt',
            asked: 5,
            settled: false
        });
    });

    // Revert: in askOf of state/sources/fs.ts, accept an empty root key.
    it('holds no ask for an empty root key, which names no root', () => {
        const id = client.layout.showInFiles('README.md', '');
        expect(filesViewOf(client.ui.instanceState(id)).reveal).toBeNull();
    });
});

describe('the folders read on the way and what the path comes to', () => {
    // Revert: in resolveReveal, read every folder on the way first, the deepest first.
    it('reads a folder only after the one above it said the next name is a folder, outermost first', async () => {
        const stub = reader();
        const outcome = await resolveReveal(
            { root: 'hub', path: 'funding/2026-veni' },
            ROOTS,
            stub.read
        );
        expect(stub.asked).toEqual(['hub:', 'hub:funding']);
        expect(outcome).toEqual({
            kind: 'found',
            asked: { root: 'hub', path: 'funding/2026-veni' },
            shown: { root: 'hub', path: 'funding/2026-veni' },
            error: ''
        });
    });

    // Revert: in resolveReveal, require the last name to be a folder too.
    it('finds a file as it finds a folder', async () => {
        const stub = reader();
        const outcome = await resolveReveal(
            { root: 'hub', path: 'funding/2026-veni/CALL.md' },
            ROOTS,
            stub.read
        );
        expect(outcome.kind).toBe('found');
        expect(stub.asked).toEqual(['hub:', 'hub:funding', 'hub:funding/2026-veni']);
    });

    // Revert: in resolveReveal, answer `found` with the path asked whatever the listings hold, or
    // read every folder on the way before looking at the names.
    it('shows the nearest folder on the way to a path that is not there, and reads nothing past it', async () => {
        const stub = reader();
        const outcome = await resolveReveal(
            { root: 'hub', path: 'funding/2025-gone/CALL.md' },
            ROOTS,
            stub.read
        );
        expect(outcome).toEqual({
            kind: 'missing',
            asked: { root: 'hub', path: 'funding/2025-gone/CALL.md' },
            shown: { root: 'hub', path: 'funding' },
            error: ''
        });
        expect(stub.asked).toEqual(['hub:', 'hub:funding']);
    });

    // Revert: in resolveReveal, drop the `entry.kind !== 'dir'` test for a name that is not the
    // last.
    it('does not walk through a file as if it were a folder', async () => {
        const outcome = await resolveReveal(
            { root: 'hub', path: 'README.md/inside' },
            ROOTS,
            reader().read
        );
        expect(outcome.kind).toBe('missing');
        expect(outcome.shown).toEqual({ root: 'hub', path: '' });
    });

    // Revert: in resolveReveal, treat a listing error as an empty folder.
    it('says a folder on the way could not be read, and shows that folder', async () => {
        const outcome = await resolveReveal(
            { root: 'hub', path: 'funding/2026-veni/CALL.md' },
            ROOTS,
            reader(['hub:funding']).read
        );
        expect(outcome).toEqual({
            kind: 'unread',
            asked: { root: 'hub', path: 'funding/2026-veni/CALL.md' },
            shown: { root: 'hub', path: 'funding' },
            error: 'EACCES'
        });
    });

    // Revert: in resolveReveal, drop the roots check.
    it('shows nothing for a root the workspace does not have, and reads nothing', async () => {
        const stub = reader();
        const outcome = await resolveReveal({ root: 'gone', path: 'a/b' }, ROOTS, stub.read);
        expect(outcome).toEqual({
            kind: 'no-root',
            asked: { root: 'gone', path: 'a/b' },
            shown: null,
            error: ''
        });
        expect(stub.asked).toEqual([]);
    });

    // Revert: in resolveReveal, read the root's listing for the root's own line.
    it("answers a path under another root from that root's listings, and a root's own line at once", async () => {
        const stub = reader();
        const inner = await resolveReveal(
            { root: 'notes', path: 'sub/inner.txt' },
            ROOTS,
            stub.read
        );
        expect(inner.kind).toBe('found');
        expect(stub.asked).toEqual(['notes:', 'notes:sub']);
        const own = await resolveReveal({ root: 'notes', path: '' }, ROOTS, stub.read);
        expect(own.kind).toBe('found');
        expect(stub.asked).toHaveLength(2);
    });

    // Revert: in ancestorsOf, include the row itself.
    it('names the folders a row sits under, outermost first, and none for a root line', () => {
        expect(ancestorsOf({ root: 'hub', path: 'a/b/c' })).toEqual([
            { root: 'hub', path: '' },
            { root: 'hub', path: 'a' },
            { root: 'hub', path: 'a/b' }
        ]);
        expect(ancestorsOf({ root: 'hub', path: '' })).toEqual([]);
    });
});

describe('what an answer writes', () => {
    const ask: RevealAsk = { root: 'hub', path: 'funding/2026-veni', asked: 3, settled: false };
    const found: RevealOutcome = {
        kind: 'found',
        asked: { root: 'hub', path: 'funding/2026-veni' },
        shown: { root: 'hub', path: 'funding/2026-veni' },
        error: ''
    };

    // Revert: in revealSettled, open the row shown too, or replace the open folders with its
    // ancestors.
    it('opens the folders above the row, keeps the ones already open, selects the row and waits for the scroll', () => {
        const now = filesViewOf({ expanded: ['notes:', 'hub:'], reveal: ask, revealing: 3 });
        expect(revealSettled(now, ask, found)).toEqual({
            expanded: ['notes:', 'hub:', 'hub:funding'],
            selected: { root: 'hub', path: 'funding/2026-veni' },
            reveal: { ...ask, settled: true },
            revealed: null
        });
    });

    // Revert: in revealSettled, clear `revealed` whatever the outcome.
    it('keeps the outcome of a path not found, for the line that says so', () => {
        const now = filesViewOf({ reveal: ask, revealing: 3 });
        const missing: RevealOutcome = {
            ...found,
            kind: 'missing',
            shown: { root: 'hub', path: 'funding' }
        };
        expect(revealSettled(now, ask, missing)).toMatchObject({
            selected: { root: 'hub', path: 'funding' },
            revealed: missing
        });
        const none: RevealOutcome = { ...found, kind: 'no-root', shown: null };
        expect(revealSettled(now, ask, none)).toEqual({ reveal: null, revealed: none });
    });

    // Revert: in rootsUnread of state/sources/fs.ts, answer a `no-root` outcome, or drop the error.
    it('answers an ask made while the roots could not be read at once, with the reason, and leaves nothing to answer later', () => {
        const now = filesViewOf({ reveal: ask, revealing: 3 });
        const next = revealSettled(now, ask, rootsUnread(ask, 'EACCES'));
        expect(next).toEqual({
            reveal: null,
            revealed: {
                kind: 'no-roots',
                asked: { root: 'hub', path: 'funding/2026-veni' },
                shown: null,
                error: 'EACCES'
            }
        });
        const after = filesViewOf({ ...now, ...next });
        expect(after.revealed?.kind).toBe('no-roots');
        expect(revealSettled(after, ask, found)).toBeNull();
    });

    // Revert: in revealSettled, drop the sameAsk test.
    it('writes nothing for an answer a later ask superseded', () => {
        const later = filesViewOf({
            reveal: { ...ask, path: 'README.md', asked: 4 },
            revealing: 4
        });
        expect(revealSettled(later, ask, found)).toBeNull();
        const same = filesViewOf({ reveal: { ...ask, asked: 4 }, revealing: 4 });
        expect(revealSettled(same, ask, found)).toBeNull();
    });

    // Revert: in revealSettled, fall back to writing when the instance holds no ask.
    it('writes nothing once the tab is closed, whose record is gone', () => {
        expect(revealSettled(filesViewOf(undefined), ask, found)).toBeNull();
    });

    // Revert: in revealSettled, compare the asks without `settled`.
    it('writes nothing for a second reading of an ask another mount already settled', () => {
        const settled = filesViewOf({ reveal: { ...ask, settled: true }, revealing: 3 });
        expect(revealSettled(settled, ask, found)).toBeNull();
    });

    // Revert: in revealScrolled, clear the ask whatever it is.
    it('clears the ask after the scroll only while the instance holds that settled ask', () => {
        const done = { ...ask, settled: true };
        expect(revealScrolled(filesViewOf({ reveal: done }), done)).toEqual({ reveal: null });
        expect(revealScrolled(filesViewOf({ reveal: ask }), ask)).toBeNull();
        expect(revealScrolled(filesViewOf({ reveal: { ...done, asked: 4 } }), done)).toBeNull();
        expect(revealScrolled(filesViewOf(undefined), done)).toBeNull();
    });

    // Revert: in askOf or outcomeOf of state/sources/fs.ts, take the record as it is.
    it('reads an ask and an outcome out of a saved record, and nothing out of anything else', () => {
        expect(
            filesViewOf({ reveal: { root: 'hub', path: 'a', asked: 0, settled: false } }).reveal
        ).toBeNull();
        expect(filesViewOf({ reveal: { root: 'hub', path: 'a', asked: 2 } }).reveal).toBeNull();
        expect(filesViewOf({ reveal: ['hub', 'a'] }).reveal).toBeNull();
        expect(
            filesViewOf({ revealed: { kind: 'lost', asked: { root: 'hub', path: 'a' } } }).revealed
        ).toBeNull();
        expect(filesViewOf({ revealed: { kind: 'missing', asked: 'a' } }).revealed).toBeNull();
        expect(filesViewOf({ revealing: -1 }).revealing).toBe(0);
        expect(
            filesViewOf({
                revealed: {
                    kind: 'unread',
                    asked: { root: 'hub', path: 'a/b' },
                    shown: { root: 'hub', path: 'a' },
                    error: 'EACCES'
                }
            }).revealed
        ).toEqual({
            kind: 'unread',
            asked: { root: 'hub', path: 'a/b' },
            shown: { root: 'hub', path: 'a' },
            error: 'EACCES'
        });
    });

    // Revert: in revealAsked, start the count again at 1 when no ask is held.
    it('counts asks on across a cleared ask, so an old answer never matches a new ask of the same path', () => {
        const once = revealAsked({ revealing: 7, reveal: null }, 'funding');
        expect(filesViewOf(once).reveal?.asked).toBe(8);
    });
});

describe('a path told from an address', () => {
    // Revert: in hubPathsOf of state/boards/collection.ts, test for `://` alone, or leave `url` out
    // of PATH_FIELDS.
    it('takes a hub path from `link`, `url` and `folder`, and no address, absolute path or other field', () => {
        expect(hubPathsOf({ link: 'funding/2026-veni' })).toEqual(['funding/2026-veni']);
        expect(hubPathsOf({ url: 'network/flta-2025/deck.html' })).toEqual([
            'network/flta-2025/deck.html'
        ]);
        expect(hubPathsOf({ folder: 'education/student-supervision/ward-2024' })).toEqual([
            'education/student-supervision/ward-2024'
        ]);
        expect(hubPathsOf({ link: 'https://example.org/call' })).toEqual([]);
        expect(hubPathsOf({ url: 'https://example.org/call' })).toEqual([]);
        expect(hubPathsOf({ link: 'mailto:someone@example.org' })).toEqual([]);
        expect(hubPathsOf({ link: '/Users/someone/elsewhere' })).toEqual([]);
        expect(hubPathsOf({ note: 'funding/x', sub: 'funding/y' })).toEqual([]);
        expect(hubPathsOf({ link: 3, folder: ['a'] })).toEqual([]);
    });

    // Revert: drop the `!HOSTED.test(value)` term from isHubPath of state/boards/collection.ts.
    it('takes no path from a `url` that is a web address written without a scheme', () => {
        expect(hubPathsOf({ url: 'github.com/x' })).toEqual([]);
        expect(hubPathsOf({ url: 'www.example.org' })).toEqual([]);
        expect(hubPathsOf({ url: 'projects/active/x/README.md' })).toEqual([
            'projects/active/x/README.md'
        ]);
    });

    // Revert: drop the `path === ''` test in hubPathsOf, or the dedupe.
    it('takes no path from an empty value, and one from two values naming the same place', () => {
        expect(hubPathsOf({ link: '' })).toEqual([]);
        expect(hubPathsOf({ link: './' })).toEqual([]);
        expect(hubPathsOf({ link: 'funding/x/', folder: './funding//x' })).toEqual(['funding/x']);
        expect(hubPathsOf({ link: 'funding/x', folder: 'funding/y' })).toEqual([
            'funding/x',
            'funding/y'
        ]);
    });

    // Revert: drop the `..` tests in hubPathsOf, so a value climbing above the hub counts.
    it('takes no path from a value that climbs above the hub, and one that climbs back into it', () => {
        expect(hubPathsOf({ link: '../outside/secret.txt' })).toEqual([]);
        expect(hubPathsOf({ link: 'network/../../outside' })).toEqual([]);
        expect(hubPathsOf({ link: '..' })).toEqual([]);
        expect(hubPathsOf({ link: 'network/../funding/funding.yml' })).toEqual([
            'funding/funding.yml'
        ]);
    });

    // Revert: in normalisePath of state/boards/collection.ts, keep the `..` segments as they are,
    // or keep the empty and `.` ones.
    it('addresses a path by its segments, each `..` taking the one before it away', () => {
        expect(normalisePath('./funding//x/')).toBe('funding/x');
        expect(normalisePath('')).toBe('');
        expect(normalisePath('network/../funding/funding.yml')).toBe('funding/funding.yml');
        expect(normalisePath('a/b/../../c')).toBe('c');
        expect(normalisePath('../a')).toBe('../a');
        expect(normalisePath('a/../../b')).toBe('../b');
    });

    // Revert: in revealAsked of state/sources/fs.ts, ask for the path as it was given.
    it('asks for a path through `..` by the file it names, and for one above its root at the root', async () => {
        const through = filesViewOf(revealAsked({}, 'network/../funding/funding.yml')).reveal;
        expect(through).toMatchObject({ root: 'hub', path: 'funding/funding.yml' });
        const stub = reader();
        const found = await resolveReveal(
            { root: 'hub', path: through?.path ?? '' },
            ROOTS,
            stub.read
        );
        expect(found.kind).toBe('found');
        const above = filesViewOf(revealAsked({}, 'network/../../outside/secret.txt')).reveal;
        expect(above?.path).toBe('../outside/secret.txt');
        const climbing = reader();
        const outcome = await resolveReveal(
            { root: 'hub', path: above?.path ?? '' },
            ROOTS,
            climbing.read
        );
        expect(outcome).toMatchObject({ kind: 'missing', shown: { root: 'hub', path: '' } });
        expect(climbing.asked).toEqual(['hub:']);
    });
});

describe("the store's awaited listing read", () => {
    let client: ClientState;
    let asked: string[] = [];

    function answering(entries: FsEntry[]): void {
        asked = [];
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            return Promise.resolve(
                new Response(JSON.stringify({ entries }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                })
            );
        });
    }

    beforeEach(() => {
        vi.stubGlobal('window', {});
        client = createClientState();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // Revert: in readListing of state/sources/fs.svelte.ts, call loadListing directly rather than
    // askListing.
    it("shares one request with a render's read of the same folder, and asks nothing for a folder held", async () => {
        answering([file('a.txt')]);
        expect(client.fs.listing('hub', 'funding').loading).toBe(true);
        const read = await client.fs.readListing('hub', 'funding');
        expect(read.entries.map((one) => one.name)).toEqual(['a.txt']);
        expect(asked).toHaveLength(1);
        await client.fs.readListing('hub', 'funding');
        expect(asked).toHaveLength(1);
        expect(client.fs.listing('hub', 'funding').loading).toBe(false);
    });

    // Revert: in loadListing, return nothing when the round moved, so the awaited read answers
    // empty.
    it('answers what the server said even when a newer round began meanwhile', async () => {
        answering([file('b.txt')]);
        const pending = client.fs.readListing('hub', '');
        client.fs.invalidate();
        const read = await pending;
        expect(read.entries.map((one) => one.name)).toEqual(['b.txt']);
        expect(client.fs.heldEntries('hub', '')).toBeNull();
    });

    // Revert: drop the online() test in readListing.
    it('asks nothing where there is no page, and says so', async () => {
        vi.unstubAllGlobals();
        answering([file('c.txt')]);
        const fresh = createClientState();
        const read = await fresh.fs.readListing('hub', '');
        expect(asked).toEqual([]);
        expect(read.error).toBe(catalog['files.read_offline']);
    });
});
