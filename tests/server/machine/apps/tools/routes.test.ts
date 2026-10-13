// Layer 2, server test. What a page asks of the tools through POST /api/app-host
// (lib/server/machine/apps/tools/routes.ts): a file the app's manifest names is read as JSON and
// any other file of the app is `missing`; an app that is disabled or was never approved is
// `closed`; an action on a source control or a terminal of a host that is not running is
// `host_down`; and an action whose body is out of shape is not one of the tools' actions. These are
// the tools' rows of G49.
//
// Every folder is synthetic, under the system temporary directory. What this does NOT cover: the
// write token that stands before all of them (tests/routes/apps/app-manage.test.ts) and the source
// control rows (scm.test.ts).

import { describe, expect } from 'vitest';
import {
    handleToolsPost,
    isToolsBody,
    toolsShape
} from '../../../../../src/lib/server/machine/apps/tools/routes.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { world } from '../world/hosts-world.ts';

const KEYS = `contributes:
  languages:
    - id: notes
      extensions: [".note"]
      configuration: notes.language.json
  grammars:
    - language: notes
      scopeName: source.notes
      path: notes.tmLanguage.json
`;

const FILES = {
    'notes.language.json': '{ "comments": { "lineComment": "//", }, }',
    'notes.tmLanguage.json': '{"scopeName":"source.notes","patterns":[]}',
    'secret.json': '{"not":"named"}'
};

/** A world with the app `notes` approved, and the answer of one action of the tools. */
function setup(over: { approve?: string[] } = {}) {
    const w = world({ notes: { keys: KEYS, files: FILES } }, {}, { approve: over.approve });
    const post = async (body: unknown): Promise<unknown> =>
        (await handleToolsPost(toolsShape.parse(body), w.hosts.tools)).json();
    return { w, post };
}

const file = (kind: string, path: string) => ({ action: 'file', app: 'app:notes', kind, path });

describe('a file of the app the page asks for', () => {
    it('is read as JSON when the manifest names it for that kind, comments and trailing commas allowed', async () => {
        const { w, post } = setup();
        await w.hosts.tab('app:notes');
        const answers = [
            await post(file('configuration', 'notes.language.json')),
            await post(file('grammar', 'notes.tmLanguage.json'))
        ];
        await w.hosts.close();
        expect(answers).toEqual([
            { ok: true, value: { comments: { lineComment: '//' } } },
            { ok: true, value: { scopeName: 'source.notes', patterns: [] } }
        ]);
    });

    it('is missing when the manifest does not name it for that kind, though the app holds it', async () => {
        const { w, post } = setup();
        const answers = [
            await post(file('grammar', 'secret.json')),
            await post(file('configuration', 'notes.tmLanguage.json')),
            await post(file('grammar', '../notes/secret.json')),
            await post(file('schema', 'notes.language.json'))
        ];
        await w.hosts.close();
        expect(answers).toEqual(Array(4).fill({ ok: false, word: 'missing' }));
    });

    it('is closed for an app that is disabled, one that was never approved and one that is not held', async () => {
        const off = setup();
        off.w.disable('app:notes');
        const unapproved = setup({ approve: [] });
        const none = setup();
        const answers = [
            await off.post(file('grammar', 'notes.tmLanguage.json')),
            await unapproved.post(file('grammar', 'notes.tmLanguage.json')),
            await none.post({ ...file('grammar', 'notes.tmLanguage.json'), app: 'app:nobody' })
        ];
        await Promise.all([off.w.hosts.close(), unapproved.w.hosts.close(), none.w.hosts.close()]);
        expect(answers).toEqual(Array(3).fill({ ok: false, word: 'closed' }));
    });
});

describe('an action on the host of an app that does not run', () => {
    it('is host_down for a source control, a terminal and nothing else', async () => {
        const { w, post } = setup();
        const answers = [
            await post({
                action: 'scm',
                app: 'app:notes',
                id: 'notes.git',
                op: { kind: 'accept' }
            }),
            await post({ action: 'terminal', app: 'app:notes', id: 't1' })
        ];
        await w.hosts.close();
        expect(answers).toEqual(Array(2).fill({ ok: false, word: 'host_down' }));
    });
});

describe('a body the tools do not take', () => {
    it('is no action of the tools when it names no action, a path of no kind or too many paths to decorate', () => {
        expect([
            isToolsBody({ action: 'tab' }),
            isToolsBody({ action: 'file', app: 'app:notes', kind: 'script', path: 'x' }),
            isToolsBody({ action: 'decorate', root: 'r', paths: Array(501).fill('a') }),
            isToolsBody({ action: 'decorate', root: 'r', paths: ['a'] })
        ]).toEqual([false, false, false, true]);
    });
});
