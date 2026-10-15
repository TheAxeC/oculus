// Layer 3, shell. What a page puts on its document so that the theme, the wallpaper, the glyph
// vocabulary and the file icon theme the viewer chose are drawn: the theme's class and its derived
// tokens, the wallpaper's layer and the properties its translucent surfaces read, the text scale,
// which of the two glyph vocabularies renders, and the icon theme of an app when `file_icons` names
// one. Called once from the page's script body (Workbench.svelte), which draws the wallpaper's
// layer from the two values it answers. In the desktop app the colours the title bar strip is drawn
// in go to the host each time a theme is drawn, the first time included, for the window buttons the
// system draws over the strip off macOS; a page in a browser has no host and sends nothing.

import { WALL_CLASS, applyWallpaper } from '$lib/ui/theme/theme';
import { drawTheme } from '$lib/ui/theme/app-theme';
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
    terminalTheme,
    themeClass,
    wallpaperOnTheme,
    wallpaperSettings
} from '$lib/state/shared/words/appearance';
import type { ClientState } from '$lib/state/client/context';
import { stripColours } from '$lib/shell/window/strip-colours';

/** What the page draws its wallpaper layer from. */
export type Appearance = {
    /** Whether the wallpaper is drawn: the viewer wants one and the theme shows under it. */
    wall: () => boolean;
    /**
     * The image's own two numbers, as the properties its layer's filter reads: the dim is how much
     * light is taken out of the picture, so the brightness left is what the filter wants.
     */
    image: () => string;
};

/** Put the viewer's appearance on the document, and keep it there as the choices change. */
export function useAppearance({
    ui,
    notices,
    appShell,
    desktop
}: Pick<ClientState, 'ui' | 'notices' | 'appShell' | 'desktop'>): Appearance {
    const { crt, icons, textScale, theme, wallpaper } = ui;
    /** The app themes the page said are unavailable, so a theme is told once. */
    const told = new Set<string>();
    const wall = $derived(wallpaper() && wallpaperOnTheme(theme(), appShell.offers()));
    const paper = $derived(wallpaperSettings());
    const image = $derived(
        `--wall-dim: ${paper === null ? 1 : 1 - paper.dim}; --wall-image-blur: ${paper === null ? 0 : paper.blur}px`
    );

    $effect(() => {
        document.documentElement.style.setProperty('--text-scale', String(textScale() ?? 1));
        applyWallpaper(document, paper, wall);
        // The terminal palettes draw the ASCII stand-ins unless the viewer asked for the icons;
        // every other theme draws the icon config/catalogs/icons.yml maps each glyph name to.
        setGlyphMode(terminalTheme(theme(), appShell.offers()) && !icons() ? 'ascii' : 'icon');
    });

    $effect(() => {
        const choice = theme();
        const offers = appShell.offers();
        const state = appThemeState(choice, offers);
        const extra = wall ? WALL_CLASS : '';
        let current = true;
        // A theme of an app is drawn when its file has been loaded. One that no acting app offers
        // is the default theme, and the page says so once.
        void drawTheme(
            document,
            {
                choice,
                app: state === 'ready',
                classes: [themeClass(choice, offers), extra].join(' '),
                extra,
                crt: crt()
            },
            () => current
        ).then((drawn) => {
            if (current) setIconsDark(getComputedStyle(document.body).colorScheme === 'dark');
            const strip = current && desktop !== undefined ? stripColours(document) : null;
            if (strip !== null) desktop?.bridge.titleColours(strip.color, strip.symbolColor);
            if (!current || (state !== 'missing' && drawn) || told.has(choice)) return;
            told.add(choice);
            notices.post(t('apps.theme_unavailable', appThemeLabel(choice)));
        });
        return () => {
            current = false;
        };
    });

    $effect(() => {
        const choice = appShell.fileIcons();
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
