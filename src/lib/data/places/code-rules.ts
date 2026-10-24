// Layer 1, data. The classes the VS Code code themes may name: the keys of the `themes` map of
// src/lib/themes/vscode-rules.json, the TextMate rules of each VS Code theme the editor colours
// code with (ui/controls/editor/kit/theme/theme.ts, `ownRules`). A row of `code_themes.vscode`
// whose class is no key here makes no code theme (data/helpers/editor/code-themes.ts). The file is
// read from the checkout the running code is in, which is the checkout whose editor the page is
// served, so the server's list and the page's agree; the page is handed the keys with its first
// load (state/shared/page/install.ts) and with every push of the `config` channel
// (server/root/watch/portfolio/portfolio.ts). A file that does not read gives no key.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { engineDir } from './engine-dir.ts';

/** Whether a value is a map of keys, which the file and its `themes` are. */
function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The keys of the `themes` map of the checkout's vscode-rules.json, in the file's order. */
export function vscodeRuleIds(engine: string = engineDir()): string[] {
    try {
        const file = join(engine, 'src', 'lib', 'themes', 'vscode-rules.json');
        const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
        const themes = isMap(parsed) ? parsed.themes : undefined;
        return isMap(themes) ? Object.keys(themes) : [];
    } catch {
        return [];
    }
}
