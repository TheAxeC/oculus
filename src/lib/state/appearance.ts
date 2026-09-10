// Layer 2, client state. The UI theme list as config/appearance.yml describes it: the picker's
// order, the class string each theme puts on the body, and the words it is offered under. It is
// installed the way the tone vocabulary is - the server ships the `themes` key as the page's data at
// first load, and every later edit of config/appearance.yml arrives on the `config` channel - so a
// theme is added by editing YAML and nothing else.
//
// This holds no runes: every lookup is pure over what was last installed, so a component calling one
// during its first render gets the page's data and re-renders when a push replaces it. What the
// viewer picked out of this list is state/ui.svelte.ts's, which is the store that persists.

/** One theme of the picker: the name the store saves, the body class, and the words shown. */
export type Theme = { name: string; class: string; label: string };

let list: Theme[] = [];
let byName: Record<string, Theme> = {};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The string at `key` of a record, or nothing. */
function stringAt(node: unknown, key: string): string | undefined {
    if (!isRecord(node)) return undefined;
    const value = node[key];
    return typeof value === 'string' ? value : undefined;
}

/**
 * Install the theme list from the merged config's `themes` key. A row with no `name` is dropped; a
 * row with no `class` is the empty class, which is what the light theme carries. A key the config
 * does not hold installs as an empty list, so the lookups answer with their own fallbacks rather
 * than throwing and a half-read config still renders a page.
 */
export function setAppearance(config: Record<string, unknown>): void {
    list = [];
    byName = {};
    const rows = config.themes;
    if (!Array.isArray(rows)) return;
    for (const row of rows) {
        const name = stringAt(row, 'name');
        if (name === undefined || name.length === 0) continue;
        const theme: Theme = {
            name,
            class: stringAt(row, 'class') ?? '',
            label: stringAt(row, 'label') ?? name
        };
        list.push(theme);
        byName[name] = theme;
    }
}

/** Every theme the picker offers, in the config's order. A copy, so a caller cannot edit the list. */
export function themes(): Theme[] {
    return [...list];
}

/** The body class string a theme lands on the document as. The light theme's is empty. */
export function themeClass(name: string): string {
    return byName[name]?.class ?? '';
}

/** A theme's words in the picker, and the theme's own name for one the config does not list. */
export function themeLabel(name: string): string {
    return byName[name]?.label ?? name;
}
