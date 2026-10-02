// The Repositories store against the route it posts to: every git action the store sends is read
// back through the route's own body shape (gitBodyShape) and its action table (OPERATIONS of
// server/git/git-routes.ts), and each field the server's action reads is looked for in the body the
// store built. A field name the two sides spell differently fails here, which a test of the store
// alone and a test of the route alone cannot see.
//
// What this does NOT cover: what an action does with a field it finds, which tests/routes/git and
// tests/server/git hold, and the fields an action reads only when the page has a value for them
// (OPTIONAL).

import { describe, expect, it } from 'vitest';
import { createRepositories } from '../../../../../src/lib/state/sources/repositories/repositories.svelte.ts';
import { ACTIONS, OPERATIONS, gitBodyShape } from '../../../../../src/lib/server/git/git-routes.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { layoutRecorder } from '../layout-recorder.ts';
import type { TerminalsStore } from '../../../../../src/lib/state/sessions/terminals.svelte.ts';
import type {
    WriteAnswer,
    WritesStore
} from '../../../../../src/lib/state/client/writes.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const ROOT = '/hub';

/** The fields an action reads that the page leaves out when it has no value for them. */
const OPTIONAL = new Set(['start', 'amend']);

type Sent = { action: string; fields: Record<string, unknown> };

/** Every body the store builds, one per action, by calling each method that sends one. */
async function bodies(): Promise<Sent[]> {
    const sent: Sent[] = [];
    const writes = {
        writeGit: (action: string, _root: string, fields: Record<string, unknown> = {}) => {
            sent.push({ action, fields });
            const answer: WriteAnswer = { ok: true, changed: [], refused: [], output: '' };
            return Promise.resolve(answer);
        }
    } as unknown as WritesStore;
    const terminals = {
        startTerminal: () => Promise.resolve({ ok: false, id: '', error: '' }),
        showTerminal: () => undefined
    } as unknown as TerminalsStore;
    const access = {
        served: () => [{ key: 'hub', dir: ROOT }],
        instanceState: () => undefined,
        setInstanceState: () => undefined
    };
    const store = createRepositories(writes, terminals, layoutRecorder([]), access);
    const R = ROOT;
    await store.suggest(R);
    await store.stagePaths(R, ['a.txt']);
    await store.unstagePaths(R, ['a.txt']);
    await store.discardPaths(R, ['a.txt']);
    await store.applyPatch(R, 'diff', 'stage');
    await store.applyPatch(R, 'diff', 'unstage');
    await store.applyPatch(R, 'diff', 'revert');
    await store.stageAll(R, 'changed');
    await store.unstageAll(R);
    await store.discardAll(R);
    await store.commit(R, 'amend', 'message');
    await store.push(R);
    await store.pull(R);
    await store.fetch(R);
    await store.sync(R);
    await store.publish(R, 'origin');
    await store.createBranch(R, 'topic', 'abc1234');
    await store.switchBranch(R, 'topic');
    await store.createWorktree(R, 'side');
    await store.removeWorktree(R, '/hub-side');
    await store.merge(R, 'topic');
    await store.abortMerge(R);
    await store.continueRebase(R);
    await store.resolve(R, 'a.txt', 'text');
    await store.markResolved(R, 'a.txt');
    await store.acceptDeletion(R, 'a.txt');
    await store.stash(R, 'tracked', 'note');
    await store.stashAct(R, 'apply', 'stash@{0}');
    await store.stashAct(R, 'pop', 'stash@{0}');
    await store.stashAct(R, 'drop', 'stash@{0}');
    await store.createTag(R, 'v1', 'note', 'abc1234');
    await store.deleteTag(R, 'v1');
    await store.pushTags(R);
    await store.trashUntracked(R, ['u.txt']);
    await store.ignore(R, ['u.txt']);
    await store.cherryPick(R, 'abc1234');
    await store.checkoutDetached(R, 'abc1234');
    await store.deleteBranch(R, 'topic');
    await store.deleteBranchAnyway(R, 'topic');
    return sent;
}

/** The fields the server's action reads from a parsed body: a read of each property is recorded. */
async function fieldsRead(action: string, parsed: Record<string, unknown>): Promise<string[]> {
    const read = new Set<string>();
    const watched = new Proxy(parsed, {
        get: (target, key) => {
            if (typeof key === 'string') read.add(key);
            return Reflect.get(target, key) as unknown;
        }
    });
    // `suggest` is answered by the route before the table, and reads no field.
    const operation = Object.hasOwn(OPERATIONS, action) ? OPERATIONS[action] : null;
    if (operation === null) return [];
    const options = {
        config: {},
        guard: () => new Set<string>(),
        trash: () => Promise.resolve()
    };
    await operation(ROOT, watched as never, [], options as never).catch(() => undefined);
    read.delete('action');
    read.delete('root');
    return [...read];
}

describe('the bodies the Repositories store posts', () => {
    it('are sent for every action the route knows', async () => {
        const sent = await bodies();
        expect(new Set(sent.map((one) => one.action))).toEqual(new Set(ACTIONS));
    });

    // Revert: send a field under another name than the one the route's action reads.
    it('carry every field the route reads for their action', async () => {
        const missing: string[] = [];
        for (const { action, fields } of await bodies()) {
            const parsed = gitBodyShape.parse({ action, root: ROOT, ...fields });
            for (const key of await fieldsRead(action, parsed)) {
                if (OPTIONAL.has(key)) continue;
                if (!(key in fields)) missing.push(`${action} reads ${key}`);
            }
        }
        expect(missing).toEqual([]);
    });
});
