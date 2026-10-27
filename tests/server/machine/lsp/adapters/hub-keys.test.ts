// Layer 2, server test. What the YAML entry answers to `prepareRename` and `rename` of a hub key
// (server/machine/lsp/adapters/yaml/hub-keys.ts), G67: a refusal that does not depend on the new
// key is the answer to `prepareRename`, so the page shows it at the caret, and `rename` gives it
// again; a refusal that depends on the new key is the answer to `rename` alone. A setting of the
// open workspace file that names a key of the primary hub is answered against the primary hub's
// keys, wherever the file lies, and so is `self` of the primary hub's own `.oculus/local.yml`. The
// index is the planted hub of tests/data/snapshot/reference-hub.ts, the page's view is built here
// with the open document, the disk read and the tabs of another window as each case needs them, and
// the sentences are the checkout's own catalog (tests/server/text.ts).
//
// What this does NOT cover: the edit a rename returns (tests/data/snapshot/rename.test.ts), and
// where the page shows an error (tests/ui/controls/editor/lsp-transport.test.ts).

import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { FileText } from '../../../../../src/lib/data/snapshot/references/rename.ts';
import { answerHubKeys } from '../../../../../src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts';
import type { PageAnswer, PageView } from '../../../../../src/lib/server/machine/lsp/servers.ts';
import { pageUri } from '../../../../../src/lib/server/machine/lsp/uris.ts';
import { words } from '../../../../../src/lib/server/core/words.ts';
import { it } from '../../../../fixtures/scratch.ts';
import {
    HUB_FILES,
    LOCAL_TEXT,
    plantHub,
    WORKSPACE_FILE,
    WORKSPACE_TEXT,
    type PlantedHub
} from '../../../../data/snapshot/reference-hub.ts';
import { TEXT } from '../../../text.ts';

const ALPHA = 'projects/active/alpha/project.yml';
const VENUE_AT = { line: 3, character: 10 };
const PEOPLE = '.oculus/data/people/people.yml';

/** The value of `slurm.resource` in the planted workspace file, and the cluster `hpc`. */
const SETTING_AT = { line: 5, character: 21 };
const HPC_DEFINED = { start: { line: 4, character: 11 }, end: { line: 4, character: 14 } };
const RESOURCES = '.oculus/data/research/resources.yml';

/** The value of `self` in the planted `local.yml`, and the key `amir` in the people file. */
const SELF_AT = { line: 2, character: 6 };
const AMIR_DEFINED = { start: { line: 5, character: 9 }, end: { line: 5, character: 13 } };

/** What the page holds and the disk gives, which a case changes. */
type Page = {
    /** The texts of other tabs, by path under the hub root, in place of the disk's. */
    tabs?: Record<string, string>;
    read?: (real: string) => FileText;
    elsewhere?: (real: string) => boolean;
};

/**
 * The answer to a request about a position of a file open in the page, the manifest of `alpha`
 * unless named; a name written `lab:path` is a file of the second workspace folder.
 */
function ask(
    hub: PlantedHub,
    method: 'textDocument/definition' | 'textDocument/prepareRename' | 'textDocument/rename',
    at: { line: number; character: number },
    page: Page = {},
    named: string = ALPHA,
    newName = 'jama'
): PageAnswer | undefined {
    const real = realpathSync(hub.hub);
    const roots = [
        { key: 'hub', dir: hub.hub, real },
        { key: 'engine', dir: hub.engine, real: realpathSync(hub.engine) },
        ...(hub.lab === null ? [] : [{ key: 'lab', dir: hub.lab, real: realpathSync(hub.lab) }])
    ];
    const inLab = named.startsWith('lab:');
    const file = inLab ? named.slice('lab:'.length) : named;
    const folder = inLab && hub.lab !== null ? hub.lab : hub.hub;
    const document = {
        real: join(realpathSync(folder), file),
        pageUri: pageUri(inLab ? 'lab' : 'hub', file),
        version: 1,
        text: readFileSync(join(folder, file), 'utf8')
    };
    const tabs = Object.entries(page.tabs ?? {}).map(([name, text]) => ({
        real: join(real, name),
        pageUri: pageUri('hub', name),
        version: 1,
        text
    }));
    const view: PageView = {
        roots,
        references: hub.index,
        catalog: TEXT,
        documents: [document, ...tabs],
        document: (uri) => (uri === document.pageUri ? document : undefined),
        read: page.read ?? ((real) => ({ text: readFileSync(real, 'utf8') })),
        heldElsewhere: page.elsewhere ?? (() => false)
    };
    const params = { textDocument: { uri: document.pageUri }, position: at, newName };
    return answerHubKeys({ method, params }, view);
}

/** The message of an error answer. */
function messageOf(answer: PageAnswer | undefined): string | null {
    return answer !== undefined && 'error' in answer ? answer.error.message : null;
}

describe('the answer to prepareRename and rename of a hub key', () => {
    it('gives the key and its range when nothing refuses it', () => {
        const hub = plantHub();
        expect(ask(hub, 'textDocument/prepareRename', VENUE_AT)).toMatchObject({
            result: { placeholder: 'jbhi' }
        });
    });

    it('refuses a project id at prepareRename, with its sentence', () => {
        const hub = plantHub();
        const at = { line: 5, character: 10 };
        const answer = ask(hub, 'textDocument/prepareRename', at);
        expect(messageOf(answer)).toBe(words(TEXT, 'source.rename_project', 'beta'));
    });

    it('refuses a person key that a reference also names as a project, from its definition', () => {
        const people = HUB_FILES['.oculus/data/people/people.yml'].replace(
            '  - key: ann\n',
            '  - key: beta\n    name: Beta\n  - key: ann\n'
        );
        const hub = plantHub({ '.oculus/data/people/people.yml': people });
        const answer = ask(
            hub,
            'textDocument/prepareRename',
            { line: 8, character: 10 },
            {},
            '.oculus/data/people/people.yml'
        );
        expect(messageOf(answer)).toBe(
            words(TEXT, 'source.rename_sources', 'beta', 'people, projects')
        );
    });

    it('refuses a rename over a text that does not read as YAML at prepareRename', () => {
        const hub = plantHub();
        const answer = ask(hub, 'textDocument/prepareRename', VENUE_AT, {
            tabs: { 'projects/active/beta/project.yml': 'id: beta\nvenue: [jbhi\n' }
        });
        expect(messageOf(answer)).toBe(
            words(TEXT, 'source.rename_unparsed', 'projects/active/beta/project.yml')
        );
    });

    it.each<[string, () => FileText, string]>([
        ['is larger than the write limit', () => ({ large: true }), 'rename_large'],
        ['cannot be read as text', () => null, 'rename_unread']
    ])('refuses a rename when a file %s, at prepareRename', (_name, read, key) => {
        const hub = plantHub();
        const answer = ask(hub, 'textDocument/prepareRename', VENUE_AT, { read });
        const named = messageOf(answer);
        expect(named).toBe(
            key === 'rename_large'
                ? words(TEXT, `source.${key}`, '.oculus/data/research/venues.yml', 5)
                : words(TEXT, `source.${key}`, '.oculus/data/research/venues.yml')
        );
    });

    it('refuses a rename when a file is open in a tab of another window, at prepareRename', () => {
        const hub = plantHub();
        const answer = ask(hub, 'textDocument/prepareRename', VENUE_AT, {
            elsewhere: (real) => real.endsWith('.oculus/data/research/venues.yml')
        });
        expect(messageOf(answer)).toBe(
            words(TEXT, 'source.lsp_edit_elsewhere', '.oculus/data/research/venues.yml')
        );
    });

    it('refuses a project id for what it is when another window holds a file that names it', () => {
        const hub = plantHub();
        const answer = ask(
            hub,
            'textDocument/prepareRename',
            { line: 5, character: 10 },
            {
                elsewhere: () => true
            }
        );
        expect(messageOf(answer)).toBe(words(TEXT, 'source.rename_project', 'beta'));
    });

    it('makes the checks of prepareRename again at rename', () => {
        const hub = plantHub();
        const page = {
            elsewhere: (real: string) => real.endsWith('.oculus/data/research/venues.yml')
        };
        expect(messageOf(ask(hub, 'textDocument/rename', VENUE_AT, page))).toBe(
            words(TEXT, 'source.lsp_edit_elsewhere', '.oculus/data/research/venues.yml')
        );
    });

    it.each([
        ['an empty key', '', 'rename_empty', []],
        ['a key that exists', 'bspc', 'rename_exists', ['bspc', 'venues']]
    ])('gives a refusal for %s at rename and none at prepareRename', (_name, key, text, args) => {
        const hub = plantHub();
        expect(ask(hub, 'textDocument/prepareRename', VENUE_AT)).toMatchObject({ result: {} });
        const answer = ask(hub, 'textDocument/rename', VENUE_AT, {}, ALPHA, key);
        expect(messageOf(answer)).toBe(words(TEXT, `source.${text}`, ...args));
    });
});

describe('the answer to a request on a setting of the open workspace file', () => {
    it.each([
        ['the folder of the primary hub', 'hub' as const],
        ['another workspace folder', 'lab' as const]
    ])(
        "goes from the setting slurm.resource of the open workspace file in %s to the primary hub's cluster",
        (_name, folder) => {
            const hub = plantHub({}, {}, { workspace: { text: WORKSPACE_TEXT, folder } });
            const file = folder === 'lab' ? `lab:${WORKSPACE_FILE}` : WORKSPACE_FILE;
            const answer = ask(hub, 'textDocument/definition', SETTING_AT, {}, file);
            expect(answer).toMatchObject({
                result: [{ targetUri: pageUri('hub', RESOURCES), targetRange: HPC_DEFINED }]
            });
        }
    );

    it("renames from the open workspace file of another workspace folder the primary hub's cluster", () => {
        const hub = plantHub({}, {}, { workspace: { text: WORKSPACE_TEXT, folder: 'lab' } });
        const answer = ask(
            hub,
            'textDocument/rename',
            SETTING_AT,
            {},
            `lab:${WORKSPACE_FILE}`,
            'hpc-2'
        );
        expect(changedUris(answer)).toEqual(
            [
                pageUri('hub', RESOURCES),
                pageUri('engine', 'defaults/behavior.yml'),
                pageUri('lab', WORKSPACE_FILE)
            ].sort()
        );
    });
});

describe("the answer to a request on self of the primary hub's local.yml", () => {
    it("goes from self of the primary hub's local.yml to the person it names (case 25)", () => {
        const hub = plantHub({ '.oculus/local.yml': LOCAL_TEXT });
        const answer = ask(hub, 'textDocument/definition', SELF_AT, {}, '.oculus/local.yml');
        expect(answer).toMatchObject({
            result: [{ targetUri: pageUri('hub', PEOPLE), targetRange: AMIR_DEFINED }]
        });
    });

    it("renames from self of the primary hub's local.yml the person, and that file with it (case 23)", () => {
        const hub = plantHub({ '.oculus/local.yml': LOCAL_TEXT });
        const answer = ask(hub, 'textDocument/rename', SELF_AT, {}, '.oculus/local.yml', 'amir-2');
        expect(changedUris(answer)).toEqual(
            [
                pageUri('hub', PEOPLE),
                pageUri('hub', '.oculus/data/academic/joint-work.yml'),
                pageUri('hub', 'projects/active/alpha/project.yml'),
                pageUri('hub', '.oculus/local.yml')
            ].sort()
        );
    });
});

/** The pages a rename's answer edits, sorted, or undefined for an answer with no edit. */
function changedUris(answer: PageAnswer | undefined): string[] | undefined {
    const result = answer !== undefined && 'result' in answer ? answer.result : null;
    return (
        result as { documentChanges?: { textDocument: { uri: string } }[] } | null
    )?.documentChanges
        ?.map((one) => one.textDocument.uri)
        .sort();
}
