// Layer 2, server (the desktop host). The colours a window of the app takes before its page paints:
// the background it is filled with and the colour the system draws the window buttons' symbols in
// over the page's strip (decide/window-options.ts, `windowFill` and `windowFrame`). They are the
// colours of the theme the window's page will start on, read from that theme's stylesheet block, so
// the window shows the page's own background while the page loads and no colour is restated here.
// Once the page has drawn a theme, it sends that theme's background and the window takes it
// (windows/bridge.ts, `TITLE_COLOURS`).
//
// The theme is the one the server's page starts on in the app's window: the config is merged as the
// server merges it for the workspace in force (oculus's files, the primary hub's settings file and
// the open workspace file's `settings:`), and the theme is the `theme` option's, else the
// `app_theme` option's, else the first row's (data/helpers/editor/start-theme.ts, `windowStart`).
// Either option may name an app's colour theme. The server reads the file of each such theme as a
// page's first load reads it, for an approved, enabled app alone, and tells the host
// (server/process.ts, `appThemes`), or, for a window onto an oculus the app did not start, the host
// asks that oculus for them before the window opens (server/health.ts, `fetchAppThemes`, over
// `startThemeNames`); the host converts it with the mapping the page converts it with
// (lib/themes/vscode-map.ts, over the page's tokens.css and themes.css) and reads the colours from
// the block that makes. A theme whose app is not approved and enabled, or whose file does not
// resolve, is not among them and is passed over to the next theme of the rule, as its page passes
// over it. The sheets are the ones the page is styled with, read in the order the page reads them
// from the checkout that holds the code, which is not the folder `--engine` names when that folder
// holds config/ alone.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { windowStart } from '../../lib/data/helpers/editor/start-theme.ts';
import {
    APP_THEME_CLASS,
    appThemeNames,
    type AppThemeFile,
    type AppThemeFiles
} from '../../lib/data/helpers/files/apps/choices.ts';
import { loadConfig } from '../../lib/data/sources/config.ts';
import { openWorkspace } from '../../lib/server/files/workspace/open.ts';
import { configOptions } from '../../lib/server/files/workspace/paths.ts';
import { defaultStateFolder } from '../../lib/server/files/workspace/state.ts';
import { parseBlocks, windowColours, type WindowColours } from '../../lib/themes/parse.ts';
import {
    GIT_DEFAULTS,
    basesOf,
    mapTheme,
    type ResolvedTheme
} from '../../lib/themes/vscode-map.ts';

/**
 * The saved names of the app themes a window may start on, over the config merged as
 * `startColours` merges it: the ones the `theme` and `app_theme` options name (`appThemeNames`).
 */
export function startThemeNames(
    engine: string,
    stateFolder: string = defaultStateFolder()
): string[] {
    return appThemeNames(loadConfig(engine, configOptions(openWorkspace(stateFolder))).config);
}

/** The folder of the stylesheets under the checkout `code`. */
function themesFolder(code: string): string {
    return join(code, 'src', 'lib', 'themes');
}

/**
 * The stylesheets that hold the theme blocks under the checkout `code`, as one text: tokens.css
 * with `:root`, themes.css, the rice palettes of rice/ in the order of their file names, and
 * vscode.css, the order of the page's sheets (ui/theme/theme.ts).
 */
function themeSheets(code: string): string {
    const folder = themesFolder(code);
    const rice = readdirSync(join(folder, 'rice'))
        .filter((name) => name.endsWith('.css'))
        .sort()
        .map((name) => join('rice', name));
    return ['tokens.css', 'themes.css', ...rice, 'vscode.css']
        .map((name) => readFileSync(join(folder, name), 'utf8'))
        .join('\n');
}

/**
 * The tokens of an app's theme file as the page converts it (ui/theme/app-theme.ts,
 * `convertAppTheme`): the mapping over the bases of the checkout's tokens.css and themes.css.
 */
function appThemeBlock(code: string, file: AppThemeFile): Record<string, string> {
    const folder = themesFolder(code);
    const bases = basesOf(
        readFileSync(join(folder, 'tokens.css'), 'utf8'),
        readFileSync(join(folder, 'themes.css'), 'utf8')
    );
    const theme = file.theme as ResolvedTheme;
    return Object.fromEntries(mapTheme(theme, file.uiTheme, { git: GIT_DEFAULTS, bases }).entries);
}

/**
 * The colours of the theme a window starts on, for the config under `engine` and the workspace the
 * state folder holds, read from the sheets of the checkout `code`, with the app themes the server
 * told (`files`, by saved name); null when that theme's block gives no hex colour for them.
 */
export function startColours(
    engine: string,
    code: string,
    files: AppThemeFiles = {},
    stateFolder: string = defaultStateFolder()
): WindowColours | null {
    const { config } = loadConfig(engine, configOptions(openWorkspace(stateFolder)));
    const drawable = Object.entries(files).flatMap(([name, file]) => (file === null ? [] : [name]));
    const start = windowStart(config, drawable);
    const blocks = parseBlocks(themeSheets(code));
    const file = 'app' in start && Object.hasOwn(files, start.app) ? files[start.app] : null;
    if (file === null) {
        return windowColours(blocks, 'cls' in start ? start.cls : '');
    }
    return windowColours(
        { ...blocks, [APP_THEME_CLASS]: appThemeBlock(code, file) },
        APP_THEME_CLASS
    );
}
