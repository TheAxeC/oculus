// Layer 1, data. The typed reader of the linters' settings of behavior.yml: which linter runs,
// where three of the programs are, ChkTeX's arguments and the writing rules' two lists of globs. It
// reads through settingReader (reader.ts).

import type { LintId } from '../../../model/index.ts';
import { settingReader, type SettingProblem } from './reader.ts';

/**
 * The linters' settings of behavior.yml: which run, where three of them are, ChkTeX's flags, and
 * the writing rules' two lists of paths.
 */
export type LintSettings = {
    /** Whether each linter runs. */
    on: Record<LintId, boolean>;
    /** Where each program is; empty finds it on PATH. ESLint is the repository's own. */
    paths: Record<Exclude<LintId, 'eslint' | 'writing'>, string>;
    /** The arguments ChkTeX is run with besides the ones oculus adds. */
    chktexArgs: string[];
    /** The globs of the files the writing rules skip, against the path from the file's root. */
    writingSkip: string[];
    /** The globs of the files whose arrows are icons, which the writing rules leave unmarked. */
    writingGlyphs: string[];
};

/** A list of globs as the writing rules read it: each entry trimmed, an empty one dropped. */
function globList(entries: string[]): string[] {
    return entries.map((one) => one.trim()).filter((one) => one !== '');
}

/** Read `lint:`'s eleven keys, each its default when it is missing or wrong. */
export function lintSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LintSettings {
    const read = settingReader(config, problems);
    return {
        on: {
            chktex: read.flag('lint.chktex'),
            ruff: read.flag('lint.ruff'),
            eslint: read.flag('lint.eslint'),
            shellcheck: read.flag('lint.shellcheck'),
            writing: read.flag('lint.writing')
        },
        paths: {
            chktex: read.text('lint.chktex_path'),
            ruff: read.text('lint.ruff_path'),
            shellcheck: read.text('lint.shellcheck_path')
        },
        chktexArgs: read.strings('lint.chktex_args'),
        writingSkip: globList(read.strings('lint.writing_skip')),
        writingGlyphs: globList(read.strings('lint.writing_glyphs'))
    };
}
