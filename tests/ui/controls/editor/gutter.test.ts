// The editor's gutter as Monaco decorations: the quick diff marks in the line-decorations lane, the
// breakpoints in the glyph margin, and the blame written into the line-number column; and the
// diff's comment `+`: which line a mouse target is on, the hover mark on each side, the press that
// opens a comment, and the Add Comment on Line action, each driven through a fake editor. What
// this does NOT cover: Monaco drawing those decorations and reporting a press on them, which the
// look does.

import { describe, expect, it } from 'vitest';
import {
    blameDecorations,
    blameNumbers,
    blameWidth,
    breakpointDecorations,
    changeActions,
    commentActionsOn,
    commentGutter,
    commentSides,
    listedWithComment,
    markAction,
    markAt,
    markDecorations,
    stepMark,
    type EditorMark
} from '../../../../src/lib/ui/controls/editor/gutter/gutter.ts';
import type { DiffSide } from '../../../../src/lib/ui/controls/editor/types.ts';
import { blameRows } from '../../../../src/lib/state/sources/repositories/file-git.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import type { GitBlameLine } from '../../../../src/lib/data/model/index.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const MARKS: EditorMark[] = [
    { kind: 'added', line: 3, count: 3 },
    { kind: 'modified', line: 8, count: 1 },
    { kind: 'deleted', line: 11, count: 0 }
];

/** Each decoration as the lines it covers and the class of the lane it draws in. */
function drawn(decorations: ReturnType<typeof markDecorations>): [number, number, string][] {
    return decorations.map((one) => [
        one.range.startLineNumber,
        one.range.endLineNumber,
        one.options.linesDecorationsClassName ?? ''
    ]);
}

describe('the quick diff marks', () => {
    // Red when a mark is drawn per line rather than per run, or in the wrong lane or kind.
    it('draws an added run, a modified line and a deletion as three ranges of their kinds', () => {
        expect(drawn(markDecorations(MARKS, 20))).toEqual([
            [3, 5, 'oculus-mark oculus-mark-added'],
            [8, 8, 'oculus-mark oculus-mark-modified'],
            [11, 11, 'oculus-mark oculus-mark-deleted']
        ]);
    });

    // Red when a deletion past the last line is drawn nowhere, or at the top of the last line.
    it('draws a deletion at the end of the file at the foot of the last line', () => {
        expect(drawn(markDecorations([{ kind: 'deleted', line: 11, count: 0 }], 10))).toEqual([
            [10, 10, 'oculus-mark oculus-mark-deleted-foot']
        ]);
    });

    // Red when a press is mapped to a mark other than the one drawn on its line.
    it('finds the mark a pressed line carries, and none for a line no mark covers', () => {
        expect(markAt(MARKS, 4, 20)).toEqual(MARKS[0]);
        expect(markAt(MARKS, 8, 20)).toEqual(MARKS[1]);
        expect(markAt(MARKS, 11, 20)).toEqual(MARKS[2]);
        expect(markAt([{ kind: 'deleted', line: 11, count: 0 }], 10, 10)?.line).toBe(11);
        expect(markAt(MARKS, 6, 20)).toBe(null);
    });
});

describe('the steps from mark to mark', () => {
    // Red when the marks are taken in the order handed rather than the order drawn: from before the
    // first, the next is the mark handed first, at line 11.
    it('steps from a caret before the first mark to the first, and back round to the last', () => {
        const shuffled = [MARKS[2], MARKS[0], MARKS[1]];
        expect(stepMark(shuffled, 1, 20, true)).toBe(3);
        expect(stepMark(shuffled, 1, 20, false)).toBe(11);
    });

    // Red when Previous takes the first mark before the caret rather than the nearest, line 3.
    it('steps from a caret between two marks to the nearest after it and before it', () => {
        expect(stepMark(MARKS, 9, 20, true)).toBe(11);
        expect(stepMark(MARKS, 9, 20, false)).toBe(8);
    });

    // Red when the step stops at the ends rather than going round: Next answers the caret's line or
    // null.
    it('steps from a caret after the last mark round to the first', () => {
        expect(stepMark(MARKS, 15, 20, true)).toBe(3);
        expect(stepMark(MARKS, 15, 20, false)).toBe(11);
    });

    // Red when a mark on the caret's own line counts as the next, so Next stays on the wedge, or
    // when a deletion at the end is stepped to at the line past the text rather than where it is
    // drawn.
    it('steps off a deletion wedge the caret is on, and to a wedge at the foot of the text', () => {
        expect(stepMark(MARKS, 11, 20, true)).toBe(3);
        expect(stepMark(MARKS, 11, 20, false)).toBe(8);
        expect(stepMark([{ kind: 'deleted', line: 11, count: 0 }], 4, 10, true)).toBe(10);
    });

    // Red when a text with no mark moves the caret.
    it('answers no line when the text holds no mark', () => {
        expect(stepMark([], 4, 20, true)).toBe(null);
    });
});

describe('the actions over the marks', () => {
    // Red when Open Change opens a mark off the caret's line, or opens one where none is drawn.
    it("opens the mark on the caret's line, and does nothing on a line with none", () => {
        expect(markAction('open', MARKS, 4, 20)).toEqual({ mark: MARKS[0] });
        expect(markAction('open', MARKS, 6, 20)).toBe(null);
        expect(markAction('next', MARKS, 6, 20)).toEqual({ line: 8 });
        expect(markAction('previous', MARKS, 6, 20)).toEqual({ line: 3 });
        expect(markAction('next', [], 6, 20)).toBe(null);
    });

    // Red when Next and Previous change keys, Open Change is given one, or a hint is written apart
    // from its key.
    it('binds Next to Alt+F5 and Previous to Shift+Alt+F5, and Open Change to no key', () => {
        const words = { next: 'N', previous: 'P', open: 'O' };
        for (const mac of [true, false]) {
            const listed = changeActions(words, mac, true);
            expect(listed.map(({ label, hint, press }) => [label, hint, press])).toEqual([
                ['N', 'Alt+F5', { code: 'F5', alt: true }],
                ['P', 'Shift+Alt+F5', { code: 'F5', alt: true, shift: true }],
                ['O', '', null]
            ]);
        }
    });

    // Red when the actions are offered on a text with no mark, where they do nothing.
    it('offers none of the three on a text with no mark', () => {
        expect(changeActions({ next: 'N', previous: 'P', open: 'O' }, true, false)).toEqual([]);
    });
});

describe('the breakpoints', () => {
    // Red when a breakpoint is drawn anywhere but the glyph margin of its line.
    it('draws one glyph-margin decoration on each line handed in', () => {
        const drawnLines = breakpointDecorations([4, 9]).map((one) => [
            one.range.startLineNumber,
            one.range.endLineNumber,
            one.options.glyphMarginClassName
        ]);
        expect(drawnLines).toEqual([
            [4, 4, 'oculus-breakpoint'],
            [9, 9, 'oculus-breakpoint']
        ]);
    });
});

describe('the blame in the line-number column', () => {
    const now = Date.parse('2026-09-29T12:00:00Z');
    const line = (at: number, hash: string, author: string): GitBlameLine => ({
        line: at,
        hash,
        short: hash.slice(0, 7),
        author,
        when: '2026-09-27T12:00:00Z',
        subject: `Work of ${author}`,
        uncommitted: false
    });
    const blame = [
        line(1, 'a'.repeat(40), 'Ada'),
        line(2, 'a'.repeat(40), 'Ada'),
        line(3, 'b'.repeat(40), 'Bob'),
        line(4, 'b'.repeat(40), 'Bob')
    ];

    // Red when the blame's words are written on every line of a run, or on none.
    it('writes the author and how long ago on the first line of each run, the number alone after', () => {
        const numbers = blameNumbers(blameRows(blame, now));
        expect(numbers(1)).toMatch(/^Ada, 2 days ago +1$/);
        expect(numbers(2).trim()).toBe('2');
        expect(numbers(3)).toMatch(/^Bob, 2 days ago +3$/);
        expect(numbers(4).trim()).toBe('4');
        // Every number sits at one column because the editor draws the column with
        // `white-space: pre`, which keeps the padding counted here on screen.
        expect(numbers(1)).toHaveLength(numbers(2).length);
    });

    // Red when the text handed to Monaco's line-number column is not escaped: Monaco writes it
    // into the margin's HTML as it is, and an author's name comes from any repository's history.
    it("hands an author's markup to the column as entities, and counts the width as written", () => {
        const rows = blameRows(
            [
                line(1, 'c'.repeat(40), '<img src=x onerror=alert(1)>'),
                line(2, 'd'.repeat(40), 'A & B')
            ],
            now
        );
        const numbers = blameNumbers(rows);
        expect(numbers(1)).toContain('&lt;img src=x onerror=alert(1)&gt;');
        expect(numbers(1)).not.toContain('<img');
        expect(numbers(2)).toContain('A &amp; B');
        expect(numbers(2)).not.toMatch(/A & B/);
        const widest = Math.max(...rows.map((row) => row.words.length));
        expect(blameWidth(rows, 2)).toBe(widest + 2);
    });

    // Red when the column is narrower than what the line-number function writes.
    it('widens the column to hold the widest words and the number', () => {
        const rows = blameRows(blame, now);
        expect(blameWidth(rows, 4)).toBe(numbersWidth(rows));
        const escaped = blameRows([line(1, 'c'.repeat(40), 'A & B'), ...blame.slice(1)], now);
        expect(blameWidth(escaped, 4)).toBe(numbersWidth(escaped));
        expect(blameWidth([], 120)).toBe(5);
    });

    // Red when the hover is handed the subject as Markdown, where a star would turn into emphasis.
    it("puts the commit and its subject on the number's hover, each character as written", () => {
        const rows = blameRows([{ ...blame[0], subject: 'Fix *two* [links]' }], now);
        const [one] = blameDecorations(rows);
        const hover = one.options.lineNumberHoverMessage;
        const value = Array.isArray(hover) ? '' : (hover?.value ?? '');
        expect(value).toContain('Fix \\*two\\* \\[links\\]');
        expect(one.range.startLineNumber).toBe(1);
        expect(one.options.lineNumberClassName).toBe('oculus-blame');
    });

    /**
     * The characters the line-number column shows: what the line-number function writes, its
     * entities read back as the characters they stand for.
     */
    function numbersWidth(rows: ReturnType<typeof blameRows>): number {
        return blameNumbers(rows)(1).replaceAll(/&(lt|gt|quot|#39|amp);/g, '_').length;
    }
});

/** Monaco's MouseTargetType values for the kinds a line is read from. */
const KINDS = {
    GUTTER_GLYPH_MARGIN: 2,
    GUTTER_LINE_NUMBERS: 3,
    GUTTER_LINE_DECORATIONS: 4,
    CONTENT_TEXT: 6,
    CONTENT_EMPTY: 7
};
const VIEW_ZONE = 8;

type Target = { type: number; position: { lineNumber: number } | null };
type Fire = (event: { target: Target | null }) => void;

/**
 * An editor as the comment gutter uses it: three mouse events, a decorations collection, actions.
 */
function fakeSide(caret = 5) {
    const listeners: Record<'move' | 'leave' | 'down', Fire[]> = { move: [], leave: [], down: [] };
    let decorated: number[] = [];
    let classes: object[] = [];
    let disposed = 0;
    const actions: {
        id: string;
        label: string;
        contextMenuGroupId?: string;
        contextMenuOrder?: number;
        run: () => void;
        disposed: boolean;
    }[] = [];
    const subscribe = (kind: 'move' | 'leave' | 'down') => (listener: Fire) => {
        listeners[kind].push(listener);
        return {
            dispose: () => {
                disposed += 1;
                listeners[kind] = listeners[kind].filter((one) => one !== listener);
            }
        };
    };
    const editor = {
        onMouseMove: subscribe('move'),
        onMouseLeave: subscribe('leave'),
        onMouseDown: subscribe('down'),
        createDecorationsCollection: () => ({
            set: (decorations: { range: { startLineNumber: number }; options: object }[]) => {
                decorated = decorations.map((one) => one.range.startLineNumber);
                classes = decorations.map((one) => one.options);
                return [];
            },
            clear: () => {
                decorated = [];
                classes = [];
            }
        }),
        getPosition: () => ({ lineNumber: caret, column: 1 }),
        addAction: (action: {
            id: string;
            label: string;
            contextMenuGroupId?: string;
            contextMenuOrder?: number;
            run: () => void;
        }) => {
            const held = { ...action, disposed: false };
            actions.push(held);
            return {
                dispose: () => {
                    held.disposed = true;
                }
            };
        }
    };
    const at = (lineNumber: number, type: number): { target: Target } => ({
        target: { type, position: { lineNumber } }
    });
    return {
        editor: editor as never,
        decorated: () => decorated,
        classes: () => classes,
        move: (line: number, type = KINDS.CONTENT_TEXT) =>
            listeners.move.forEach((one) => one(at(line, type))),
        moveOff: (type: number | null = VIEW_ZONE) =>
            listeners.move.forEach((one) =>
                one({ target: type === null ? null : { type, position: null } })
            ),
        pressOff: (type: number) =>
            listeners.down.forEach((one) => one({ target: { type, position: null } })),
        leave: () => listeners.leave.forEach((one) => one({ target: { type: 0, position: null } })),
        press: (line: number, type = KINDS.GUTTER_LINE_DECORATIONS) =>
            listeners.down.forEach((one) => one(at(line, type))),
        subscriptions: () => listeners.move.length + listeners.leave.length + listeners.down.length,
        disposed: () => disposed,
        actions
    };
}

describe('the comment mark in the line-decorations lane of a diff', () => {
    function wired(offered: (side: DiffSide) => boolean = () => true) {
        const sides = { original: fakeSide(), modified: fakeSide() };
        const pressed: [DiffSide, number][] = [];
        const watch = commentGutter(
            [
                { side: 'original', editor: sides.original.editor },
                { side: 'modified', editor: sides.modified.editor }
            ],
            KINDS,
            offered,
            (side, line) => pressed.push([side, line])
        );
        return { sides, pressed, watch };
    }

    // Red when no mark is drawn on a hovered line, one is left on every line the pointer crossed,
    // the mark is drawn in the glyph margin, which the inline layout puts left of the line numbers
    // beside the original side's, or it is drawn on every row of a wrapped line.
    it('draws one mark on the hovered line, moves it with the pointer and clears it when the pointer leaves', () => {
        const { sides } = wired();
        sides.modified.move(12);
        expect(sides.modified.decorated()).toEqual([12]);
        expect(sides.modified.classes()).toMatchObject([
            { firstLineDecorationClassName: 'oculus-comment-add' }
        ]);
        expect(sides.modified.classes()[0]).not.toHaveProperty('glyphMarginClassName');
        expect(sides.modified.classes()[0]).not.toHaveProperty('linesDecorationsClassName');
        sides.modified.move(13);
        expect(sides.modified.decorated()).toEqual([13]);
        sides.modified.leave();
        expect(sides.modified.decorated()).toEqual([]);
    });

    it('draws it for a pointer over the gutter as over the text, and not over a bar in a view zone', () => {
        const { sides } = wired();
        for (const type of [
            KINDS.GUTTER_GLYPH_MARGIN,
            KINDS.GUTTER_LINE_NUMBERS,
            KINDS.CONTENT_EMPTY
        ]) {
            sides.modified.move(4, type);
            expect(sides.modified.decorated()).toEqual([4]);
        }
        sides.modified.moveOff();
        expect(sides.modified.decorated()).toEqual([]);
    });

    it('keeps the two sides apart: a mark on one side is not on the other', () => {
        const { sides } = wired();
        sides.original.move(7);
        sides.modified.move(9);
        expect(sides.original.decorated()).toEqual([7]);
        expect(sides.modified.decorated()).toEqual([9]);
        sides.original.leave();
        expect(sides.original.decorated()).toEqual([]);
        expect(sides.modified.decorated()).toEqual([9]);
    });

    // Red when a press anywhere in the editor, or twice, asks for a comment.
    it('asks for a comment once on a press on the line-decorations lane of a line, and for none elsewhere', () => {
        const { sides, pressed } = wired();
        sides.modified.press(12);
        expect(pressed).toEqual([['modified', 12]]);
        sides.modified.press(12, KINDS.CONTENT_TEXT);
        sides.modified.press(12, KINDS.GUTTER_GLYPH_MARGIN);
        sides.modified.press(12, KINDS.GUTTER_LINE_NUMBERS);
        sides.modified.press(12, VIEW_ZONE);
        expect(pressed).toEqual([['modified', 12]]);
        sides.original.press(3);
        expect(pressed).toEqual([
            ['modified', 12],
            ['original', 3]
        ]);
    });

    // Red when the inline layout draws a mark on, or takes a press from, the original side.
    it('offers a side only while the parent says so: the original side draws and takes nothing in the inline layout', () => {
        let layout: 'side' | 'inline' = 'inline';
        const { sides, pressed } = wired((side) => side === 'modified' || layout === 'side');
        sides.original.move(7);
        sides.original.press(7);
        expect(sides.original.decorated()).toEqual([]);
        expect(pressed).toEqual([]);
        sides.modified.move(7);
        expect(sides.modified.decorated()).toEqual([7]);
        layout = 'side';
        sides.original.move(7);
        expect(sides.original.decorated()).toEqual([7]);
    });

    it('clears its marks and lets go of every listener when it is disposed', () => {
        const { sides, pressed, watch } = wired();
        sides.modified.move(12);
        sides.original.move(2);
        watch.dispose();
        expect(sides.modified.decorated()).toEqual([]);
        expect(sides.original.decorated()).toEqual([]);
        expect(sides.modified.subscriptions() + sides.original.subscriptions()).toBe(0);
        sides.modified.press(12);
        expect(pressed).toEqual([]);
    });

    it('reads a line out of a mouse target only where one is on a line of text', () => {
        const { sides, pressed } = wired();
        sides.modified.move(5, KINDS.GUTTER_GLYPH_MARGIN);
        expect(sides.modified.decorated()).toEqual([5]);
        sides.modified.move(6, KINDS.CONTENT_TEXT);
        expect(sides.modified.decorated()).toEqual([6]);
        sides.modified.moveOff(KINDS.CONTENT_TEXT);
        expect(sides.modified.decorated()).toEqual([]);
        sides.modified.move(6);
        sides.modified.moveOff(null);
        expect(sides.modified.decorated()).toEqual([]);
        sides.modified.press(6, VIEW_ZONE);
        sides.modified.pressOff(KINDS.GUTTER_LINE_DECORATIONS);
        expect(pressed).toEqual([]);
    });
});

describe('the action that adds a comment on a line', () => {
    const chords = [{ id: 'editor.fold', label: 'Fold', hint: 'Cmd+K Cmd+0' }];

    // Red when the action is listed with no comment to add, or left out when there is one.
    it('is listed with the parent label while comments are offered, and not otherwise', () => {
        const listed = listedWithComment(chords, true, 'Add Comment on Line');
        expect(listed.slice(0, 1)).toEqual(chords);
        expect(listed.slice(1).map((one) => [one.label, one.hint])).toEqual([
            ['Add Comment on Line', '']
        ]);
        expect(listedWithComment(chords, false, 'Add Comment on Line')).toEqual(chords);
        expect(listedWithComment(chords, true, undefined)).toEqual(chords);
    });

    it('is registered on each side offered and asks for a comment on the line of that side caret', () => {
        const original = fakeSide(3);
        const modified = fakeSide(8);
        const asked: [DiffSide, number][] = [];
        const held = commentActionsOn(
            [
                { side: 'original', editor: original.editor },
                { side: 'modified', editor: modified.editor }
            ],
            'Add Comment on Line',
            (side, line) => asked.push([side, line])
        );
        expect(original.actions.map((one) => one.label)).toEqual(['Add Comment on Line']);
        expect(listedWithComment([], true, 'Add Comment on Line')[0].id).toBe(
            original.actions[0].id
        );
        original.actions[0].run();
        modified.actions[0].run();
        expect(asked).toEqual([
            ['original', 3],
            ['modified', 8]
        ]);
        held.dispose();
        expect([original.actions[0].disposed, modified.actions[0].disposed]).toEqual([true, true]);
    });

    // Red when the action is added with no menu group, which Monaco leaves out of the right-click
    // menu.
    it('is listed in the right-click menu of the line, in a group and at a place', () => {
        const side = fakeSide(3);
        commentActionsOn([{ side: 'modified', editor: side.editor }], 'Add Comment on Line', () => {
            /* no press */
        });
        expect(side.actions[0].contextMenuGroupId).toBeTypeOf('string');
        expect(side.actions[0].contextMenuGroupId).not.toBe('');
        expect(side.actions[0].contextMenuOrder).toBeTypeOf('number');
    });
});

describe('the sides the comments are offered on (case 23)', () => {
    const made = (original: object, modified: object) =>
        ({ getOriginalEditor: () => original, getModifiedEditor: () => modified }) as never;

    // Red when an inline layout still offers the original side, which is not drawn there, or a side
    // by side layout offers the modified side alone.
    it('are both editors side by side and the modified one inline', () => {
        const original = { name: 'original' };
        const modified = { name: 'modified' };
        const diff = made(original, modified);
        expect(commentSides(diff, 'side')).toEqual([
            { side: 'original', editor: original },
            { side: 'modified', editor: modified }
        ]);
        expect(commentSides(diff, 'inline')).toEqual([{ side: 'modified', editor: modified }]);
    });
});
