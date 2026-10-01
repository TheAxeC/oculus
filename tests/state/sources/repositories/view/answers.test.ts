// What the views read out of the bodies of the git endpoints they fetch: the branches of the
// Changes tab, a commit's files, a diff, a page of the graph, the three sides of a conflict and
// the gutter's marks and blame. Each function takes the status and the parsed body, so a case
// states a body and asserts what the view draws, without a fetch. What this does NOT cover: the
// fetch itself and the catch around it, which are the components' and are drawn in their tests.

import { describe, expect, it } from 'vitest';
import {
    branchesOf,
    commitFilesOf,
    diffAnswerOf,
    graphPageOf,
    listOf,
    mergeSidesOf
} from '../../../../../src/lib/state/sources/repositories/answers.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const BRANCH = { name: 'main', upstream: '', current: true };
const FILE = { status: 'M', path: 'a.ts', from: '' };
const SIDES = {
    oldPath: 'a',
    newPath: 'a',
    head: [],
    binary: false,
    encoded: true,
    original: 'o',
    modified: 'm'
};
const COMMIT = {
    hash: 'abc',
    short: 'a',
    subject: 's',
    when: 'w',
    parents: [],
    author: 'x',
    refs: [],
    tags: [],
    head: true,
    message: 'm'
};
const MARK = { kind: 'added', line: 1, count: 1 };
const BLAME = {
    line: 1,
    hash: 'abc',
    short: 'a',
    author: 'x',
    when: 'w',
    subject: 's',
    uncommitted: false
};
const MERGE = { base: 'a\n', ours: 'b\n', theirs: 'c\n', deleted: '' };

/** A body that is no JSON or is JSON null reads as undefined; the rest is what a server sends. */
const NOT_LISTS: [string, unknown][] = [
    ['no JSON', undefined],
    ['a list', []],
    ['a text', 'x']
];

const failed = (): string => t('repositories.graph_failed');

describe('the branches an answer lists', () => {
    it.each([...NOT_LISTS, ['an empty map', {}], ['branches that is a number', { branches: 3 }]])(
        'answers none for %s',
        (_name, body) => {
            expect(branchesOf(body)).toStrictEqual([]);
        }
    );

    it('answers a well-formed list as the input itself', () => {
        const list = [BRANCH];
        expect(branchesOf({ branches: list })).toBe(list);
    });

    it('answers the passing branches of a list that holds a row of the wrong shape', () => {
        expect(branchesOf({ branches: [BRANCH, 3] })).toStrictEqual([BRANCH]);
    });
});

describe('the files a commit lists', () => {
    it('answers a well-formed list as the input itself, with no failure at ok', () => {
        const files = [FILE];
        const answer = commitFilesOf(true, { files });
        expect(answer.files).toBe(files);
        expect(answer.failure).toBe('');
    });

    it('answers the reason the server gave at ok false', () => {
        expect(commitFilesOf(false, { files: [], error: 'git said no' })).toStrictEqual({
            files: [],
            failure: 'git said no'
        });
    });

    it('answers no files and the failure sentence for a body that was not read', () => {
        for (const ok of [true, false]) {
            expect(commitFilesOf(ok, undefined)).toStrictEqual({ files: null, failure: failed() });
        }
    });

    it('answers an empty list for a body without a list of files', () => {
        for (const body of [[], 'x', {}, { files: 3 }]) {
            expect(commitFilesOf(true, body).files).toStrictEqual([]);
        }
        expect(commitFilesOf(false, { files: 3 })).toStrictEqual({ files: [], failure: failed() });
    });

    it('answers the passing files of a list that holds a row of the wrong shape', () => {
        expect(commitFilesOf(true, { files: [FILE, 3] }).files).toStrictEqual([FILE]);
    });

    it('answers the failure sentence when the reason is not a text', () => {
        expect(commitFilesOf(false, { files: 3, error: 3 }).failure).toBe(failed());
    });
});

describe('the parts of a diff', () => {
    it('answers a well-formed body with its files as the input itself', () => {
        const files = [SIDES];
        const answer = diffAnswerOf(true, { files, conflicted: true });
        expect(answer.ok).toBe(true);
        expect(answer.files).toBe(files);
        expect(answer.conflicted).toBe(true);
        expect(answer.error).toBeUndefined();
    });

    it('answers a refusal that gave no reason for a body that was not read', () => {
        for (const ok of [true, false]) {
            expect(diffAnswerOf(ok, undefined)).toStrictEqual({
                ok: false,
                files: null,
                attributes: null,
                conflicted: false,
                error: undefined
            });
        }
    });

    it('answers no files for a body without a list of them', () => {
        for (const body of [[], 'x', {}, { files: 3 }]) {
            expect(diffAnswerOf(true, body).files).toBeNull();
        }
    });

    it('answers a conflict only for true', () => {
        expect(diffAnswerOf(true, { files: [], conflicted: 'true' }).conflicted).toBe(false);
        expect(diffAnswerOf(true, { files: [], conflicted: 1 }).conflicted).toBe(false);
    });

    it('answers the reason the server gave when it is a text, and none otherwise', () => {
        expect(diffAnswerOf(false, { error: 'git said no' }).error).toBe('git said no');
        expect(diffAnswerOf(false, { error: 3 }).error).toBeUndefined();
    });

    it('answers the passing files of a list that holds a row of the wrong shape', () => {
        expect(diffAnswerOf(true, { files: [SIDES, 3] }).files).toStrictEqual([SIDES]);
    });

    it('answers no attributes when they are not the six texts git gives', () => {
        expect(diffAnswerOf(true, { files: [], attributes: 3 }).attributes).toBeNull();
        const attributes = {
            filter: '',
            text: '',
            eol: '',
            workingTreeEncoding: '',
            ident: '',
            autocrlf: ''
        };
        expect(diffAnswerOf(true, { files: [], attributes }).attributes).toStrictEqual(attributes);
    });
});

describe('the page of the graph an answer carries', () => {
    const page = { commits: [COMMIT], more: false, incoming: [], outgoing: [] };

    it('answers a well-formed page and no failure', () => {
        expect(graphPageOf(true, { page })).toStrictEqual({ page, failure: '' });
    });

    it('answers the failure sentence for a body that was not read', () => {
        for (const ok of [true, false]) {
            expect(graphPageOf(ok, undefined)).toStrictEqual({ page: null, failure: failed() });
        }
    });

    it('answers the failure sentence for a body without a page', () => {
        for (const body of [[], 'x', {}]) {
            expect(graphPageOf(true, body)).toStrictEqual({ page: null, failure: failed() });
        }
    });

    it('answers the reason the server gave at ok false when it is a text', () => {
        expect(graphPageOf(false, { error: 'git said no' }).failure).toBe('git said no');
        expect(graphPageOf(false, { page }).failure).toBe(failed());
    });

    it('answers the failure sentence when the reason is not a text', () => {
        expect(graphPageOf(false, { error: 3 }).failure).toBe(failed());
    });

    it('answers the failure sentence for a page that is no page', () => {
        for (const bad of [3, 'x', [], { commits: 3, more: false, incoming: [], outgoing: [] }]) {
            expect(graphPageOf(true, { page: bad })).toStrictEqual({
                page: null,
                failure: failed()
            });
        }
    });

    it('answers the page it was given, with a field the reader does not name', () => {
        const given = { ...page, extra: 'kept' };
        expect(graphPageOf(true, { page: given }).page).toBe(given);
    });

    it('answers a new page, not the one given, when a list dropped a commit', () => {
        const given = { ...page, incoming: [COMMIT, 3] };
        const answered = graphPageOf(true, { page: given }).page;
        expect(answered).not.toBe(given);
        expect(answered?.incoming).toStrictEqual([COMMIT]);
    });

    it('answers the passing commits of a page whose list holds a row of the wrong shape', () => {
        const mixed = { ...page, commits: [COMMIT, 3] };
        expect(graphPageOf(true, { page: mixed }).page?.commits).toStrictEqual([COMMIT]);
    });
});

describe('the three sides of a conflict an answer carries', () => {
    const merging = (): string => t('repositories.merge_failed');

    it('answers well-formed sides and no failure', () => {
        expect(mergeSidesOf(true, { sides: MERGE })).toStrictEqual({ sides: MERGE, failure: '' });
    });

    it('answers the sides it was given, with a field the reader does not name', () => {
        const given = { ...MERGE, extra: 'kept' };
        expect(mergeSidesOf(true, { sides: given }).sides).toBe(given);
    });

    it('answers the failure sentence for a body that was not read', () => {
        for (const ok of [true, false]) {
            expect(mergeSidesOf(ok, undefined)).toStrictEqual({ sides: null, failure: merging() });
        }
    });

    it('answers the failure sentence for a body without sides', () => {
        for (const body of [[], 'x', {}]) {
            expect(mergeSidesOf(true, body)).toStrictEqual({ sides: null, failure: merging() });
        }
    });

    it('answers the reason the server gave at ok false when it is a text', () => {
        expect(mergeSidesOf(false, { error: 'git said no' }).failure).toBe('git said no');
        expect(mergeSidesOf(false, { error: 3 }).failure).toBe(merging());
    });

    it('answers the failure sentence for sides that are no sides', () => {
        for (const bad of [3, 'x', [], { ...MERGE, deleted: 'neither' }, { base: 'a' }]) {
            expect(mergeSidesOf(true, { sides: bad })).toStrictEqual({
                sides: null,
                failure: merging()
            });
        }
    });
});

describe('the lists the gutter reads', () => {
    it('answers none at ok false whatever the body holds', () => {
        expect(listOf(false, { marks: [MARK] }, 'marks')).toStrictEqual([]);
        expect(listOf(false, { lines: [BLAME] }, 'lines')).toStrictEqual([]);
    });

    it('answers none for a body without the list', () => {
        for (const body of [undefined, [], 'x', {}, { marks: 3 }, { lines: 3 }]) {
            expect(listOf(true, body, 'marks')).toStrictEqual([]);
            expect(listOf(true, body, 'lines')).toStrictEqual([]);
        }
    });

    it('answers a well-formed list as the input itself', () => {
        const marks = [MARK];
        const lines = [BLAME];
        expect(listOf(true, { marks }, 'marks')).toBe(marks);
        expect(listOf(true, { lines }, 'lines')).toBe(lines);
    });

    it('answers the passing rows of a list that holds a row of the wrong shape', () => {
        expect(listOf(true, { marks: [MARK, 3] }, 'marks')).toStrictEqual([MARK]);
        expect(listOf(true, { lines: [BLAME, 3] }, 'lines')).toStrictEqual([BLAME]);
    });
});
