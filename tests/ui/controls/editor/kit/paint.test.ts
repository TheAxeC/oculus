// The editor's paint through the installed shiki and @shikijs/monaco: the theme the bridge defines
// in Monaco, the scopes its tokens provider answers, and what a second paint leaves behind.
//
// Monaco is a stand-in that records what the bridge calls, `defineTheme` and `setTokensProvider`,
// and the grammar every highlighter starts with is markdown alone, which is where bold and italic
// are. A code theme is painted through the real Shiki theme files, loaded by a counting loader. The
// grammars loaded on first use (`ensureLanguage`) are the real ones, through a highlighter whose
// `loadLanguage` is recorded, gated or made to fail by the case.
// What this does NOT cover: that Monaco draws a defined theme or a model takes the tokens of a
// provider set after it was made, and the editor components calling `ensureLanguage` when they make
// or change a model, which the look does.

import { shikiToMonaco } from '@shikijs/monaco';
import { createHighlighter } from 'shiki';
import type { BundledLanguage, ThemeRegistration } from 'shiki';
import { bundledThemes, bundledThemesInfo } from 'shiki/themes';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME, painter } from '../../../../../src/lib/ui/controls/editor/kit/load.ts';
import { editorTheme } from '../../../../../src/lib/ui/controls/editor/kit/theme.ts';
import { RITE_GRAMMAR } from '../../../../../src/lib/ui/controls/editor/kit/rite/rite.ts';
import { runCommand } from '../../../../../src/lib/ui/controls/editor/commands.ts';
import { shownLanguage } from '../../../../../src/lib/state/workbench/navigation/editor-text.ts';

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

/** The languages the stand-in Monaco lists, as `start()` leaves it once every id is registered. */
const MONACO_IDS = ['markdown', 'lua', 'cmake', 'java', 'rite', 'javascript', 'typescript', 'css'];

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
            getLanguages: () => MONACO_IDS.map((id) => ({ id })),
            setTokensProvider: (id: string, provider: Provider) => void providers.set(id, provider)
        }
    };
    return { monaco, defined, providers };
}

/** The theme file Shiki ships for an id, as the real loader answers it. */
async function shipped(id: string): Promise<ThemeRegistration> {
    return (await bundledThemes[id as keyof typeof bundledThemes]()).default;
}

const IDS = bundledThemesInfo.map((info) => info.id);

/** What a case does to the grammar loads of the highlighters its painter makes. */
type Loads = {
    /** Awaited before a load runs; a rejection fails the load. */
    before?: (id: string) => Promise<void> | void;
    /** What a grammar is loaded from: its id, unless the case gives a grammar of its own. */
    source?: (id: string) => BundledLanguage | typeof RITE_GRAMMAR;
};

/** One call of a highlighter's `loadLanguage`, and whether the highlighter was disposed by then. */
type Load = { id: string; disposed: boolean };

/**
 * A painter over the stand-in, counting the highlighters it makes and the ones it disposes, with
 * the grammars each was made holding and every `loadLanguage` it was asked.
 */
function counted(
    loadTheme: (id: string) => Promise<ThemeRegistration> = shipped,
    loads: Loads = {}
) {
    const stand = standIn();
    const made: {
        disposed: boolean;
        registered: ThemeRegistration;
        langs: unknown[];
        highlighter: Awaited<ReturnType<typeof createHighlighter>>;
    }[] = [];
    const asked: Load[] = [];
    const bridged: unknown[] = [];
    const parts = painter({
        monaco: stand.monaco as never,
        loadTheme,
        codeIds: IDS,
        createHighlighter: async (options) => {
            const registered = structuredClone(options.themes[0]);
            const highlighter = await createHighlighter(options);
            const entry = { disposed: false, registered, langs: [...options.langs], highlighter };
            made.push(entry);
            const dispose = highlighter.dispose.bind(highlighter);
            highlighter.dispose = () => {
                entry.disposed = true;
                dispose();
            };
            const load = highlighter.loadLanguage.bind(highlighter);
            highlighter.loadLanguage = async (...langs: Parameters<typeof load>) => {
                const first = langs[0] as string | { name: string };
                const id = typeof first === 'string' ? first : first.name;
                asked.push({ id, disposed: entry.disposed });
                await loads.before?.(id);
                return load(...langs);
            };
            return highlighter;
        },
        shikiToMonaco: (highlighter: unknown, monaco: never) => {
            bridged.push(highlighter);
            shikiToMonaco(highlighter as never, monaco);
        },
        langs: ['markdown'],
        source: loads.source ?? ((id: string) => id as BundledLanguage)
    });
    return { ...stand, made, asked, bridged, ...parts };
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

/** A colour without its hash and case, the form the bridge keeps. */
function bare(colour: string | undefined): string | undefined {
    return colour?.replace(/^#/, '').toLowerCase();
}

/** The rule the defined theme holds for a scope. */
function ruleFor(defined: Map<string, Theme>, scope: string): Rule | undefined {
    return defined.get(THEME)?.rules.find((rule) => rule.token === scope);
}

/** A scoped entry of a shipped theme with a foreground, and its first scope. */
async function foregroundOf(id: string): Promise<{ scope: string; foreground: string }> {
    const entry = (await shipped(id)).tokenColors?.find(
        (one) => one.scope !== undefined && one.settings.foreground !== undefined
    );
    const scope = Array.isArray(entry?.scope) ? entry.scope[0] : entry?.scope;
    return { scope: scope ?? '', foreground: entry?.settings.foreground ?? '' };
}

describe('the paint with a code theme', () => {
    // Revert: set `const id = ''` in paintNow (always paint the tokens); the rules then hold the
    // token hues and the foreground of dark-plus's first scope is not found.
    it('paints dark-plus rules over the tokens colours, defining only oculus', async () => {
        const { defined, paint } = counted();
        const read = distinct(1);
        expect(await paint(read, 'dark-plus')).toBe(THEME);
        expect([...defined.keys()]).toEqual([THEME]);
        expect(defined.get(THEME)?.colors).toEqual(editorTheme(read).colors);
        expect(defined.get(THEME)?.colors['editor.background']).toBe(read('--panel'));
        const { scope, foreground } = await foregroundOf('dark-plus');
        expect(bare(ruleFor(defined, scope)?.foreground)).toBe(bare(foreground));
    });

    // Revert: return `theme.tokenColors ?? []` from codeRules; the registration then holds the
    // theme's scope-less entry and its backgrounds.
    it('drops a scope-less entry and a scoped entry background, keeping the foreground', async () => {
        const nord = counted();
        const read = distinct(1);
        await nord.paint(read, 'nord');
        const registered = nord.made[0].registered;
        const first = await foregroundOf('nord');
        expect(bare(ruleFor(nord.defined, first.scope)?.foreground)).toBe(bare(first.foreground));
        expect((registered.tokenColors ?? []).every((entry) => entry.scope !== undefined)).toBe(
            true
        );
        expect(
            (await shipped('nord')).tokenColors?.some((entry) => entry.scope === undefined)
        ).toBe(true);
        expect(nord.made[0].registered.bg).toBe(read('--panel'));

        const light = counted();
        await light.paint(read, 'github-light');
        const rule = ruleFor(light.defined, 'carriage-return');
        expect(bare(rule?.foreground)).toBe('fafbfc');
        expect(rule).toHaveProperty('background', undefined);
        const settings = (light.made[0].registered.tokenColors ?? []).map(
            (entry) => entry.settings
        );
        expect(settings.some((one) => one.background !== undefined)).toBe(false);
    });

    // Revert: leave `id` out of the signature in paintNow; the switch to nord then makes no
    // highlighter.
    it('makes a new highlighter for a switch to a code theme, and none for the same theme again', async () => {
        const { made, paint } = counted();
        await paint(distinct(1));
        await paint(distinct(1), 'nord');
        expect(made).toHaveLength(2);
        await paint(distinct(1), 'nord');
        expect(made).toHaveLength(2);
    });

    // Revert: leave `id` out of the signature in paintNow; the switch back to tokens then makes no
    // highlighter.
    it('follows a switch back to tokens with the tokens rules again', async () => {
        const { made, paint } = counted();
        const read = distinct(1);
        await paint(read, 'nord');
        await paint(read, 'tokens');
        expect(made[1].registered.tokenColors).toEqual(editorTheme(read).textmate.tokenColors);
        expect(made.map((entry) => entry.disposed)).toEqual([true, false]);
    });

    // Revert: return the stored rules without a copy in rulesOf; Shiki's in-place normalisation of
    // the first paint then leaks its base-colour rule into the second.
    it('follows a switch of the UI theme with the code theme kept', async () => {
        const { defined, made, paint } = counted();
        await paint(distinct(1), 'nord');
        const second = distinct(0x100);
        await paint(second, 'nord');
        expect(made).toHaveLength(2);
        expect(defined.get(THEME)?.colors).toEqual(editorTheme(second).colors);
        expect(made[1].registered.tokenColors).toEqual(made[0].registered.tokenColors);
    });

    // Revert: call `rules.set(id, [])` before the load in rulesOf; the failed load is then kept,
    // the next paint of the id resolves and the loader is not asked again.
    it('answers a load that fails as a rejection, keeps the theme in force and asks again later', async () => {
        let calls = 0;
        const { defined, made, paint } = counted(() => {
            calls += 1;
            return Promise.reject(new Error('import failed'));
        });
        const read = distinct(1);
        await paint(read);
        const before = defined.get(THEME);
        await expect(paint(read, 'nord')).rejects.toThrow('import failed');
        expect(defined.get(THEME)).toBe(before);
        expect(await paint(read, 'tokens')).toBe(THEME);
        await expect(paint(read, 'nord')).rejects.toThrow('import failed');
        expect(calls).toBe(2);
        expect(made).toHaveLength(1);
    });

    // Revert: replace `kept === undefined` with `true` in rulesOf; the loader is called again for
    // nord after tokens.
    it('loads a code theme once however often it is painted', async () => {
        const asked: string[] = [];
        const { paint } = counted((id) => {
            asked.push(id);
            return shipped(id);
        });
        const read = distinct(1);
        await paint(read, 'nord');
        await paint(read, 'tokens');
        await paint(read, 'nord');
        expect(asked).toEqual(['nord']);
    });

    // Revert: replace the queue with `queue = paintNow(read, code)`; nord's late load then ends as
    // the theme in force.
    it('leaves the last asked paint in force when an earlier load is in flight', async () => {
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const asked: string[] = [];
        const { defined, paint } = counted(async (id) => {
            asked.push(id);
            if (id === 'nord') await gate;
            return shipped(id);
        });
        const read = distinct(1);
        const first = paint(read, 'nord');
        const second = paint(read, 'dark-plus');
        // Without the queue the loader is asked for dark-plus at once, and its paint settles while
        // nord's load is gated; with the queue dark-plus has not started, and nord is released.
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (asked.includes('dark-plus')) await second;
        release();
        await Promise.all([first, second]);
        const { scope, foreground } = await foregroundOf('dark-plus');
        expect(bare(ruleFor(defined, scope)?.foreground)).toBe(bare(foreground));
    });

    // Revert: set `const id = code` in paintNow; the loader is then asked for an unlisted id and
    // the paint fails.
    it('paints tokens for an id the list does not hold', async () => {
        const asked: string[] = [];
        const { made, paint } = counted((id) => {
            asked.push(id);
            return shipped(id);
        });
        const read = distinct(1);
        for (const id of ['not-a-theme', '', 'Dark-Plus', 'constructor']) {
            expect(await paint(read, id)).toBe(THEME);
        }
        expect(asked).toEqual([]);
        expect(made).toHaveLength(1);
        expect(made[0].registered.tokenColors).toEqual(editorTheme(read).textmate.tokenColors);
    });
});

afterEach(() => vi.restoreAllMocks());

/** The ids of every `loadLanguage` a painter's highlighters were asked. */
function loaded(asked: Load[]): string[] {
    return asked.map((load) => load.id);
}

describe('the grammars loaded on first use', () => {
    // Red when ensureLanguage loads nothing, loads again for a second ask, or loads a grammar the
    // first highlighter holds already.
    it('loads the Lua grammar once, for the first model of the language and for no later one', async () => {
        const { asked, providers, paint, ensureLanguage } = counted();
        await paint(distinct(1));
        expect(providers.has('lua')).toBe(false);
        await ensureLanguage('lua');
        expect(loaded(asked)).toEqual(['lua']);
        const provider = providers.get('lua');
        expect(scopeAt(provider, 'local x = 1', 'local')).toBeTruthy();
        await ensureLanguage('lua');
        await ensureLanguage('lua');
        expect(loaded(asked)).toEqual(['lua']);
        await ensureLanguage('markdown');
        await ensureLanguage('plaintext');
        await ensureLanguage('cobol');
        expect(loaded(asked)).toEqual(['lua']);
    });

    // Red when a second model made while the first load is in flight starts a load of its own.
    it('makes no second load for a model made while the first load is in flight', async () => {
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const { asked, providers, paint, ensureLanguage } = counted(shipped, {
            before: () => gate
        });
        await paint(distinct(1));
        const first = ensureLanguage('lua');
        const second = ensureLanguage('lua');
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(loaded(asked)).toEqual(['lua']);
        expect(providers.has('lua')).toBe(false);
        release();
        await Promise.all([first, second]);
        expect(loaded(asked)).toEqual(['lua']);
        expect(providers.has('lua')).toBe(true);
    });

    // Red when a paint builds its highlighter from the first grammars alone: the theme change then
    // draws Lua uncoloured again.
    it('keeps the Lua colours through a theme change, the new highlighter holding the grammar', async () => {
        const { made, providers, asked, paint, ensureLanguage } = counted();
        await paint(distinct(1));
        await ensureLanguage('lua');
        const before = providers.get('lua');
        await paint(distinct(0x100));
        expect(made).toHaveLength(2);
        expect(made[1].langs).toEqual(['markdown', 'lua']);
        expect(providers.get('lua')).not.toBe(before);
        expect(scopeAt(providers.get('lua'), 'local x = 1', 'local')).toBeTruthy();
        expect(loaded(asked)).toEqual(['lua']);
    });

    // Red when a load and a paint interleave: the grammar is loaded into a highlighter the paint
    // then replaces, or into one it has disposed.
    it.each([
        ['the paint asked first', true],
        ['the load asked first', false]
    ])(
        'ends with the highlighter in force holding the grammar when a paint and a load start together, %s',
        async (_label, paintFirst) => {
            const { made, asked, providers, paint, ensureLanguage } = counted();
            await paint(distinct(1));
            const read = distinct(0x100);
            const settled = paintFirst
                ? [paint(read), ensureLanguage('lua')]
                : [ensureLanguage('lua'), paint(read)];
            await Promise.all(settled);
            const inForce = made.filter((entry) => !entry.disposed);
            expect(inForce).toHaveLength(1);
            expect(inForce[0].highlighter.getLoadedLanguages()).toContain('lua');
            expect(loaded(asked)).toEqual(['lua']);
            expect(asked.every((load) => !load.disposed)).toBe(true);
            expect(scopeAt(providers.get('lua'), 'local x = 1', 'local')).toBeTruthy();
            await paint(distinct(0x200));
            expect(made.at(-1)?.langs).toContain('lua');
        }
    );

    // Red when a load asked before the first paint runs on no highlighter, or never runs.
    it('waits for the first paint when a model is made before the theme is set', async () => {
        const { asked, providers, paint, ensureLanguage } = counted();
        const early = ensureLanguage('lua');
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(loaded(asked)).toEqual([]);
        await paint(distinct(1));
        await early;
        expect(loaded(asked)).toEqual(['lua']);
        expect(providers.has('lua')).toBe(true);
    });

    // Red when a failed load is kept: the next theme change builds a highlighter with a grammar
    // that fails, or the next language is not loaded.
    it('leaves a file as it was when its grammar fails to load, logs one line, and loads the next language', async () => {
        const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { made, asked, providers, paint, ensureLanguage } = counted(shipped, {
            before: (id) => {
                if (id === 'cmake' || id === 'lua') throw new Error(`no grammar ${id}`);
            }
        });
        await paint(distinct(1));
        await expect(ensureLanguage('cmake')).resolves.toBeUndefined();
        await expect(ensureLanguage('lua')).resolves.toBeUndefined();
        expect(log).toHaveBeenCalledTimes(2);
        expect(providers.has('cmake')).toBe(false);
        expect(providers.has('lua')).toBe(false);

        await ensureLanguage('java');
        expect(providers.has('java')).toBe(true);
        expect(loaded(asked)).toEqual(['cmake', 'lua', 'java']);

        await paint(distinct(0x100));
        expect(made.at(-1)?.langs).toEqual(['markdown', 'java']);
        expect(log).toHaveBeenCalledTimes(2);
    });

    // Red when the grammar of the module is passed as its id: Shiki bundles no grammar named rite.
    it('loads a grammar from the source the painter was given, not by its id', async () => {
        const { asked, providers, made, paint, ensureLanguage } = counted(shipped, {
            source: (id) => (id === 'rite' ? RITE_GRAMMAR : (id as BundledLanguage))
        });
        await paint(distinct(1));
        await ensureLanguage('rite');
        expect(loaded(asked)).toEqual(['rite']);
        expect(made[0].highlighter.getLoadedLanguages()).toContain('rite');
        expect(providers.has('rite')).toBe(true);
        await paint(distinct(0x100));
        expect(made[1].highlighter.getLoadedLanguages()).toContain('rite');
    });

    // Red when the picker's language is set without the load: the model would stay uncoloured.
    it('loads the grammar the picker chooses, once, and sets the model under its id', async () => {
        const { asked, paint, ensureLanguage } = counted();
        await paint(distinct(1));
        const set: string[] = [];
        const kit = {
            monaco: { editor: { setModelLanguage: (_model: unknown, id: string) => set.push(id) } },
            ensureLanguage
        };
        runCommand(kit as never, {} as never, {} as never, { kind: 'language', language: 'lua' });
        runCommand(kit as never, {} as never, {} as never, { kind: 'language', language: 'lua' });
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(set).toEqual(['lua', 'lua']);
        expect(loaded(asked)).toEqual(['lua']);
    });

    // Red when a file past the paint limit, handed to the editor as plaintext, loads its grammar.
    it('loads no grammar for a 5 MB Lua file above the paint limit', async () => {
        const { asked, paint, ensureLanguage } = counted();
        await paint(distinct(1));
        const shown = shownLanguage('lua', 'x'.repeat(5 * 1024 * 1024), 64 * 1024);
        expect(shown).toBe('plaintext');
        await ensureLanguage(shown);
        expect(loaded(asked)).toEqual([]);
    });

    // Red when a load in flight at teardown goes on to bridge, throw or load the next language.
    it('loads nothing more and throws nothing when the page is torn down mid-load', async () => {
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { made, asked, bridged, paint, ensureLanguage, close } = counted(shipped, {
            before: () => gate
        });
        await paint(distinct(1));
        const bridges = bridged.length;
        const inFlight = ensureLanguage('lua');
        const queued = ensureLanguage('java');
        await new Promise((resolve) => setTimeout(resolve, 0));
        close();
        release();
        await expect(inFlight).resolves.toBeUndefined();
        await expect(queued).resolves.toBeUndefined();
        await expect(ensureLanguage('cmake')).resolves.toBeUndefined();
        await expect(paint(distinct(0x100))).resolves.toBe(THEME);
        expect(loaded(asked)).toEqual(['lua']);
        expect(bridged).toHaveLength(bridges);
        expect(made.every((entry) => entry.disposed)).toBe(true);
        expect(log).not.toHaveBeenCalled();
    });
});
