// Layer 4, server test. The reader of the apps folders, for the contribution points that reach the
// tools: `languages`, `grammars`, `snippets`, `jsonValidation`, `configurationDefaults`,
// `debuggers`, `taskDefinitions`, `problemPatterns`, `problemMatchers`, and the points oculus does
// not read. A shape or a name that breaks a rule refuses the app, a file or a rule that cannot act
// is left out with a finding and the app is offered, and two apps that name one ending give it to
// the app that comes first. These are the manifest reader's rows of G49 for the tools' points.
//
// Every folder here is synthetic, under the system temporary directory. What this does NOT cover:
// the page that draws a language (tests/state/system/apps/tools), and the servers an app starts.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import {
    MANIFEST,
    PAGE,
    again,
    notes,
    offeredWith,
    outcome,
    read,
    refused,
    words,
    type Layout,
    type Row
} from './manifest-fixture.ts';

/** The manifest of `notes` with a `contributes` map written as YAML text, and its named files. */
const contributing = (
    contributes: string,
    files: Record<string, string> = {}
): Record<string, string> => ({
    ...notes(`${MANIFEST}contributes:\n${contributes}`),
    'notes/host.mjs': 'export function activate() {}\n',
    ...files
});

const NOTE_LANGUAGE = '  languages:\n    - id: notes\n      extensions: [".note"]\n';

const SHAPE_ROWS: Row[] = [
    [
        'a language with extensions, file names, a file name pattern and a first line pattern is offered and held by the row',
        () => {
            const layout: Layout = {
                machine: contributing(
                    '  languages:\n    - id: notes\n      aliases: [Notes]\n      extensions: [".note", ".nt"]\n      filenames: [NOTES]\n      filenamePatterns: ["**/notes/*.txt"]\n      firstLine: "^#notes"\n'
                )
            };
            const { scanned } = read(layout);
            return {
                ...outcome(layout),
                held: scanned.apps[0].row.contributes.languages.map((one) => [
                    one.id,
                    one.extensions,
                    one.filenames,
                    one.filenamePatterns,
                    one.firstLine
                ])
            };
        },
        {
            ...offeredWith(),
            held: [['notes', ['.note', '.nt'], ['notes'], ['**/notes/*.txt'], '^#notes']]
        }
    ],
    [
        'an extension without its dot, a file name with a slash and a first line pattern that is no regular expression',
        () =>
            [
                '  languages:\n    - id: notes\n      extensions: [note]\n',
                '  languages:\n    - id: notes\n      filenames: [a/b]\n',
                '  languages:\n    - id: notes\n      firstLine: "("\n'
            ].map((one) => outcome({ machine: contributing(one) }).findings),
        [
            [
                [
                    'apps[notes]',
                    words('contributes_extension', 'contributes.languages[0].extensions[0]', 'note')
                ]
            ],
            [
                [
                    'apps[notes]',
                    words('contributes_filename', 'contributes.languages[0].filenames[0]', 'a/b')
                ]
            ],
            [
                [
                    'apps[notes]',
                    words('contributes_regexp', 'contributes.languages[0].firstLine', '(')
                ]
            ]
        ]
    ],
    [
        'a grammar file the app does not hold',
        () =>
            outcome({
                machine: contributing(
                    `${NOTE_LANGUAGE}  grammars:\n    - language: notes\n      scopeName: source.notes\n      path: notes.tmLanguage.json\n`
                )
            }).ids,
        []
    ],
    [
        'a grammar whose scope name a shipped grammar has: left out with a finding, the app offered',
        () => {
            const layout: Layout = {
                machine: contributing(
                    `${NOTE_LANGUAGE}  grammars:\n    - language: notes\n      scopeName: text.html.markdown\n      path: md.tmLanguage.json\n`,
                    {
                        'notes/md.tmLanguage.json':
                            '{"scopeName":"text.html.markdown","patterns":[]}'
                    }
                )
            };
            const { scanned } = read(layout);
            return {
                ...outcome(layout),
                grammars: scanned.apps[0].row.contributes.grammars.length
            };
        },
        {
            ...offeredWith(words('grammar_shipped', 'md.tmLanguage.json', 'text.html.markdown')),
            grammars: 0
        }
    ],
    [
        'a grammar of a scope name no shipped grammar has is kept',
        () => {
            const layout: Layout = {
                machine: contributing(
                    `${NOTE_LANGUAGE}  grammars:\n    - language: notes\n      scopeName: source.notes\n      path: notes.tmLanguage.json\n`,
                    { 'notes/notes.tmLanguage.json': '{"scopeName":"source.notes","patterns":[]}' }
                )
            };
            return {
                ...outcome(layout),
                grammars: read(layout).scanned.apps[0].row.contributes.grammars.map(
                    (one) => one.scopeName
                )
            };
        },
        { ...offeredWith(), grammars: ['source.notes'] }
    ],
    [
        'a JSON schema that is no file of the app is left out with a finding, the app offered',
        () =>
            outcome({
                machine: contributing(
                    '  jsonValidation:\n    - fileMatch: "*.notes.json"\n      url: absent.json\n'
                )
            }),
        offeredWith(words('contributes_validation_dropped', 'absent.json'))
    ],
    [
        'a debugger of the type oculus ships',
        () =>
            outcome({
                machine: contributing(
                    '  debuggers:\n    - type: rite\n      label: Mine\n      program: a.js\n',
                    { 'notes/a.js': 'x\n' }
                )
            }),
        refused(words('contributes_rite', 'contributes.debuggers[0].type', 'rite'))
    ],
    [
        'a problem matcher that names a pattern the app does not declare',
        () =>
            outcome({
                machine: contributing(
                    '  problemMatchers:\n    - name: notes.mine\n      owner: mine\n      pattern: $absent\n'
                )
            }),
        refused(
            words('contributes_pattern_unknown', 'contributes.problemMatchers[0].pattern', 'absent')
        )
    ],
    [
        'a problem matcher with an expression that is no regular expression',
        () =>
            outcome({
                machine: contributing(
                    '  problemMatchers:\n    - name: notes.mine\n      owner: mine\n      pattern:\n        regexp: "("\n        file: 1\n        message: 2\n'
                )
            }).ids,
        []
    ],
    [
        'menus of the tools: scm, debug and terminal entries with their when clauses are kept as written',
        () => {
            const layout: Layout = {
                machine: contributing(
                    '  commands:\n    - command: notes.hello\n      title: Hello\n  menus:\n    scm/title:\n      - command: notes.hello\n        when: scmProvider == notes.git\n    scm/resourceState/context:\n      - command: notes.hello\n        when: scmResourceGroup == changes && scmProvider == notes.git\n    debug/callstack/context:\n      - command: notes.hello\n        when: debugType == notes.dbg\n    debug/toolBar:\n      - command: notes.hello\n    terminal/title/context:\n      - command: notes.hello\n        when: terminalProcessSupported\n'
                )
            };
            return {
                ...outcome(layout),
                kept: Object.fromEntries(
                    Object.entries(read(layout).scanned.apps[0].row.contributes.menus).map(
                        ([menu, entries]) => [menu, entries.map((one) => one.when)]
                    )
                )
            };
        },
        {
            ...offeredWith(),
            kept: {
                'scm/title': ['scmProvider == notes.git'],
                'scm/resourceState/context': [
                    'scmResourceGroup == changes && scmProvider == notes.git'
                ],
                'debug/callstack/context': ['debugType == notes.dbg'],
                'debug/toolBar': [''],
                'terminal/title/context': ['terminalProcessSupported']
            }
        }
    ]
];

const UNKNOWN_ROWS: Row[] = [
    [
        'a point oculus does not read: notebooks',
        () =>
            outcome({
                machine: contributing('  notebooks:\n    - type: x\n      displayName: X\n')
            }),
        refused(words('key_unknown', 'contributes.notebooks'))
    ],
    [
        'a menu oculus does not draw: scm/inputBox',
        () =>
            outcome({
                machine: contributing(
                    '  commands:\n    - command: notes.hello\n      title: Hello\n  menus:\n    scm/inputBox:\n      - command: notes.hello\n'
                )
            }),
        offeredWith(words('contributes_menu_dropped', 'scm/inputBox'))
    ]
];

/** The ids a case's apps offer after the approval of every one of them, and what they lost. */
function approvedOutcome(layout: Layout) {
    const first = read(layout);
    const hashes = new Set(first.scanned.apps.map((one) => one.row.hash));
    const roots = Object.keys(layout.roots ?? {}).map((key) => ({
        key,
        dir: join(first.base, 'roots', key)
    }));
    return again(first.base, join(first.base, 'machine'), roots, hashes);
}

const OTHER = (languages: string): Record<string, string> => ({
    '.oculus/apps/other/app.yml': `name: other\ntitle: Other\nbridge: 1\ncontributes:\n${languages}`,
    '.oculus/apps/other/index.html': PAGE
});

const TAKEN_ROWS: Row[] = [
    [
        'an ending two apps give to two languages goes to the app first in the Views list, and the other app is told',
        () => {
            const scanned = approvedOutcome({
                machine: contributing(NOTE_LANGUAGE),
                roots: {
                    one: OTHER(
                        '  languages:\n    - id: other\n      extensions: [".note", ".oth"]\n'
                    )
                }
            });
            return {
                held: scanned.apps.map((one) => [
                    one.id,
                    one.row.contributes.languages.map((language) => [
                        language.id,
                        language.extensions
                    ])
                ]),
                findings: scanned.findings.map((one) => [one.key, one.message])
            };
        },
        {
            held: [
                ['app:notes', [['notes', ['.note']]]],
                ['app:one/other', [['other', ['.oth']]]]
            ],
            findings: [
                [
                    'apps[one/other]',
                    words('language_taken', 'app:one/other', 'other', '.note', 'notes')
                ]
            ]
        }
    ],
    [
        'a language id two apps both name is one language with the endings of both',
        () => {
            const scanned = approvedOutcome({
                machine: contributing(NOTE_LANGUAGE),
                roots: { one: OTHER('  languages:\n    - id: notes\n      extensions: [".nts"]\n') }
            });
            return {
                held: scanned.apps.map((one) =>
                    one.row.contributes.languages.map((language) => language.extensions)
                ),
                findings: scanned.findings.length
            };
        },
        { held: [[['.note']], [['.nts']]], findings: 0 }
    ],
    [
        'a debugger type two apps declare goes to the app first in the Views list, and the other is refused with a finding that names both',
        () => {
            const scanned = approvedOutcome({
                machine: contributing(
                    '  debuggers:\n    - type: dbg\n      label: One\n      program: a.js\n',
                    { 'notes/a.js': 'x\n' }
                ),
                roots: {
                    one: {
                        ...OTHER(
                            '  debuggers:\n    - type: dbg\n      label: Two\n      program: a.js\n'
                        ),
                        '.oculus/apps/other/a.js': 'x\n'
                    }
                }
            });
            return {
                held: scanned.apps.map((one) => one.id),
                findings: scanned.findings.map((one) => one.message)
            };
        },
        {
            held: ['app:notes'],
            findings: [words('id_taken', 'app:one/other', 'debugger:dbg', 'app:notes')]
        }
    ]
];

describe('reads the points of contributes that reach the tools', () => {
    it.each(SHAPE_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('refuses or leaves out what oculus does not read', () => {
    it.each(UNKNOWN_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('gives an ending two apps name to the app first in the Views list', () => {
    it.each(TAKEN_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});
