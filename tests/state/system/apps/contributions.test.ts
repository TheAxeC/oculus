// Layer 2, client state test. What the apps add to the shell (lib/state/system/apps/shell/
// contributions.ts, data/helpers/files/apps/choices.ts and the settings rows of the Settings
// view): the commands, menu entries, views, custom editors, settings, colour themes and icon
// themes of an app appear while the app is enabled and its current files are approved, and every
// one of them goes the moment the app is disabled, its files change, or the app is removed. These
// are the registry rows of G77 for the contribution points.
//
// The rows are built from `fixtureApp`, with no server. What this does NOT cover: the widgets
// that draw these lists (tests/views) and the host's own registrations (tests/routes/apps).

import { describe, expect } from 'vitest';
import {
    iconThemeOffers,
    themeOffers
} from '../../../../src/lib/data/helpers/files/apps/choices.ts';
import type { AppContributes, AppRow } from '../../../../src/lib/data/model/index.ts';
import {
    actingApps,
    commandOffers,
    editorOffers,
    menuOffers,
    viewOffers
} from '../../../../src/lib/state/system/apps/shell/contributions.ts';
import { appSettingRows } from '../../../../src/lib/state/system/config/other-rows/app-rows.ts';
import { fixtureApp } from '../../../fixtures/entities-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';

/** Everything `notes` declares, one of each point. */
const DECLARED: AppContributes = {
    commands: [
        { command: 'notes.hello', title: 'Hello', category: 'Notes', icon: '', enablement: '' }
    ],
    keybindings: [
        {
            command: 'notes.hello',
            key: 'ctrl+alt+h',
            mac: '',
            linux: '',
            win: '',
            when: '',
            args: null
        }
    ],
    menus: { commandPalette: [{ command: 'notes.hello', when: '', group: '', alt: '' }] },
    viewsContainers: { activitybar: [{ id: 'notes-bar', title: 'Notes', icon: '' }], panel: [] },
    views: {
        'notes-bar': [{ id: 'notes.list', name: 'List', type: 'tree', when: '', entry: '' }]
    },
    customEditors: [
        {
            viewType: 'notes.edit',
            displayName: 'Edit',
            selector: ['*.json'],
            priority: 'default',
            entry: 'edit.html'
        }
    ],
    configuration: {
        title: 'Notes',
        properties: [
            {
                key: 'notes.size',
                type: 'integer',
                default: 3,
                description: 'Size',
                enum: [],
                enumDescriptions: [],
                minimum: null,
                maximum: null
            }
        ]
    },
    themes: [{ label: 'Dusk', uiTheme: 'vs-dark', path: 'dusk.json' }],
    iconThemes: [{ id: 'pebbles', label: 'Pebbles', path: 'icons.json' }]
};

/** The row of `notes` in a state, with its declarations. */
const notes = (change: Partial<AppRow> = {}): AppRow =>
    fixtureApp({ contributes: DECLARED, ...change });

/** What each point lists for a set of rows: one string per entry, so a case compares text. */
function listed(rows: AppRow[]) {
    const acting = actingApps(rows);
    return {
        acting: acting.map((one) => one.id),
        commands: commandOffers(acting).map((one) => one.command.command),
        menu: menuOffers(acting, 'commandPalette', { getValue: () => undefined }).map(
            (one) => one.entry.command
        ),
        views: viewOffers(acting).map((one) => one.view.id),
        editors: editorOffers(acting).map((one) => one.editor.viewType),
        settings: appSettingRows(acting, {}).map((one) => one.path),
        themes: themeOffers(rows).map((one) => one.choice),
        icons: iconThemeOffers(rows).map((one) => one.choice)
    };
}

const ALL = {
    acting: ['app:notes'],
    commands: ['notes.hello'],
    menu: ['notes.hello'],
    views: ['notes.list'],
    editors: ['notes.edit'],
    settings: ['notes.size'],
    themes: ['app:notes/Dusk'],
    icons: ['app:notes/pebbles']
};

const NONE = {
    acting: [],
    commands: [],
    menu: [],
    views: [],
    editors: [],
    settings: [],
    themes: [],
    icons: []
};

describe('what an app adds to the shell follows the state of the app', () => {
    it.each([
        ['enabled and approved', [notes()], ALL],
        ['not approved at all', [notes({ approved: false, hashApproved: false })], NONE],
        ['approved before and changed since', [notes({ hashApproved: false })], NONE],
        ['disabled', [notes({ disabled: true })], NONE],
        ['removed', [], NONE]
    ] as [string, AppRow[], typeof ALL][])('%s', (_state, rows, expected) => {
        expect(listed(rows)).toEqual(expected);
    });

    it('lists the contributions again once the changed files are approved', () => {
        const changed = notes({ hashApproved: false });
        expect(listed([changed])).toEqual(NONE);
        expect(listed([{ ...changed, hashApproved: true }])).toEqual(ALL);
    });

    it('lists the apps that act in the order of the rows and leaves out one that does not', () => {
        const rows = [
            notes({ name: 'zeta', title: 'Zeta' }),
            notes({ name: 'stale', hashApproved: false }),
            notes({ name: 'alpha', title: 'Alpha' })
        ];
        expect(actingApps(rows).map((one) => one.id)).toEqual(['app:zeta', 'app:alpha']);
    });

    it('names a root app by its root and keeps two apps of one name apart', () => {
        const rows = [notes(), notes({ root: 'one' })];
        expect(actingApps(rows).map((one) => one.id)).toEqual(['app:notes', 'app:one/notes']);
        expect(themeOffers(rows).map((one) => one.choice)).toEqual([
            'app:notes/Dusk',
            'app:one/notes/Dusk'
        ]);
    });
});

describe('a setting row of an app', () => {
    it('shows the stored value, and the default while the stored one breaks its declaration', () => {
        const acting = actingApps([notes()]);
        const row = (stored: unknown) =>
            appSettingRows(acting, { app_settings: { 'notes.size': stored } })[0];
        expect([row(7).value, row(7).modified]).toEqual([7, true]);
        expect([row('wide').value, row('wide').modified]).toEqual([3, false]);
    });
});
