// Layer 4, test. The Deposit tab of a workbench page, made from the shipped `workbench:` key of
// config/layout.yml: present, after Repositories and set to its project, for a project with a
// deposit; absent for a project with none and for a folder opened for no project; present again
// when Reset layout remakes the page of a project that has one.

import { describe, expect, it } from 'vitest';
import type { Project } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import type {
    FolderItem,
    FolderRef,
    Page
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { tabsOf } from '../../../../src/lib/state/workbench/layout/index.ts';
import {
    createFolderPages,
    type FolderPagesDeps
} from '../../../../src/lib/state/workbench/layout/open/float/folder-opener.ts';
import type { FolderLayout } from '../../../../src/lib/state/workbench/layout/open/float/folder-store.ts';

const { config } = loadConfig(engineDir());

const FOLDER: FolderRef = { root: 'hub', path: 'projects/alpha' };

/** A project with the fields a deposit reads; the rest of the record is left out. */
function projectWith(fields: Partial<Project>): Project {
    return { id: 'alpha', title: 'Alpha', ...fields } as Project;
}

/** The pages made so far, and what Reset layout asked to remake, in place of the layout store. */
function harness(projects: Record<string, Project>) {
    const made: FolderLayout[] = [];
    const pages: Page[] = [];
    const folders = createFolderPages({
        config: () => config,
        roots: () => [{ key: 'hub', dir: '/hub' }],
        project: (id) => projects[id],
        layout: {
            openFolderPage: (spec) => {
                const layout = spec.make();
                if (layout === null) return null;
                made.push(layout);
                pages.push({
                    id: 'page',
                    label: spec.label,
                    workbench: layout.workbench,
                    folder: spec.folder,
                    item: spec.item
                });
                return { id: 'page', how: 'made' };
            },
            resetFolderPage: (_id, layout) => {
                made.push(layout);
                return true;
            },
            pages: () => pages,
            openView: () => ''
        } satisfies FolderPagesDeps['layout']
    });
    return { folders, made };
}

/** The views of the page made last, in order. */
function viewsOf(made: FolderLayout[]): string[] {
    const last = made.at(-1);
    return last === undefined ? [] : tabsOf(last.workbench.root).map((tab) => tab.view);
}

function projectItem(id: string): FolderItem {
    return { view: 'project', state: { id } };
}

const WITH_DEPOSIT: [string, Partial<Project>][] = [
    ['a code folder', { codeFolder: true }],
    ['a code_availability url', { codeAvailability: { url: 'https://github.com/a/b' } }],
    ['a code_availability repo', { codeAvailability: { repo: 'alpha-code' } }]
];

const WITHOUT_DEPOSIT: [string, Partial<Project>][] = [
    ['no code folder and no code_availability', {}],
    ['a code_availability naming neither repo nor url', { codeAvailability: { status: 'none' } }]
];

describe('the Deposit tab of a workbench page', () => {
    it.each(WITH_DEPOSIT)('follows Repositories for a project with %s', (_name, fields) => {
        const { folders, made } = harness({ alpha: projectWith(fields) });
        folders.open(FOLDER, { item: projectItem('alpha') });
        const views = viewsOf(made);
        expect(views.indexOf('deposit')).toBe(views.indexOf('repositories') + 1);
        const tab = tabsOf(made[0].workbench.root).find((one) => one.view === 'deposit');
        expect(tab?.state).toEqual({ id: 'alpha' });
    });

    it.each(WITHOUT_DEPOSIT)('is absent for a project with %s', (_name, fields) => {
        const { folders, made } = harness({ alpha: projectWith(fields) });
        folders.open(FOLDER, { item: projectItem('alpha') });
        expect(viewsOf(made)).not.toContain('deposit');
        expect(viewsOf(made)).toContain('repositories');
    });

    it('is absent for a folder opened for no project', () => {
        const { folders, made } = harness({ alpha: projectWith({ codeFolder: true }) });
        folders.open(FOLDER);
        expect(viewsOf(made)).not.toContain('deposit');
    });

    it('is absent for a project the portfolio does not hold', () => {
        const { folders, made } = harness({});
        folders.open(FOLDER, { item: projectItem('alpha') });
        expect(viewsOf(made)).not.toContain('deposit');
    });

    it('comes back when Reset layout remakes the page of a project that has a deposit', () => {
        const { folders, made } = harness({ alpha: projectWith({ codeFolder: true }) });
        folders.open(FOLDER, { item: projectItem('alpha') });
        expect(folders.reset('page')).toBe(true);
        expect(made).toHaveLength(2);
        expect(viewsOf(made)).toContain('deposit');
    });
});
