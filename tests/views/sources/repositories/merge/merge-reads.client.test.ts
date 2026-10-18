// Layer 3, view-state tests. The reads of an open merge tab (views/sources/repositories/merge/
// merge-reads.svelte.ts), in Svelte's client runtime since they follow the repository's git state
// through an effect: what the tab draws when that state moves behind it. The GET is a fake that
// answers from a list, so no server is reached.
//
// It does not cover the three editors the tab draws, which the look does.

import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../../src/lib/state/shared/words/text.ts';
import {
    chooseIn,
    openCount
} from '../../../../../src/lib/state/sources/repositories/diff/merge-regions.ts';
import type { GitMergeSides } from '../../../../../src/lib/state/sources/repositories/repositories.ts';
import { MergeReads } from '../../../../../src/lib/views/sources/repositories/merge/merge-reads.svelte.ts';
import { cell, rooted } from '../../../../ui/frame/rooted.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const ONE: GitMergeSides = {
    base: 'a\nb\nc\n',
    ours: 'a\nB\nc\n',
    theirs: 'a\nX\nc\n',
    deleted: ''
};

const TWO: GitMergeSides = {
    base: 'a\nb\nc\nd\ne\n',
    ours: 'a\nB\nc\nD\ne\n',
    theirs: 'a\nX\nc\nY\ne\n',
    deleted: ''
};

const sides = (held: GitMergeSides) => new Response(JSON.stringify({ sides: held }));
const refusal = (error: string) => new Response(JSON.stringify({ error }), { status: 409 });

/** A merge tab over a.txt whose reads answer `answers` in turn, and the git state it follows. */
function open(answers: Response[]) {
    const git = cell<object>({ head: 'one' });
    const asked: string[] = [];
    const made = rooted(
        () =>
            new MergeReads({
                root: () => '/repo',
                path: () => 'a.txt',
                git: git.get,
                get: (url) => {
                    asked.push(url);
                    const next = answers.shift();
                    return next === undefined
                        ? Promise.reject(new Error('no answer'))
                        : Promise.resolve(next);
                }
            })
    );
    flushSync();
    return { reads: made.value, git, asked, stop: made.stop };
}

const conflicts = (reads: MergeReads) => reads.regions.filter((one) => one.kind === 'conflict');

type Row = {
    name: string;
    then: Response;
    before?: (reads: MergeReads) => void;
    check: (reads: MergeReads) => void;
};

const ROWS: Row[] = [
    {
        name: 'a second conflict written behind it is drawn',
        then: sides(TWO),
        check: (reads) => {
            expect(conflicts(reads)).toHaveLength(2);
            expect(openCount(reads.regions, reads.history.held.choices)).toBe(2);
            expect(reads.failure).toBe('');
        }
    },
    {
        name: 'a conflict resolved behind it says the path is no longer in conflict',
        then: refusal(t('server.git.not_in_conflict', 'a.txt')),
        check: (reads) => {
            expect(reads.failure).toBe(t('server.git.not_in_conflict', 'a.txt'));
            expect(reads.done).toBe(false);
        }
    },
    {
        name: 'a move that brings the same versions keeps the choice the reader made',
        then: sides(ONE),
        before: (reads) => {
            const at = reads.regions.findIndex((one) => one.kind === 'conflict');
            reads.history = chooseIn(reads.history, reads.regions, at, 'incoming');
        },
        check: (reads) => {
            expect(conflicts(reads)).toHaveLength(1);
            const at = reads.regions.findIndex((one) => one.kind === 'conflict');
            expect(reads.history.held.choices[at]).toBe('incoming');
        }
    },
    {
        name: "the tab's own Complete Merge keeps its done note when the path leaves the conflict",
        then: refusal(t('server.git.not_in_conflict', 'a.txt')),
        before: (reads) => reads.finished(),
        check: (reads) => {
            expect(reads.done).toBe(true);
            expect(reads.failure).toBe('');
        }
    }
];

describe('an open merge tab when the git state moves behind it', () => {
    it.each(ROWS)('$name', async (row) => {
        const { reads, git, asked, stop } = open([sides(ONE), row.then]);
        await reads.latest;
        expect(conflicts(reads)).toHaveLength(1);
        row.before?.(reads);
        git.set({ head: 'two' });
        flushSync();
        await reads.latest;
        expect(asked).toHaveLength(2);
        row.check(reads);
        stop();
    });
});
