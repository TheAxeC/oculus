// The manual: the view that draws it, and the manual itself against the application it describes.
//
// The source half is the gate that keeps HELP.md true as the tool changes: every listed view is
// named there by its id, every key of the sheet is in its table, every letter a group is reached by
// is written down, and every configuration file is described in the same words the Config view
// shows. A view, a key or a file added without a line here fails this file rather than leaving the
// manual quietly wrong.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Help from '../../../src/lib/views/system/help/Help.svelte';
import { descriptionKey } from '../../../src/lib/views/system/config/files.ts';
import { sheetRows } from '../../../src/lib/ui/menu/key-rows.ts';
import {
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import type { DocState } from '../../../src/lib/state/system/docs.svelte.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { registerAll, registerCollections } from '../../../src/routes/views.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    registerAll(client.registry);
    registerCollections(client.registry, collectionKeys(config));
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const MANUAL = readFileSync(join(engineDir(), 'HELP.md'), 'utf8');

const instance: Instance = { id: 'help-one', view: 'help', state: {} };

/** The view with a doubled document store, so a case draws the manual without a server. */
function drawn(doc: DocState): string {
    const context = clientContext({ ...client, docs: { ...client.docs, manual: () => doc } });
    return render(Help, { context, props: { instance } }).body;
}

describe('the Help view', () => {
    it('draws the manual the store holds', () => {
        const body = drawn({
            html: '<h1>Oculus</h1>',
            frontmatter: null,
            error: '',
            loading: false
        });

        expect(body).toContain('Help');
        expect(body).toContain('<h1>Oculus</h1>');
    });

    it('says the manual is being read, and says what a failed read failed with', () => {
        expect(drawn({ html: '', frontmatter: null, error: '', loading: true })).toContain(
            'Reading the manual...'
        );
        expect(
            drawn({ html: '', frontmatter: null, error: 'no such file', loading: false })
        ).toContain('The manual could not be read: no such file');
    });
});

describe('the key sheet', () => {
    it('names every rail group that has a chord, by its label and its letter', () => {
        const groups = Object.values(
            config.nav_groups as Record<string, { label: string; chord?: string }>
        ).filter((group) => group.chord !== undefined);
        expect(groups.length).toBeGreaterThan(0);
        const rows = sheetRows(catalog['app.keys.rows']);
        const missing = groups.filter(
            (group) =>
                !rows.some(
                    (row) =>
                        row.key.includes(`${group.chord}1-${group.chord}9`) &&
                        row.meaning.includes(group.label)
                )
        );
        expect(missing.map((group) => group.label)).toEqual([]);
    });
});

describe('the manual itself', () => {
    it('names every view the rail lists, by its id', () => {
        const missing = client.registry
            .views()
            .filter((view) => view.listed !== false)
            .map((view) => view.id)
            .filter((id) => !MANUAL.includes(`\`${id}\``));
        expect(missing).toEqual([]);
    });

    it('holds every key of the sheet in its table', () => {
        const missing = sheetRows(catalog['app.keys.rows'])
            .map((row) => row.key)
            .filter((key) => !MANUAL.includes(`| ${key} |`));
        expect(missing).toEqual([]);
    });

    it('writes down every letter a rail group is reached by', () => {
        const groups = config.nav_groups as Record<string, { chord?: string }>;
        const letters = [
            config.direct_chord as string,
            ...Object.values(groups)
                .map((group) => group.chord)
                .filter((chord): chord is string => chord !== undefined)
        ];
        const missing = letters.filter((letter) => !MANUAL.includes(`${letter}1-${letter}9`));
        expect(missing).toEqual([]);
    });

    it('describes every configuration file in the words the Config view shows', () => {
        const files = readdirSync(join(engineDir(), 'config')).filter((name) =>
            name.endsWith('.yml')
        );
        expect(files.length).toBeGreaterThan(0);
        const missing = files.filter(
            (name) =>
                !MANUAL.includes(`\`${name}\``) || !MANUAL.includes(catalog[descriptionKey(name)])
        );
        expect(missing).toEqual([]);
    });

    it('names every key the machine-local file may carry', () => {
        const source = readFileSync(
            join(engineDir(), 'src', 'lib', 'data', 'sources', 'config', 'local.ts'),
            'utf8'
        );
        const block = /const LOCAL_KEYS = \[([^\]]*)\]/.exec(source)?.[1] ?? '';
        const keys = [...block.matchAll(/'([a-z_]+)'/g)].map((found) => found[1]);
        expect(keys).toContain('claude_bin');
        const paragraph = MANUAL.split('\n\n').filter((one) => one.includes('`local.yml` sits'));
        expect(paragraph).toHaveLength(1);
        const missing = keys.filter((key) => !paragraph[0].includes(`\`${key}\``));
        expect(missing).toEqual([]);
        // Where the file is, and which keys a running server would have to be restarted to pick up.
        expect(paragraph[0]).toContain('`config/` folder');
        expect(paragraph[0]).toContain('read once when the server starts');
        expect(paragraph[0]).toContain('read again on every write');
    });

    it('names the machine-local file, the checks and where the hub comes from', () => {
        expect(MANUAL).toContain('`local.yml`');
        expect(MANUAL).toContain('`npm test`');
        expect(MANUAL).toContain('`npm run check`');
        expect(MANUAL).toContain('`npm run test:browser`');
        expect(MANUAL).toContain('`hub` key of `local.yml`');
    });
});
