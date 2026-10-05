// Layer 1, data tests. The editor's options and a repository's settings file, read by the rule of
// the options catalog. The catalog is synthetic, its editor defaults different from the shipped
// ones, so a default written in code fails a row; the shipped configuration is read for no problem.

import { describe, expect, it } from 'vitest';
import {
    editorOptions,
    parseRepoSettings,
    readEditorOptions
} from '../../../../src/lib/data/sources/config/editor-options.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';

type Entries = Record<string, Record<string, unknown>>;

const SHIPPED = loadConfig(engineDir()).config;
const SHIPPED_ENTRIES = (SHIPPED.options as Record<string, Entries>)['behavior.yml'];

/** The defaults of the synthetic catalog, each different from the shipped one. */
const DEFAULTS = {
    'editor.tab_size': 3,
    'editor.insert_spaces': false,
    'editor.word_wrap': 'bounded',
    'editor.minimap': false,
    'editor.render_whitespace': 'all',
    'editor.sticky_scroll': false
};

/** A map whose catalog carries the synthetic defaults, with the given block and field changes. */
function configWith(
    editor: Record<string, unknown> | undefined,
    change: (fields: Record<string, Record<string, unknown>>) => void = () => undefined
): Record<string, unknown> {
    const entries: Entries = structuredClone(SHIPPED_ENTRIES);
    for (const [key, value] of Object.entries(DEFAULTS)) {
        entries[key] = { ...entries[key], default: value };
    }
    change(entries['editor.languages'].fields as Record<string, Record<string, unknown>>);
    return {
        options: { 'behavior.yml': entries },
        palette: SHIPPED.palette,
        ...(editor === undefined ? {} : { editor })
    };
}

/** The problems of a read as key and kind of the rule's problem, or where it was found. */
function named(problems: ReturnType<typeof readEditorOptions>['problems']): string[] {
    return problems.map((one) => `${one.key}: ${'problem' in one ? one.problem.kind : one.where}`);
}

describe('readEditorOptions', () => {
    const GLOBAL = {
        tabSize: 3,
        insertSpaces: false,
        wordWrap: 'bounded',
        minimap: false,
        renderWhitespace: 'all',
        stickyScroll: false
    };

    it('reads each editor option by its catalog entry, answering the default and a problem for a value it refuses', () => {
        const none = readEditorOptions(configWith(undefined));
        expect(none.options).toMatchObject(GLOBAL);
        expect(none.problems).toStrictEqual([]);

        const rows: [Record<string, unknown>, Record<string, unknown>, string][] = [
            [{ tab_size: 9 }, { tabSize: 3 }, 'editor.tab_size: range'],
            [{ tab_size: 2.5 }, { tabSize: 3 }, 'editor.tab_size: whole'],
            [{ word_wrap: 'wrap' }, { wordWrap: 'bounded' }, 'editor.word_wrap: choice'],
            [
                { render_whitespace: 'some' },
                { renderWhitespace: 'all' },
                'editor.render_whitespace: choice'
            ],
            [{ minimap: 'yes' }, { minimap: false }, 'editor.minimap: boolean']
        ];
        for (const [editor, expected, problem] of rows) {
            const read = readEditorOptions(
                configWith({ tab_size: 5, insert_spaces: true, ...editor })
            );
            const wrongKey = Object.keys(editor)[0];
            expect(read.options, wrongKey).toMatchObject({
                ...GLOBAL,
                tabSize: 5,
                insertSpaces: true,
                ...expected
            });
            expect(named(read.problems), wrongKey).toStrictEqual([problem]);
        }
    });

    it('answers null for a configuration with no catalog', () => {
        expect(editorOptions({})).toBeNull();
        expect(editorOptions(configWith(undefined))).toMatchObject(GLOBAL);
    });

    it('reads the shipped configuration for no problem', () => {
        expect(readEditorOptions(SHIPPED).problems).toStrictEqual([]);
    });

    it('carries the predicates that say which widths and words the catalog takes', () => {
        const { options } = readEditorOptions(configWith(undefined));
        expect([2, 8, 9, 0, 2.5].map((size) => options.fitsTabSize(size))).toStrictEqual([
            true,
            true,
            false,
            false,
            false
        ]);
        expect(['on', 'off', 'x'].map((word) => options.fitsWrap(word))).toStrictEqual([
            true,
            true,
            false
        ]);
    });
});

describe('readEditorOptions over editor.languages', () => {
    const LANGUAGES = {
        python: { tab_size: 2, word_wrap: 'on', rulers: [80, 0] },
        cobolx: { tab_size: 2 },
        markdown: 5,
        ruby: { colour: 'x' }
    };

    it('reads a language record field by field against the fields of editor.languages', () => {
        const read = readEditorOptions(configWith({ languages: LANGUAGES }));
        expect({ ...read.options.languages }).toStrictEqual({
            python: { tabSize: 2, wordWrap: 'on' }
        });
        expect(named(read.problems)).toStrictEqual([
            'editor.languages.python.rulers: range',
            'editor.languages.cobolx: unknown-language',
            'editor.languages.markdown: not-a-map',
            'editor.languages.ruby.colour: unknown-field'
        ]);
    });

    it('takes the rulers the catalog field takes when it holds no minimum', () => {
        const read = readEditorOptions(
            configWith({ languages: { python: { rulers: [80, 0] } } }, (fields) => {
                delete fields.rulers.min;
            })
        );
        expect({ ...read.options.languages }).toStrictEqual({ python: { rulers: [80, 0] } });
        expect(read.problems).toStrictEqual([]);
    });

    it('answers one problem for a languages entry that is no map', () => {
        const read = readEditorOptions(configWith({ languages: 5 }));
        expect(read.problems).toStrictEqual([{ key: 'editor.languages', where: 'not-a-map' }]);
    });
});

describe('parseRepoSettings', () => {
    const TEXT = 'languages:\n  python:\n    tab_size: 2\n    word_wrap: wrap\n';

    it("reads a repository's records by the catalog's rule", () => {
        const read = parseRepoSettings(TEXT, configWith(undefined));
        expect(read.kind).toBe('read');
        if (read.kind !== 'read') return;
        expect({ ...read.languages }).toStrictEqual({ python: { tabSize: 2 } });
        expect(named(read.skipped)).toStrictEqual(['languages.python.word_wrap: choice']);

        expect(parseRepoSettings('languages: [', configWith(undefined)).kind).toBe('unparsed');
        expect(parseRepoSettings('languages: 5', configWith(undefined))).toStrictEqual({
            kind: 'not-a-map'
        });

        const wide = parseRepoSettings(
            TEXT,
            configWith(undefined, (fields) => {
                fields.word_wrap.values = [...(fields.word_wrap.values as string[]), 'wrap'];
            })
        );
        expect(wide.kind === 'read' && { ...wide.languages }).toStrictEqual({
            python: { tabSize: 2, wordWrap: 'wrap' }
        });
    });

    it('sets nothing for an empty file, a file without languages and a configuration with no catalog', () => {
        for (const text of ['', 'other: 1\n', 'languages:\n']) {
            const read = parseRepoSettings(text, configWith(undefined));
            expect(read.kind === 'read' && { ...read.languages }).toStrictEqual({});
        }
        const bare = parseRepoSettings(TEXT, {});
        expect(bare.kind === 'read' && { ...bare.languages }).toStrictEqual({});
    });
});
