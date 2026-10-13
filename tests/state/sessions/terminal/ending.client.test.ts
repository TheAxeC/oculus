// Layer 2, client state test. What the app of a view id runs now, which the question a Disable, a
// Remove or a Revoke asks names (lib/state/sessions/terminal/terminal-lists.ts `endingOf`): the
// debug session while the app's adapter runs it, the app's tasks that have not ended and the
// terminals it made that are no task. A terminal of another app, a terminal of the reader's own
// and one that ended are not named, so the question names what ending the app ends and nothing
// else. This is the terminal row of G35 on the page's side.
//
// What this does NOT cover: the question's dialog (tests/state/system/apps/flows.test.ts) and the
// server that ends them (tests/server/machine/apps/tools/terminals/).

import { describe, expect } from 'vitest';
import type { DebugPayload, Terminal } from '../../../../src/lib/data/model/index.ts';
import { endingOf } from '../../../../src/lib/state/sessions/terminal/terminal-lists.ts';
import { it } from '../../../fixtures/scratch.ts';
import { terminal } from '../../../fixtures/sessions-fixture.ts';
import { installRealText } from '../../../views/shared/real-text.ts';

installRealText();

const NOTES = 'app:notes';

/** A terminal the app NOTES made, with the members a case changes. */
const made = (id: string, over: Partial<Terminal> = {}): Terminal =>
    terminal(id, { kind: 'app', app: NOTES, name: 'Shell', ...over });

const taskOf = (app: string, name: string): Terminal['job'] => ({
    repo: 'r',
    name,
    app: { app, title: app, type: 'shell', background: false }
});

/** A debug payload whose session runs with the adapter of an app. */
function debug(status: DebugPayload['status'], app: string): DebugPayload {
    return {
        status,
        adapter: { type: 'notes.dbg', label: 'Notes debugger', app }
    } as DebugPayload;
}

describe('what an app runs now', () => {
    it('names its running debug session, its tasks and its terminals, each under the name the Terminal tab shows', () => {
        const ending = endingOf(
            NOTES,
            [
                made('a-app', { name: 'App shell' }),
                made('b-app', { task: true, name: 'Build', job: taskOf(NOTES, 'Build') })
            ],
            debug('paused', NOTES)
        );
        expect(ending).toEqual({
            debug: 'Notes debugger',
            tasks: [expect.stringContaining('Build')],
            terminals: ['App shell']
        });
    });

    it('names nothing of another app, nothing that ended and no session that is over', () => {
        const ending = endingOf(
            NOTES,
            [
                made('a-app', { app: 'app:other', name: 'Theirs' }),
                made('b-app', { kind: 'shell', app: '', name: 'Mine' }),
                made('c-app', { name: 'Done', exit: 0 }),
                made('d-app', { app: 'app:other', task: true, job: taskOf('app:other', 'Build') })
            ],
            debug('ended', NOTES)
        );
        expect(ending).toEqual({ debug: null, tasks: [], terminals: [] });
    });

    it('names no debug session run by the adapter of another app', () => {
        expect(endingOf(NOTES, [], debug('running', 'app:other')).debug).toBeNull();
    });
});
