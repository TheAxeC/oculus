// Layer 2, client-state tests. How a terminal is marked
// (state/sessions/terminal/terminal-marks.ts): the icon and colour token a reader gave it while the
// vocabulary holds them, the result mark of a task terminal, and what the strip's tab of a Terminal
// tab is drawn with, given the terminal the tab shows.
//
// What this does NOT cover: the mark drawn on a row, the bar title or the strip, which is seen at
// the look and in tests/views/sessions/terminal-style.test.ts.

import { beforeAll, describe, expect, it } from 'vitest';
import {
    markOf,
    resultMark,
    tabMark,
    tabMarkOf
} from '../../../../src/lib/state/sessions/terminal/terminal-marks.ts';
import type { Terminal } from '../../../../src/lib/data/model/index.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';

beforeAll(() => {
    const { config } = loadConfig(engineDir());
    setCatalog(textCatalog(config));
    setGlyphs(glyphCatalog(config));
});

const A = 'a1a1a1-shell';

function terminal(icon: string, color: string): Terminal {
    return {
        id: A,
        name: A,
        title: '',
        icon,
        color,
        kind: 'shell',
        cwd: '/x',
        command: 'zsh',
        pid: 1,
        created: '2026-09-11T08:00:00.000Z',
        attached: true,
        resumes: null,
        task: false,
        exit: null,
        job: null
    };
}

describe('the mark of a terminal on the strip', () => {
    // Revert: leave the colour token out of tabMark.
    it('is the icon and the colour token of a terminal that has both', () => {
        expect(tabMark(terminal('refresh', 'red'))).toEqual({ glyph: 'refresh', token: '--c-red' });
    });

    // Revert: give a terminal with no icon the kind's glyph in tabMark.
    it('names no glyph and no token for a terminal with neither', () => {
        expect(tabMark(terminal('', ''))).toEqual({});
    });

    // Revert: give an icon the vocabulary no longer holds to the strip in tabMark.
    it('names no glyph for an icon the vocabulary does not hold, and no token for a colour outside the eight', () => {
        expect(tabMark(terminal('no_such_glyph', 'chartreuse'))).toEqual({});
    });

    // Revert: read the mark of a tab that shows no known terminal from a default terminal.
    it('is empty for a tab that shows no terminal', () => {
        expect(tabMark(null)).toEqual({});
    });

    // Revert: give the mark to a tab of every view in tabMarkOf.
    it('is given to a Terminal tab and to no other view', () => {
        const state = { id: 't', terminals: [A], shown: A };
        const found = (id: string | null) => (id === A ? terminal('refresh', 'red') : null);
        expect(tabMarkOf({ view: 'terminal', state }, found)).toEqual({
            glyph: 'refresh',
            token: '--c-red'
        });
        expect(tabMarkOf({ view: 'files', state }, found)).toEqual({});
    });
});

describe('the result mark of a task terminal', () => {
    const task = (exit: number | null, icon = 'refresh', color = 'red'): Terminal => ({
        ...terminal(icon, color),
        task: true,
        exit
    });

    it('is a green check for an exit code of zero and a red cross for any other', () => {
        expect(resultMark(task(0))).toEqual({ glyph: 'check', token: '--c-green' });
        expect(resultMark(task(1))).toEqual({ glyph: 'fail', token: '--c-red' });
    });

    it('is empty while the line runs and for a terminal that is no task terminal', () => {
        expect(resultMark(task(null))).toBeNull();
        expect(resultMark({ task: false, exit: 0 })).toBeNull();
        expect(resultMark({ task: false, exit: null })).toBeNull();
    });

    it('replaces the icon and the colour on the strip and on the row once the line ended', () => {
        expect(tabMark(task(0))).toEqual({ glyph: 'check', token: '--c-green' });
        expect(markOf(task(0))).toEqual({ glyph: 'check', token: '--c-green' });
    });

    it('keeps the icon and the colour of the terminal while its line runs', () => {
        expect(tabMark(task(null))).toEqual({ glyph: 'refresh', token: '--c-red' });
        expect(markOf(task(null))).toEqual({ glyph: 'refresh', token: '--c-red' });
    });

    it('draws the kind glyph and no token for a shell with no icon and no colour', () => {
        const shell = terminal('', '');
        expect(markOf(shell)).toEqual({ glyph: 'terminal_shell', token: null });
    });
});
