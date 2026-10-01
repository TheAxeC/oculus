// The pure LinkedIn cadence, idea rotation, snippets, ordering, search, and instance state.

import { describe, expect, it } from 'vitest';
import {
    cadence,
    daysSince,
    linkedinSearch,
    parseLinkedinState,
    pickIdea,
    snippet,
    splitPosts,
    type LinkedinEntry
} from '../../../src/lib/state/feeds/linkedin.ts';

const entries = [
    {
        file: 'xx-zeta.md',
        title: 'Zeta idea',
        date: '2026-09-01',
        category: 'research',
        body: 'A tensor hook',
        idea: true
    },
    {
        file: '01-first.md',
        title: 'First post',
        date: '2026-08-01',
        category: 'reflection',
        body: 'An old post',
        idea: false
    },
    {
        file: 'xx-alpha.md',
        title: 'Alpha idea',
        date: '',
        category: 'mentorship',
        body: 'Teaching lessons',
        idea: true
    },
    {
        file: '02-second.md',
        title: 'Second post',
        date: '2026-09-10',
        category: 'research',
        body: 'A clinical result',
        idea: false
    }
] satisfies LinkedinEntry[];

describe('LinkedIn state', () => {
    it('measures the newest valid post and classifies all three cadence states', () => {
        const posts = splitPosts(entries).posts;
        expect(daysSince(posts, '2026-09-12')).toBe(2);
        expect(cadence(2, 30)).toBe('ontrack');
        expect(cadence(31, 30)).toBe('overdue');
        expect(cadence(null, 30)).toBe('no-dates');
        expect(
            daysSince(
                posts.map((post) => ({ ...post, date: 'not-a-date' })),
                '2026-09-12'
            )
        ).toBe(null);
    });

    it('rotates ideas by day of year and returns null when there is no idea', () => {
        const ideas = splitPosts(entries).ideas;
        expect(pickIdea(ideas, '2026-01-01')?.file).toBe('xx-zeta.md');
        expect(pickIdea(ideas, '2026-01-02')?.file).toBe('xx-alpha.md');
        expect(pickIdea([], '2026-01-01')).toBe(null);
    });

    it('orders ideas by filename and posts by newest date', () => {
        const split = splitPosts([
            ...entries,
            {
                file: '03-undated.md',
                title: 'Undated post',
                date: 'not-a-date',
                category: '',
                body: '',
                idea: false
            },
            {
                file: 'README.md',
                title: 'Read me',
                date: '2026-09-11',
                category: '',
                body: '',
                idea: false
            },
            {
                file: 'draft-another.md',
                title: 'Draft',
                date: '2026-09-11',
                category: '',
                body: '',
                idea: true
            }
        ]);
        expect(split.ideas.map((entry) => entry.file)).toEqual(['xx-alpha.md', 'xx-zeta.md']);
        expect(split.posts.map((entry) => entry.file)).toEqual([
            '02-second.md',
            '01-first.md',
            '03-undated.md'
        ]);
    });

    it('searches title, category, and body and requires every word', () => {
        expect(linkedinSearch(entries, 'research tensor').map((entry) => entry.file)).toEqual([
            'xx-zeta.md'
        ]);
        expect(linkedinSearch(entries, 'teaching').map((entry) => entry.file)).toEqual([
            'xx-alpha.md'
        ]);
        expect(linkedinSearch(entries, 'zeta').map((entry) => entry.file)).toEqual(['xx-zeta.md']);
        expect(linkedinSearch(entries, '')).toBe(entries);
    });

    it('collapses whitespace and keeps 160 characters before the ellipsis', () => {
        const astral = String.fromCodePoint(0x1f9e0);
        expect(snippet('one\n  two')).toBe('one two...');
        expect(snippet('x'.repeat(170))).toBe(`${'x'.repeat(160)}...`);
        expect(snippet(`${'x'.repeat(159)}${astral}tail`)).toBe(`${'x'.repeat(159)}${astral}...`);
    });

    it('reads search and add-form state defensively', () => {
        expect(parseLinkedinState({ search: 'idea', adding: true })).toEqual({
            search: 'idea',
            adding: true
        });
        expect(parseLinkedinState(null)).toEqual({ search: '', adding: false });
    });
});

describe('the LinkedIn readers over fields of the wrong type', () => {
    const blank = { date: '', category: '', body: '' };

    it('reads a field as its text when it is text or a number and as nothing otherwise', () => {
        const split = splitPosts([
            { file: 3 },
            {
                file: '12-x',
                title: 3,
                date: 20260101,
                category: true,
                body: null
            },
            { file: 'xx-a', title: ['t'], date: true },
            { file: 'xx-b', title: '', body: NaN },
            { file: '7-', title: 'ok', date: '2026-01-01', category: 5, body: 'b' },
            { file: ['xx-c'] },
            {}
        ]);
        expect(split).toStrictEqual({
            ideas: [
                { file: 'xx-a', title: 'xx-a', ...blank, idea: true },
                { file: 'xx-b', title: 'xx-b', date: '', category: '', body: 'NaN', idea: true }
            ],
            posts: [
                {
                    file: '7-',
                    title: 'ok',
                    date: '2026-01-01',
                    category: '5',
                    body: 'b',
                    idea: false
                },
                { file: '12-x', title: '3', date: '20260101', category: '', body: '', idea: false }
            ]
        });
    });

    it('titles an idea whose title is the number zero by its digit', () => {
        const split = splitPosts([{ file: 'xx-z' }, { file: 'xx-a' }, { file: 'xx-m', title: 0 }]);
        expect(split.ideas.map((idea) => [idea.file, idea.title])).toEqual([
            ['xx-a', 'xx-a'],
            ['xx-m', '0'],
            ['xx-z', 'xx-z']
        ]);
        expect(split.posts).toEqual([]);
    });

    it('leaves a null entry out of the ideas and the posts', () => {
        const split = splitPosts([null, { file: 'xx-a' }, { file: '1-a' }]);
        expect(split.ideas.map((idea) => idea.file)).toEqual(['xx-a']);
        expect(split.posts.map((post) => post.file)).toEqual(['1-a']);
    });

    it('orders posts by a date that is a real ISO date string, the others after by filename', () => {
        const split = splitPosts([
            { file: '1-a', date: '2026-02-01' },
            { file: '2-b', date: 20260301 },
            { file: '3-c', date: '2026-03-01' },
            { file: '4-d', date: '2026-02-31' },
            { file: '5-e' }
        ]);
        expect(split.posts.map((post) => post.file)).toEqual(['3-c', '1-a', '2-b', '4-d', '5-e']);
    });

    it.each([
        [3, '3...'],
        [true, 'true...'],
        [NaN, 'NaN...'],
        [null, '...'],
        [undefined, '...'],
        [['a'], '...'],
        [{ a: 1 }, '...'],
        ['a  b\n c', 'a b c...']
    ])('writes the snippet of the body %j as %j', (body, written) => {
        expect(snippet(body)).toBe(written);
    });
});
