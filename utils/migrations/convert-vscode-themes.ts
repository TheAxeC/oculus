#!/usr/bin/env node
// Layer 1, data. Convert the colour themes Visual Studio Code ships into oculus's theme blocks and
// the editor's colour rules.
//
// Run it from oculus's folder:
//
//     node utils/migrations/convert-vscode-themes.ts [--from <extensions folder>] [--check]
//
// `--from` names VS Code's `extensions` folder (default: the installed macOS app's). `--check`
// writes nothing: it exits 1 and names every block or theme whose file differs from what a run
// would write, every `vscode-*` row of config/appearance.yml without a block or block without a
// row, and every class that the list of VS Code themes in
// src/lib/data/helpers/editor/code-themes.ts (the one layer 1 holds, since it cannot read themes/)
// lacks or holds without a block. A run writes two files and a second run changes no byte of them:
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
// The mapping is `mapTheme` of src/lib/themes/vscode-map.ts, which the page uses too to convert the
// colour theme of an app. This script reads the files and writes the two outputs; the git
// extension's colours the mapping uses are the table `GIT_DEFAULTS` there, and `--check` names each
// that differs from the installed extension's.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { format, resolveConfig } from 'prettier';
import { parse as parseYaml } from 'yaml';
import { codeThemeInfo } from '../../src/lib/data/helpers/editor/code-themes.ts';
import {
    GIT_DEFAULTS,
    basesOf,
    mapTheme,
    parseColour,
    table,
    type Context,
    type Mapped,
    type ResolvedTheme,
    type TokenRule,
    type TypeDefaults,
    type UiTheme,
    MINIMUM
} from '../../src/lib/themes/vscode-map.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS_PATH = join(ROOT, 'src', 'lib', 'themes', 'vscode.css');
const JSON_PATH = join(ROOT, 'src', 'lib', 'themes', 'vscode-rules.json');
const APPEARANCE_PATH = join(ROOT, 'config', 'appearance.yml');
const DEFAULT_FROM = '/Applications/Visual Studio Code.app/Contents/Resources/app/extensions';

/** The width a comment line may reach. */
const WIDTH = 100;

/** A theme as an extension's package.json lists it. */
type Listed = { label: string; ui: UiTheme; file: string };

function fail(message: string): never {
    throw new Error(message);
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
    const [tokens, themes] = ['tokens.css', 'themes.css'].map((name) =>
        readFileSync(join(ROOT, 'src', 'lib', 'themes', name), 'utf8')
    );
    return basesOf(tokens, themes);
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
        `The VS Code themes: one block per colour theme of Visual Studio Code ${version}, written by utils/migrations/convert-vscode-themes.ts from the theme files under extensions/ of the installed app, which are Microsoft's and MIT licensed with VS Code. Generated: change the converter and run it, never this file, with: node utils/migrations/convert-vscode-themes.ts. A block sets the chrome tokens, the Source Control tokens, the diff's outlines of inserted and removed text (--diff-added-outline, --diff-deleted-outline), the Source Control Graph's three name colours (--c-graph-ref, --c-graph-remote, --c-graph-base), the tab tokens the theme holds, the window's title bar strip (--titlebar-bg, --titlebar-txt, --titlebar-line) and the six code hues; its comment names each token that VS Code's registered default or oculus's base gave.`
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

/** The VS Code classes of data/helpers/editor/code-themes.ts against the classes of the blocks. */
function listProblems(built: Built[]): string[] {
    const listed = codeThemeInfo()
        .filter((theme) => theme.vscode)
        .map((theme) => theme.id);
    const classes = built.map((one) => one.cls);
    return [
        ...classes
            .filter((cls) => !listed.includes(cls))
            .map((cls) => `data/helpers/editor/code-themes.ts does not list ${cls}`),
        ...listed
            .filter((cls) => !classes.includes(cls))
            .map((cls) => `data/helpers/editor/code-themes.ts lists ${cls}, which has no block`),
        ...(classes.length === listed.length && classes.some((cls, at) => cls !== listed[at])
            ? [
                  'data/helpers/editor/code-themes.ts lists the classes in another order than the blocks'
              ]
            : [])
    ];
}

/** The git extension's colours as installed against the table the mapping uses. */
function gitProblems(from: string): string[] {
    return differences(
        new Map(Object.entries(readGit(from))),
        new Map(Object.entries(GIT_DEFAULTS)),
        'git colour'
    );
}

async function main(): Promise<number> {
    const { values } = parseArgs({
        options: { from: { type: 'string' }, check: { type: 'boolean', default: false } }
    });
    const from = values.from ?? DEFAULT_FROM;
    const { built, version } = build(from);
    const wanted = await files(built, version);
    const problems = [...rowProblems(built), ...listProblems(built), ...gitProblems(from)];
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
