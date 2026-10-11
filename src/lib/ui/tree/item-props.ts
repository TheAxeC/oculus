// Layer 3, primitive. What one row of an explorer takes (ui/tree/TreeItem.svelte): the name and its
// look, the row's place in a tree, what a press does and the snippets the row draws in its line. It
// is its own module so the component holds the row's markup and rules and not the table of its
// properties.

import type { Snippet } from 'svelte';
import type { TreeNav } from './tree-keys.ts';

/**
 * What a row takes to be dragged and dropped on within its list: whether it can be picked up, the
 * browser's drag events, and the edge the drop line is drawn on while a drag is over it.
 */
export type ItemDrag = {
    draggable: boolean;
    ondragstart?: (event: DragEvent) => void;
    ondragover?: (event: DragEvent) => void;
    ondragleave?: (event: DragEvent) => void;
    ondrop?: (event: DragEvent) => void;
    ondragend?: (event: DragEvent) => void;
    /** The edge of the row a dragged item would land on, drawn as a line; none for no line. */
    place?: 'before' | 'after';
};

/** The props of one row. */
export type TreeItemProps = {
    /** The row's name, already translated; also the row's and the button's accessible name. */
    label: string;
    /** A name in `glyphs:`, drawn before the name. */
    glyph?: string;
    /** The address of a picture drawn in the glyph's place, as an app's icon for a row. */
    picture?: string;
    /** Declarations set on the glyph, as the colour a symbol's kind draws its icon in. */
    glyphStyle?: string;
    /** A file's name or path, drawn before the name as its Seti icon (display/FileIcon). */
    file?: string;
    /**
     * A folder's name, drawn before the name as the icon an app's icon theme gives the folder, open
     * while `expanded`; the row draws its glyph when no theme gives the folder an icon.
     */
    folder?: string;
    /** How many indent guides the row draws. */
    depth?: number;
    /**
     * Given, the row is a treeitem: at this level outside a tree, and at the level the tree
     * reads from its rows inside one.
     */
    level?: number;
    /** Whether the row is open: omitted for a row that does not open, which draws no arrow. */
    expanded?: boolean;
    /** Draw the row as the reader's cursor. */
    selected?: boolean;
    /** Draw the row as the one in force. */
    current?: boolean;
    /** Draw the row as the head of a section. */
    heading?: boolean;
    /** The row's accessible name, when it says more than the label drawn. */
    name?: string;
    /**
     * Draw the name muted, or in the warning or the error hue, for a row that says something;
     * `link` is a row that does something, its words centred in the link colour.
     */
    tone?: 'muted' | 'warn' | 'error' | 'link';
    /** A number drawn at the right edge, for a heading or a group that counts its rows. */
    count?: number;
    /** Draw the count as a pill. */
    badge?: boolean;
    /** The hover words of the count. */
    countTitle?: string;
    /** Draw the name at weight 600 with no check. */
    strong?: boolean;
    /** Draw the name struck through. */
    struck?: boolean;
    /** Custom properties and declarations set on the name. */
    nameStyle?: string;
    /** Draw `end` before the controls, both at the right edge. */
    trailing?: boolean;
    /** Let the controls give way before the name when the row is narrow. */
    yielding?: boolean;
    /** The tooltip, when it says more than the name does. */
    title?: string;
    /** The row's id in the tree it is drawn in. */
    id?: string;
    /** The tree the row is drawn in, which gives it its stop and its keys. */
    nav?: TreeNav;
    /** What pressing the row does; a row with none is drawn as text. */
    onclick?: (event: MouseEvent) => void;
    /**
     * The second press of a double click, taken when it goes down: what the row opens with a
     * first press may cover the row before that press is released, and the release and the
     * browser's dblclick then never reach the row.
     */
    onpressagain?: (event: MouseEvent) => void;
    /** What the row says after its name, muted: a path, a time. */
    detail?: Snippet;
    /** The name drawn by the caller, in the place of the label's text. */
    words?: Snippet;
    /** A field drawn after the name, for a row a reader types into. */
    field?: Snippet;
    /** The row's own controls, handed the tabindex they take. */
    actions?: Snippet<[number]>;
    /** Draw the controls at full strength whether or not the pointer is over the row. */
    showActions?: boolean;
    /** Drawn at the right edge after the controls: a status letter. */
    end?: Snippet;
    /** What lets the row be dragged within its list, and where a drop on it would land. */
    drag?: ItemDrag;
};
