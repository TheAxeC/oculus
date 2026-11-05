// Layer 1, data tests. The typed readers of the writing tools' settings out of the merged map (the
// LaTeX formatter and its auto build, the build's recipes and tools, and the linters of lint), in
// src/lib/data/sources/config/settings/writing/. Each reader is run over the map of synthetic.ts,
// whose every default differs from the shipped one, so a default written in code instead of read
// from the entry fails a row. A wrong value answers the entry's default and a problem naming the
// key; a missing key answers the default and no problem.

import { describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import { latexFormatting, lintSettings } from '../../../../../src/lib/data/sources/config.ts';
import { latexBuild } from '../../../../../src/lib/data/sources/config/settings/writing/latex.ts';
import { mapWith, outcome } from './synthetic.ts';

/** What latexBuild answers for a block that holds nothing: the `latex.*` defaults of DEFAULTS. */
const BUILD_DEFAULTS = {
    recipes: [],
    tools: [],
    recipeDefault: 'last_used',
    outDir: 'out',
    auxDir: 'aux',
    autoBuild: 'never',
    autoBuildIntervalMs: 2500,
    cleanAndRetry: false,
    autoClean: 'on_built',
    synctexPath: '/a/synctex',
    reverseSynctex: 'double_click',
    texcountAutorun: 'on_save',
    contextMenu: true,
    texlabPath: '/a/texlab',
    unimathSymbols: true,
    includegraphicsPreview: false
};

describe('latexFormatting and the auto build', () => {
    const PATHS = { latexindent_path: '', tex_fmt_path: '', badness_path: '' };
    const read = (latex: unknown) => outcome((p) => latexFormatting(mapWith({ latex }), p));

    it('answers the default for a formatter outside the entry words', () => {
        expect(read({ formatter: 'prettier', ...PATHS })).toMatchObject({
            value: { formatter: 'tex-fmt' },
            problems: ['latex.formatter: choice']
        });
    });

    it('reads the auto build by its entry', () => {
        const auto = (latex: unknown) => latexBuild(mapWith({ latex })).autoBuild;
        expect(auto({ auto_build: 'on_save' })).toBe('on_save');
        expect(auto({ auto_build: 'on_file_change' })).toBe('on_file_change');
        expect(auto({})).toBe('never');
        expect(
            outcome((p) => latexBuild(mapWith({ latex: { auto_build: 'x' } }), p))
        ).toStrictEqual({ value: BUILD_DEFAULTS, problems: ['latex.auto_build: choice'] });
    });
});

describe('lintSettings', () => {
    const DEFAULT = {
        on: { chktex: false, ruff: false, eslint: false, shellcheck: false, writing: false },
        paths: { chktex: '/a/chktex', ruff: '/a/ruff', shellcheck: '/a/shellcheck' },
        chktexArgs: ['-q'],
        writingSkip: ['skip/**'],
        writingGlyphs: ['icons/**']
    };
    const read = (lint: unknown) => outcome((p) => lintSettings(mapWith({ lint }), p));

    it('answers the entry defaults for a block that holds nothing', () => {
        expect(read({})).toStrictEqual({ value: DEFAULT, problems: [] });
    });

    it('reads the switches, the paths and the arguments the block holds', () => {
        expect(
            read({
                chktex: true,
                ruff: true,
                eslint: true,
                shellcheck: true,
                writing: true,
                chktex_path: '~/bin/chktex',
                ruff_path: '/b/ruff',
                shellcheck_path: '/b/shellcheck',
                chktex_args: ['-wall', '-e9'],
                writing_skip: [' a/** ', '', 'b/*.md'],
                writing_glyphs: ['c/**']
            })
        ).toStrictEqual({
            value: {
                on: { chktex: true, ruff: true, eslint: true, shellcheck: true, writing: true },
                paths: { chktex: '~/bin/chktex', ruff: '/b/ruff', shellcheck: '/b/shellcheck' },
                chktexArgs: ['-wall', '-e9'],
                writingSkip: ['a/**', 'b/*.md'],
                writingGlyphs: ['c/**']
            },
            problems: []
        });
    });

    it.each([
        ['chktex', 'maybe', 'boolean'],
        ['ruff', 'maybe', 'boolean'],
        ['eslint', 'maybe', 'boolean'],
        ['shellcheck', 'maybe', 'boolean'],
        ['writing', 'maybe', 'boolean'],
        ['chktex_path', 'chktex', 'path'],
        ['ruff_path', 'ruff', 'path'],
        ['shellcheck_path', '../shellcheck', 'path'],
        ['chktex_args', 'no', 'strings'],
        ['writing_skip', 'no', 'strings'],
        ['writing_glyphs', 'no', 'strings']
    ])('answers the default for a wrong lint.%s and names the key', (key, bad, kind) => {
        expect(read({ [key]: bad })).toStrictEqual({
            value: DEFAULT,
            problems: [`lint.${key}: ${kind}`]
        });
    });
});

describe('latexBuild', () => {
    const TOOLS = [
        { name: 'one', command: 'latexmk', args: ['-pdf', '%DOC%'] },
        { name: 'two', command: 'bibtex', args: ['%DOCFILE%'] }
    ];
    const RECIPES = [
        { name: 'plain', tools: ['one'] },
        { name: 'chain', tools: ['one', 'two', 'one'] }
    ];
    const read = (latex: unknown) => outcome((p) => latexBuild(mapWith({ latex }), p));

    it('answers the entry defaults and no recipe for a block that holds nothing', () => {
        expect(read({})).toStrictEqual({ value: BUILD_DEFAULTS, problems: [] });
    });

    it('reads the recipes and the tools they name, in the order the file holds them', () => {
        expect(read({ tools: TOOLS, recipes: RECIPES })).toMatchObject({
            value: { tools: TOOLS, recipes: RECIPES },
            problems: []
        });
    });

    it.each([
        ['auto_build_interval_ms', 0, 'range', { autoBuildIntervalMs: 2500 }],
        ['auto_build_interval_ms', 1.5, 'whole', { autoBuildIntervalMs: 2500 }],
        ['recipe_default', 'x', 'choice', { recipeDefault: 'last_used' }],
        ['out_dir', 5, 'text', { outDir: 'out' }],
        ['aux_dir', 5, 'text', { auxDir: 'aux' }],
        ['clean_and_retry', 'yes', 'boolean', { cleanAndRetry: false }],
        ['auto_clean', 'x', 'choice', { autoClean: 'on_built' }],
        ['synctex_path', 'synctex', 'path', { synctexPath: '/a/synctex' }],
        ['reverse_synctex', 'x', 'choice', { reverseSynctex: 'double_click' }],
        ['texcount_autorun', 'x', 'choice', { texcountAutorun: 'on_save' }],
        ['context_menu', 'yes', 'boolean', { contextMenu: true }],
        ['texlab_path', 3, 'text', { texlabPath: '/a/texlab' }],
        ['unimath_symbols', 'yes', 'boolean', { unimathSymbols: true }],
        ['includegraphics_preview', 'yes', 'boolean', { includegraphicsPreview: false }]
    ])('answers the default for a wrong %s and names the key', (key, bad, kind, value) => {
        expect(read({ [key]: bad })).toMatchObject({
            value,
            problems: [`latex.${key}: ${kind}`]
        });
    });

    it('drops each row the entry refuses and names it, and keeps the others', () => {
        const tools = [
            TOOLS[0],
            { ...TOOLS[0], command: 'other' },
            { command: 'x', args: [] },
            5,
            { name: 'bare', command: '', args: [] },
            { name: 'bad', command: 'x', args: 'no' },
            TOOLS[1]
        ];
        const recipes = [
            RECIPES[0],
            { name: 'plain', tools: ['two'] },
            { name: '', tools: ['one'] },
            { name: 'lost', tools: ['nope'] },
            { name: 'empty', tools: [] },
            RECIPES[1]
        ];
        expect(read({ tools, recipes })).toMatchObject({
            value: { tools: TOOLS, recipes: RECIPES },
            problems: [
                'latex.tools: repeat',
                'latex.tools[2].name: text',
                'latex.tools[3]: records',
                'latex.tools[4].command: empty',
                'latex.tools[5].args: strings',
                'latex.recipes: repeat',
                'latex.recipes[2]: unnamed',
                'latex.recipes[3].tools: choice',
                'latex.recipes[4].tools: choice'
            ]
        });
    });

    it('names a list that is no list as a family problem', () => {
        expect(read({ tools: 'x', recipes: { a: 1 } })).toMatchObject({
            value: { tools: [], recipes: [] },
            problems: ['latex.tools: family', 'latex.recipes: family']
        });
    });
});
