// Layer 3, shell test. What a file tab says about its path: the segments of the breadcrumb over it
// (shell/panes/strip/tab-crumbs.ts), what a press on a segment opens, the hint a tab draws as its
// tooltip (shell/panes/pane-view.ts's tabHint) and the home folder written `~`
// (state/workbench/navigation/pages.ts's shownPath).
//
// The words are a stand-in `t` that answers each key as `@key`.

import { describe, expect, it } from 'vitest';
import { crumbPicked, tabCrumbs } from '../../../../src/lib/shell/panes/strip/tab-crumbs.ts';
import { tabHint } from '../../../../src/lib/shell/panes/pane-view.ts';
import { shownPath } from '../../../../src/lib/state/workbench/navigation/pages.ts';

const words = (key: string): string => `@${key}`;

const SERVED = ['hub', 'notes'];
const source = (path: string, root = 'hub') => ({
    id: 't',
    view: 'source',
    state: { root, path, label: path }
});

describe('the breadcrumb over a file tab', () => {
    // Revert: build each segment from the part alone.
    it('names the root, each folder and the file of a source tab', () => {
        const crumbs = tabCrumbs(source('projects/x/manuscript/main.tex'), SERVED);

        expect(crumbs.map((crumb) => crumb.label)).toEqual([
            'hub',
            'projects',
            'x',
            'manuscript',
            'main.tex'
        ]);
        expect(crumbs.map((crumb) => crumb.file)).toEqual([false, false, false, false, true]);
        expect(crumbs[2]).toMatchObject({ root: 'hub', path: 'projects/x' });
    });

    it('names the root and the file for a file at the top of a root', () => {
        expect(tabCrumbs(source('README.md'), SERVED).map((crumb) => crumb.label)).toEqual([
            'hub',
            'README.md'
        ]);
    });

    it('reads a document tab as a path under the hub root', () => {
        const doc = {
            id: 'd',
            view: 'doc',
            state: { id: 'hpc', path: 'docs/HPC-UTwente-howto.md' }
        };

        expect(tabCrumbs(doc, SERVED).map((crumb) => crumb.label)).toEqual([
            'hub',
            'docs',
            'HPC-UTwente-howto.md'
        ]);
    });

    it('draws none for a tab naming no file and none for a root the server does not serve', () => {
        expect(tabCrumbs({ id: 't', view: 'terminal', state: { id: 'x' } }, SERVED)).toEqual([]);
        expect(tabCrumbs(source('a.md', 'elsewhere'), SERVED)).toEqual([]);
        expect(tabCrumbs(source('a.md'), [])).toEqual([]);
    });
});

describe('a press on a segment of the breadcrumb', () => {
    const crumbs = tabCrumbs(source('projects/x/manuscript/main.tex'), SERVED);
    const deps = () => {
        const calls: string[] = [];
        return {
            calls,
            showFolderInFiles: (path: string, root?: string) => {
                calls.push(`folder ${root ?? ''}:${path}`);
                return '';
            },
            showInFiles: (path: string, root?: string) => {
                calls.push(`file ${root ?? ''}:${path}`);
                return '';
            }
        };
    };

    // Revert: open the file for a folder segment.
    it('opens the Files view rooted at the folder for the root and a folder', () => {
        const held = deps();
        crumbPicked(crumbs[2], held);
        crumbPicked(crumbs[0], held);

        expect(held.calls).toEqual(['folder hub:projects/x', 'folder hub:']);
    });

    it('reveals the file for the file segment', () => {
        const held = deps();
        crumbPicked(crumbs[4], held);

        expect(held.calls).toEqual(['file hub:projects/x/manuscript/main.tex']);
    });
});

describe('the hint of a tab', () => {
    // Revert: keep the view label as the hint of a file tab.
    it('is the full path of a file tab, and the path then the preview sentence for a preview one', () => {
        expect(tabHint({ preview: false, path: '~/w/a.md', viewWords: 'Source' }, words)).toBe(
            '~/w/a.md'
        );
        expect(tabHint({ preview: true, path: '~/w/a.md', viewWords: 'Source' }, words)).toBe(
            '~/w/a.md\n@ui.preview_tab'
        );
    });

    it('is the preview words, the view words or nothing for a tab naming no file', () => {
        expect(tabHint({ preview: true, path: null, viewWords: 'Source' }, words)).toBe(
            '@ui.preview_tab'
        );
        expect(tabHint({ preview: false, path: null, viewWords: 'Processes' }, words)).toBe(
            'Processes'
        );
        expect(
            tabHint({ preview: false, path: null, viewWords: undefined }, words)
        ).toBeUndefined();
    });
});

describe('the home folder written ~', () => {
    // Revert: join without testing the home folder.
    it('replaces the home folder of a path under it', () => {
        expect(
            shownPath('/Users/axelfaes/workspace/hub', 'projects/x/a.md', '/Users/axelfaes')
        ).toBe('~/workspace/hub/projects/x/a.md');
        expect(shownPath('/Users/axelfaes', '', '/Users/axelfaes')).toBe('~');
        expect(shownPath('/Users/axelfaes/', 'a', '/Users/axelfaes/')).toBe('~/a');
    });

    it('writes a path outside the home folder whole, a sibling folder of the same prefix included', () => {
        expect(shownPath('/srv/data', 'a.txt', '/Users/axelfaes')).toBe('/srv/data/a.txt');
        expect(shownPath('/Users/axelfaes2/w', 'a.txt', '/Users/axelfaes')).toBe(
            '/Users/axelfaes2/w/a.txt'
        );
        expect(shownPath('/srv/data', 'a.txt', '')).toBe('/srv/data/a.txt');
    });
});
