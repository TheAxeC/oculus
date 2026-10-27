// Layer 3, shell. What a page puts on its document so that the theme, the wallpaper, the glyph
// vocabulary and the file icon theme the viewer chose are drawn: the theme's class and its derived
// tokens with the classes of the CRT overlay and the rice toggles, the wallpaper's layer and the
// properties its translucent surfaces read, the text scale, which of the two glyph vocabularies
// renders, and the icon theme of an app when `file_icons` names one, or the theme and the icon
// theme the palette previews while its selection rests on one (`ui.preview`). Called once from the
// page's script body (Workbench.svelte), which draws the wallpaper's layer from the two values it
// answers. In the desktop app the colours the title bar strip is drawn in go to the host each time
// a theme is drawn, the first time included, for the window buttons the system draws over the strip
// off macOS, with the drawn theme's background, which the host fills the window with; a page in a
// browser has no host and sends nothing.
//
// The page's first HTML is sent with the theme it starts on, its ground, its body class, the tokens
// derived for it and the block of an app's theme (hooks.server.ts), so the first paint is that
// theme's, the wallpaper's class and its properties excepted, which come with this module's first
// draw, which also takes the ground element away (`applyTheme` of ui/theme/theme.ts). The page's
// first load carries the files of the app themes the `theme` and `app_theme` options name
// (`files`), and the first draw of each such theme is made from its file (`firstDrawFile` of
// ui/theme/app-theme.ts), so the first draw keeps what the HTML showed. A later draw of the theme
// loads its file from the server, so a theme whose file changed after the first load is drawn as it
// is now. An app's theme whose file the first load carries as unresolved, or whose file the server
// does not give, is passed over to the start theme, as the server passes over it for the page's
// first HTML, the desktop host for the window's fill and the pages with no `apps` channel for their
// draw, until the apps' offers change, which is when a theme's file may have changed.

import { WALL_CLASS, applyWallpaper } from '$lib/ui/theme/theme';
import { drawTheme, firstDrawFile, type FirstThemeFiles } from '$lib/ui/theme/app-theme';
import {
    holdIconTheme,
    loadIconTheme,
    setIconLanguages,
    setIconsDark
} from '$lib/ui/display/icon-theme/held.svelte';
import { setGlyphMode, t } from '$lib/state/shared/words/text';
import {
    appThemeLabel,
    appThemeState,
    fileIconsState,
    startChoice,
    startClass,
    terminalTheme,
    themeClass,
    wallpaperOnTheme,
    wallpaperSettings,
    withoutThemes
} from '$lib/state/shared/words/appearance';
import type { ClientState } from '$lib/state/client/context';
import { stripColours } from '$lib/shell/window/strip-colours';

/** What the page draws its wallpaper layer from. */
export type Appearance = {
    /** Whether the wallpaper is drawn: the viewer wants one and the theme shows under it. */
    wall: () => boolean;
    /**
     * The layer's style: the image's address, which names the `wallpaper.image` value (a pick's
     * while its write is out, else the config's), so a new choice is a new address the browser
     * fetches rather than the picture it holds, and no address while the value is empty, which
     * names no image, and the image's
     * own two numbers, as the properties its layer's filter reads: the dim is how much light is
     * taken out of the picture, so the brightness left is what the filter wants.
     */
    image: () => string;
};

/**
 * Put the viewer's appearance on the document, and keep it there as the choices change. `files`
 * are the files of the app themes the page's first load carries, by saved name.
 */
export function useAppearance(
    {
        ui,
        notices,
        appShell,
        desktop,
        entities,
        wallpapers
    }: Pick<ClientState, 'ui' | 'notices' | 'appShell' | 'desktop' | 'entities' | 'wallpapers'>,
    files: () => FirstThemeFiles
): Appearance {
    const { brackets, crt, icons, monospace, textScale, theme, wallpaper } = ui;
    const inApp = desktop !== undefined;
    /** The app themes the page said are unavailable, so a theme is told once. */
    const told = new Set<string>();
    /** The first load's file of an app's theme, for the first draw of that theme. */
    const firstFile = firstDrawFile(files);
    /**
     * The app themes whose file the page could not get, under the offers they were found missing
     * from: at the start those the first load carries no file of, then each whose load failed. It
     * is raw state, replaced whole, so `offers` is the offers array itself and compares equal to
     * the list the shell acts on while that list is unchanged.
     */
    let unloaded = $state.raw({
        offers: appShell.offers(),
        names: Object.entries(files())
            .filter(([, file]) => file === null)
            .map(([name]) => name)
    });
    const wall = $derived(wallpaper() && wallpaperOnTheme(theme(), appShell.offers(), inApp));
    const paper = $derived(wallpaperSettings());
    const chosen = $derived(wallpapers.shown(entities.config()?.config));
    const image = $derived(
        (chosen === ''
            ? ''
            : `background-image: url("/api/wallpaper?v=${encodeURIComponent(chosen)}"); `) +
            `--wall-dim:${paper === null ? 1 : 1 - paper.dim}; --wall-image-blur: ${paper === null ? 0 : paper.blur}px`
    );

    $effect(() => {
        document.documentElement.style.setProperty('--text-scale', String(textScale() ?? 1));
        applyWallpaper(document, paper, wall);
        // The terminal palettes draw the ASCII stand-ins unless the option `rice.icons` is on;
        // every other theme draws the icon config/catalogs/icons.yml maps each glyph name to.
        setGlyphMode(
            terminalTheme(theme(), appShell.offers(), inApp) && !icons() ? 'ascii' : 'icon'
        );
    });

    $effect(() => {
        const choice = theme();
        const acting = appShell.offers();
        const failed = unloaded.offers === acting ? unloaded.names : [];
        const offers = withoutThemes(acting, failed);
        const state = appThemeState(choice, offers);
        const extra = wall ? WALL_CLASS : '';
        let current = true;
        // A theme of an app is drawn from its file: the one the first load carries for the first
        // draw, else the one the server serves, which is asked for a theme the page knows nothing
        // of yet too. One whose app is not approved and enabled, or whose file does not resolve,
        // is the start theme, `app_theme` in the desktop app's window (an app's theme too, when
        // the page can draw it), and the page says so once. Should a file not load, the theme of
        // the list the page starts on is drawn and the theme is passed over from then on, so the
        // next draw is the start theme.
        const shown = state === 'missing' ? startChoice(inApp, offers) : choice;
        const shownState = appThemeState(shown, offers);
        const app = shownState === 'ready' || shownState === 'pending';
        const classes = app ? startClass(inApp) : themeClass(shown, offers, inApp);
        void drawTheme(
            document,
            {
                choice: shown,
                app,
                classes: [classes, extra].join(' '),
                extra,
                crt: crt(),
                brackets: brackets(),
                monospace: monospace(),
                file: app ? firstFile(shown) : undefined
            },
            () => current
        ).then((drawn) => {
            if (current && app && !drawn) unloaded = { offers: acting, names: [...failed, shown] };
            if (current) setIconsDark(getComputedStyle(document.body).colorScheme === 'dark');
            const strip = current && desktop !== undefined ? stripColours(document) : null;
            if (strip !== null)
                desktop?.bridge.titleColours(strip.color, strip.symbolColor, strip.background);
            if (!current || (state !== 'missing' && drawn) || told.has(choice)) return;
            told.add(choice);
            notices.post(t('apps.theme_unavailable', appThemeLabel(choice)));
        });
        return () => {
            current = false;
        };
    });

    $effect(() => {
        const choice = ui.preview().fileIcons ?? appShell.fileIcons();
        let current = true;
        // An app's icon theme is drawn when its file has been loaded; until then, and for a theme
        // no acting app offers, the page draws Seti.
        if (fileIconsState(choice, appShell.offers()) !== 'ready') {
            holdIconTheme(document, null);
            return;
        }
        void loadIconTheme(choice).then((loaded) => {
            if (current) holdIconTheme(document, loaded);
        });
        return () => {
            current = false;
        };
    });

    $effect(() => {
        setIconLanguages(appShell.languages());
    });

    return { wall: () => wall, image: () => image };
}
