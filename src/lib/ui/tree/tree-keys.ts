// Layer 3, primitive. The rows of an explorer tree as ui/tree/TreeView.svelte hands them to zag's
// tree-view machine, apart from the component so the rules can be read and asserted without a DOM:
// the nested collection the machine walks, the rows it reads as expanded, the rows one change of
// its expanded value asks the caller to open or close, and the row it holds the focus on.
//
// The caller's rows are the one statement of what is drawn, in the order it is drawn, each naming
// the row it sits under. Whether a row is open stays the caller's: the machine is handed each row's
// `open` and asks for a change, which the tree turns into the caller's `ontoggle`.

/** One drawn row as the keyboard reads it. */
export type KeyRow = {
    id: string;
    /** The row this one sits under, or null for a row at the top of the tree. */
    parent: string | null;
    /** Whether the row is open; omitted for a row that does not open. */
    open?: boolean;
    /**
     * Drawn as it is for a reason the keyboard does not own, such as a filter holding a folder
     * open: Right and Left then step through it and never open or close it.
     */
    fixed?: boolean;
};

/** One node of the collection the machine walks: a row's id and the rows drawn under it. */
export type RowNode = {
    value: string;
    children: RowNode[];
    /** Set on a row that opens, so the machine reads it as a branch with nothing drawn under it. */
    childrenCount?: number;
};

/** A list that draws only the rows in view, as it is known to the tree the rows are in. */
export type RowList = {
    /**
     * Scroll the row `id` into view and focus it once it is drawn; false when the list does not
     * hold the row.
     */
    reveal: (id: string) => boolean;
    /** The label of a row the list holds, drawn or not, for the type-ahead. */
    label: (id: string) => string | undefined;
};

/**
 * What a row reads off the tree it is drawn in. `row` is the attributes and the focus handler the
 * row's focusable element spreads from the machine (its id, role, level, open state and place in
 * the focus order), and records the row's label for the type-ahead. `list` registers a list that
 * draws only the rows in view and returns what unregisters it; `focus` puts the focus on a drawn
 * row; `kept` is the rows a list keeps drawn wherever it is scrolled: the row holding the tree's
 * stop and the row the focus is in.
 */
export type TreeNav = {
    row: (id: string, label: string) => Record<string, unknown>;
    list: (list: RowList) => () => void;
    focus: (id: string) => void;
    kept: () => string[];
    /**
     * Whether the tree takes a key press for its caller's keymap, so a row does not also act on it.
     * Absent on a tree with no keymap.
     */
    bound?: (event: KeyboardEvent) => boolean;
};

/**
 * One chord of a caller's keymap: the physical key (`KeyboardEvent.code`), the modifiers that must
 * be held and no others, and the action the caller is asked to run. The physical key is matched
 * because Option changes the character a letter types on macOS.
 */
export type Chord = {
    code: string;
    meta: boolean;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    action: string;
};

/** A key press as the keymap reads it. */
export type Press = Omit<Chord, 'action'>;

/** The action of the first chord a press matches exactly, or null when none does. */
export function boundAction(keymap: readonly Chord[], press: Press): string | null {
    const found = keymap.find(
        (one) =>
            one.code === press.code &&
            one.meta === press.meta &&
            one.ctrl === press.ctrl &&
            one.alt === press.alt &&
            one.shift === press.shift
    );
    return found?.action ?? null;
}

/** A press as the keymap reads it, from the event. */
export function pressOf(event: KeyboardEvent): Press {
    return {
        code: event.code,
        meta: event.metaKey,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey
    };
}

/**
 * Where one key pressed on a row goes. Cmd+A (Ctrl+A off macOS) is `select-all`: the caller is
 * asked to select its rows and the page never selects its text from a tree. Any other character
 * with Meta or Ctrl held is withheld, so the page keeps the other shortcuts, while a named key with
 * them (Enter, an arrow) is still the machine's; `*` (open every sibling) is withheld, and so is
 * Space unless a
 * type-ahead is running, since neither is a key of this tree. A lowercase `a` is sent as a
 * type-ahead letter, since the machine's own map reads `a` as select-all and drops it otherwise.
 * Every other key is the machine's. A press matching a chord of the caller's `keymap` is
 * `bound`, whatever else the rules above would make of it.
 */
export function keyRoute(
    key: string,
    held: { meta: boolean; ctrl: boolean; alt?: boolean; shift?: boolean; code?: string },
    typingAhead: boolean,
    keymap: readonly Chord[] = []
): 'withhold' | 'type-ahead' | 'machine' | 'bound' | 'select-all' {
    const code = held.code ?? '';
    const press = {
        code,
        meta: held.meta,
        ctrl: held.ctrl,
        alt: held.alt ?? false,
        shift: held.shift ?? false
    };
    // A bound chord is the caller's; Space is bound only while no type-ahead is running, since a
    // space then belongs to the word being typed.
    if (boundAction(keymap, press) !== null && !(code === 'Space' && typingAhead)) return 'bound';
    if ((held.meta || held.ctrl) && !press.alt && !press.shift && code === 'KeyA') {
        return 'select-all';
    }
    if ((held.meta || held.ctrl) && key.length === 1) return 'withhold';
    if (key === '*') return 'withhold';
    if (key === ' ') return typingAhead ? 'machine' : 'withhold';
    if (key === 'a') return 'type-ahead';
    return 'machine';
}

/**
 * The collection's root, holding each row under its parent in the order the rows are drawn. A row
 * whose parent is not placed before it sits at the top, so the machine's order is the drawn one;
 * a row with an empty id, and a second row of one id, are not placed.
 */
export function treeNodes(rows: readonly KeyRow[]): RowNode {
    const root: RowNode = { value: '', children: [] };
    const seen = new Map<string, RowNode>();
    for (const row of rows) {
        if (row.id === '' || seen.has(row.id)) continue;
        const node: RowNode = { value: row.id, children: [] };
        const parent = row.parent === null ? undefined : seen.get(row.parent);
        (parent ?? root).children.push(node);
        seen.set(row.id, node);
        if (row.open !== undefined) node.childrenCount = 0;
    }
    for (const node of seen.values()) {
        if (node.childrenCount !== undefined) node.childrenCount = node.children.length;
    }
    return root;
}

/** Each placed row's index path in the collection, read once per collection. */
export function indexPaths(root: RowNode): Map<string, number[]> {
    const paths = new Map<string, number[]>();
    const walk = (node: RowNode, path: number[]): void => {
        node.children.forEach((child, at) => {
            const here = [...path, at];
            paths.set(child.value, here);
            walk(child, here);
        });
    };
    walk(root, []);
    return paths;
}

/**
 * The rows the machine reads as expanded: every open row, and every row something is drawn under,
 * since the machine walks into a row only while it is expanded.
 */
export function expandedOf(rows: readonly KeyRow[]): string[] {
    const parents = new Set(rows.map((row) => row.parent));
    const ids = rows
        .filter((row) => row.id !== '' && (row.open === true || parents.has(row.id)))
        .map((row) => row.id);
    return [...new Set(ids)];
}

/**
 * The rows one change of the machine's expanded value asks the caller to open or close: each row
 * that came or went, once, and only a drawn row that opens and is not held as it is.
 */
export function toggledBy(
    rows: readonly KeyRow[],
    before: readonly string[],
    after: readonly string[]
): string[] {
    const changed = [
        ...after.filter((id) => !before.includes(id)),
        ...before.filter((id) => !after.includes(id))
    ];
    return [...new Set(changed)].filter((id) => {
        const row = rows.find((one) => one.id === id);
        return row?.open !== undefined && row.fixed !== true;
    });
}

/**
 * The row the machine holds the focus on: the one asked for while it is drawn, and none otherwise,
 * which the machine reads as its first row.
 */
export function focusOf(rows: readonly KeyRow[], wanted: string): string | null {
    return wanted !== '' && rows.some((row) => row.id === wanted) ? wanted : null;
}

// What a key does on one row (ui/tree/TreeItem.svelte): Enter on the row itself presses the row's
// button, which opens what the row stands for, unless the tree binds the key to its caller's
// keymap.

/** The parts of a key press a row reads. */
export type RowKey = Pick<KeyboardEvent, 'key' | 'target' | 'preventDefault'>;

/** What a row knows of itself when a key reaches it. */
export type RowParts<Press extends RowKey> = {
    /** The row's focusable element. */
    box: unknown;
    /** Whether the row is a stop of a tree. */
    inTree: boolean;
    /** The tree's test for a key it takes for its caller's keymap; absent without a keymap. */
    bound: ((event: Press) => boolean) | undefined;
    /** The button over the row's name, absent for a row with nothing to do when pressed. */
    button: { click: () => void } | undefined;
};

/**
 * Press the row's button for Enter pressed on the row itself. A key pressed on a control inside the
 * row, on a row outside a tree and a key the tree binds to its caller's keymap are left alone.
 * True when the button was pressed.
 */
export function pressedByKey<Press extends RowKey>(event: Press, row: RowParts<Press>): boolean {
    if (event.target !== row.box || !row.inTree) return false;
    if (row.bound?.(event) === true) return false;
    if (event.key !== 'Enter' || row.button === undefined) return false;
    event.preventDefault();
    row.button.click();
    return true;
}
