// Layer 2, client-state tests. The three readers of a folder's `.oculus/settings.yml` take its text
// from the folder list and ask the server for nothing: the source tab's options
// (views/shared/prose/editor/source-options.ts), the lines under the Settings `editor.languages`
// row (state/system/config/editors/origins.ts, `repoOrigins`) and the rules of a save
// (state/workbench/navigation/editor-text.ts, `saveRulesOf`). The folder list is read from a
// workspaces answer as the page reads it, and every request after that read is recorded, so a row
// fails on one request under `/api/fs?` or `/api/file/`. A tab rooted at the repository path of a
// folder (a HEAD or Index tab) finds that folder's settings; a root that is no folder of the
// workspace has none. The line under the Settings row for a folder whose text is null names each
// reason the text can be null.

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RepoSettings } from '../../../src/lib/data/sources/config/editor-options.ts';
import { editorOptions } from '../../../src/lib/data/sources/config/editor-options.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { SourceDraft } from '../../../src/lib/state/sessions/source/draft.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import type { FsRoot } from '../../../src/lib/state/sources/explorer/view/place.ts';
import { repoOrigins } from '../../../src/lib/state/system/config/editors/origins.ts';
import { saveRulesOf } from '../../../src/lib/state/workbench/navigation/editor-text.ts';
import { createSourceOptions } from '../../../src/lib/views/shared/prose/editor/source-options.ts';
import { pageWorkspaces } from '../../fixtures/hubs/workspace.ts';

const CONFIG = loadConfig(engineDir()).config;
setCatalog(textCatalog(CONFIG));
const OPTIONS = editorOptions(CONFIG);

afterEach(() => vi.unstubAllGlobals());

/** The text the folder `repo` holds, and the records a parse of it gives. */
const TEXT = 'languages:\n  markdown:\n    tab_size: 3\n';
const READ: RepoSettings = {
    kind: 'read',
    languages: { markdown: { tabSize: 3, insertSpaces: true, trimTrailingWhitespace: true } },
    skipped: []
};

/**
 * The folder list of a workspace of `repo`, whose settings file holds TEXT and whose repository
 * lies at `/real/repo`, and `plain`, which has none; then a fetch that records every request.
 */
async function folders(): Promise<{ list: FsRoot[]; asked: string[]; parsed: string[] }> {
    const read = await pageWorkspaces({
        home: '/home/u',
        open: null,
        folders: [
            { name: 'repo', dir: '/w/repo', real: '/real/repo', hub: false, settings: TEXT },
            { name: 'plain', dir: '/w/plain', real: '/real/plain', hub: false, settings: null }
        ],
        primary: null,
        engine: null,
        recent: [],
        available: []
    });
    const asked: string[] = [];
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        return Promise.resolve(new Response('{}'));
    });
    return { list: read.folders, asked, parsed: [] };
}

/** A parse that records the texts it is handed and reads TEXT as READ. */
const parseInto =
    (parsed: string[]) =>
    (text: string): RepoSettings => {
        parsed.push(text);
        return text === TEXT ? READ : { kind: 'read', languages: {}, skipped: [] };
    };

/** A Markdown draft of one line, as a tab holds it. */
const DRAFT = {
    text: 'one\n',
    saved: 'one\n',
    language: 'markdown',
    indent: null,
    wrap: null
};

/** The indentation a source tab rooted at `root` resolves. */
function indentAt(list: FsRoot[], root: string, parse: (text: string) => RepoSettings) {
    return createSourceOptions({
        path: () => 'a.md',
        root: () => root,
        draft: () => DRAFT,
        languages: () => new Map(),
        options: () => OPTIONS,
        repoSettings: parse,
        paintLimit: () => 1_000_000,
        folders: () => list
    }).indent;
}

/** Whether a save of a tab rooted at `root` trims the ends of its lines. */
function trimsAt(list: FsRoot[], root: string, parse: (text: string) => RepoSettings) {
    return saveRulesOf(
        {
            options: OPTIONS,
            languages: new Map(),
            paintLimit: 1_000_000,
            folders: () => list,
            repoSettings: parse
        },
        DRAFT as unknown as SourceDraft,
        root,
        'a.md'
    ).trim;
}

describe('the readers of a folder settings file', () => {
    it("take the folder's records from the folder list and ask for nothing", async () => {
        const { list, asked, parsed } = await folders();
        const parse = parseInto(parsed);
        expect(indentAt(list, 'repo', parse)).toEqual({ tabs: false, size: 3 });
        expect(trimsAt(list, 'repo', parse)).toBe(true);
        const lines = repoOrigins(list, parse);
        expect(lines.filter((one) => one.root === 'repo').map((one) => one.kind)).toEqual(['also']);
        expect(parsed).toContain(TEXT);
        expect(asked).toEqual([]);
    });

    it("name each reason a folder's settings text is null", async () => {
        const { list } = await folders();
        const plain = repoOrigins(list, parseInto([])).find((one) => one.root === 'plain');
        expect(
            plain === undefined ? null : [plain.kind, plain.lead + plain.label + plain.tail]
        ).toEqual([
            'none',
            'plain has no .oculus/settings.yml, or one that does not read as text, is longer ' +
                'than the file window reads or is a link out of the folder'
        ]);
    });

    // A root that is no folder's path, nor its repository's, gets the records of no folder.
    it("give a tab rooted at a folder's repository path that folder's records", async () => {
        const { list, asked, parsed } = await folders();
        const parse = parseInto(parsed);
        const none = { indent: indentAt(list, '', parse), trim: trimsAt(list, '', parse) };
        for (const root of ['/real/repo', '/w/repo']) {
            expect(indentAt(list, root, parse), root).toEqual({ tabs: false, size: 3 });
            expect(trimsAt(list, root, parse), root).toBe(true);
        }
        expect(indentAt(list, '/elsewhere/repo', parse)).toEqual(none.indent);
        expect(trimsAt(list, '/elsewhere/repo', parse)).toBe(none.trim);
        expect(asked).toEqual([]);
    });
});
