// Layer 3, primitive. The TextMate rules of the app colour theme in force, which the editor reads
// as it reads the rules of a VS Code theme (ui/controls/editor/kit/theme/theme.ts `ownRules`). The
// page converts an app's theme file once it is chosen (app-theme.ts) and sets the rules here; the
// editor takes them for a body class string that carries the app theme's class. Monaco keeps one
// theme for the page, so the rules are held once for the page.

import { APP_THEME_CLASS } from '$lib/state/shared/words/appearance';
import type { OutRule } from '$lib/themes/vscode-map';

let held: OutRule[] | null = null;

/** Hold the rules of the app theme in force, or none. */
export function setAppRules(rules: OutRule[] | null): void {
    held = rules;
}

/** The rules of the app theme when a class string carries its class, else undefined. */
export function appRulesFor(classes: string): OutRule[] | undefined {
    if (held === null || !classes.split(/\s+/).includes(APP_THEME_CLASS)) return undefined;
    return held;
}
