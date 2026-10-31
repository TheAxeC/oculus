// Layer 2, client-state tests. The store of Write the website (G140), over the merged configuration
// of a scratch hub: the button's tip names the paths `website.files` gives and the command of
// `website.cv`, and a press over one of those paths a source tab holds unsaved text of stops before
// it is sent, with the sentence every write over such a file gets (`unsavedAnswer`).
//
// It does not cover the tip drawn on the button, which the look does.

import { afterEach, describe, expect, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { Snapshot } from '../../../../src/lib/data/model/index.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { createWebsite } from '../../../../src/lib/state/sessions/source/website.svelte.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => vi.unstubAllGlobals());

/** A snapshot that names the user. */
const KNOWN = { entities: { people: { me: { self: true } } } } as unknown as Snapshot;

/** The settings file of a hub with a website folder and these lines under `website:`. */
function settingsOf(lines: string): string {
    return `website:\n  folder: site\n${lines}`;
}

/** The store over a hub with this settings file, holding the files `held` unsaved. */
function storeOf(settings: string, held: readonly string[] = []) {
    const hub = plantScratch('oculus-website-store-', { '.oculus/config.yml': settings });
    const { config } = loadConfig(engineDir(), { hub });
    return createWebsite({
        writes: { writeToken: () => 'a-token', renewToken: () => Promise.resolve() },
        config: () => config,
        snapshot: () => KNOWN,
        look: { primary: () => 'hub', unsavedUnknown: () => false },
        heldUnsaved: (file) => file.root === 'hub' && held.includes(file.path),
        approve: () => Promise.resolve({ ok: true }),
        terminal: () => null
    });
}

const TIPS: { row: string; lines: string; key: string; args: string[] }[] = [
    {
        row: 'the shipped paths and no command',
        lines: '',
        key: 'career.website_tip',
        args: ['_data/data.yml', '_data/publications.yml', '_data/industry.yml']
    },
    {
        row: 'a path of website.files.cv and no command',
        lines: '  files: { cv: data/cv.yml }\n',
        key: 'career.website_tip',
        args: ['data/cv.yml', '_data/publications.yml', '_data/industry.yml']
    },
    {
        row: 'a path of website.files.papers and a command',
        lines: '  cv: make cv\n  files: { papers: data/papers.yml }\n',
        key: 'career.website_tip_run',
        args: ['_data/data.yml', 'data/papers.yml', '_data/industry.yml', 'make cv']
    }
];

describe('the tip of Write the website', () => {
    for (const { row, lines, key, args } of TIPS) {
        it(`names the paths the settings give: ${row}`, () => {
            const tip = storeOf(settingsOf(lines)).tip();
            expect(tip).toBe(t(key, ...args));
            for (const arg of args) expect(tip).toContain(arg);
        });
    }

    it('is the reason while the button is off', () => {
        expect(storeOf('{}\n').tip()).toBe(t('career.website_no_folder'));
    });
});

const UNSAVED: { row: string; lines: string; held: string; name: string }[] = [
    {
        row: 'a shipped path',
        lines: '',
        held: 'site/_data/industry.yml',
        name: 'industry.yml'
    },
    {
        row: 'a path website.files.papers names',
        lines: '  files: { papers: data/papers.yml }\n',
        held: 'site/data/papers.yml',
        name: 'papers.yml'
    },
    {
        row: 'a path written with a dot segment',
        lines: '  files: { cv: ./data/cv.yml }\n',
        held: 'site/data/cv.yml',
        name: 'cv.yml'
    }
];

describe('a press over a file a source tab holds unsaved text of', () => {
    for (const { row, lines, held, name } of UNSAVED) {
        it(`stops before it is sent: ${row}`, async () => {
            const sent = vi.fn(() => Promise.resolve(Response.json({})));
            vi.stubGlobal('fetch', sent);
            const store = storeOf(settingsOf(lines), [held]);
            await store.write();
            expect(store.said()).toEqual({ text: t('app.file_unsaved', name), error: true });
            expect(sent).not.toHaveBeenCalled();
        });
    }
});
