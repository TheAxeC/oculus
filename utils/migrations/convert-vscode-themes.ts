#!/usr/bin/env node
// Layer 1, data. Convert the colour themes Visual Studio Code ships into oculus's theme blocks and
// the editor's colour rules.
//
// Run it from tools/oculus:
//
//     node utils/migrations/convert-vscode-themes.ts [--from <extensions folder>] [--check]
//
// `--from` names VS Code's `extensions` folder (default: the installed macOS app's). `--check`
// writes nothing: it exits 1 and names every block or theme whose file differs from what a run
// would write, every `vscode-*` row of config/appearance.yml without a block or block without a
// row, and every class that the list of VS Code themes in src/lib/data/helpers/code-themes.ts (the
// one layer 1 holds, since it cannot read themes/) lacks or holds without a block. A run writes two
// files and a second run changes no byte of them:
//
//   - src/lib/themes/vscode.css, one `body.vscode-<slug>` block per theme;
//   - src/lib/themes/vscode-rules.json, each theme's TextMate rules, which the editor takes in
//     place of the six code hues of tokens.css (kit/theme/theme.ts, `ownRules`).
//
// Every theme is read from the `contributes.themes` of the `package.json` of an extension under
// `--from`, with its label from `package.nls.json`, its `include` chain followed to the end (the
// includer's keys win, the included files' `tokenColors` come first). `semanticTokenColors` is
// ignored: the editor colours semantic tokens from the TextMate rules (kit/theme/semantic.ts).
//
// The mapping is `mapTheme`, a function of a resolved theme, its `uiTheme` and a context (the git
// extension's registered colours and oculus's own base tokens), so nothing in it reads a file. Each
// token takes the first key of its list that the theme holds; when it holds none, the first key of
// the list with a registered default (the git extension's `contributes.colors` for
// `gitDecoration.*`, the table WORKBENCH below for the others); when that comes out null or
// transparent, oculus's own base token of the theme's type. `--bg` is the side bar VS Code draws:
// the theme's `sideBar.background`, else its registered default. A colour with an alpha is
// composited over `--panel`. The tab label colours that fall under 4.5:1 on the strip or the shown
// tab are nudged in lightness by derive.ts's `readable`, as are the foreground of each rule of
// the JSON file on `--panel` and on the Source Control tints.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { format, resolveConfig } from 'prettier';
import { parse as parseYaml } from 'yaml';
import { codeThemeInfo } from '../../src/lib/data/helpers/code-themes.ts';
import { ratio, readable } from '../../src/lib/themes/derive.ts';
import { parseBlocks } from '../../src/lib/themes/parse.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS_PATH = join(ROOT, 'src', 'lib', 'themes', 'vscode.css');
const JSON_PATH = join(ROOT, 'src', 'lib', 'themes', 'vscode-rules.json');
const APPEARANCE_PATH = join(ROOT, 'config', 'appearance.yml');
const DEFAULT_FROM = '/Applications/Visual Studio Code.app/Contents/Resources/app/extensions';

/** The contrast the tab labels and the rules' foregrounds are brought to: the contrast test's. */
const MINIMUM = 4.5;

/** The width a comment line may reach. */
const WIDTH = 100;

/** The share of `--ink` that `--muted` takes when every candidate reads stronger than `--ink`. */
const MUTED_SHARE = 0.7;

type UiTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

/** A colour with its alpha as a share, 0 to 1. */
type Rgba = { r: number; g: number; b: number; a: number };

/** One rule of a theme's `tokenColors`. */
type TokenRule = {
    scope?: string | string[];
    settings?: { foreground?: string; background?: string; fontStyle?: string };
};

/** A theme with its `include` chain applied. */
type ResolvedTheme = { colors: Record<string, string>; tokenColors: TokenRule[] };

/** A theme as an extension's package.json lists it. */
type Listed = { label: string; ui: UiTheme; file: string };

/** A rule of vscode-rules.json. */
type OutRule = { scope: string[]; foreground?: string; fontStyle?: string };

/**
 * How VS Code registers a colour for one theme type: a hex, nothing, another key (its value in the
 * theme, else its own default) with a factor on its alpha, or a hex with an alpha.
 */
type Registered = string | null | { key: string; alpha: number } | { hex: string; alpha: number };
type TypeDefaults = Record<'dark' | 'light' | 'hcDark' | 'hcLight', Registered>;

const TYPE_OF: Record<UiTheme, keyof TypeDefaults> = {
    vs: 'light',
    'vs-dark': 'dark',
    'hc-black': 'hcDark',
    'hc-light': 'hcLight'
};

/** What `mapTheme` reads besides the theme: the git extension's colours and oculus's base ones. */
type Context = {
    git: Record<string, TypeDefaults>;
    bases: Record<'dark' | 'light', Record<string, string>>;
};

type Mapped = {
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
const table = (
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
    )
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

function fail(message: string): never {
    throw new Error(message);
}

// --- colours -------------------------------------------------------------------------------------

/** A hex of three, four, six or eight digits, or null for any other text. */
function parseColour(text: string): Rgba | null {
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
function mapTheme(theme: ResolvedTheme, ui: UiTheme, context: Context): Mapped {
    const type = TYPE_OF[ui];
    const dark = ui === 'vs-dark' || ui === 'hc-black';
    const highContrast = ui === 'hc-black' || ui === 'hc-light';
    const base = context.bases[dark ? 'dark' : 'light'];
    const defaults = { ...WORKBENCH, ...context.git };
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
        const value = defaults[key]?.[type] as Registered | undefined;
        if (value === undefined || value === null) return null;
        if (typeof value === 'string') return parseColour(value);
        if ('hex' in value) return { ...(parseColour(value.hex) as Rgba), a: value.alpha };
        const target = own(value.key) ?? standard(value.key);
        return target === null ? null : { ...target, a: target.a * value.alpha };
    };
    const panelBase = parseColour(base['--panel']) as Rgba;
    const over = (): Rgba => parseColour(tokens['--panel'] ?? base['--panel']) as Rgba;

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
    if (everyRefused && tokens['--muted'] === undefined) {
        const ink = parseColour(tokens['--ink']) as Rgba;
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
        if (tokens[token] !== undefined) continue;
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
        ...TAB_KEYS.map(([token]) => token),
        ...CODE_SCOPES.map(([name]) => `--c-code-${name}`)
    ];
    const entries: [string, string][] = [];
    if (dark) entries.push(['color-scheme', 'dark'], ['--shadow', 'none']);
    for (const token of order) {
        const value = DARK_TINTS.includes(token) ? base[token] : tokens[token];
        if (value !== undefined) entries.push([token, value]);
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
    const behind = parseColour(panel) as Rgba;
    for (const rule of theme.tokenColors) {
        const scope = scopesOf(rule);
        if (scope.length === 0) continue;
        const colour = parseColour(rule.settings?.foreground ?? '');
        const fontStyle = rule.settings?.fontStyle?.trim();
        const out: OutRule = { scope };
        if (visible(colour)) {
            out.foreground = clear(settle(colour, behind), grounds);
            const worst = Math.min(
                ...grounds.map((ground) => ratio(out.foreground as string, ground))
            );
            if (worst < MINIMUM) {
                unreadable.push(`the rule ${scope.join(',')} clears only ${worst.toFixed(2)}:1`);
            }
        }
        if (fontStyle !== undefined) out.fontStyle = fontStyle;
        if (out.foreground !== undefined || out.fontStyle !== undefined) rules.push(out);
    }
    return rules;
}

// --- reading VS Code -----------------------------------------------------------------------------

function readJson(file: string): unknown {
    if (!existsSync(file)) fail(`${file} does not exist`);
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
        return fail(`${file} is not valid JSON: ${(error as Error).message}`);
    }
}

/** Every colour theme of the extensions under `from`, with the label VS Code shows. */
function listThemes(from: string): Listed[] {
    if (!existsSync(from)) {
        fail(
            `the extensions folder ${from} does not exist; name it with --from <extensions folder>`
        );
    }
    const listed: Listed[] = [];
    for (const name of readdirSync(from).sort()) {
        const manifest = join(from, name, 'package.json');
        if (!existsSync(manifest)) continue;
        const pkg = readJson(manifest) as {
            contributes?: { themes?: { label: string; uiTheme: UiTheme; path: string }[] };
        };
        const themes = pkg.contributes?.themes;
        if (themes === undefined) continue;
        const nlsFile = join(from, name, 'package.nls.json');
        const nls = existsSync(nlsFile)
            ? (readJson(nlsFile) as Record<string, string | { message: string }>)
            : {};
        for (const theme of themes) {
            const found = nls[theme.label.replace(/^%(.*)%$/, '$1')];
            const label = typeof found === 'string' ? found : (found?.message ?? theme.label);
            listed.push({ label, ui: theme.uiTheme, file: resolve(from, name, theme.path) });
        }
    }
    if (listed.length === 0) fail(`no colour theme found under ${from}`);
    return listed;
}

/** A theme file with its `include` chain applied; the includer's keys win. */
function readTheme(file: string, chain: string[] = []): ResolvedTheme {
    if (!existsSync(file)) {
        fail(
            `the theme file ${file} does not exist${chain.length > 0 ? `, included by ${chain.at(-1)}` : ''}; name the extensions folder with --from`
        );
    }
    const data = readJson(file) as {
        include?: string;
        colors?: Record<string, string>;
        tokenColors?: TokenRule[];
    };
    const own = data.tokenColors ?? [];
    if (!Array.isArray(own)) fail(`${file}: tokenColors is no list`);
    const included =
        typeof data.include === 'string'
            ? readTheme(resolve(dirname(file), data.include), [...chain, file])
            : { colors: {}, tokenColors: [] };
    return {
        colors: { ...included.colors, ...data.colors },
        tokenColors: [...included.tokenColors, ...own]
    };
}

/** The VS Code version the folder belongs to: the app's Info.plist, else its package.json. */
function versionOf(from: string): string {
    const plist = resolve(from, '..', '..', '..', 'Info.plist');
    if (existsSync(plist)) {
        const found = /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/.exec(
            readFileSync(plist, 'utf8')
        );
        if (found !== null) return found[1];
    }
    const app = join(from, '..', 'package.json');
    const version = existsSync(app) ? (readJson(app) as { version?: string }).version : undefined;
    return version ?? fail(`no VS Code version in ${plist} or ${app}`);
}

/** The git extension's registered `gitDecoration.*` colours. */
function readGit(from: string): Record<string, TypeDefaults> {
    const manifest = join(from, 'git', 'package.json');
    const pkg = readJson(manifest) as {
        contributes?: { colors?: { id: string; defaults: Record<string, string> }[] };
    };
    const found: Record<string, TypeDefaults> = {};
    for (const color of pkg.contributes?.colors ?? []) {
        if (!color.id.startsWith('gitDecoration.')) continue;
        const d = color.defaults;
        for (const hex of Object.values(d)) {
            if (parseColour(hex) === null)
                fail(`${manifest}: ${color.id} has the value ${hex}, no hex`);
        }
        found[color.id] = table(d.dark, d.light, d.highContrast, d.highContrastLight);
    }
    return found;
}

/** oculus's own base tokens: `:root`, and `body.dark` over it. */
function readBases(): Context['bases'] {
    const sheets = ['tokens.css', 'themes.css'].map((name) =>
        readFileSync(join(ROOT, 'src', 'lib', 'themes', name), 'utf8')
    );
    const blocks = parseBlocks(sheets.join('\n'));
    return { light: blocks[':root'], dark: { ...blocks[':root'], ...blocks.dark } };
}

// --- writing the files ---------------------------------------------------------------------------

/** The class a theme's block carries: `vscode-` and the label as lower-case words. */
function slugOf(label: string): string {
    const words = label
        .toLowerCase()
        .replace(/\+/g, ' plus ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    return `vscode-${words.replace(/ /g, '-')}`;
}

/** A comment wrapped at the width, in the style of themes.css. */
function wrapped(text: string): string {
    const lines: string[] = [];
    let line = '/*';
    for (const word of text.split(/\s+/)) {
        const next = `${line} ${word}`;
        if (next.length + ' */'.length > WIDTH && line !== '/*') {
            lines.push(line);
            line = `   ${word}`;
        } else {
            line = next;
        }
    }
    lines.push(`${line} */`);
    return lines.join('\n');
}

function describe(label: string, file: string, ui: UiTheme, mapped: Mapped): string {
    const parts = [`${label}: ${file}, uiTheme ${ui}.`];
    if (mapped.registered.length > 0) {
        parts.push(`Registered VS Code defaults: ${mapped.registered.join(', ')}.`);
    }
    if (mapped.muted) {
        parts.push(
            '--muted: --ink at 0.7 over --panel, the rule of VS Code descriptionForeground.'
        );
    }
    if (mapped.base.length > 0) parts.push(`oculus base: ${mapped.base.join(', ')}.`);
    if (mapped.nudged.length > 0) {
        parts.push(`Nudged to ${MINIMUM}:1: ${mapped.nudged.join(', ')}.`);
    }
    return wrapped(parts.join(' '));
}

function blockOf(cls: string, mapped: Mapped, note: string): string {
    const body = mapped.entries.map(([name, value]) => `    ${name}: ${value};`);
    return `${note}\nbody.${cls} {\n${body.join('\n')}\n}`;
}

function headOf(version: string): string {
    return wrapped(
        `The VS Code themes: one block per colour theme of Visual Studio Code ${version}, written by utils/migrations/convert-vscode-themes.ts from the theme files under extensions/ of the installed app, which are Microsoft's and MIT licensed with VS Code. Generated: change the converter and run it, never this file, with: node utils/migrations/convert-vscode-themes.ts. A block sets the chrome tokens, the Source Control tokens, the tab tokens the theme holds and the six code hues; its comment names each token that VS Code's registered default or oculus's base gave.`
    );
}

type Built = { cls: string; label: string; css: string; mapped: Mapped };

async function pretty(text: string, file: string): Promise<string> {
    const config = (await resolveConfig(file)) ?? {};
    return format(text, { ...config, filepath: file });
}

function groupOf(ui: UiTheme): number {
    return ui === 'vs' ? 0 : ui === 'vs-dark' ? 1 : 2;
}

function build(from: string): { built: Built[]; version: string } {
    const listed = listThemes(from);
    const context: Context = { git: readGit(from), bases: readBases() };
    const built = listed
        .map((item) => {
            const mapped = mapTheme(readTheme(item.file), item.ui, context);
            const cls = slugOf(item.label);
            const file = relative(from, item.file);
            const css = blockOf(cls, mapped, describe(item.label, file, item.ui, mapped));
            return { cls, label: item.label, css, mapped, group: groupOf(item.ui) };
        })
        .sort((a, b) => a.group - b.group || a.cls.localeCompare(b.cls));
    const names = built.map((one) => one.cls);
    const twice = names.find((name, at) => names.indexOf(name) !== at);
    if (twice !== undefined) fail(`two themes give the class ${twice}`);
    return { built, version: versionOf(from) };
}

async function files(built: Built[], version: string): Promise<{ css: string; json: string }> {
    const css = [headOf(version), ...built.map((one) => one.css)].join('\n\n');
    const rules = built.map(
        (one) =>
            `${JSON.stringify(one.cls)}: [\n${one.mapped.rules.map((rule) => JSON.stringify(rule)).join(',\n')}\n]`
    );
    const generated = `Generated by utils/migrations/convert-vscode-themes.ts from the colour themes of Visual Studio Code ${version} (MIT licensed with VS Code, Microsoft Corporation); change the converter and run it with node utils/migrations/convert-vscode-themes.ts, never this file. Each key is a body class of vscode.css, its value the TextMate rules of that theme with every foreground opaque and readable on the panel and the Source Control tints.`;
    const json = `{\n"generated": ${JSON.stringify(generated)},\n"themes": {\n${rules.join(',\n')}\n}\n}`;
    return { css: await pretty(css, CSS_PATH), json: await pretty(json, JSON_PATH) };
}

// --- checking ------------------------------------------------------------------------------------

/** The text of each `body.vscode-*` block of a stylesheet, by class. */
function blocksOf(css: string): Map<string, string> {
    const found = new Map<string, string>();
    for (const match of css.matchAll(/body\.(vscode-[a-z0-9-]+) \{[^}]*\}/g)) {
        found.set(match[1], match[0]);
    }
    return found;
}

function differences<T>(want: Map<string, T>, have: Map<string, T>, what: string): string[] {
    const out: string[] = [];
    for (const [cls, value] of want) {
        if (!have.has(cls)) out.push(`${what} ${cls} is missing`);
        else if (JSON.stringify(have.get(cls)) !== JSON.stringify(value))
            out.push(`${what} ${cls} differs`);
    }
    for (const cls of have.keys())
        if (!want.has(cls)) out.push(`${what} ${cls} is not a VS Code theme`);
    return out;
}

function ruleSets(json: string): Map<string, unknown> {
    try {
        const themes = (JSON.parse(json) as { themes?: Record<string, unknown> }).themes ?? {};
        return new Map(Object.entries(themes));
    } catch {
        return new Map();
    }
}

/** The `vscode-*` rows of appearance.yml against the classes of the blocks. */
function rowProblems(built: Built[]): string[] {
    const rows = (
        (parseYaml(readFileSync(APPEARANCE_PATH, 'utf8')) as { themes?: { class?: string }[] })
            .themes ?? []
    )
        .map((row) => row.class ?? '')
        .filter((cls) => cls.startsWith('vscode-'));
    const classes = built.map((one) => one.cls);
    return [
        ...rows
            .filter((cls) => !classes.includes(cls))
            .map((cls) => `appearance.yml row ${cls} has no block`),
        ...classes
            .filter((cls) => !rows.includes(cls))
            .map((cls) => `block ${cls} has no appearance.yml row`)
    ];
}

/** The VS Code classes of data/helpers/code-themes.ts against the classes of the blocks. */
function listProblems(built: Built[]): string[] {
    const listed = codeThemeInfo()
        .filter((theme) => theme.vscode)
        .map((theme) => theme.id);
    const classes = built.map((one) => one.cls);
    return [
        ...classes
            .filter((cls) => !listed.includes(cls))
            .map((cls) => `data/helpers/code-themes.ts does not list ${cls}`),
        ...listed
            .filter((cls) => !classes.includes(cls))
            .map((cls) => `data/helpers/code-themes.ts lists ${cls}, which has no block`),
        ...(classes.length === listed.length && classes.some((cls, at) => cls !== listed[at])
            ? ['data/helpers/code-themes.ts lists the classes in another order than the blocks']
            : [])
    ];
}

async function main(): Promise<number> {
    const { values } = parseArgs({
        options: { from: { type: 'string' }, check: { type: 'boolean', default: false } }
    });
    const { built, version } = build(values.from ?? DEFAULT_FROM);
    const wanted = await files(built, version);
    const problems = [...rowProblems(built), ...listProblems(built)];
    for (const one of built) {
        for (const line of one.mapped.unreadable) console.log(`${one.cls}: ${line}`);
    }
    if (values.check === true) {
        const have = {
            css: existsSync(CSS_PATH) ? readFileSync(CSS_PATH, 'utf8') : '',
            json: existsSync(JSON_PATH) ? readFileSync(JSON_PATH, 'utf8') : ''
        };
        const out = [
            ...differences(blocksOf(wanted.css), blocksOf(have.css), 'block'),
            ...differences(ruleSets(wanted.json), ruleSets(have.json), 'rules of'),
            ...problems
        ];
        if (wanted.css !== have.css && out.length === 0)
            out.push('vscode.css differs outside its blocks');
        if (wanted.json !== have.json && out.length === 0)
            out.push('vscode-rules.json differs outside its themes');
        for (const line of out) console.log(line);
        if (out.length === 0) console.log(`${built.length} themes up to date`);
        return out.length === 0 ? 0 : 1;
    }
    writeFileSync(CSS_PATH, wanted.css);
    writeFileSync(JSON_PATH, wanted.json);
    console.log(`wrote ${CSS_PATH} and ${JSON_PATH}: ${built.length} themes of VS Code ${version}`);
    for (const line of problems) console.log(line);
    return 0;
}

try {
    process.exitCode = await main();
} catch (error) {
    console.error(`convert-vscode-themes: ${(error as Error).message}`);
    process.exitCode = 1;
}
