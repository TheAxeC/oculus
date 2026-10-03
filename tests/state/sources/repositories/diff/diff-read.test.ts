// How a diff pane reads its subject (state/sources/repositories/answers.ts): the request of a
// Replace Preview is a POST with the write token and the hits in its body, any other diff is a
// GET, a pane draws the answer of its newest read only and none once it is closed, and a group's
// answer is joined from its files' answers (diff/compare.ts's joinAnswers).

import { describe, expect, it } from 'vitest';
import type { DiffSides } from '../../../../../src/lib/data/model/index.ts';
import type { DiffAnswer } from '../../../../../src/lib/state/sources/repositories/answers.ts';
import {
    diffReader,
    diffRequest
} from '../../../../../src/lib/state/sources/repositories/answers.ts';
import {
    joinAnswers,
    latestRead
} from '../../../../../src/lib/state/sources/repositories/diff/compare.ts';
import { diffState } from '../../../../../src/lib/state/sources/repositories/repositories.ts';
import { previewSubject } from '../../../../../src/lib/state/sources/repositories/replace-preview.ts';

const FILE = { root: 'hub', path: 'a.ts', hits: [{ line: 2, at: 4 }] };
const SETTINGS = {
    query: { q: 'foo', word: false, case: false, regex: false, under: '' },
    replace: 'bar',
    preserve: false
};
const PREVIEW = diffState(previewSubject(FILE, SETTINGS, 2), 'a.ts (replace)');

/** The two sides a preview answers, the right one holding `modified`. */
function sides(modified: string): DiffSides {
    return {
        oldPath: 'hub:a.ts',
        newPath: 'hub:a.ts',
        head: [],
        binary: false,
        encoded: false,
        original: 'foo\n',
        modified
    };
}

/** The answer of a preview read whose right side is `modified`. */
function answered(modified: string): DiffAnswer {
    return {
        ok: true,
        files: [sides(modified)],
        attributes: null,
        conflicted: false,
        error: undefined
    };
}

type Draw = Parameters<ReturnType<typeof diffReader>['load']>[1];

/** What a draw was given, in order. */
function recorder(): { draw: Draw; drawn: string[] } {
    const drawn: string[] = [];
    return {
        drawn,
        draw: {
            answered: (read) => drawn.push(read.files?.[0]?.modified ?? 'none'),
            failed: () => drawn.push('failed')
        }
    };
}

/** A read that answers when the test lets it, one answer per state asked, by its replace text. */
function held() {
    const waiting: ((answer: DiffAnswer) => void)[] = [];
    const read = () => new Promise<DiffAnswer>((done) => waiting.push(done));
    return { read, waiting };
}

describe('the request of a diff read', () => {
    it('posts a Replace Preview with the write token and its hits in the body', () => {
        const request = diffRequest(PREVIEW, 'tok');
        expect(request.url).toBe('/api/ops');
        expect(request.init?.method).toBe('POST');
        expect(request.init?.headers).toMatchObject({ 'x-oculus-token': 'tok' });
        expect(JSON.parse(request.init?.body ?? '')).toEqual({
            op: 'preview',
            query: SETTINGS.query,
            replace: 'bar',
            preserveCase: false,
            root: 'hub',
            path: 'a.ts',
            hits: [{ line: 2, at: 4 }]
        });
    });

    it('gets any other diff by its address, with no token and no body', () => {
        const request = diffRequest(
            diffState({ root: 'hub', path: 'a.ts', staged: true, worktree: false }, 'a'),
            'tok'
        );
        expect(request.init).toBeUndefined();
        expect(request.url).toBe('/api/git?diff=hub&path=a.ts&staged=1');
    });
});

describe('the reads of a pane', () => {
    it('draws nothing when the pane closed while a preview read was out', async () => {
        const { read, waiting } = held();
        const reader = diffReader(read, latestRead());
        const { draw, drawn } = recorder();
        const pending = reader.load(PREVIEW, draw);
        reader.close();
        waiting[0]?.(answered('bar\n'));
        expect(await pending).toBe(false);
        expect(drawn).toEqual([]);
    });

    it('draws no failure either when the pane closed while the read threw', async () => {
        const reader = diffReader(() => Promise.reject(new Error('down')), latestRead());
        const { draw, drawn } = recorder();
        const pending = reader.load(PREVIEW, draw);
        reader.close();
        expect(await pending).toBe(false);
        expect(drawn).toEqual([]);
    });

    it('draws only the later answer when two previews were pressed in a row', async () => {
        const { read, waiting } = held();
        const reader = diffReader(read, latestRead());
        const { draw, drawn } = recorder();
        const first = reader.load(PREVIEW, draw);
        const second = reader.load(PREVIEW, draw);
        waiting[1]?.(answered('quux\n'));
        waiting[0]?.(answered('bar\n'));
        expect([await first, await second]).toEqual([false, true]);
        expect(drawn).toEqual(['quux\n']);
    });

    it('draws a read that answered, and a read that threw as the failure', async () => {
        const ok = recorder();
        expect(
            await diffReader(() => Promise.resolve(answered('bar\n')), latestRead()).load(
                PREVIEW,
                ok.draw
            )
        ).toBe(true);
        const down = recorder();
        expect(
            await diffReader(() => Promise.reject(new Error('down')), latestRead()).load(
                PREVIEW,
                down.draw
            )
        ).toBe(true);
        expect([ok.drawn, down.drawn]).toEqual([['bar\n'], ['failed']]);
    });
});

describe('the answer of a group read', () => {
    it('holds the files of every path read, in order', () => {
        const read = joinAnswers([answered('one\n'), answered('two\n')]);
        expect(read.ok).toBe(true);
        expect(read.files?.map((file) => file.modified)).toEqual(['one\n', 'two\n']);
    });

    it('is the first answer that failed when a path could not be read', () => {
        const failed: DiffAnswer = { ...answered('x'), ok: false, files: null, error: 'missing' };
        expect(joinAnswers([answered('one\n'), failed, answered('two\n')])).toBe(failed);
    });
});
