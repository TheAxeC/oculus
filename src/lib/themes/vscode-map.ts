// Layer 3, themes. The mapping of a VS Code colour theme to oculus's theme tokens and to the
// TextMate rules of the editor. The converter utils/migrations/convert-vscode-themes.ts writes the
// shipped themes of Visual Studio Code with it, and the page converts an app's colour theme with it
// (ui/theme/app-theme.ts), so a theme file maps the same way wherever it is read.
//
// `mapTheme` is a function of a resolved theme (`colors` and `tokenColors`, the `include` chain
// applied), its `uiTheme` and a context: the git extension's registered colours (`GIT_DEFAULTS`)
// and oculus's base tokens of a light and a dark theme (`basesOf`, over tokens.css and themes.css).
// Nothing here reads a file or the document. Each token takes the first key of its list that the
// theme holds; when it holds none, the first key of the list with a registered default (the git
// extension's colours for `gitDecoration.*`, the table `WORKBENCH` for the others); when that
// comes out null or transparent, oculus's own base token of the theme's type. A colour with an
// alpha is composited over `--panel`. The tab label colours that fall under 4.5:1 on the strip or
// the shown tab are nudged in lightness by derive.ts's `readable`, as are the foreground of each
// rule on `--panel` and on the Source Control tints.
//
// Besides the chrome, the Source Control, the tab and the code tokens, a block sets the window's
// title bar strip from VS Code's title bar keys (`--titlebar-bg`, `--titlebar-txt`, whose words
// are nudged to 4.5:1 on the strip, and `--titlebar-line`, transparent when VS Code draws no
// border) and the Source Control Graph's name colours from its `scmGraph.*` keys
// (`--c-graph-ref`, `--c-graph-remote`, `--c-graph-base`), all with VS Code's registered defaults
// when the theme holds none.

import { ratio, readable } from './derive.ts';
import { parseBlocks } from './parse.ts';

/** The contrast the tab labels and the rules' foregrounds are brought to: the contrast test's. */
export const MINIMUM = 4.5;

/** The share of `--ink` that `--muted` takes when every candidate reads stronger than `--ink`. */
const MUTED_SHARE = 0.7;

export type UiTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

/** A colour with its alpha as a share, 0 to 1. */
type Rgba = { r: number; g: number; b: number; a: number };

/** One rule of a theme's `tokenColors`. */
export type TokenRule = {
    scope?: string | string[];
    settings?: { foreground?: string; background?: string; fontStyle?: string };
};

/** A theme with its `include` chain applied. */
export type ResolvedTheme = { colors: Record<string, string>; tokenColors: TokenRule[] };

/** A rule of vscode-rules.json. */
export type OutRule = { scope: string[]; foreground?: string; fontStyle?: string };

/**
 * How VS Code registers a colour for one theme type: a hex, nothing, another key (its value in the
 * theme, else its own default) with a factor on its alpha, or a hex with an alpha.
 */
type Registered = string | null | { key: string; alpha: number } | { hex: string; alpha: number };
export type TypeDefaults = Record<'dark' | 'light' | 'hcDark' | 'hcLight', Registered>;

const TYPE_OF: Record<UiTheme, keyof TypeDefaults> = {
    vs: 'light',
    'vs-dark': 'dark',
    'hc-black': 'hcDark',
    'hc-light': 'hcLight'
};

/** What `mapTheme` reads besides the theme: the git extension's colours and oculus's base ones. */
export type Context = {
    git: Record<string, TypeDefaults>;
    bases: Record<'dark' | 'light', Record<string, string>>;
};

export type Mapped = {
    dark: boolean;
    entries: [string, string][];
    registered: string[];
    base: string[];
    muted: boolean;
    nudged: string[];
    rules: OutRule[];
    unreadable: string[];
};

const via = (key: string, alpha = 1): Registered => ({ key, alpha });
const fade = (hex: string, alpha: number): Registered => ({ hex, alpha });
export const table = (
    dark: Registered,
    light: Registered,
    hcDark: Registered,
    hcLight: Registered
): TypeDefaults => ({ dark, light, hcDark, hcLight });

/**
 * The workbench's registered colours for the keys the mapping names, as VS Code 1.137.0 registers
 * them in out/vs/workbench/workbench.desktop.main.js (MIT licence, Microsoft Corporation). The
 * source forms are `"#RRGGBB"` (a hex), `null`, another registered key (`contrastBorder`,
 * `focusBorder`, `foreground`), another key through `transparent(f)` (`via(key, f)`), `qe.white`
 * and `qe.black` (`#ffffff`, `#000000`), `qe.fromHex("#808080").transparent(a)` (`fade`), and the
 * colour objects of the diff tints, `new qe(new si(155, 185, 85, .2))` and
 * `new qe(new si(255, 0, 0, .2))` (`fade` of the same RGB). `sideBar.foreground` and
 * `tab.activeBorder` are registered with no default.
 */
const WORKBENCH: Record<string, TypeDefaults> = {
    'sideBar.background': table('#252526', '#f3f3f3', '#000000', '#ffffff'),
    'activityBar.background': table('#333333', '#2c2c2c', '#000000', '#ffffff'),
    'editorGroupHeader.tabsBackground': table('#252526', '#f3f3f3', null, null),
    'editor.background': table('#1e1e1e', '#ffffff', '#000000', '#ffffff'),
    'editorWidget.background': table('#252526', '#f3f3f3', '#0c141f', '#ffffff'),
    'input.background': table('#3c3c3c', '#ffffff', '#000000', '#ffffff'),
    'dropdown.background': table('#3c3c3c', '#ffffff', '#000000', '#ffffff'),
    'sideBarSectionHeader.background': table(
        fade('#808080', 0.2),
        fade('#808080', 0.2),
        null,
        null
    ),
    foreground: table('#cccccc', '#616161', '#ffffff', '#292929'),
    'editor.foreground': table('#bbbbbb', '#333333', '#ffffff', via('foreground')),
    'sideBar.foreground': table(null, null, null, null),
    'tab.activeForeground': table('#ffffff', '#333333', '#ffffff', '#292929'),
    'tab.inactiveForeground': table(
        via('tab.activeForeground', 0.5),
        via('tab.activeForeground', 0.7),
        '#ffffff',
        '#292929'
    ),
    descriptionForeground: table(
        via('foreground', 0.7),
        '#717171',
        via('foreground', 0.7),
        via('foreground', 0.7)
    ),
    'editorLineNumber.foreground': table('#858585', '#237893', '#ffffff', '#292929'),
    'sideBar.border': table(null, null, via('contrastBorder'), via('contrastBorder')),
    'panel.border': table(
        fade('#808080', 0.35),
        fade('#808080', 0.35),
        via('contrastBorder'),
        via('contrastBorder')
    ),
    'editorGroup.border': table('#444444', '#e7e7e7', via('contrastBorder'), via('contrastBorder')),
    contrastBorder: table(null, null, '#6fc3df', '#0f4a85'),
    'tab.border': table('#252526', '#f3f3f3', via('contrastBorder'), via('contrastBorder')),
    'tab.activeBorder': table(null, null, null, null),
    focusBorder: table('#007fd4', '#0090f1', '#f38518', '#006bbd'),
    'button.background': table('#0e639c', '#007acc', '#000000', '#0f4a85'),
    'activityBarBadge.background': table('#007acc', '#007acc', '#000000', '#0f4a85'),
    contrastActiveBorder: table(null, null, via('focusBorder'), via('focusBorder')),
    'editorGutter.modifiedBackground': table('#1b81a8', '#2090d3', '#1b81a8', '#2090d3'),
    'diffEditor.insertedLineBackground': table(
        fade('#9bb955', 0.2),
        fade('#9bb955', 0.2),
        null,
        null
    ),
    'diffEditor.removedLineBackground': table(
        fade('#ff0000', 0.2),
        fade('#ff0000', 0.2),
        null,
        null
    ),
    'titleBar.activeBackground': table('#3C3C3C', '#DDDDDD', '#000000', '#FFFFFF'),
    'titleBar.activeForeground': table('#CCCCCC', '#333333', '#FFFFFF', '#292929'),
    'titleBar.border': table(null, null, via('contrastBorder'), via('contrastBorder')),
    'scmGraph.historyItemRefColor': table('#59a4f9', '#0063d3', '#59a4f9', '#0063d3'),
    'scmGraph.historyItemRemoteRefColor': table('#B180D7', '#652D90', '#B180D7', '#652D90'),
    'scmGraph.historyItemBaseRefColor': table('#EA5C00', '#EA5C00', '#EA5C00', '#EA5C00')
};

/** The scopes each code hue is read from, in list order. */
const CODE_SCOPES: [string, string[]][] = [
    ['comment', ['comment']],
    ['keyword', ['keyword', 'storage', 'keyword.control']],
    ['meta', ['meta.tag', 'entity.name.tag', 'meta.preprocessor', 'punctuation.definition.tag']],
    ['name', ['entity.name.function', 'entity.name', 'support.function']],
    ['number', ['constant.numeric']],
    ['string', ['string']]
];

/** The Source Control tokens and the key each is read from. */
const SCM_KEYS: [string, string][] = [
    ['--c-scm-added', 'gitDecoration.addedResourceForeground'],
    ['--c-scm-modified', 'gitDecoration.modifiedResourceForeground'],
    ['--c-gutter-modified', 'editorGutter.modifiedBackground'],
    ['--c-scm-deleted', 'gitDecoration.deletedResourceForeground'],
    ['--c-scm-conflict', 'gitDecoration.conflictingResourceForeground'],
    ['--c-scm-added-bg', 'diffEditor.insertedLineBackground'],
    ['--c-scm-deleted-bg', 'diffEditor.removedLineBackground']
];

/**
 * The Source Control Graph's three name colours and the keys each is read from. VS Code registers
 * the reference colour as `charts.blue`, itself `editorInfo.foreground`, and the remote reference
 * colour as `charts.purple`, so a theme that sets one of those colours its graph with it; the base
 * reference colour is a fixed orange.
 */
const GRAPH_KEYS: [string, string[]][] = [
    ['--c-graph-ref', ['scmGraph.historyItemRefColor', 'charts.blue', 'editorInfo.foreground']],
    ['--c-graph-remote', ['scmGraph.historyItemRemoteRefColor', 'charts.purple']],
    ['--c-graph-base', ['scmGraph.historyItemBaseRefColor']]
];

/**
 * The window's title bar strip: its surface, its words and its bottom line, each from the theme's
 * key or VS Code's registered default. A line with no colour is drawn transparent, as VS Code
 * draws no title bar border then.
 */
const STRIP_BG: [string, string] = ['--titlebar-bg', 'titleBar.activeBackground'];
const STRIP_TXT: [string, string] = ['--titlebar-txt', 'titleBar.activeForeground'];
const STRIP_LINE: [string, string] = ['--titlebar-line', 'titleBar.border'];

/** The surfaces a tab label lands on, and the tints the editor draws code over. */
const TAB_SURFACES = ['--bg', '--panel'];
const TINTS = ['--c-scm-added-bg', '--c-scm-deleted-bg', '--c-scm-conflict-bg'];

/** The tab tokens, each read from the theme's own key alone. */
const TAB_KEYS: [string, string][] = [
    ['--tab-active-txt', 'tab.activeForeground'],
    ['--tab-inactive-txt', 'tab.inactiveForeground'],
    ['--tab-active-border', 'tab.activeBorder']
];

/** The tokens a dark theme takes from `body.dark` besides its colours. */
const DARK_TINTS = ['--c-red-bg', '--c-red-s', '--c-amber-bg', '--c-amber-s'];

/**
 * The colours the git extension of Visual Studio Code 1.137.0 registers for `gitDecoration.*`, from
 * the `contributes.colors` of its package.json (MIT licence, Microsoft Corporation). The converter
 * names the keys that differ from the installed extension's.
 */
export const GIT_DEFAULTS: Record<string, TypeDefaults> = {
    'gitDecoration.addedResourceForeground': table('#81b88b', '#587c0c', '#a1e3ad', '#374e06'),
    'gitDecoration.modifiedResourceForeground': table('#E2C08D', '#895503', '#E2C08D', '#895503'),
    'gitDecoration.deletedResourceForeground': table('#c74e39', '#ad0707', '#c74e39', '#ad0707'),
    'gitDecoration.renamedResourceForeground': table('#73C991', '#007100', '#73C991', '#007100'),
    'gitDecoration.untrackedResourceForeground': table('#73C991', '#007100', '#73C991', '#007100'),
    'gitDecoration.ignoredResourceForeground': table('#8C8C8C', '#8E8E90', '#A7A8A9', '#8e8e90'),
    'gitDecoration.stageModifiedResourceForeground': table(
        '#E2C08D',
        '#895503',
        '#E2C08D',
        '#895503'
    ),
    'gitDecoration.stageDeletedResourceForeground': table(
        '#c74e39',
        '#ad0707',
        '#c74e39',
        '#ad0707'
    ),
    'gitDecoration.conflictingResourceForeground': table(
        '#e4676b',
        '#ad0707',
        '#c74e39',
        '#ad0707'
    ),
    'gitDecoration.submoduleResourceForeground': table('#8db9e2', '#1258a7', '#8db9e2', '#1258a7')
};

/** oculus's own base tokens: `:root`, and `body.dark` over it. */
export function basesOf(tokens: string, themes: string): Context['bases'] {
    const blocks = parseBlocks(`${tokens}\n${themes}`);
    return { light: blocks[':root'], dark: { ...blocks[':root'], ...blocks.dark } };
}

// --- colours -------------------------------------------------------------------------------------

/** A hex colour that a table of oculus holds; the text of a colour that is none is a defect. */
function known(text: string | undefined): Rgba {
    const colour = parseColour(text ?? '');
    if (colour === null) throw new Error(`Not a colour: ${text ?? 'undefined'}`);
    return colour;
}

/** A hex of three, four, six or eight digits, or null for any other text. */
export function parseColour(text: string): Rgba | null {
    const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text.trim());
    if (match === null) return null;
    let digits = match[1];
    if (digits.length <= 4) digits = digits.replace(/./g, (digit) => digit + digit);
    const byte = (at: number): number => Number.parseInt(digits.slice(at, at + 2), 16);
    return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) / 255 : 1 };
}

function hexOf(colour: Rgba): string {
    const byte = (value: number): string => Math.round(value).toString(16).padStart(2, '0');
    return `#${byte(colour.r)}${byte(colour.g)}${byte(colour.b)}`;
}

/** The colour over `base`, as six digits. An alpha of 1 is dropped. */
function settle(colour: Rgba, base: Rgba): string {
    const mixed = (top: number, bottom: number): number => colour.a * top + (1 - colour.a) * bottom;
    return hexOf(
        colour.a >= 1
            ? colour
            : {
                  r: mixed(colour.r, base.r),
                  g: mixed(colour.g, base.g),
                  b: mixed(colour.b, base.b),
                  a: 1
              }
    );
}

/** Whether a colour paints anything: an alpha of `00` counts as no value. */
function visible(colour: Rgba | null): colour is Rgba {
    return colour !== null && Math.round(colour.a * 255) > 0;
}

/** `hex` nudged until it clears the contrast on each ground in turn. */
function clear(hex: string, grounds: string[]): string {
    return grounds.reduce((out, ground) => readable(out, ground, MINIMUM), hex);
}

// --- the mapping ---------------------------------------------------------------------------------

/** The rules whose scope is empty or absent: the theme's own foreground and background. */
function scopeless(theme: ResolvedTheme): { foreground?: string; background?: string } {
    const global = theme.tokenColors.filter((rule) => scopesOf(rule).length === 0);
    const last = (key: 'foreground' | 'background'): string | undefined =>
        global
            .map((rule) => rule.settings?.[key])
            .filter(Boolean)
            .at(-1);
    return { foreground: last('foreground'), background: last('background') };
}

/** A rule's scopes: a list or a comma-separated string, split and trimmed. */
function scopesOf(rule: TokenRule): string[] {
    const list = rule.scope === undefined ? [] : [rule.scope].flat();
    return list
        .flatMap((scope) => scope.split(','))
        .map((scope) => scope.trim())
        .filter(Boolean);
}

/** The foreground a code hue takes: the first scope some rule holds, the last rule holding it. */
function codeColour(theme: ResolvedTheme, scopes: string[]): Rgba | null {
    for (const scope of scopes) {
        const holders = theme.tokenColors.filter(
            (rule) => scopesOf(rule).includes(scope) && rule.settings?.foreground
        );
        const colour = parseColour(holders.at(-1)?.settings?.foreground ?? '');
        if (visible(colour)) return colour;
    }
    return null;
}

/**
 * The block of one theme and its editor rules. Pure: the theme, its `uiTheme` and the context are
 * all it reads.
 */
export function mapTheme(theme: ResolvedTheme, ui: UiTheme, context: Context): Mapped {
    const type = TYPE_OF[ui];
    const dark = ui === 'vs-dark' || ui === 'hc-black';
    const highContrast = ui === 'hc-black' || ui === 'hc-light';
    const base = context.bases[dark ? 'dark' : 'light'];
    const defaults: Partial<Record<string, TypeDefaults>> = { ...WORKBENCH, ...context.git };
    const tokens: Record<string, string> = {};
    const registered: string[] = [];
    const fromBase: string[] = [];
    const nudged: string[] = [];
    const unreadable: string[] = [];
    let muted = false;

    const own = (key: string): Rgba | null => {
        const colour = parseColour(theme.colors[key] ?? '');
        return visible(colour) ? colour : null;
    };
    const standard = (key: string): Rgba | null => {
        const value = defaults[key]?.[type];
        if (value === undefined || value === null) return null;
        if (typeof value === 'string') return parseColour(value);
        if ('hex' in value) return { ...known(value.hex), a: value.alpha };
        const target = own(value.key) ?? standard(value.key);
        return target === null ? null : { ...target, a: target.a * value.alpha };
    };
    const panelBase = known(base['--panel']);
    const over = (): Rgba => known(tokens['--panel'] ?? base['--panel']);

    /**
     * Set `token` from the first of `keys` the theme holds, else the scopeless rule's colour, else
     * the first registered default; `skip` refuses a candidate. Answers whether a candidate was
     * refused and nothing was set, so the caller can name the other source.
     */
    function pick(
        token: string,
        keys: string[],
        options: { lead?: boolean; global?: string; skip?: (hex: string) => boolean } = {}
    ): boolean {
        let refused = false;
        const take = (colour: Rgba | null, note?: string): boolean => {
            if (!visible(colour)) return false;
            const hex = settle(colour, token === '--panel' ? panelBase : over());
            if (options.skip?.(hex) === true) {
                refused = true;
                return false;
            }
            tokens[token] = hex;
            if (note !== undefined) registered.push(`${token} (${note})`);
            return true;
        };
        let rest = keys;
        if (options.lead === true) {
            if (take(own(keys[0])) || take(standard(keys[0]), keys[0])) return false;
            rest = keys.slice(1);
        }
        for (const key of rest) if (take(own(key))) return false;
        if (take(options.global === undefined ? null : parseColour(options.global))) return false;
        for (const key of rest) if (take(standard(key), key)) return false;
        return refused;
    }

    const aside = scopeless(theme);
    pick('--panel', ['editor.background'], { global: aside.background });
    pick(
        '--bg',
        [
            'sideBar.background',
            'activityBar.background',
            'editorGroupHeader.tabsBackground',
            'editor.background'
        ],
        { lead: true }
    );
    pick('--card', [
        'editorWidget.background',
        'input.background',
        'dropdown.background',
        'sideBarSectionHeader.background'
    ]);
    pick('--ink', ['foreground', 'editor.foreground', 'sideBar.foreground'], {
        global: aside.foreground
    });
    const stronger = ratio(tokens['--ink'] ?? base['--ink'], tokens['--panel'] ?? base['--panel']);
    const everyRefused = pick(
        '--muted',
        ['tab.inactiveForeground', 'descriptionForeground', 'editorLineNumber.foreground'],
        { skip: (hex) => ratio(hex, tokens['--panel'] ?? base['--panel']) >= stronger }
    );
    if (everyRefused && !('--muted' in tokens)) {
        const ink = known(tokens['--ink']);
        tokens['--muted'] = settle({ ...ink, a: MUTED_SHARE }, over());
        muted = true;
    }
    const lineKeys = [
        'sideBar.border',
        'panel.border',
        'editorGroup.border',
        'contrastBorder',
        'tab.border'
    ];
    pick('--line', highContrast ? ['contrastBorder', ...lineKeys] : lineKeys);
    const accentKeys = ['focusBorder', 'button.background', 'activityBarBadge.background'];
    pick('--accent', highContrast ? ['contrastActiveBorder', ...accentKeys] : accentKeys);
    for (const [token, key] of SCM_KEYS) pick(token, [key]);
    for (const [token, keys] of GRAPH_KEYS) pick(token, keys);
    for (const [token, key] of [STRIP_BG, STRIP_TXT, STRIP_LINE]) pick(token, [key]);
    tokens[STRIP_LINE[0]] ??= 'transparent';
    for (const [name, scopes] of CODE_SCOPES) {
        const colour = codeColour(theme, scopes);
        if (colour !== null) tokens[`--c-code-${name}`] = settle(colour, over());
    }

    // Whatever no key gave takes oculus's own base token of the theme's type.
    const complete = [
        '--bg',
        '--panel',
        '--card',
        '--ink',
        '--muted',
        '--line',
        '--accent',
        '--c-scm-conflict-bg',
        ...SCM_KEYS.map(([token]) => token),
        ...CODE_SCOPES.map(([name]) => `--c-code-${name}`)
    ];
    for (const token of complete) {
        if (token in tokens) continue;
        tokens[token] = base[token];
        fromBase.push(token);
    }
    tokens['--chip'] = tokens['--card'];

    for (const [token, key] of TAB_KEYS) {
        const colour = own(key);
        if (colour === null) continue;
        const given = settle(colour, over());
        const value = token.endsWith('-txt')
            ? clear(
                  given,
                  TAB_SURFACES.map((surface) => tokens[surface])
              )
            : given;
        tokens[token] = value;
        if (value !== given) nudged.push(`${token} from ${given} (${key})`);
        const worst = Math.min(...TAB_SURFACES.map((surface) => ratio(value, tokens[surface])));
        if (token.endsWith('-txt') && worst < MINIMUM) {
            unreadable.push(`${token} clears only ${worst.toFixed(2)}:1`);
        }
    }

    // The strip's words are nudged on the strip alone, the one surface they are drawn on.
    const [stripTxt, stripKey] = STRIP_TXT;
    const stripGiven = tokens[stripTxt];
    tokens[stripTxt] = clear(stripGiven, [tokens[STRIP_BG[0]]]);
    if (tokens[stripTxt] !== stripGiven) {
        nudged.push(`${stripTxt} from ${stripGiven} (${stripKey})`);
    }
    const stripRatio = ratio(tokens[stripTxt], tokens[STRIP_BG[0]]);
    if (stripRatio < MINIMUM) {
        unreadable.push(`${stripTxt} clears only ${stripRatio.toFixed(2)}:1`);
    }

    const order = [
        '--bg',
        '--panel',
        '--card',
        '--ink',
        '--muted',
        '--line',
        '--chip',
        '--accent',
        ...(dark ? DARK_TINTS : []),
        ...SCM_KEYS.map(([token]) => token),
        '--c-scm-conflict-bg',
        ...GRAPH_KEYS.map(([token]) => token),
        ...TAB_KEYS.map(([token]) => token),
        STRIP_BG[0],
        STRIP_TXT[0],
        STRIP_LINE[0],
        ...CODE_SCOPES.map(([name]) => `--c-code-${name}`)
    ];
    const entries: [string, string][] = [];
    if (dark) entries.push(['color-scheme', 'dark'], ['--shadow', 'none']);
    for (const token of order) {
        const source = DARK_TINTS.includes(token) ? base : tokens;
        if (token in source) entries.push([token, source[token]]);
    }
    const grounds = [tokens['--panel'], ...TINTS.map((token) => tokens[token])];
    const rules = mapRules(theme, tokens['--panel'], grounds, unreadable);
    return { dark, entries, registered, base: fromBase, muted, nudged, rules, unreadable };
}

/**
 * Every scoped rule of the theme, its foreground made opaque and readable on every ground. A font
 * style the theme sets is kept as written, the empty string included: TextMate reads it as no style
 * and so resets a style a broader rule set.
 */
function mapRules(
    theme: ResolvedTheme,
    panel: string,
    grounds: string[],
    unreadable: string[]
): OutRule[] {
    const rules: OutRule[] = [];
    const behind = known(panel);
    for (const rule of theme.tokenColors) {
        const scope = scopesOf(rule);
        if (scope.length === 0) continue;
        const colour = parseColour(rule.settings?.foreground ?? '');
        const fontStyle = rule.settings?.fontStyle?.trim();
        const out: OutRule = { scope };
        if (visible(colour)) {
            const foreground = clear(settle(colour, behind), grounds);
            out.foreground = foreground;
            const worst = Math.min(...grounds.map((ground) => ratio(foreground, ground)));
            if (worst < MINIMUM) {
                unreadable.push(`the rule ${scope.join(',')} clears only ${worst.toFixed(2)}:1`);
            }
        }
        if (fontStyle !== undefined) out.fontStyle = fontStyle;
        if (out.foreground !== undefined || out.fontStyle !== undefined) rules.push(out);
    }
    return rules;
}
