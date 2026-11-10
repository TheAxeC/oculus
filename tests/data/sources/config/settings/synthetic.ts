// Layer 1, data test helper. The merged map the tests of the setting readers read
// (settings.test.ts and writing.test.ts), and the way they read an answer. The map carries the
// shipped options catalog of behavior.yml with every entry's default replaced by one that differs
// from the shipped default, so a default written in code instead of read from the entry fails a
// row; it is one module because both test files read the one catalog, and a second copy of the
// defaults could drift from the first.

import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import type { SettingProblem } from '../../../../../src/lib/data/sources/config/settings/reader.ts';

export type Entries = Record<string, Record<string, unknown>>;

/** The shipped entries of behavior.yml, which a synthetic catalog is made from. */
const SHIPPED: Entries = (loadConfig(engineDir()).config.options as Record<string, Entries>)[
    'behavior.yml'
];

/** The shipped entries of sources.yml: the scan depth's, and the chat's collection keys'. */
export const SOURCES = (loadConfig(engineDir()).config.options as Record<string, Entries>)[
    'sources.yml'
];

/** The shipped entry of sources.yml that the scan depth is read by. */
const SCAN_DEPTH = SOURCES.repository_scan_depth;

/** The default each synthetic entry answers, every one different from the shipped default. */
const DEFAULTS: Record<string, unknown> = {
    'slurm.resource': ['alpha'],
    'slurm.days': 7,
    'slurm.poll_min': 25,
    'slurm.quota_min': 70,
    'slurm.prewarm': false,
    'slurm.log_dirs': ['runs'],
    'calendar.poll_min': 20,
    'calendar.days_back': 10,
    'calendar.days_ahead': 20,
    'search.max_hits': 300,
    'search.timeout_s': 15,
    'search.max_names': 7000,
    'search.skip_folders': ['vendor'],
    'literature.timeout_s': 40,
    'literature.per_source': 12,
    'literature.cache_min': 5,
    'mail.poll_min': 12,
    'mail.per_signal': 30,
    'mail.todo_label': 'later',
    'changes.keep': 400,
    'processes.patterns': ['perl', 'ruby'],
    'latex.formatter': 'tex-fmt',
    'latex.latexindent_path': '/a/latexindent',
    'latex.tex_fmt_path': '/a/tex-fmt',
    'latex.badness_path': '/a/badness',
    'latex.auto_build': 'never',
    'latex.auto_build_interval_ms': 2500,
    'latex.main_file': 'paper.tex',
    'latex.recipe_default': 'last_used',
    'latex.out_dir': 'out',
    'latex.aux_dir': 'aux',
    'latex.clean_and_retry': false,
    'latex.auto_clean': 'on_built',
    'latex.synctex_path': '/a/synctex',
    'latex.texdoc_path': '/a/texdoc',
    'latex.texcount_path': '/a/texcount',
    'latex.checkcites_path': '/a/checkcites',
    'latex.clean_path': '/a/latexmk',
    'latex.reverse_synctex': 'double_click',
    'latex.texcount_autorun': 'on_save',
    'latex.context_menu': true,
    'latex.texlab_path': '/a/texlab',
    'latex.unimath_symbols': true,
    'latex.includegraphics_preview': false,
    'lint.chktex': false,
    'lint.ruff': false,
    'lint.eslint': false,
    'lint.shellcheck': false,
    'lint.writing': false,
    'lint.chktex_path': '/a/chktex',
    'lint.ruff_path': '/a/ruff',
    'lint.shellcheck_path': '/a/shellcheck',
    'lint.chktex_args': ['-q'],
    'lint.writing_skip': ['skip/**'],
    'lint.writing_glyphs': ['icons/**'],
    usage_refresh_min: 12,
    usage_refresh_model: 'm2',
    'git.autofetch_minutes': 7,
    'editor.paint_limit_kb': 100,
    'files.confirm_delete': false,
    'file_index.enabled': false,
    'file_index.max_per_project': 50,
    'file_index.ext': ['.a'],
    'file_index.skip_folders': ['cache'],
    'files.hidden_folders': ['build'],
    'website.schema_section': 'Site',
    'apps.connect_timeout_s': 11,
    'apps.state_max_kb': 70,
    'apps.store_max_kb': 300,
    'apps.writes_per_min': 40,
    'apps.opens_per_min': 41,
    'apps.keys_per_s': 25,
    'apps.messages_per_min': 700,
    'apps.max_files': 600,
    'apps.max_mb': 25,
    'apps.host_output_kb': 300,
    'apps.host_stop_seconds': 6,
    'apps.scan_entries': 12000
};

/** A merged map whose catalog gives each setting a synthetic default, with the given keys set. */
export function mapWith(
    held: Record<string, unknown> = {},
    drop: string[] = []
): Record<string, unknown> {
    const all: Entries = structuredClone(SHIPPED);
    for (const [key, value] of Object.entries(DEFAULTS)) all[key] = { ...all[key], default: value };
    const entries: Entries = Object.fromEntries(
        Object.entries(all).filter(([key]) => !drop.includes(key))
    );
    return {
        options: {
            'behavior.yml': entries,
            'sources.yml': { repository_scan_depth: { ...SCAN_DEPTH, default: 2 } }
        },
        agents: {
            claude: {
                lists: {
                    model: {
                        values: [
                            { pass: 'a', id: 'm1' },
                            { pass: 'b', id: 'm2' }
                        ]
                    }
                }
            }
        },
        ...held
    };
}

/** What a reader answers and the problems it found, as key and kind, or the sentence it throws. */
export function outcome(
    read: (problems: SettingProblem[]) => unknown
): { value: unknown; problems: string[] } | { threw: string } {
    const problems: SettingProblem[] = [];
    try {
        const value = read(problems);
        return {
            value,
            problems: problems.map((one) =>
                'problem' in one ? `${one.key}: ${one.problem.kind}` : `${one.key}: ${one.where}`
            )
        };
    } catch (error) {
        return { threw: error instanceof Error ? error.message : String(error) };
    }
}
