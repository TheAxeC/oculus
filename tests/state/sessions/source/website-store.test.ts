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
import { FIELD_LINES } from '../../../fixtures/hubs/website-hub.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => vi.unstubAllGlobals());

/** A snapshot that names the user. */
const KNOWN = { entities: { people: { me: { self: true } } } } as unknown as Snapshot;

/**
 * The settings file of a hub with a website folder, a CV section, the fields of an entry and the
 * lines `lines`.
 */
function settingsOf(lines: string): string {
    return `website:\n  folder: site\n  cv_sections:\n    - { key: news, fields: [title] }\n${FIELD_LINES}  paper_list: papers\n  paper_fields:\n    - { key: title, from: project_title }\n${lines}`;
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

    it('is the sentence of the missing fields while website.paper_fields holds no row', () => {
        const store = storeOf(
            'website:\n  folder: site\n  cv_sections:\n    - { key: news, fields: [title] }\n'
        );
        expect(store.off()).toBe(t('career.website_no_paper_fields'));
        expect(store.tip()).toBe(t('career.website_no_paper_fields'));
    });

    it('is the sentence of the CV fields while website.cv_fields lacks a role', () => {
        const lines =
            'website:\n  folder: site\n  paper_list: papers\n  cv_sections:\n    - { key: news, fields: [title] }\n  paper_fields:\n    - { key: title, from: project_title }\n';
        expect(storeOf(lines).tip()).toBe(t('career.website_no_cv_fields'));
    });

    it('is the sentence of the missing sections while website.cv_sections holds none', () => {
        expect(storeOf('website:\n  folder: site\n').tip()).toBe(
            t('career.website_no_cv_sections')
        );
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
