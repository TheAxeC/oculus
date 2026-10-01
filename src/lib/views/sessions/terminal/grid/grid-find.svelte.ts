// Layer 3, view helper. The find state of one terminal grid and what it does with the search
// addon: whether the bar is open, how often it was asked for, the text and the three toggles it
// searches with, and what the last search reported. The grid owns one and the find bar reads it.
// Search runs upward from the active match for Previous and for a changed text or toggle
// (incrementally, so a longer text keeps the match it still fits) and downward for Next. An empty
// text clears the marks and the count. A regular expression that does not parse
// (terminal-list.ts, `findUnparsable`) clears the marks and counts no results, rather than
// letting the addon's SyntaxError out of the key press.

import type { SearchAddon } from '@xterm/addon-search';
import { findLook, type FindLook } from './grid-look';
import {
    findOptions,
    findUnparsable,
    type FindAction,
    type FindResults,
    type FindToggles
} from '../terminal-list';

export class GridFind {
    /** Whether the find bar is open, and how often it was asked for. */
    finding = $state(false);
    asked = $state(0);
    /** What the bar searches for, and the toggles it searches with. */
    term = $state('');
    toggles: FindToggles = $state({ matchCase: false, wholeWord: false, regex: false });
    /** What the last search reported, or null before one. */
    results: FindResults | null = $state(null);
    /** The search addon of the mounted grid, and the colours its marks are drawn in. */
    search: SearchAddon | null = null;
    marks: FindLook | null = null;

    private readonly focus: () => void;

    /** `focus` gives the keyboard back to the grid when the bar closes. */
    constructor(focus: () => void) {
        this.focus = focus;
    }

    /** Take the mounted grid's search addon, and follow its result counts. */
    attach(searcher: SearchAddon): () => void {
        this.search = searcher;
        this.marks = findLook();
        const counted = searcher.onDidChangeResults((found) => (this.results = found));
        return () => {
            counted.dispose();
            this.search = null;
            this.finding = false;
            this.results = null;
        };
    }

    /** Read the marks' colours again after a theme change, and search again if the bar is open. */
    restyle(): void {
        this.marks = findLook();
        if (this.finding) this.run('typed');
    }

    run(move: 'next' | 'previous' | 'typed'): void {
        const search = this.search;
        if (search === null) return;
        if (this.term === '') {
            search.clearDecorations();
            this.results = null;
            return;
        }
        if (findUnparsable(this.term, this.toggles)) {
            search.clearDecorations();
            this.results = { resultIndex: -1, resultCount: 0 };
            return;
        }
        const options = findOptions(this.toggles, this.marks ?? findLook());
        if (move === 'next') search.findNext(this.term, options);
        else search.findPrevious(this.term, { ...options, incremental: move === 'typed' });
    }

    /** The find bar's text as typed, searched for at once. */
    typed(typed: string): void {
        this.term = typed;
        this.run('typed');
    }

    /** The find bar's toggles after one was pressed, searched with at once. */
    toggled(flipped: FindToggles): void {
        this.toggles = flipped;
        this.run('typed');
    }

    /** What a find key or a press in the bar does. */
    action(action: FindAction): void {
        if (action === 'open') {
            this.finding = true;
            this.asked += 1;
        } else if (action === 'close') {
            this.finding = false;
            this.search?.clearDecorations();
            this.results = null;
            this.focus();
        } else this.run(action);
    }
}
