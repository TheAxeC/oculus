// Layer 2, client-state tests. The diff pane's hunks against git's. The pane cuts its hunks from
// the line changes Monaco's diff editor computes, and a hunk it stages must be the hunk `git add
// -p` offers, so for five pairs of texts the line changes Monaco answers (its own diff algorithm,
// run here as the editor runs it) are compared with git's changes (`diff -U0`) and the hunks built
// over them with git's hunks (`diff -U3`), both read by `git diff --no-index` over the two texts
// written to a scratch folder, which needs no repository and no commit.
// @module-tag slow: starts git in a child process for each case.

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    hunkHead,
    hunksOf
} from '../../../../../src/lib/state/sources/repositories/diff/diff-hunks.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { monacoLineChanges } from '../../../../ui/controls/editor/monaco-diff.ts';

/** Twenty numbered lines, each ending with a newline. */
function numbered(count = 20): string[] {
    return Array.from({ length: count }, (_, at) => `line ${at + 1}`);
}

/** Lines joined into a text with a final newline. */
function text(lines: string[]): string {
    return lines.map((line) => `${line}\n`).join('');
}

/** A copy of the twenty lines with the lines at the given numbers rewritten. */
function changed(...numbers: number[]): string[] {
    return numbered().map((line, at) => (numbers.includes(at + 1) ? `${line} changed` : line));
}

/** The five pairs: the original text and the modified one. */
const PAIRS: [string, string, string][] = [
    ['a one-line change', text(numbered()), text(changed(10))],
    ['two changes six lines apart', text(numbered()), text(changed(5, 12))],
    ['two changes seven lines apart', text(numbered()), text(changed(5, 13))],
    ['a deletion at the top', text(numbered()), text(numbered().slice(2))],
    ['an insertion at the end', text(numbered()), text([...numbered(), 'added 1', 'added 2'])]
];

/** Every hunk head of a diff, as `-start,count +start,count`, a missing count read as one. */
function heads(diff: string): string[] {
    return [...diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)].map(
        (head) => `-${head[1]},${head.at(2) ?? '1'} +${head[3]},${head.at(4) ?? '1'}`
    );
}

/** git's diff of the pair with the given context, the two texts compared as files. */
function gitDiff(original: string, modified: string, context: number): string {
    const dir = scratchDir('oculus-hunks-git-');
    writeFileSync(join(dir, 'a'), original);
    writeFileSync(join(dir, 'b'), modified);
    const run = spawnSync(
        'git',
        ['diff', '--no-index', '--no-color', '--no-ext-diff', `-U${String(context)}`, 'a', 'b'],
        { cwd: dir, encoding: 'utf8' }
    );
    // git diff --no-index exits 1 when the files differ, which every pair here does.
    expect(run.status, run.stderr).toBe(1);
    return run.stdout;
}

/** The number of lines git counts in a text: a final newline ends the last line. */
function gitLines(value: string): number {
    return value === '' ? 0 : value.replace(/\n$/, '').split('\n').length;
}

describe('the hunks against git', () => {
    it.each(PAIRS)("finds git's changes and git's hunks for %s", (_name, original, modified) => {
        const changes = monacoLineChanges(original, modified);
        // git -U0 names an empty side by the line before it, as Monaco's line changes do.
        const monaco = changes.map((change) => {
            const olds =
                change.originalEndLineNumber === 0
                    ? 0
                    : change.originalEndLineNumber - change.originalStartLineNumber + 1;
            const news =
                change.modifiedEndLineNumber === 0
                    ? 0
                    : change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;
            return `-${change.originalStartLineNumber},${olds} +${change.modifiedStartLineNumber},${news}`;
        });
        expect(monaco).toEqual(heads(gitDiff(original, modified, 0)));
        const built = hunksOf(changes).map((hunk) => {
            const head = hunkHead(hunk, gitLines(original), gitLines(modified));
            return `-${head.oldStart},${head.oldCount} +${head.newStart},${head.newCount}`;
        });
        expect(built).toEqual(heads(gitDiff(original, modified, 3)));
    });
});
