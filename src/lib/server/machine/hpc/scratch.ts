// Layer 2, server. The scratch rule of Submit: whether a job script, or a file it sources that the
// rule can find, names `/local/$SLURM_JOB_ID`, the cluster's per-job scratch folder every job's
// input and output goes through. A script that never names it gets a warning before the reader
// submits it.
//
// Each file is read through the shell parser's printer (`print` of sh-syntax with `minify`), which
// drops every comment, keeps quotes and here-document bodies and prints one statement a line, so
// the test is a line of printed code and a comment naming the folder never counts. The parser's
// tree does not carry commands to the host language, so the printed text is read line by line:
// one pattern for the folder and one rule for what `source` names.
//
// A `source` is followed only when its word resolves by the forms below to a file inside the code
// folder; every other word is listed as written, with the file that did not print, so the warning
// says what the rule could not read. The reading is bounded: a file is read once, so two files
// that source each other end, and at most MAX_READ files are read.

import { readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { print } from 'sh-syntax';
import { inside, realPath } from '../../core/paths.ts';

/** What the rule found: whether the folder is named, and the sources it could not read. */
export type ScratchResult = { named: boolean; unread: string[] };

/**
 * `/local/` followed at once by `$SLURM_JOB_ID` that no name character follows, by
 * `${SLURM_JOB_ID}`, or by `${SLURM_JOB_ID` with an operator and a word (`:-$$`, `-x`).
 */
const SCRATCH = /\/local\/(\$SLURM_JOB_ID(?![A-Za-z0-9_])|\$\{SLURM_JOB_ID(\}|:?[-=+?][^}]*\}))/;

/** The most files one plan reads. */
const MAX_READ = 20;

/** The word after `source` or `.`: a double-quoted word, or the characters up to a separator. */
const SOURCE_WORD = /^(?:"[^"]*"|[^\s;&|<>]+)/;

/** `$(dirname "$0")` or `$(dirname $0)`, the folder of the file being read. */
const OWN_FOLDER = /^\$\(dirname "?\$0"?\)\//;

/** The word without the double quotes around the whole of it. */
function unquoted(word: string): string {
    return word.length >= 2 && word.startsWith('"') && word.endsWith('"')
        ? word.slice(1, -1)
        : word;
}

/**
 * What follows the closing brace of the expansion that opens at the start of `word`
 * (`${SLURM_SUBMIT_DIR:-...}`), counting nested braces, or null when it never closes.
 */
function afterBraces(word: string): string | null {
    let depth = 0;
    for (let at = 0; at < word.length; at += 1) {
        if (word[at] === '{') depth += 1;
        if (word[at] === '}') {
            depth -= 1;
            if (depth === 0) return word.slice(at + 1);
        }
    }
    return null;
}

/**
 * The path a `source` word names inside the code folder, or null when it is not one of the forms:
 * the submit folder (`$SLURM_SUBMIT_DIR`, `${SLURM_SUBMIT_DIR}`, `${SLURM_SUBMIT_DIR:-...}`, the
 * folder sbatch is run from, which mirrors the code folder), the folder of the file being read, the
 * cluster folder written from the home folder (`~/`, `$HOME/`, `${HOME}/`), or a relative path from
 * the code folder. A word left holding a `$`, a backquote or a quote is not followed.
 */
function sourced(word: string, from: string, code: string, cluster: string): string | null {
    let target: string | null = null;
    if (word.startsWith('${SLURM_SUBMIT_DIR') || word.startsWith('$SLURM_SUBMIT_DIR/')) {
        const rest = word.startsWith('${')
            ? afterBraces(word)
            : word.slice('$SLURM_SUBMIT_DIR'.length);
        target = rest?.startsWith('/') === true ? join(code, rest) : null;
    } else if (OWN_FOLDER.test(word)) {
        target = join(dirname(from), word.replace(OWN_FOLDER, ''));
    } else if (/^(~|\$HOME|\$\{HOME\})\//.test(word)) {
        const home = cluster.startsWith('~/') ? `${cluster.slice(2)}/` : null;
        const rest = word.slice(word.indexOf('/') + 1);
        target =
            home !== null && rest.startsWith(home) ? join(code, rest.slice(home.length)) : null;
    } else if (!word.startsWith('/')) {
        target = join(code, word);
    }
    if (target === null || /[$`'"]/.test(target)) return null;
    const real = realPath(resolve(target));
    if (real === null || !inside(real, code)) return null;
    try {
        return statSync(real).isFile() ? real : null;
    } catch {
        return null;
    }
}

/** The printed text of a file, or null when it cannot be read or does not parse. */
async function printed(file: string): Promise<string | null> {
    try {
        return await print(readFileSync(file, 'utf8'), { minify: true });
    } catch {
        return null;
    }
}

/**
 * Whether the job script, or a file it sources, names `/local/$SLURM_JOB_ID`, and the sources the
 * rule could not read. `code` is the real path of the code folder and `cluster` the folder on the
 * cluster that holds its contents, whose `~/` form lets a script name its own place.
 */
export async function scratchRule(
    script: string,
    code: string,
    cluster: string
): Promise<ScratchResult> {
    const result: ScratchResult = { named: false, unread: [] };
    const seen = new Set<string>();
    const pending = [script];
    const unread = (entry: string): void => {
        if (!result.unread.includes(entry)) result.unread.push(entry);
    };
    for (let file = pending.shift(); file !== undefined; file = pending.shift()) {
        if (seen.has(file)) continue;
        if (seen.size >= MAX_READ) {
            unread(relative(code, file));
            continue;
        }
        seen.add(file);
        const text = await printed(file);
        if (text === null) {
            unread(relative(code, file));
            continue;
        }
        for (const line of text.split('\n')) {
            if (SCRATCH.test(line)) result.named = true;
            const words = /^(?:source|\.)\s+(.*)$/.exec(line.trim());
            const word = words === null ? null : SOURCE_WORD.exec(words[1])?.[0];
            if (word === null || word === undefined) continue;
            const found = sourced(unquoted(word), file, code, cluster);
            if (found === null) unread(word);
            else pending.push(found);
        }
    }
    return result;
}
