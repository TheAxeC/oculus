// Layer 2, client-state tests. The store of Write the website (G140), over the merged configuration
// of a scratch hub: the button's tip names the paths `website.files` gives and the command of
// `website.cv`, the button is off naming the first path of `website.files` that is empty, and a
// press over one of those paths a source tab holds unsaved text of stops before it is sent, with
// the sentence every write over such a file gets (`unsavedAnswer`).
//
// It does not cover the tip drawn on the button, which the look does.

import { afterEach, describe, expect, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { Snapshot } from '../../../../src/lib/data/model/index.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { createWebsite } from '../../../../src/lib/state/sessions/source/website.svelte.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';
import { FIELD_LINES, PATHS } from '../../../fixtures/hubs/website-hub.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => vi.unstubAllGlobals());

/** A snapshot that names the user. */
const KNOWN = { entities: { people: { me: { self: true } } } } as unknown as Snapshot;

/**
 * The settings file of a hub with a website folder, a CV section, the fields of an entry, the lines
 * `lines` and the paths of `website.files`: the four paths with `files` laid over them, or none at
 * all for null.
 */
function settingsOf(lines: string, files: Record<string, string> | null = {}): string {
    const paths =
        files === null
            ? ''
            : `  files:\n${Object.entries({ ...PATHS, ...files })
                  .map(([key, path]) => `    ${key}: ${path}\n`)
                  .join('')}`;
    return `website:\n  folder: site\n  cv_sections:\n    - { key: news, fields: [title] }\n${FIELD_LINES}  paper_list: papers\n  paper_fields:\n    - { key: title, from: project_title }\n${lines}${paths}`;
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

const TIPS: {
    row: string;
    lines: string;
    files: Record<string, string>;
    key: string;
    args: string[];
}[] = [
    {
        row: 'a path of website.files.cv and no command',
        lines: '',
        files: { cv: 'data/cv.yml' },
        key: 'career.website_tip',
        args: ['data/cv.yml', '_data/publications.yml', '_data/industry.yml']
    },
    {
        row: 'a path of website.files.papers and a command',
        lines: '  cv: make cv\n',
        files: { papers: 'data/papers.yml' },
        key: 'career.website_tip_run',
        args: ['_data/data.yml', 'data/papers.yml', '_data/industry.yml', 'make cv']
    }
];

describe('the tip of Write the website', () => {
    for (const { row, lines, files, key, args } of TIPS) {
        it(`names the paths the settings give: ${row}`, () => {
            const tip = storeOf(settingsOf(lines, files)).tip();
            expect(tip).toBe(t(key, ...args));
            for (const arg of args) expect(tip).toContain(arg);
        });
    }

    it('is the sentence of the first empty path while website.files sets none or leaves one empty', () => {
        const none = storeOf(settingsOf('', null));
        expect(none.off()).toBe(t('career.website_no_path', 'website.files.site'));
        expect(none.tip()).toBe(t('career.website_no_path', 'website.files.site'));
        const empty = storeOf(settingsOf('', { papers: '' }));
        expect(empty.tip()).toBe(t('career.website_no_path', 'website.files.papers'));
    });

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

const UNSAVED: { row: string; files: Record<string, string>; held: string; name: string }[] = [
    {
        row: 'a path of the four the hub sets',
        files: {},
        held: 'site/_data/industry.yml',
        name: 'industry.yml'
    },
    {
        row: 'a path website.files.papers names',
        files: { papers: 'data/papers.yml' },
        held: 'site/data/papers.yml',
        name: 'papers.yml'
    },
    {
        row: 'a path written with a dot segment',
        files: { cv: './data/cv.yml' },
        held: 'site/data/cv.yml',
        name: 'cv.yml'
    }
];

describe('a press over a file a source tab holds unsaved text of', () => {
    for (const { row, files, held, name } of UNSAVED) {
        it(`stops before it is sent: ${row}`, async () => {
            const sent = vi.fn(() => Promise.resolve(Response.json({})));
            vi.stubGlobal('fetch', sent);
            const store = storeOf(settingsOf('', files), [held]);
            await store.write();
            expect(store.said()).toEqual({ text: t('app.file_unsaved', name), error: true });
            expect(sent).not.toHaveBeenCalled();
        });
    }
});
