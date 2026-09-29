// Layer 3, primitive helper. The rule the choice fields share: a value the choices do not hold is
// still shown, so a manifest is never silently retyped by a field that could not name its value.
// The icon dropdown's items are built here too, so its trigger's type-ahead and its open list read
// one list in one order.

/** One entry of the icon dropdown: the value a pick hands on, its words, whether it has an icon. */
export type GlyphItem = { value: string; label: string; icon: boolean };

/** Whether a value is set and is none of the choices, which a field then offers as its own. */
export function isStray(value: string, ids: string[]): boolean {
    return value !== '' && !ids.includes(value);
}

/**
 * The icon dropdown's entries in the order it lists them: the empty choice first, then a value the
 * choices lack, then every choice once. A choice is a name of the glyph vocabulary, so it has an
 * icon; the empty choice and a stray value have none. An empty name among the choices is the empty
 * choice already, and a name given twice is listed once, since a list picks by value and keys its
 * entries by it.
 */
export function glyphItems(value: string, empty: string, choices: string[]): GlyphItem[] {
    const names = [...new Set(choices)].filter((name) => name !== '');
    const head: GlyphItem[] = [{ value: '', label: empty, icon: false }];
    if (isStray(value, names)) head.push({ value, label: value, icon: false });
    return [...head, ...names.map((name) => ({ value: name, label: name, icon: true }))];
}
