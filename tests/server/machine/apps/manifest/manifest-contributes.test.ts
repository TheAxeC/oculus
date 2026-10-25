// Layer 4, server test. The reader of the apps folders, for the key `contributes` and the rules
// that tie an app's ids to its name: a command, menu, when clause, activation event, display
// language and unknown point read to the row's `contributes` and the findings, the `app-shell`
// channel closed to every app, and the ids two apps of one name may not both declare. These are the
// manifest reader's rows of G49 for the contribution points.
//
// Every folder here is synthetic, under the system temporary directory. What this does NOT cover:
// the page that draws what a row holds (tests/state/system/apps).

import { describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import {
    MANIFEST,
    PAGE,
    notes,
    offeredWith,
    outcome,
    read,
    refused,
    words,
    type Layout,
    type Row
} from './manifest-fixture.ts';

/** The manifest of `notes` with a `contributes` map written as YAML text. */
const contributing = (contributes: string, extra = ''): Record<string, string> => ({
    ...notes(`${MANIFEST}${extra}contributes:\n${contributes}`),
    'notes/host.mjs': 'export function activate() {}\n'
});

const HELLO = '  commands:\n    - command: notes.hello\n      title: Hello\n';

const COMMAND_ROWS: Row[] = [
    [
        'a command that starts with the app name and a dot is offered and held by the row',
        () => ({
            ...outcome({ machine: contributing(HELLO) }),
            held: read({
                machine: contributing(HELLO)
            }).scanned.apps[0].row.contributes.commands.map((one) => [one.command, one.title])
        }),
        { ...offeredWith(), held: [['notes.hello', 'Hello']] }
    ],
    [
        'a command without the prefix',
        () =>
            outcome({
                machine: contributing('  commands:\n    - command: hello\n      title: Hello\n')
            }),
        refused(words('contributes_id', 'contributes.commands[0].command', 'notes.'))
    ],
    [
        "a command of another app's name",
        () =>
            outcome({
                machine: contributing(
                    '  commands:\n    - command: other.hello\n      title: Hello\n'
                )
            }),
        refused(words('contributes_id', 'contributes.commands[0].command', 'notes.'))
    ],
    [
        'a command in the namespace of oculus',
        () =>
            outcome({
                machine: contributing(
                    '  commands:\n    - command: oculus.hello\n      title: Hello\n'
                )
            }),
        refused(words('contributes_id', 'contributes.commands[0].command', 'notes.'))
    ],
    [
        'a command declared twice',
        () =>
            outcome({ machine: contributing(`${HELLO}${HELLO.split('\n').slice(1).join('\n')}`) }),
        refused(words('contributes_repeated', 'contributes.commands[1].command', 'notes.hello'))
    ]
];

const MENU_ROWS: Row[] = [
    [
        'a menu oculus does not draw and a submenu entry are left out, each with a finding, and the app is offered',
        () => {
            const layout: Layout = {
                machine: contributing(
                    `${HELLO}  menus:\n    editor/context:\n      - command: notes.hello\n      - submenu: notes.more\n    scm/inputBox:\n      - command: notes.hello\n`
                )
            };
            return {
                ...outcome(layout),
                kept: read(layout).scanned.apps[0].row.contributes.menus
            };
        },
        {
            ...offeredWith(
                words('contributes_submenu_dropped', 'contributes.menus.editor/context[1]'),
                words('contributes_menu_dropped', 'scm/inputBox')
            ),
            kept: {
                'editor/context': [{ command: 'notes.hello', when: '', group: '', alt: '' }]
            }
        }
    ],
    [
        'a menu entry that names a command the app does not declare',
        () =>
            outcome({
                machine: contributing(
                    `${HELLO}  menus:\n    commandPalette:\n      - command: notes.absent\n`
                )
            }),
        refused(
            words(
                'contributes_command_unknown',
                'contributes.menus.commandPalette[0].command',
                'notes.absent'
            )
        )
    ]
];

const WHEN_ROWS: Row[] = [
    [
        'a when clause that does not parse names the clause',
        () =>
            outcome({
                machine: contributing(
                    `${HELLO}  menus:\n    commandPalette:\n      - command: notes.hello\n        when: "editorLangId == python && ("\n`
                )
            }),
        refused(
            words(
                'contributes_when',
                'contributes.menus.commandPalette[0].when',
                'editorLangId == python && ('
            )
        )
    ],
    [
        'a when clause with an alternative and a regular expression',
        () =>
            outcome({
                machine: contributing(
                    `${HELLO}  menus:\n    commandPalette:\n      - command: notes.hello\n        when: "resourceExtname == .tex || view =~ /^notes\\\\./"\n`
                )
            }),
        offeredWith()
    ]
];

const ACTIVATION_ROWS: Row[] = [
    [
        'onCommand naming a declared command',
        () =>
            outcome({
                machine: contributing(
                    HELLO,
                    'host: host.mjs\nactivation: [onCommand:notes.hello]\n'
                )
            }),
        offeredWith()
    ],
    [
        'onCommand naming a command nothing declares',
        () =>
            outcome({
                machine: contributing(
                    HELLO,
                    'host: host.mjs\nactivation: [onCommand:notes.missing]\n'
                )
            }),
        refused(words('event_command', 'onCommand:notes.missing'))
    ],
    [
        'onView naming a view nothing declares',
        () =>
            outcome({
                machine: contributing(HELLO, 'host: host.mjs\nactivation: [onView:notes.ghost]\n')
            }),
        refused(words('event_view', 'onView:notes.ghost'))
    ]
];

const KEY_ROWS: Row[] = [
    [
        'a point of VS Code that oculus does not read',
        () => outcome({ machine: contributing('  unknownPoint: []\n') }),
        refused(words('key_unknown', 'contributes.unknownPoint'))
    ],
    [
        'the point submenus',
        () => outcome({ machine: contributing('  submenus: []\n') }),
        refused(words('key_unknown', 'contributes.submenus'))
    ],
    [
        'a read of the app-shell channel',
        () => outcome({ machine: notes(`${MANIFEST}reads: [app-shell]\n`) }),
        refused(
            words(
                'channel_closed',
                'app-shell',
                words('who_every'),
                words('carries.app_shell').trim()
            )
        )
    ]
];

/** A root app `notes` of the root `one` declaring `notes.hello`. */
const rootNotes = (): Layout['roots'] => ({
    one: {
        '.oculus/apps/notes/app.yml': `${MANIFEST}contributes:\n${HELLO}`,
        '.oculus/apps/notes/index.html': PAGE
    }
});

const SHARED_ROWS: Row[] = [
    [
        'two apps of one name that declare one id: the later in the catalogue order is refused',
        () => {
            const { scanned } = read({ machine: contributing(HELLO), roots: rootNotes() });
            return {
                ids: scanned.apps.map((one) => one.id),
                findings: scanned.findings.map((one) => [one.key, one.message])
            };
        },
        {
            ids: ['app:notes'],
            findings: [
                ['apps[one/notes]', words('id_taken', 'app:one/notes', 'notes.hello', 'app:notes')]
            ]
        }
    ],
    [
        'two apps of one name that declare no common id are both offered',
        () => {
            const other = `${MANIFEST}contributes:\n  commands:\n    - command: notes.other\n      title: Other\n`;
            const layout: Layout = {
                machine: contributing(HELLO),
                roots: {
                    one: {
                        '.oculus/apps/notes/app.yml': other,
                        '.oculus/apps/notes/index.html': PAGE
                    }
                }
            };
            return outcome(layout);
        },
        { ids: ['app:notes', 'app:one/notes'], findings: [] }
    ]
];

/** The manifest of `notes` contributing Dutch by `localizations`, with a folder of its words. */
const speaking = (translations: string, extra = ''): Record<string, string> => ({
    ...notes(
        `${MANIFEST}contributes:\n  localizations:\n    - { languageId: nl, languageName: Dutch, translations: [ ${translations} ] }\n${extra}`
    ),
    'notes/i18n/nl/words.yml': 'text:\n  views:\n    settings: Instellingen\n'
});

const LOCALIZATION_ROWS: Row[] = [
    [
        "a display language whose translation for oculus names a folder of the app's files",
        () => {
            const machine = speaking('{ id: oculus, path: i18n/nl }');
            return {
                ...outcome({ machine }),
                held: read({ machine }).scanned.apps[0].row.contributes.localizations
            };
        },
        {
            ...offeredWith(),
            held: [
                {
                    languageId: 'nl',
                    languageName: 'Dutch',
                    localizedLanguageName: 'Dutch',
                    path: 'i18n/nl'
                }
            ]
        }
    ],
    [
        'a translation for another extension',
        () => outcome({ machine: speaking('{ id: other, path: x }') }),
        offeredWith(
            words(
                'contributes_translation_other',
                'contributes.localizations[0].translations[0].id',
                'other'
            )
        )
    ],
    [
        "a translation whose path holds none of the app's files",
        () => outcome({ machine: speaking('{ id: oculus, path: ../elsewhere }') }),
        refused(
            words(
                'contributes_folder',
                'contributes.localizations[0].translations[0].path',
                '../elsewhere'
            )
        )
    ],
    [
        'a display language declared twice',
        () =>
            outcome({
                machine: speaking(
                    '{ id: oculus, path: i18n/nl }',
                    '    - { languageId: nl, languageName: Dutch, translations: [ { id: oculus, path: i18n/nl } ] }\n'
                )
            }),
        refused(words('contributes_repeated', 'contributes.localizations[1].languageId', 'nl'))
    ]
];

describe('reads the display languages of contributes', () => {
    it.each(LOCALIZATION_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('reads the commands of contributes', () => {
    it.each(COMMAND_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('reads the menus of contributes', () => {
    it.each(MENU_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('reads the when clauses of contributes', () => {
    it.each(WHEN_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('reads the activation events that name a command or a view', () => {
    it.each(ACTIVATION_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('refuses a key or a channel no app has', () => {
    it.each(KEY_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('gives an id to the first app of the catalogue order', () => {
    it.each(SHARED_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});
