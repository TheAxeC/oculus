// Layer 4, tree check. settingFindings over the merged map oculus ships: every wrong setting of
// behavior.yml worded from the catalog with the key and the refused value, nothing for the shipped
// files, and nothing for a merge that dropped behavior.yml or a map without the catalog. The other
// readers of the config folder are tests/checks/config/config.test.ts's.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, type ConfigWhere } from '../../../src/lib/data/sources/config.ts';
import { settingFindings } from '../../../src/lib/data/sources/config/catalogs.ts';
import { readEditorOptions } from '../../../src/lib/data/sources/config/editor-options.ts';
import { it } from '../../fixtures/scratch.ts';
import { WRONG_EDITOR, WRONG_SETTINGS } from '../../data/sources/config/wrong-settings.ts';

/** Where the merged config of `engine` was read from, named as the shipped config's `from` does. */
function shippedAt(engine: string): ConfigWhere {
    return { engine, hub: null, from: loadConfig(engineDir()).from };
}

describe('settingFindings', () => {
    const engine = engineDir();
    const shipped = loadConfig(engine).config;
    const WRONG: Record<string, unknown> = { ...WRONG_SETTINGS, editor: WRONG_EDITOR };
    const file = join(engine, 'config', 'defaults', 'behavior.yml');
    const said = (config: Record<string, unknown>) =>
        settingFindings(shippedAt(engine), config).map((one) => `${one.key}: ${one.message}`);

    it('words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files', () => {
        const findings = settingFindings(shippedAt(engine), { ...shipped, ...WRONG });
        expect(new Set(findings.map((one) => one.file))).toEqual(new Set([file]));
        const keys = findings.map((one) => one.key);
        expect(new Set(keys).size).toBe(keys.length);
        expect([...keys].sort()).toEqual(
            [
                'calendar.days_ahead',
                'calendar.days_back',
                'calendar.poll_min',
                'changes.keep',
                'editor.autosave',
                'editor.autosave_delay_ms',
                'editor.final_newline',
                'editor.languages.cobolx',
                'editor.languages.cpp.format_on_save',
                'editor.languages.cpp.trim_trailing_whitespace',
                'editor.languages.markdown',
                'editor.languages.python.final_newline',
                'editor.languages.python.tab_size',
                'editor.paint_limit_kb',
                'editor.tab_size',
                'editor.trim_trailing_whitespace',
                'editor.word_wrap',
                'files.confirm_delete',
                'git.autofetch_minutes',
                'latex.aux_dir',
                'latex.auto_build',
                'latex.auto_build_interval_ms',
                'latex.auto_clean',
                'latex.badness_path',
                'latex.checkcites_path',
                'latex.clean_and_retry',
                'latex.clean_path',
                'latex.context_menu',
                'latex.formatter',
                'latex.includegraphics_preview',
                'latex.latexindent_path',
                'latex.literate_recipes..rnw',
                'latex.out_dir',
                'latex.program_recipes.a/b',
                'latex.recipe_default',
                'latex.recipes',
                'latex.recipes[2]',
                'latex.recipes[3].tools',
                'latex.reverse_synctex',
                'latex.synctex_path',
                'latex.texcount_autorun',
                'latex.texcount_path',
                'latex.texdoc_path',
                'latex.tex_fmt_path',
                'latex.texlab_path',
                'latex.tools',
                'latex.tools[2].name',
                'latex.tools[3]',
                'latex.tools[4].command',
                'latex.tools[5].args',
                'latex.unimath_symbols',
                'lint.chktex',
                'lint.chktex_args',
                'lint.chktex_path',
                'lint.eslint',
                'lint.ruff',
                'lint.ruff_path',
                'lint.shellcheck',
                'lint.shellcheck_path',
                'lint.writing',
                'lint.writing_glyphs',
                'lint.writing_skip',
                'literature.cache_min',
                'literature.per_source',
                'literature.timeout_s',
                'mail.per_signal',
                'mail.poll_min',
                'open.program_ext..txt',
                'open.program_ext..x',
                'open.program_ext.pdf',
                'processes.patterns',
                'search.max_hits',
                'search.max_names',
                'search.timeout_s',
                'slurm.days',
                'slurm.log_dirs',
                'slurm.poll_min',
                'slurm.prewarm',
                'slurm.quota_min',
                'slurm.resource',
                'slurm.scratch_roots.a',
                'recover.data_dir',
                'recover.partitions.a',
                'usage_refresh_min',
                'usage_refresh_model',
                'usage_tiers.b'
            ].sort()
        );
        const lines = said({ ...shipped, ...WRONG });
        expect(lines).toContain(
            'slurm.days: slurm.days must be a whole number from 0 to 3650, not -1; the default is used'
        );
        expect(lines).toContain(
            'editor.tab_size: editor.tab_size must be a whole number from 1 to 8, not 9; the default is used'
        );
        expect(lines).toContain(
            'editor.languages.cobolx: editor.languages.cobolx is not a language the editor colours; its record is not read'
        );
        expect(lines).toContain(
            'editor.languages.cpp.format_on_save: editor.languages.cpp.format_on_save must be true or false, not "yes"; the field is not read'
        );
        expect(lines).toContain(
            'editor.languages.cpp.trim_trailing_whitespace: editor.languages.cpp.trim_trailing_whitespace must be true or false, not "yes"; the field is not read'
        );
        expect(lines).toContain(
            'editor.autosave: editor.autosave must be one of off, after_delay, on_focus_change, not "sometimes"; the default is used'
        );
        expect(lines).toContain(
            'editor.autosave_delay_ms: editor.autosave_delay_ms must be a whole number of at least 0, not -5; the default is used'
        );
        expect(lines).toContain(
            'editor.trim_trailing_whitespace: editor.trim_trailing_whitespace must be true or false, not "yes"; the default is used'
        );
        expect(lines).toContain(
            'editor.final_newline: editor.final_newline must be true or false, not 1; the default is used'
        );
        expect(lines).toContain(
            'editor.languages.python.final_newline: editor.languages.python.final_newline must be true or false, not "sometimes"; the field is not read'
        );
        const read = readEditorOptions({ ...shipped, ...WRONG }).options;
        expect(read).toMatchObject({
            autosave: 'off',
            autosaveDelay: 1000,
            trimTrailingWhitespace: false,
            finalNewline: false
        });
        expect(read.languages.cpp).toBeUndefined();
        expect(read.languages.python).toBeUndefined();
        const fraction = { ...shipped, editor: { autosave_delay_ms: 1.5 } };
        expect(readEditorOptions(fraction).options.autosaveDelay).toBe(1000);
        expect(said(fraction)).toEqual([
            'editor.autosave_delay_ms: editor.autosave_delay_ms must be a whole number of at least 0, not 1.5; the default is used'
        ]);
        expect(lines).toContain(
            'open.program_ext.pdf: open.program_ext.pdf must be an extension with its dot, not "pdf"; the entry is not read'
        );
        expect(lines).toContain(
            'slurm.resource: slurm.resource must be a list of words, not 5; the default is used'
        );
        expect(settingFindings(shippedAt(engine), shipped)).toEqual([]);
    });

    it('reads an empty slurm.resource as no cluster, with no finding', () => {
        expect(said({ ...shipped, slurm: { resource: [] } })).toEqual([]);
    });

    it('names the value of a block, a family and a list of records that is not of its kind (G13)', () => {
        const lines = said({
            ...shipped,
            slurm: 5,
            recover: { ...(shipped.recover as object), partitions: 5 },
            latex: { ...(shipped.latex as object), tools: 'x' }
        });
        expect(lines).toEqual(
            expect.arrayContaining([
                'slurm: slurm must be a map, not 5; each of its keys takes its default',
                'recover.partitions: recover.partitions must be a map, not 5; none of its entries is read',
                'latex.tools: latex.tools must be a list, not "x"; none of its rows is read'
            ])
        );
    });

    it('says nothing for a merge that dropped behavior.yml, or for a map without the catalog', () => {
        const dropped = Object.fromEntries(
            Object.entries({ ...shipped, ...WRONG }).filter(([key]) => !(key in WRONG))
        );
        expect(settingFindings(shippedAt(engine), dropped)).toEqual([]);
        expect(settingFindings(shippedAt(engine), { text: shipped.text, ...WRONG })).toEqual([]);
    });
});
