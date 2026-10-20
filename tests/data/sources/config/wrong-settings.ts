// Layer 4, test helper. A wrong value for every setting of config/defaults/behavior.yml the
// readers read by the options catalog's rule, as a hand edit would leave them, laid over the
// shipped merged map by the tests of the setting readers and of their findings.

/** The blocks and keys outside the editor's block, each holding a value its entry refuses. */
export const WRONG_SETTINGS: Record<string, unknown> = {
    slurm: { resource: 5, days: -1, poll_min: 0, quota_min: 'x', prewarm: 'yes' },
    calendar: { poll_min: 0, days_back: -1, days_ahead: 3651 },
    search: { max_hits: 0, timeout_s: 0, max_names: 0 },
    literature: { timeout_s: 0, per_source: 500, cache_min: -1 },
    mail: { poll_min: 0, per_signal: 0 },
    changes: { keep: 0 },
    latex: {
        formatter: 'prettier',
        latexindent_path: 'foo',
        tex_fmt_path: 'foo',
        badness_path: 'foo',
        auto_build: 'x',
        auto_build_interval_ms: 0,
        recipe_default: 'x',
        out_dir: 5,
        aux_dir: 5,
        clean_and_retry: 'yes',
        auto_clean: 'x',
        synctex_path: 'foo',
        reverse_synctex: 'x',
        texcount_autorun: 'x',
        context_menu: 'yes',
        texlab_path: 3,
        unimath_symbols: 'yes',
        includegraphics_preview: 'yes',
        tools: [
            { name: 'one', command: 'x', args: [] },
            { name: 'one', command: 'y', args: [] },
            { command: 'z', args: [] },
            5,
            { name: 'two', command: '', args: [] },
            { name: 'three', command: 'x', args: 'no' }
        ],
        recipes: [
            { name: 'a', tools: ['one'] },
            { name: 'a', tools: ['one'] },
            { name: '', tools: ['one'] },
            { name: 'b', tools: ['nope'] }
        ]
    },
    lint: {
        chktex: 'yes',
        ruff: 'yes',
        eslint: 'yes',
        shellcheck: 'yes',
        writing: 'yes',
        chktex_path: 'foo',
        ruff_path: 'foo',
        shellcheck_path: 'foo',
        chktex_args: 'no',
        writing_skip: 'no',
        writing_glyphs: 'no'
    },
    git: { autofetch_minutes: -1 },
    files: { confirm_delete: 'no' },
    processes: { patterns: ['a/b'] },
    usage_refresh_min: 'x',
    usage_refresh_model: 'gpt',
    usage_tiers: { a: 'A', b: 5 },
    open: { program_ext: { pdf: 'com.apple.Preview', '.txt': 'com.apple TextEdit', '.x': 3 } }
};

/** The editor block holding a value its entry refuses at each of its keys and records. */
export const WRONG_EDITOR: Record<string, unknown> = {
    paint_limit_kb: 0,
    tab_size: 9,
    word_wrap: 'wrap',
    autosave: 'sometimes',
    autosave_delay_ms: -5,
    trim_trailing_whitespace: 'yes',
    final_newline: 1,
    languages: {
        cobolx: { tab_size: 2 },
        python: { tab_size: 99, final_newline: 'sometimes' },
        cpp: { format_on_save: 'yes', trim_trailing_whitespace: 'yes' },
        markdown: 5
    }
};
