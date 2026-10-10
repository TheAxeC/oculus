// Layer 3, view partial. The choices of the Settings view's Code theme menu and the words for the
// one in force. "From the theme" (`tokens`) comes first, then the 19 VS Code themes under the words
// the UI theme list gives them, then Shiki's bundled themes under their own display names; each of
// the two lists is in two groups, the dark ones and then the light ones, with a rule between every
// group. Menu.svelte draws its items in a portal that the unit render never draws while the menu is
// closed, so the items are built here as data and the view only hands them over.

import { CODE_TOKENS, codeThemeInfo, type CodeThemeInfo } from '$lib/state/shared/words/appearance';
import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

/** The catalog lookup the builder words its one fixed item with. */
type Words = (key: string) => string;

/** The words of a VS Code theme: its entry in the UI theme list, by class, else the class. */
type Label = (id: string) => string;

/** The words of one code theme: a VS Code theme's from the UI theme list, else its own. */
function wording(theme: CodeThemeInfo, label: Label): string {
    return theme.vscode ? label(theme.id) : theme.label;
}

/** The items of the menu, the one named by `active` marked. */
export function codeThemeMenu(active: string, t: Words, label: Label): MenuItem[] {
    const themes = codeThemeInfo();
    const item = (id: string, words: string): MenuItem => ({
        id,
        label: words,
        active: id === active
    });
    const of = (vscode: boolean, dark: boolean): MenuItem[] =>
        themes
            .filter((theme) => theme.vscode === vscode && theme.dark === dark)
            .map((theme) => item(theme.id, wording(theme, label)));
    return grouped([
        [item(CODE_TOKENS, t('ui.code_theme_tokens'))],
        of(true, true),
        of(true, false),
        of(false, true),
        of(false, false)
    ]);
}

/** The words for the code theme in force: "From the theme" for `tokens`, else its name. */
export function codeThemeLabel(active: string, t: Words, label: Label): string {
    if (active === CODE_TOKENS) return t('ui.code_theme_tokens');
    const found = codeThemeInfo().find((theme) => theme.id === active);
    return found === undefined ? active : wording(found, label);
}
