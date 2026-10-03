// What a source tab is handed for its indentation, word wrap and rulers, driven through the tab's
// resolution module with a fake file store and configuration: the language a record is looked up
// by (the one in force for the tab), the file's own indentation, the repository's
// `.oculus/settings.yml` read through the file store, and the tab following its root and that
// file's text.
//
// What this does NOT cover: the order the values are taken in (tests/data/helpers/
// editor-options.test.ts), the editor taking the values and Alt+Z's keypress, which are seen at
// the look.

import { beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { readEditorOptions } from '../../../../src/lib/data/helpers/editor.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { NO_TEXT, type FileText } from '../../../../src/lib/state/sources/fs-transport.ts';
import { refusedAnswer } from '../../../../src/lib/state/shared/answers/answers.ts';
import { detectIndent } from '../../../../src/lib/state/workbench/navigation/editor-text.ts';
import {
    createSourceOptions,
    type SourceOptionsInput
} from '../../../../src/lib/views/shared/prose/source-options.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));

const LANGUAGES = new Map([
    ['.py', 'python'],
    ['.c', 'c'],
    ['.cpp', 'cpp'],
    ['.md', 'markdown'],
    ['.yml', 'yaml'],
    ['.txt', 'plaintext'],
    ['makefile', 'makefile'],
    ['.tex', 'latex']
]);

/** A file text the store answers for a file that is there. */
function present(text: string, more: Partial<FileText> = {}): FileText {
    return { text, truncated: false, error: '', loading: false, ...more };
}

/** The store's answer for a file the root does not have. */
const MISSING: FileText = { ...NO_TEXT, loading: false, error: refusedAnswer(404) };

/** One case: the inputs a tab hands the module, which a case changes in place. */
type Case = {
    path: string;
    root: string;
    text: string;
    language: string;
    indent: { tabs: boolean; size: number } | null;
    wrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded' | null;
    editor: Record<string, unknown>;
    limit: number | null;
    files: Record<string, FileText>;
    asked: string[];
};

let held: Case;

beforeEach(() => {
    held = {
        path: 'a.py',
        root: 'hub',
        text: 'x = 1\n',
        language: '',
        indent: null,
        wrap: null,
        editor: {},
        limit: 1024 * 1024,
        files: {},
        asked: []
    };
});

/** The module over the case, reading the case afresh on every call as the tab's deriveds do. */
function module(): ReturnType<typeof createSourceOptions> {
    const input: SourceOptionsInput = {
        path: () => held.path,
        root: () => held.root,
        draft: () => ({
            text: held.text,
            language: held.language,
            indent: held.indent,
            wrap: held.wrap
        }),
        languages: () => LANGUAGES,
        options: () => readEditorOptions({ editor: held.editor }).options,
        paintLimit: () => held.limit,
        fileText: (root, path) => {
            held.asked.push(`${root}/${path}`);
            return held.files[`${root}/${path}`] ?? MISSING;
        }
    };
    return createSourceOptions(input);
}

const REPO = 'hub/.oculus/settings.yml';

describe('the indentation of a file that indents', () => {
    it('is the file s own indentation when it indents (case 3)', () => {
        held.text = 'def f():\n  return 1\n';
        held.editor = { tab_size: 4 };
        expect(detectIndent(held.text)).toEqual({ tabs: false, size: 2 });
        expect(module().indent).toEqual({ tabs: false, size: 2 });
    });
});

describe('the language a record is taken by (case 31)', () => {
    it('is the one chosen from the status bar, whatever the file s name says', () => {
        held.path = 'a.txt';
        held.language = 'python';
        held.editor = { languages: { python: { tab_size: 2 }, plaintext: { tab_size: 6 } } };
        expect(module().language).toBe('python');
        expect(module().indent).toEqual({ tabs: false, size: 2 });
    });

    it('is plaintext for a file over the paint limit, shown as plain text', () => {
        held.path = 'a.py';
        held.text = 'x'.repeat(2000);
        held.limit = 1000;
        held.editor = { languages: { python: { tab_size: 2 }, plaintext: { tab_size: 6 } } };
        expect(module().shown).toBe('plaintext');
        expect(module().indent).toEqual({ tabs: false, size: 6 });
    });

    it('asks the file store for nothing when the tab has no root', () => {
        held.root = '';
        expect(module().indent).toBeDefined();
        expect(held.asked).toEqual([]);
    });

    it('asks the tab s root for its .oculus/settings.yml', () => {
        expect(module().indent).toBeDefined();
        expect(held.asked).toEqual([REPO]);
    });
});

describe('the repository s file as the tab reads it', () => {
    beforeEach(() => {
        held.editor = { tab_size: 3 };
    });

    it.each([
        ['a root without the file', MISSING],
        ['a file still being read', { ...NO_TEXT }],
        ['a file that does not parse (case 9)', present('languages: [unclosed\n')],
        ['a languages that is a list (case 9)', present('languages: [a, b]\n')],
        [
            'a file cut at the read limit (case 30)',
            present('languages: { python: { tab_size: 8 } }\n', { truncated: true })
        ],
        [
            'a file the read refuses (case 30)',
            { ...NO_TEXT, loading: false, error: refusedAnswer(500) }
        ]
    ])('sets nothing for %s', (_label, file) => {
        held.files[REPO] = file;
        expect(module().indent).toEqual({ tabs: false, size: 3 });
    });
});

describe('a tab whose root changes or whose file is saved', () => {
    it('takes the new root s values and drops the old root s answer (case 32)', () => {
        held.files['one/.oculus/settings.yml'] = present(
            'languages: { python: { tab_size: 2 } }\n'
        );
        held.files['two/.oculus/settings.yml'] = present(
            'languages: { python: { tab_size: 6 } }\n'
        );
        held.root = 'one';
        const options = module();
        expect(options.indent.size).toBe(2);
        held.root = 'two';
        expect(options.indent.size).toBe(6);
        held.root = '';
        expect(options.indent.size).toBe(4);
    });

    it('takes the new text of the repository s file without a reload (case 33)', () => {
        held.files[REPO] = present('languages: { python: { tab_size: 2 } }\n');
        const options = module();
        expect(options.indent.size).toBe(2);
        held.files[REPO] = present('languages: { python: { tab_size: 5 } }\n');
        expect(options.indent.size).toBe(5);
    });
});
