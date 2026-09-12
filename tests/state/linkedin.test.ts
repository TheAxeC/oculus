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
} from '../../src/lib/state/linkedin.ts';

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
