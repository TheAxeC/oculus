// Layer 3, primitive helper. The rule the choice fields share: a value the choices do not hold is
// still shown, so a manifest is never silently retyped by a field that could not name its value.
// The icon dropdown's items are built here too, so its trigger's type-ahead and its open list read
// one list in one order, and so are the groups a plain pick draws its grouped choices under. A
// glyph is listed by words made from its name, as VS Code's Change Icon lists each icon by its name
// in words, and its name is kept beside the words, since the name is what a manifest holds.

/**
 * One entry of the icon dropdown: the value a pick hands on, its words, and whether it has an icon.
 * An entry with an icon is a name of the glyph vocabulary, which is its value.
 */
export type GlyphItem = { value: string; label: string; icon: boolean };

/** Whether a value is set and is none of the choices, which a field then offers as its own. */
export function isStray(value: string, ids: string[]): boolean {
    return value !== '' && !ids.includes(value);
}

/**
 * A glyph name in words: its underscores read as spaces and its first letter a capital, so
 * `theme_rice` reads "Theme rice". The vocabulary's names are lower-case words joined by
 * underscores, and the catalogue holds no title of its own for a glyph.
 */
function glyphWords(name: string): string {
    const words = name
        .split('_')
        .filter((word) => word !== '')
        .join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The icon dropdown's entries in the order it lists them: the empty choice first, then a value the
 * choices lack, then every choice once. A choice is a name of the glyph vocabulary, so it has an
 * icon and its name in words; the empty choice and a stray value have no icon, and a stray value is
 * shown as it is held. An empty name among the choices is the empty choice already, and a name
 * given twice is listed once, since a list picks by value and keys its entries by it.
 */
export function glyphItems(value: string, empty: string, choices: string[]): GlyphItem[] {
    const names = [...new Set(choices)].filter((name) => name !== '');
    const head: GlyphItem[] = [{ value: '', label: empty, icon: false }];
    if (isStray(value, names)) head.push({ value, label: value, icon: false });
    return [
        ...head,
        ...names.map((name) => ({ value: name, label: glyphWords(name), icon: true }))
    ];
}

/** One choice of a plain pick: the value it hands on, its words, and the group it is drawn in. */
export type SelectChoice = { id: string; label: string; group?: string };

/**
 * A pick's choices split for drawing: the ones with no group in their order, then each group once,
 * in the order its first choice comes, with its choices in their order. The Settings view's choice
 * draws a plain pick's choices by it, and Cmd-K draws the rows of `:theme` by it
 * (shell/keys/palette-modes.ts), so the two lists draw their groups in one order.
 */
export function choiceGroups<T extends { group?: string }>(
    choices: T[]
): {
    loose: T[];
    groups: { name: string; choices: T[] }[];
} {
    const loose: T[] = [];
    const groups: { name: string; choices: T[] }[] = [];
    for (const choice of choices) {
        if (choice.group === undefined) {
            loose.push(choice);
            continue;
        }
        const found = groups.find((group) => group.name === choice.group);
        if (found === undefined) groups.push({ name: choice.group, choices: [choice] });
        else found.choices.push(choice);
    }
    return { loose, groups };
}
