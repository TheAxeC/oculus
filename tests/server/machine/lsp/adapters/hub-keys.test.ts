// Layer 2, server test. What the YAML entry answers to `prepareRename` and `rename` of a hub key
// (server/machine/lsp/adapters/yaml/hub-keys.ts), G67: a refusal that does not depend on the new
// key is the answer to `prepareRename`, so the page shows it at the caret, and `rename` gives it
// again; a refusal that depends on the new key is the answer to `rename` alone. The index is the
// planted hub of tests/data/snapshot/reference-hub.ts, the page's view is built here with the
// open document, the disk read and the tabs of another window as each case needs them, and the
// sentences are the checkout's own catalog (tests/server/text.ts).
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
import { HUB_FILES, plantHub, type PlantedHub } from '../../../../data/snapshot/reference-hub.ts';
import { TEXT } from '../../../text.ts';

const ALPHA = 'projects/active/alpha/project.yml';
const VENUE_AT = { line: 3, character: 10 };

/** What the page holds and the disk gives, which a case changes. */
type Page = {
    /** The texts of other tabs, by path under the hub root, in place of the disk's. */
    tabs?: Record<string, string>;
    read?: (real: string) => FileText;
    elsewhere?: (real: string) => boolean;
};

/** The answer to a request about the position of the manifest of `alpha`. */
function ask(
    hub: PlantedHub,
    method: 'textDocument/prepareRename' | 'textDocument/rename',
    at: { line: number; character: number },
    page: Page = {},
    file: string = ALPHA,
    newName = 'jama'
): PageAnswer | undefined {
    const real = realpathSync(hub.hub);
    const roots = [
        { key: 'hub', dir: hub.hub, real },
        { key: 'engine', dir: hub.engine, real: realpathSync(hub.engine) }
    ];
    const path = join(real, file);
    const document = {
        real: path,
        pageUri: pageUri('hub', file),
        version: 1,
        text: readFileSync(join(hub.hub, file), 'utf8')
    };
    const tabs = Object.entries(page.tabs ?? {}).map(([name, text]) => ({
        real: join(real, name),
        pageUri: pageUri('hub', name),
        version: 1,
        text
    }));
    const view: PageView = {
        roots,
        config: join(real, 'oculus', 'config'),
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
        const people = HUB_FILES['registries/people.yml'].replace(
            '  - key: ann\n',
            '  - key: beta\n    name: Beta\n  - key: ann\n'
        );
        const hub = plantHub({ 'registries/people.yml': people });
        const answer = ask(
            hub,
            'textDocument/prepareRename',
            { line: 8, character: 10 },
            {},
            'registries/people.yml'
        );
        expect(messageOf(answer)).toBe(
            words(TEXT, 'source.rename_sources', 'beta', 'people, projects')
        );
    });

    it('refuses a rename over a text that does not read as YAML at prepareRename', () => {
        const hub = plantHub();
        const answer = ask(hub, 'textDocument/prepareRename', VENUE_AT, {
            tabs: { 'projects/active/beta/project.yml': 'id: beta\nvenue_id: [jbhi\n' }
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
                ? words(TEXT, `source.${key}`, 'registries/venues.yml', 5)
                : words(TEXT, `source.${key}`, 'registries/venues.yml')
        );
    });

    it('refuses a rename when a file is open in a tab of another window, at prepareRename', () => {
        const hub = plantHub();
        const answer = ask(hub, 'textDocument/prepareRename', VENUE_AT, {
            elsewhere: (real) => real.endsWith('registries/venues.yml')
        });
        expect(messageOf(answer)).toBe(
            words(TEXT, 'source.lsp_edit_elsewhere', 'registries/venues.yml')
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
        const page = { elsewhere: (real: string) => real.endsWith('registries/venues.yml') };
        expect(messageOf(ask(hub, 'textDocument/rename', VENUE_AT, page))).toBe(
            words(TEXT, 'source.lsp_edit_elsewhere', 'registries/venues.yml')
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
