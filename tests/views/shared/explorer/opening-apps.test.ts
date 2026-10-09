// Layer 3, view-partial tests. Which tab a file of an apps folder opens in
// (views/shared/explorer/opening.ts): source text through every opener, never the Document view
// that would run the app's page. Every store call is a fake that records what it was asked.
//
// It does not cover the folders the page holds (tests/server/machine/apps) or the click that
// raises the press, which the look does.

import { describe, expect } from 'vitest';
import { inAppsFolder } from '../../../../src/lib/data/helpers/files/apps.ts';
import type { Entry } from '../../../../src/lib/state/boards/collection.ts';
import { bookmarkRows } from '../../../../src/lib/state/sources/explorer/view/bookmark-rows.ts';
import {
    openBookmark,
    openPage,
    openRow,
    openRowBeside,
    type BesideOpener,
    type Opener
} from '../../../../src/lib/views/shared/explorer/opening.ts';
import { tabForKind } from '../../../../src/lib/state/workbench/layout/instance.ts';
import type { TreeRow } from '../../../../src/lib/state/sources/fs.ts';
import { it } from '../../../fixtures/scratch.ts';

const FOLDERS = ['/hub/.oculus/apps'];

/** The page's `holds`: whether a file of the root `hub` lies in an apps folder. */
const holds = (root: string, path: string): boolean =>
    inAppsFolder(FOLDERS, root === 'hub' ? '/hub' : '', path);

const APP_PAGE = '.oculus/apps/notes/index.html';
const PLAIN_PAGE = 'docs/manual.html';

const bookmark = (id: string, title: string, path: string): Entry => ({
    id,
    title,
    fields: { root: 'hub', path },
    file: '/bookmarks.yml',
    index: 0
});

const row = (path: string): TreeRow => ({
    root: 'hub',
    path,
    name: path.split('/').pop() ?? path,
    kind: 'file',
    size: 12,
    depth: 1,
    open: false
});

/** An opener over fakes: the views it was asked to open, in order. */
function opener(kind = 'html', over: Partial<Opener> = {}) {
    const opened: string[] = [];
    const made: Opener = {
        openView: (view) => {
            opened.push(view);
            return 'tab-1';
        },
        keepPreview: () => undefined,
        readFileKind: () => Promise.resolve({ kind }) as ReturnType<Opener['readFileKind']>,
        holds,
        ...over
    };
    return { made, opened };
}

type Row = [string, () => unknown, unknown];

const BESIDE = (opened: string[]): BesideOpener => ({
    openBeside: (view) => {
        opened.push(view);
        return 'tab-2';
    },
    readFileKind: () => Promise.resolve({ kind: 'html' }),
    holds
});

const ROWS: Row[] = [
    ...(
        [
            ['a page of an app', APP_PAGE, 'source'],
            ['a page outside every apps folder', PLAIN_PAGE, 'document'],
            [
                'a folder name that only starts like the apps folder',
                '.oculus/apps-old/x.html',
                'document'
            ]
        ] as [string, string, string][]
    ).map(([label, path, view]): Row => [
        `${label}, in the ${view} view from the tab choice`,
        () => tabForKind('html', 'hub', path, undefined, holds).view,
        view
    ]),
    [
        'a page of an app, as source text whatever kind the first bytes give',
        () =>
            ['html', 'text', 'other', 'image', 'pdf', 'missing'].map(
                (kind) => tabForKind(kind, 'hub', APP_PAGE, 12, holds).view
            ),
        Array<string>(6).fill('source')
    ],
    [
        'a page of an app pressed with the pointer and with a key, and an ordinary page',
        async () => {
            const pointer = opener();
            await openRow(pointer.made, row(APP_PAGE), true, 40);
            const key = opener();
            await openRow(key.made, row(APP_PAGE), false);
            const plain = opener();
            await openRow(plain.made, row(PLAIN_PAGE), true);
            return [pointer.opened, key.opened, plain.opened];
        },
        [['source'], ['source'], ['document']]
    ],
    [
        'a page of an app beside the pane being read, and an ordinary page',
        async () => {
            const opened: string[] = [];
            await openRowBeside(BESIDE(opened), row(APP_PAGE));
            await openRowBeside(BESIDE(opened), row(PLAIN_PAGE));
            return opened;
        },
        ['source', 'document']
    ],
    [
        'a bookmark of a page of an app, of another page and of a script of an app',
        () => {
            const { made, opened } = opener();
            openBookmark(made, bookmark('a', 'App', APP_PAGE));
            openBookmark(made, bookmark('b', 'Manual', PLAIN_PAGE));
            openBookmark(made, bookmark('c', 'Script', '.oculus/apps/notes/app.js'));
            return opened;
        },
        ['source', 'document', 'source']
    ],
    [
        'a page held by a path through a link to the apps folder',
        () => {
            const linked = (root: string, path: string): boolean =>
                inAppsFolder(['/real/apps'], root === 'hub' ? '/real' : '', path);
            return tabForKind('html', 'hub', 'apps/notes/index.html', undefined, linked).view;
        },
        'source'
    ],
    [
        'the rail bookmark of a file of an app, an ordinary page and a folder',
        () =>
            bookmarkRows(
                [
                    { title: 'App', fields: { root: 'hub', path: APP_PAGE } },
                    { title: 'Manual', fields: { root: 'hub', path: PLAIN_PAGE } },
                    {
                        title: 'Folder',
                        fields: { root: 'hub', path: '.oculus/apps' },
                        kind: 'folder'
                    }
                ],
                holds
            ).map((one) => one.view),
        ['source', 'document', 'files']
    ],
    [
        'a page opened through openPage, which the project, card, entry and README openers call',
        () => {
            const views: string[] = [];
            const client = {
                apps: { holds },
                layout: {
                    openView: (view: string) => {
                        views.push(view);
                        return 'tab';
                    }
                }
            };
            openPage(client as never, { root: 'hub', path: APP_PAGE, label: 'App' });
            openPage(client as never, { root: 'hub', path: PLAIN_PAGE, label: 'Manual' });
            return views;
        },
        ['source', 'document']
    ]
];

describe('opens a file of an apps folder as source text, whichever opener asks', () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
