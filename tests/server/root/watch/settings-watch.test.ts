// Layer 2, server test. The git watch (lib/server/root/watch/git.ts) says the workspaces may have
// changed for an event at a root's own `.oculus/settings.yml`, which reads the folder list again,
// and for no settings file of a folder below the root. The watch runs over a real folder; a case
// resumes on the `files` message it waits for and on no timer.
//
// Every directory here is under the system temporary directory; nothing reads ~/.oculus.

import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { REPO_SETTINGS } from '../../../../src/lib/data/helpers/editor/editor.ts';
import type { FilesPayload } from '../../../../src/lib/data/model/index.ts';
import { Hub, type Sink } from '../../../../src/lib/server/core/channels.ts';
import { watchGit, type GitWatcher } from '../../../../src/lib/server/root/watch/git.ts';
import { noCredentials } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** The text the case writes into each settings file. */
const TEXT = 'editor:\n  languages: {}\n';

let watcher: GitWatcher | undefined;

afterEach(() => {
    watcher?.close();
    watcher = undefined;
});

/**
 * Every `files` payload the hub publishes from now on, and a wait for the first one `wanted` is.
 */
function filesOf(hub: Hub) {
    const heard: FilesPayload[] = [];
    let waiting: { wanted: (one: FilesPayload) => boolean; done: () => void } | null = null;
    const sink: Sink = {
        send: (text) => {
            const payload = (JSON.parse(text) as { payload: FilesPayload }).payload;
            heard.push(payload);
            if (waiting?.wanted(payload) === true) {
                waiting.done();
                waiting = null;
            }
            return Promise.resolve();
        },
        close: () => undefined
    };
    hub.subscribe(sink, ['files'], false);
    return {
        heard,
        until: (wanted: (one: FilesPayload) => boolean): Promise<void> =>
            heard.some(wanted)
                ? Promise.resolve()
                : new Promise((done) => {
                      waiting = { wanted, done };
                  })
    };
}

/** Resolve once the `git` channel names the root, its first read answered. */
function read(hub: Hub, root: string): Promise<void> {
    return new Promise((done) => {
        const sink: Sink = {
            send: () => {
                const message = hub.latest('git');
                const named = message === undefined ? [] : Object.keys(message.payload as object);
                if (named.includes(root)) {
                    hub.remove(sink);
                    done();
                }
                return Promise.resolve();
            },
            close: () => undefined
        };
        hub.subscribe(sink, ['git']);
    });
}

const workspaces = (one: FilesPayload): boolean => one.workspaces === true;

describe('the git watch of a root with a settings file', () => {
    it("reads the workspaces again for an event at the root's settings file only", async () => {
        const root = realpathSync(scratchDir('oculus-settings-watch-'));
        mkdirSync(join(root, '.git'));
        mkdirSync(join(root, '.oculus'));
        mkdirSync(join(root, 'sub', '.oculus'), { recursive: true });
        mkdirSync(join(root, 'probe'));
        const hub = new Hub();
        const files = filesOf(hub);
        const first = read(hub, root);
        watcher = watchGit(hub, {
            throttle: 0,
            roots: () => [root],
            credentials: noCredentials()
        });
        await first;
        // The events of the folders made above, which the watch may still hear, come before the
        // probe's, so what is heard after the probe is what the writes below cause.
        writeFileSync(join(root, 'probe', 'ready.txt'), '');
        await files.until((one) => one.root === root && one.folders?.includes('probe') === true);
        const from = files.heard.length;
        const later = (one: FilesPayload): boolean => files.heard.indexOf(one) >= from;
        const since = (): FilesPayload[] => files.heard.slice(from).filter(workspaces);
        writeFileSync(join(root, 'sub', REPO_SETTINGS), TEXT);
        await files.until(
            (one) =>
                later(one) && one.root === root && one.folders?.includes('sub/.oculus') === true
        );
        expect(since()).toEqual([]);
        writeFileSync(join(root, REPO_SETTINGS), TEXT);
        await files.until((one) => later(one) && workspaces(one));
        expect(since()).toEqual([{ root: '', workspaces: true }]);
    });
});
