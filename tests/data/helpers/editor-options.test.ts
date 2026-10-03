// The editor's options in config/behavior.yml's `editor:` block and in a repository's
// `.oculus/settings.yml`: how the merged configuration is read (a bad value is the default and a
// problem naming its key), how a repository's file is parsed, the order a value is taken in
// (the tab's choice, the file's own indentation, the repository's record, `editor.languages`, the
// global key), and the toggle of word wrap.
//
// What this does NOT cover: the editor taking the values (tests/ui/controls/editor/options.test.ts)
// and the source tab handing them over (tests/views/shared/prose/source-options.test.ts).

import { describe, expect, it } from 'vitest';
import { parseDocument } from 'yaml';
import {
    editorOptions,
    parseRepoSettings,
    readEditorOptions,
    resolveEditor,
    toggleWrap
} from '../../../src/lib/data/helpers/editor.ts';
import { behaviorFindings } from '../../../src/lib/data/sources/config/catalogs.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';

const { config } = loadConfig(engineDir());

/** A configuration carrying only these `editor:` keys. */
function held(editor: unknown): Record<string, unknown> {
    return { editor };
}

/** The keys the problems of a configuration name, in order. */
function problemKeys(editor: unknown): string[] {
    return readEditorOptions(held(editor)).problems.map((one) => one.key);
}

describe('the tracked configuration', () => {
    it('draws no finding of the new keys', () => {
        expect(behaviorFindings(engineDir(), config)).toEqual([]);
    });
});

describe('a configuration without any of the new keys', () => {
    it.each([{}, held({}), held({ paint_limit_kb: 64 }), held('on'), held([])])(
        'is read as every default with no problem: %j',
        (given) => {
            const { options, problems } = readEditorOptions(given);
            expect(problems).toEqual([]);
            expect(options).toMatchObject({
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'off',
                minimap: true,
                renderWhitespace: 'selection',
                stickyScroll: true
            });
            expect({ ...options.languages }).toEqual({});
        }
    );

    it('draws no finding', () => {
        const text = { text: config.text };
        expect(behaviorFindings(engineDir(), { ...text, editor: { paint_limit_kb: 64 } })).toEqual(
            []
        );
    });

    it('hands every caller options of its own', () => {
        const first = editorOptions({});
        first.tabSize = 7;
        expect(editorOptions({}).tabSize).toBe(4);
    });
});

describe('a global key outside its words or range', () => {
    it.each([
        ['tab_size', 0],
        ['tab_size', 9],
        ['tab_size', 2.5],
        ['tab_size', -1],
        ['tab_size', '4'],
        ['insert_spaces', 'yes'],
        ['insert_spaces', 1],
        ['word_wrap', true],
        ['word_wrap', 'sideways'],
        ['minimap', 'no'],
        ['render_whitespace', 'everything'],
        ['sticky_scroll', 0]
    ])('reads %s: %j as its default and names the key', (key, value) => {
        const { options, problems } = readEditorOptions(held({ [key]: value }));
        expect(problems.map((one) => one.key)).toEqual([`editor.${key}`]);
        expect(options).toMatchObject({
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'off',
            minimap: true,
            renderWhitespace: 'selection',
            stickyScroll: true
        });
    });

    it.each([
        ['tab_size', 1, 'tabSize', 1],
        ['tab_size', 8, 'tabSize', 8],
        ['insert_spaces', false, 'insertSpaces', false],
        ['word_wrap', 'wordWrapColumn', 'wordWrap', 'wordWrapColumn'],
        ['word_wrap', 'bounded', 'wordWrap', 'bounded'],
        ['minimap', false, 'minimap', false],
        ['render_whitespace', 'all', 'renderWhitespace', 'all'],
        ['sticky_scroll', false, 'stickyScroll', false]
    ])('reads %s: %j', (key, value, name, read) => {
        const { options, problems } = readEditorOptions(held({ [key]: value }));
        expect(problems).toEqual([]);
        expect(options).toMatchObject({ [name]: read });
    });
});

describe('editor.languages', () => {
    it.each([{}, null])('sets nothing and draws no finding when it is %j', (languages) => {
        const { options, problems } = readEditorOptions(held({ languages }));
        expect(problems).toEqual([]);
        expect({ ...options.languages }).toEqual({});
    });

    it('is a finding when it is not a map', () => {
        expect(problemKeys({ languages: ['a'] })).toEqual(['editor.languages']);
        expect(problemKeys({ languages: 'python' })).toEqual(['editor.languages']);
    });

    it('reads the fields of a record and gives a record per language', () => {
        const { options, problems } = readEditorOptions(
            held({
                languages: {
                    python: {
                        tab_size: 2,
                        insert_spaces: false,
                        word_wrap: 'bounded',
                        rulers: [72]
                    }
                }
            })
        );
        expect(problems).toEqual([]);
        expect(options.languages.python).toEqual({
            tabSize: 2,
            insertSpaces: false,
            wordWrap: 'bounded',
            rulers: [72]
        });
    });

    it('names a language the editor does not know, matched as written, and reads the rest', () => {
        const { options, problems } = readEditorOptions(
            held({
                languages: { klingon: { tab_size: 2 }, Python: { tab_size: 2 }, c: { tab_size: 8 } }
            })
        );
        expect(problems.map((one) => one.key)).toEqual([
            'editor.languages.klingon',
            'editor.languages.Python'
        ]);
        expect({ ...options.languages }).toEqual({ c: { tabSize: 8 } });
    });

    it('reads a bad field on its own and keeps the record s other fields', () => {
        const { options, problems } = readEditorOptions(
            held({
                languages: {
                    python: { tab_size: 'two', rulers: [72], insert_spaces: false },
                    cpp: { tab_size: 0 },
                    java: { tab_size: 9 },
                    c: { tab_size: 2.5, word_wrap: 'on' }
                }
            })
        );
        expect(problems.map((one) => one.key)).toEqual([
            'editor.languages.python.tab_size',
            'editor.languages.cpp.tab_size',
            'editor.languages.java.tab_size',
            'editor.languages.c.tab_size'
        ]);
        expect(options.languages.python).toEqual({ rulers: [72], insertSpaces: false });
        expect(options.languages.c).toEqual({ wordWrap: 'on' });
    });

    it.each([[80], ['72'], [[72, 'x']], [[-1]], [[0]], [[1.5]], [[]]])(
        'reads rulers %j',
        (rulers) => {
            const { options, problems } = readEditorOptions(
                held({ languages: { python: { rulers, tab_size: 3 } } })
            );
            const good =
                Array.isArray(rulers) &&
                rulers.every((one) => typeof one === 'number' && Number.isInteger(one) && one >= 1);
            expect(problems.map((one) => one.key)).toEqual(
                good ? [] : ['editor.languages.python.rulers']
            );
            expect(options.languages.python).toEqual(
                good ? { tabSize: 3, rulers } : { tabSize: 3 }
            );
        }
    );

    it('names a field the record does not have, and a record that is not a map', () => {
        expect(problemKeys({ languages: { python: { tabsize: 2 } } })).toEqual([
            'editor.languages.python.tabsize'
        ]);
        expect(problemKeys({ languages: { python: [1] } })).toEqual(['editor.languages.python']);
        expect(problemKeys({ languages: { python: 4 } })).toEqual(['editor.languages.python']);
    });

    it('names a reserved language and never merges it', () => {
        const parsed = JSON.parse(
            '{"languages": {"__proto__": {"tab_size": 2}, "constructor": {"tab_size": 3}, "prototype": {"tab_size": 4}, "c": {"tab_size": 8}}}'
        ) as unknown;
        const { options, problems } = readEditorOptions(held(parsed));
        expect(problems.map((one) => one.key)).toEqual([
            'editor.languages.__proto__',
            'editor.languages.constructor',
            'editor.languages.prototype'
        ]);
        expect(Object.keys(options.languages)).toEqual(['c']);
        expect(Object.getPrototypeOf(options.languages)).toBeNull();
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(({} as Record<string, unknown>).tabSize).toBeUndefined();
    });

    it('lists each problem in the Findings view naming its key', () => {
        const messages = behaviorFindings(engineDir(), {
            text: config.text,
            editor: {
                paint_limit_kb: 64,
                word_wrap: 'sideways',
                languages: { klingon: { tab_size: 2 }, python: { tab_size: 0 } }
            }
        });
        expect(messages.map((one) => one.key)).toEqual([
            'editor.word_wrap',
            'editor.languages.klingon',
            'editor.languages.python.tab_size'
        ]);
        for (const one of messages) expect(one.message).toContain(one.key);
    });
});

describe('a repository s .oculus/settings.yml', () => {
    it.each([
        ['an empty file', ''],
        ['a comments-only file', '# nothing here\n'],
        ['a file without languages', 'other: 1\n'],
        ['languages: null', 'languages:\n'],
        ['languages: {}', 'languages: {}\n'],
        ['a list at the top', '- a\n- b\n']
    ])('reads %s and sets nothing', (_label, text) => {
        const read = parseRepoSettings(text);
        expect(read.kind).toBe('read');
        if (read.kind !== 'read') return;
        expect({ ...read.languages }).toEqual({});
        expect(read.skipped).toEqual([]);
    });

    it('reads a record of a language and no key but languages', () => {
        const read = parseRepoSettings(
            'languages:\n  python: { tab_size: 8, insert_spaces: false }\neditor:\n  tab_size: 7\n'
        );
        if (read.kind !== 'read') throw new Error('not read');
        expect({ ...read.languages }).toEqual({ python: { tabSize: 8, insertSpaces: false } });
        expect(read.skipped).toEqual([]);
    });

    it('does not read a file that does not parse, and says the parser s first line', () => {
        const read = parseRepoSettings('languages: [unclosed\n');
        expect(read.kind).toBe('unparsed');
        if (read.kind !== 'unparsed') return;
        expect(read.line).toBe(
            parseDocument('languages: [unclosed\n').errors[0].message.split('\n')[0]
        );
        expect(read.line).not.toContain('\n');
    });

    it('does not read a languages that is not a map', () => {
        expect(parseRepoSettings('languages: [a, b]\n').kind).toBe('not-a-map');
        expect(parseRepoSettings('languages: python\n').kind).toBe('not-a-map');
    });

    it('skips an unknown language, a reserved name and a bad field, and reads the rest', () => {
        const read = parseRepoSettings(
            [
                'languages:',
                '  klingon: { tab_size: 2 }',
                '  python: { tabsize: 2, rulers: [72] }',
                '  cpp: { tab_size: two, rulers: [80, 100] }',
                '  Java: { tab_size: 2 }',
                'editor:',
                '  tab_size: 7',
                ''
            ].join('\n')
        );
        if (read.kind !== 'read') throw new Error('not read');
        expect(read.skipped.map((one) => one.key)).toEqual([
            'languages.klingon',
            'languages.python.tabsize',
            'languages.cpp.tab_size',
            'languages.Java'
        ]);
        expect({ ...read.languages }).toEqual({
            python: { rulers: [72] },
            cpp: { rulers: [80, 100] }
        });
    });

    it('never merges a reserved language name', () => {
        const read = parseRepoSettings(
            'languages:\n  __proto__: { tab_size: 2 }\n  constructor: { tab_size: 3 }\n'
        );
        if (read.kind !== 'read') throw new Error('not read');
        expect(read.skipped.map((one) => one.key)).toEqual([
            'languages.__proto__',
            'languages.constructor'
        ]);
        expect(Object.keys(read.languages)).toEqual([]);
        expect(Object.getPrototypeOf(read.languages)).toBeNull();
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
});

/** Options with these language records, over VS Code's defaults. */
function optionsWith(languages: Record<string, unknown>, global: Record<string, unknown> = {}) {
    return readEditorOptions(held({ ...global, languages })).options;
}

/** The root file's records, read from a text. */
function rootOf(text: string) {
    const read = parseRepoSettings(text);
    if (read.kind !== 'read') throw new Error('not read');
    return read.languages;
}

const NONE = { indent: null, wrap: null };

describe('the indentation a tab takes', () => {
    it('is the configured width and tabs for a file with nothing to detect (case 1)', () => {
        const options = optionsWith({}, { tab_size: 3, insert_spaces: false });
        const got = resolveEditor({
            language: 'python',
            options,
            root: null,
            detected: null,
            tab: NONE
        });
        expect(got.indent).toEqual({ tabs: true, size: 3 });
    });

    // Red when a record's tab_size does not combine with the default insert_spaces: true.
    it('takes editor.languages over the global keys at their defaults (case 2)', () => {
        const options = optionsWith({ python: { tab_size: 2 } });
        const asked = (
            root: ReturnType<typeof rootOf> | null,
            indent = null as null | { tabs: boolean; size: number }
        ) =>
            resolveEditor({
                language: 'python',
                options,
                root,
                detected: null,
                tab: { indent, wrap: null }
            }).indent;
        expect(asked(null)).toEqual({ tabs: false, size: 2 });
        const root = rootOf('languages: { python: { tab_size: 8, insert_spaces: false } }\n');
        expect(asked(root)).toEqual({ tabs: true, size: 8 });
        expect(asked(root, { tabs: false, size: 4 })).toEqual({ tabs: false, size: 4 });
    });

    it('combines the fields one by one, a record width with the global tabs (case 2)', () => {
        const options = optionsWith(
            { python: { tab_size: 2 } },
            { tab_size: 3, insert_spaces: false }
        );
        const asked = (
            root: ReturnType<typeof rootOf> | null,
            indent = null as null | { tabs: boolean; size: number }
        ) =>
            resolveEditor({
                language: 'python',
                options,
                root,
                detected: null,
                tab: { indent, wrap: null }
            }).indent;
        expect(asked(null)).toEqual({ tabs: true, size: 2 });
        const root = rootOf('languages: { python: { tab_size: 8, insert_spaces: false } }\n');
        expect(asked(root)).toEqual({ tabs: true, size: 8 });
        expect(asked(root, { tabs: false, size: 4 })).toEqual({ tabs: false, size: 4 });
    });

    it('takes the indentation the file gives over the configured one (case 3)', () => {
        const options = optionsWith({}, { tab_size: 4 });
        const got = resolveEditor({
            language: 'python',
            options,
            root: null,
            detected: { tabs: false, size: 2 },
            tab: NONE
        });
        expect(got.indent).toEqual({ tabs: false, size: 2 });
    });

    it('takes a tab file s width from the configured order, not the detection (case 4)', () => {
        const options = optionsWith({ c: { tab_size: 8 } });
        const got = resolveEditor({
            language: 'c',
            options,
            root: null,
            detected: { tabs: true, size: 4 },
            tab: NONE
        });
        expect(got.indent).toEqual({ tabs: true, size: 8 });
    });

    it('takes the global keys for a language no record names', () => {
        const options = optionsWith({ python: { tab_size: 2 } }, { tab_size: 3 });
        const got = resolveEditor({
            language: 'lua',
            options,
            root: null,
            detected: null,
            tab: NONE
        });
        expect(got.indent).toEqual({ tabs: false, size: 3 });
    });
});

describe('the word wrap and rulers a tab takes', () => {
    const options = readEditorOptions(config).options;

    it('takes the tab s toggle over the root, editor.languages and the global key', () => {
        const root = rootOf('languages: { markdown: { word_wrap: bounded } }\n');
        const asked = (wrap: 'off' | 'on' | null) =>
            resolveEditor({
                language: 'markdown',
                options,
                root,
                detected: null,
                tab: { indent: null, wrap }
            });
        expect(asked(null).wordWrap).toBe('bounded');
        expect(asked(null).configuredWrap).toBe('bounded');
        expect(asked('off').wordWrap).toBe('off');
        expect(asked('off').configuredWrap).toBe('bounded');
    });

    it('draws the rulers of the language alone (case 8)', () => {
        const withRulers = optionsWith({ cpp: { rulers: [80, 100] } });
        const rulers = (language: string, root: ReturnType<typeof rootOf> | null = null) =>
            resolveEditor({ language, options: withRulers, root, detected: null, tab: NONE })
                .rulers;
        expect(rulers('cpp')).toEqual([80, 100]);
        expect(rulers('python')).toEqual([]);
        expect(rulers('cpp', rootOf('languages: { cpp: { rulers: [60] } }\n'))).toEqual([60]);
    });
});

describe('the toggle of word wrap (case 34)', () => {
    it.each([
        ['bounded', 'bounded', 'off'],
        ['on', 'on', 'off'],
        ['wordWrapColumn', 'off', null],
        ['off', 'bounded', null],
        ['off', 'on', null],
        ['off', 'off', 'on']
    ] as const)('toggles %s, configured %s, to %j', (now, configured, toggled) => {
        expect(toggleWrap(now, configured)).toBe(toggled);
    });
});
