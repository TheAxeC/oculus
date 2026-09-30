// Layer 3, view partial. The choices of the Settings view's Code theme menu and the words for the
// one in force. "From the theme" (`tokens`) comes first, then Shiki's bundled themes under their
// own display names in two groups, the dark ones and then the light ones, with a rule between.
// Menu.svelte draws its items in a portal that the unit render never draws while the menu is
// closed, so the items are built here as data and the view only hands them over.

import { CODE_TOKENS, codeThemeInfo } from '$lib/state/shared/words/appearance';
import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

/** The catalog lookup the builder words its one fixed item with. */
type Words = (key: string) => string;

/** The items of the menu, the one named by `active` marked. */
export function codeThemeMenu(active: string, t: Words): MenuItem[] {
    const themes = codeThemeInfo();
    const item = (id: string, label: string): MenuItem => ({ id, label, active: id === active });
    const of = (dark: boolean): MenuItem[] =>
        themes.filter((theme) => theme.dark === dark).map((theme) => item(theme.id, theme.label));
    return grouped([[item(CODE_TOKENS, t('ui.code_theme_tokens'))], of(true), of(false)]);
}

/** The words for the code theme in force: "From the theme" for `tokens`, else its display name. */
export function codeThemeLabel(active: string, t: Words): string {
    if (active === CODE_TOKENS) return t('ui.code_theme_tokens');
    return codeThemeInfo().find((theme) => theme.id === active)?.label ?? active;
}
