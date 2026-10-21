// Layer 1, data tests. The six VS Code themes oculus converts that Shiki also bundles, each pair
// compared by the colour it gives every TextMate scope the bundled grammars name: oculus's rules of
// the VS Code theme (themes/vscode-rules.json, read as the editor reads them, `ownRules`) against
// Shiki's theme (its scoped rules as the editor takes them, `codeRules`). A scope is matched alone,
// as a one-level scope stack, so a rule that names parent scopes does not take part. A pair that
// gives one colour for every scope is a duplicate, and `code_themes.shiki` of
// config/defaults/appearance.yml holds no row for its Shiki id, which then is no code theme; a pair
// that differs keeps both, and the test prints the first scopes that differ. Every other theme
// Shiki bundles has a row of `code_themes.shiki`, and every row names a theme Shiki bundles.

import { describe, expect, it } from 'vitest';
import { bundledLanguages } from 'shiki/langs';
import { bundledThemes, bundledThemesInfo } from 'shiki/themes';
import { Theme, type IRawThemeSetting } from 'shiki/textmate';
import { codeThemeIds } from '../../../src/lib/data/helpers/editor/code-themes.ts';
import { vscodeRuleIds } from '../../../src/lib/data/places/code-rules.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    codeRules,
    expandHex,
    ownRules
} from '../../../src/lib/ui/controls/editor/kit/theme/theme.ts';

/** Each VS Code theme's class and the id of the Shiki theme of the same name. */
const PAIRS: [string, string][] = [
    ['vscode-dark-plus', 'dark-plus'],
    ['vscode-light-plus', 'light-plus'],
    ['vscode-monokai', 'monokai'],
    ['vscode-red', 'red'],
    ['vscode-solarized-dark', 'solarized-dark'],
    ['vscode-solarized-light', 'solarized-light']
];

/** How many differing scopes the test prints for a pair. */
const SHOWN = 5;

/** Every scope name a grammar holds: its `scopeName` and each word of a `name` or `contentName`. */
function scopesOf(node: unknown, into: Set<string>): void {
    if (Array.isArray(node)) {
        for (const item of node) scopesOf(item, into);
        return;
    }
    if (typeof node !== 'object' || node === null) return;
    for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && ['name', 'contentName', 'scopeName'].includes(key)) {
            for (const word of value.split(/\s+/)) {
                if (word !== '' && !word.includes('$')) into.add(word);
            }
        } else {
            scopesOf(value, into);
        }
    }
}

/** Every scope the grammars Shiki bundles name, sorted. */
async function bundledScopes(): Promise<string[]> {
    const found = new Set<string>();
    for (const load of Object.values(bundledLanguages)) {
        scopesOf((await load()).default, found);
    }
    return [...found].sort();
}

/** A colour as one form of it: six hex digits, lower case, an opaque alpha dropped. */
function sameForm(colour: string): string {
    const hex = expandHex(colour) ?? colour.toLowerCase();
    return hex.length === 9 && hex.endsWith('ff') ? hex.slice(0, 7) : hex;
}

/** The foreground a theme gives one scope matched alone, or null when no rule colours it. */
function colourOf(theme: Theme, scope: string): string | null {
    const stack = { scopeName: scope, parent: null } as unknown as Parameters<Theme['match']>[0];
    const style = theme.match(stack);
    if (style === null || style.foregroundId === 0) return null;
    return sameForm(theme.getColorMap()[style.foregroundId]);
}

/** A theme of the rules the editor paints a code theme with. */
function themeOf(rules: IRawThemeSetting[]): Theme {
    return Theme.createFromRawTheme({ settings: rules });
}

/** The scopes a pair colours differently, each with the two colours, in scope order. */
async function differences(
    vscode: string,
    shiki: string,
    scopes: string[]
): Promise<{ scope: string; ours: string | null; theirs: string | null }[]> {
    const ours = themeOf(ownRules(vscode) ?? []);
    const loaded = (await bundledThemes[shiki as keyof typeof bundledThemes]()).default;
    const theirs = themeOf(codeRules(loaded));
    return scopes
        .map((scope) => ({ scope, ours: colourOf(ours, scope), theirs: colourOf(theirs, scope) }))
        .filter((one) => one.ours !== one.theirs);
}

describe('the VS Code themes Shiki also bundles', { tags: ['slow'] }, () => {
    it('keeps a Shiki theme only when it colours some scope differently from its VS Code theme', async () => {
        const scopes = await bundledScopes();
        const config = loadConfig(engineDir()).config;
        const ids = codeThemeIds(config, new Set(vscodeRuleIds()));
        const identical: string[] = [];
        for (const [vscode, shiki] of PAIRS) {
            const found = await differences(vscode, shiki, scopes);
            const first = found
                .slice(0, SHOWN)
                .map((one) => `${one.scope} ${one.ours ?? 'none'} / ${one.theirs ?? 'none'}`);
            console.log(
                `${vscode} and ${shiki} over ${scopes.length} scopes: ${found.length === 0 ? 'the same' : `${found.length} differ, first ${first.join('; ')}`}`
            );
            if (found.length === 0) identical.push(shiki);
            expect([vscode, ids.includes(vscode)]).toEqual([vscode, true]);
            expect([shiki, ids.includes(shiki)]).toEqual([shiki, found.length > 0]);
        }
        expect(shippedIds(config).filter((id) => identical.includes(id))).toEqual([]);
    }, 120_000);
});

/** The ids of the rows of `code_themes.shiki` a config holds, in their order. */
function shippedIds(config: Record<string, unknown>): string[] {
    const rows = (config.code_themes as { shiki: { id: unknown }[] }).shiki;
    return rows.map((row) => String(row.id));
}

describe('the rows of code_themes.shiki', () => {
    it('hold one row for each theme Shiki bundles but the duplicates of a VS Code theme', () => {
        const ids = shippedIds(loadConfig(engineDir()).config);
        const bundled = bundledThemesInfo.map((info) => info.id);
        const pairs = PAIRS.map(([, shiki]) => shiki);
        expect(ids.filter((id) => !bundled.includes(id))).toEqual([]);
        expect(bundled.filter((id) => !ids.includes(id) && !pairs.includes(id))).toEqual([]);
        expect(ids.filter((id, at) => ids.indexOf(id) !== at)).toEqual([]);
    });
});
