// Layer 1, data. The kinds of terminal a reader starts by name, in the order every list of them
// shows: the desktop menu's New Terminal With Profile (desktop/windows/menu-template.ts), the
// Terminal tab's own menus (views/sessions/terminal/terminal-list.ts) and the composer's agent
// choice (views/sessions/terminal/start/Composer.svelte), with the words each of them names a kind
// by. They are the kinds a page may start (`StartKind` of model-machine.ts). The module imports
// nothing but that type, so the desktop host reads it as the page does; a view and the shell reach
// it through state/sessions/terminals.svelte.ts, as they reach the other terminal types.

import type { StartKind } from './model-machine.ts';

/** The kinds a terminal is started as by name, in the order listed. */
export const TERMINAL_PROFILES = [
    'shell',
    'claude',
    'codex'
] as const satisfies readonly StartKind[];

/** One kind of terminal a reader starts by name. */
export type TerminalProfile = (typeof TERMINAL_PROFILES)[number];

/** The words of one kind of terminal, as every list of the kinds names it. */
export function profileWords(kind: TerminalProfile, t: (key: string) => string): string {
    if (kind === 'claude') return t('sessions.kind_claude');
    if (kind === 'codex') return t('sessions.kind_codex');
    return t('sessions.kind_shell');
}
