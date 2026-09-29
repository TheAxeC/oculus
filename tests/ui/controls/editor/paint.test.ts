// The editor's paint through the installed shiki and @shikijs/monaco: the theme the bridge defines
// in Monaco, the scopes its tokens provider answers, and what a second paint leaves behind.
//
// Monaco is a stand-in that records what the bridge calls, `defineTheme` and `setTokensProvider`,
// and the grammar loaded is markdown alone, which is where bold and italic are.
// What this does NOT cover: that Monaco draws a defined theme, which the look does.

import { shikiToMonaco } from '@shikijs/monaco';
import { createHighlighter } from 'shiki';
import { describe, expect, it } from 'vitest';
import { THEME, painter } from '../../../../src/lib/ui/controls/editor/kit/load.ts';

type Rule = { token: string; foreground?: string; fontStyle?: string };
type Theme = { rules: Rule[]; colors: Record<string, string> };
type Provider = {
    getInitialState: () => unknown;
    tokenize: (
        line: string,
        state: unknown
    ) => { tokens: { startIndex: number; scopes: string }[] };
};

/** A reading of the tokens that answers each token its own colour, counted up from `from`. */
function distinct(from: number): (token: string) => string {
    const seen = new Map<string, string>();
    return (token: string) => {
        const held = seen.get(token);
        if (held !== undefined) return held;
        const value = `#${(from + seen.size).toString(16).padStart(6, '0')}`;
        seen.set(token, value);
        return value;
    };
}

/** A stand-in Monaco recording the themes defined and the tokens providers set. */
function standIn() {
    const defined = new Map<string, Theme>();
    const providers = new Map<string, Provider>();
    const monaco = {
        editor: {
            defineTheme: (name: string, theme: Theme) => void defined.set(name, theme),
            setTheme: () => undefined,
            create: () => undefined
        },
        languages: {
            getLanguages: () => [{ id: 'markdown' }],
            setTokensProvider: (id: string, provider: Provider) => void providers.set(id, provider)
        }
    };
    return { monaco, defined, providers };
}

/** A painter over the stand-in, counting the highlighters it makes and the ones it disposes. */
function counted() {
    const stand = standIn();
    const made: { disposed: boolean }[] = [];
    const paint = painter({
        monaco: stand.monaco as never,
        createHighlighter: async (options) => {
            const highlighter = await createHighlighter(options);
            const entry = { disposed: false };
            made.push(entry);
            const dispose = highlighter.dispose.bind(highlighter);
            highlighter.dispose = () => {
                entry.disposed = true;
                dispose();
            };
            return highlighter;
        },
        shikiToMonaco: shikiToMonaco as never,
        langs: ['markdown']
    });
    return { ...stand, made, paint };
}

/** The scope the markdown provider answers for the token that starts at `text` in `line`. */
function scopeAt(provider: Provider | undefined, line: string, text: string): string | undefined {
    if (provider === undefined) return undefined;
    const at = line.indexOf(text);
    const { tokens } = provider.tokenize(line, provider.getInitialState());
    return tokens.findLast((token) => token.startIndex <= at)?.scopes;
}

const LINE = 'Some **bold** and *it* text';

describe('the paint through the bridge', () => {
    // Red when the bold or italic rule has no foreground: the bridge maps a colour and a style to a
    // scope only for a rule with a foreground, so the provider answers no markup scope.
    it('answers markup.bold and markup.italic for markdown, drawn bold and italic', async () => {
        const { defined, providers, paint } = counted();
        expect(await paint(distinct(1))).toBe(THEME);
        const provider = providers.get('markdown');
        expect(scopeAt(provider, LINE, 'bold')).toBe('markup.bold');
        expect(scopeAt(provider, LINE, 'it*')).toBe('markup.italic');
        const rules = defined.get(THEME)?.rules ?? [];
        const style = (token: string) => rules.find((rule) => rule.token === token)?.fontStyle;
        expect(style('markup.bold')).toBe('bold');
        expect(style('markup.italic')).toBe('italic');
    });

    // Red when one highlighter is kept across paints: the first is never disposed and a second is
    // never made, and Shiki's cache keeps the first colours under the reused name.
    it('replaces the theme on a second paint, defining only oculus in the second colours', async () => {
        const { defined, providers, made, paint } = counted();
        const first = distinct(1);
        const second = distinct(0x100);
        await paint(first);
        await paint(second);
        expect([...defined.keys()]).toEqual([THEME]);
        const colors = defined.get(THEME)?.colors ?? {};
        expect(colors['editor.foreground']).toBe(second('--ink-txt'));
        expect(colors['editor.foreground']).not.toBe(first('--ink-txt'));
        const rules = defined.get(THEME)?.rules ?? [];
        const bold = rules.find((rule) => rule.token === 'markup.bold');
        expect(bold?.foreground?.replace(/^#?/, '#')).toBe(second('--ink-txt'));
        expect(scopeAt(providers.get('markdown'), LINE, 'bold')).toBe('markup.bold');
        expect(made.map((entry) => entry.disposed)).toEqual([true, false]);
    });

    // Red when the signature check goes: an unchanged reading would make a highlighter again.
    it('makes no highlighter for a paint whose tokens have not moved', async () => {
        const { made, paint } = counted();
        await paint(distinct(1));
        await paint(distinct(1));
        expect(made).toHaveLength(1);
    });
});
