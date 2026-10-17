// Layer 3, primitive types. The props of ui/controls/ToolButton.svelte, kept apart from the
// component so its file holds the markup and the styles of the variants. Every flag but `label`
// and `onclick` is optional; the variants (`rail`, `bare`, `status`, `cell`, `plain`, `primary`,
// `wide`) are looks of one button, each drawn by its own rules in the component.

import type { Snippet } from 'svelte';

export type ToolButtonProps = {
    /** The button's words, translated by the view. */
    label: string;
    /** A name in `glyphs:`, drawn in front of the label. */
    glyph?: string;
    /**
     * The address of a picture drawn in the glyph's place, for a control whose icon is a file of
     * an app. A button with a glyph draws the glyph.
     */
    picture?: string;
    /** Turn the glyph round and round, for an action that is under way. */
    turning?: boolean;
    /** Draw it as the one in force. */
    active?: boolean;
    /**
     * Whether this button's controlled content is open. Omitted for buttons with no content.
     */
    expanded?: boolean;
    /** A toggle button's current state. Omitted for ordinary action buttons. */
    pressed?: boolean;
    /** The button is the one of its set that names the place the reader is at, such as a page. */
    current?: boolean;
    onclick: (event: MouseEvent) => void;
    /** A second press in quick succession, for a control whose two speeds mean two things. */
    ondblclick?: (event: MouseEvent) => void;
    /**
     * The tooltip, when it should say more than the label does. A button with none shows none.
     */
    title?: string;
    /** One of an exclusive group: the button becomes a radio and reports this as its state. */
    checked?: boolean;
    /**
     * Shown and not pressable, for a control whose action is unavailable right now. The reason
     * belongs in `title`: a button that cannot be pressed and does not say why is a dead end.
     */
    disabled?: boolean;
    /**
     * Not pressable while the action it started is under way, drawn as `disabled` is, but kept
     * focusable and in the tab order (`aria-disabled`): the keyboard that pressed it stays on it,
     * and a dialog the action opened gives the keyboard back to it when it closes.
     */
    waiting?: boolean;
    /**
     * Takes no press and says nothing is unavailable: drawn at full strength, with no fill under
     * the pointer, as VS Code draws a status bar item that runs no command.
     */
    inert?: boolean;
    /**
     * The glyph alone, with the words as the tooltip and the accessible name: for a control
     * that sits on every card of a board, where the words on each would cost a line. A button
     * with no glyph ignores this, since a button with nothing on it is not a control.
     */
    compact?: boolean;
    /**
     * A text button inside a 22 px row: 11px words on a 14px line, so the button is as high as
     * the row, VS Code's small button.
     */
    small?: boolean;
    /**
     * One item of the activity rail: the glyph alone, at the icon size, in a square box the
     * rail's width, with no border and no fill, muted until the pointer is over it; the one in
     * force draws its glyph in the text colour with the accent bar on its left edge.
     */
    rail?: boolean;
    /**
     * The glyph alone in a bare icon box, for a strip's own buttons and a pane's header
     * actions: no border, no fill and no terminal brackets until the pointer is over it, the
     * same box a bare menu opener draws. The words are the tooltip and the accessible name.
     */
    bare?: boolean;
    /**
     * One item of the status bar, drawn as VS Code draws one: the bar's height, the bar's own
     * text size and colour, no border and no fill until the pointer is over it, and its
     * tooltip over it rather than under, since the bar is the window's foot.
     */
    status?: boolean;
    /** A status bar item in the warning tone: its words and glyph in the amber of a warning. */
    warning?: boolean;
    /** A status bar item filled with the warning or the error tone behind its words. */
    fill?: 'warning' | 'error';
    /**
     * A cell of a grid it sits in, a gutter's line number or change mark: no border, fill,
     * padding or brackets of its own, the size, colour and alignment of the cell around it,
     * and the whole of that cell, so the caller's cell draws what state it is in. The cell is
     * a flex box, which is what stretches the button to its height. Its words are its
     * children, or nothing for a cell that is a mark alone, and `label` is its name.
     */
    cell?: boolean;
    /**
     * The words or marks alone, inline, for a control whose look the caller's box around it
     * draws, as a cell's is drawn by its grid: no border, fill, padding or brackets of its own,
     * and the font, colour, case, decoration and alignment of that box. A project's name drawn
     * as a link and a tag that opens its view are each one of these inside the box that gives
     * them their look.
     */
    plain?: boolean;
    /**
     * The action button of a form, drawn as VS Code draws its buttons: the width of the box it
     * is in (its tooltip wrapper is as wide as that box too), the glyph and then the words, in
     * the accent fill with the text colour that reads on it.
     */
    primary?: boolean;
    /**
     * As wide as the box it is in (its tooltip wrapper too), the glyph and the words in its
     * middle: the title bar's Command Center, which VS Code draws as a search field's box.
     */
    wide?: boolean;
    /**
     * A primary button followed by a dropdown part: its right corners are square and a
     * separator parts it from the dropdown, which the caller draws next to it.
     */
    joined?: boolean;
    /**
     * Words that may be longer than the room: the button is never wider than its parent, and a
     * label that does not fit is cut with an ellipsis, so the caller gives the whole words as
     * `title` for the tooltip. The parent is what sets the room, a flex box its width capped.
     */
    cut?: boolean;
    /** A rail view id, rendered on the button for browser navigation. */
    dataView?: string;
    /** A configured hub document's path, rendered on the button for browser navigation. */
    dataDoc?: string;
    /**
     * Marks the control the keyboard cursor presses on any card: the one Enter activates when the
     * card has no title button of its own.
     */
    dataCardToggle?: boolean;
    /** `data-*` attributes by their names after `data-`, for a caller that finds a button. */
    data?: Record<string, string | number>;
    /**
     * The button's place in the browser's focus order, for a strip that is one stop: 0 for the
     * control at the stop and -1 for the rest. A button with none is an ordinary stop.
     */
    tabindex?: number;
    /**
     * This control's name in the strip that carries the stop, rendered for that strip to read.
     */
    stop?: string;
    /** A key pressed on the button, for a strip that moves its own stop with the arrow keys. */
    onkeydown?: (event: KeyboardEvent) => void;
    /**
     * What the button draws in place of its label's words, for a control whose words carry a mark
     * of their own: a search hit with the match emboldened in its line. `label` is the button's
     * accessible name, since a screen reader is given words and not markup.
     */
    children?: Snippet;
};
