// Layer 3, shell. What a page puts on its document so that the theme, the wallpaper and the glyph
// vocabulary the viewer chose are drawn: the theme's class and its derived tokens, the wallpaper's
// layer and the properties its translucent surfaces read, the text scale, and which of the two
// glyph vocabularies renders. Called once from the page's script body (Workbench.svelte), which
// draws the wallpaper's layer from the two values it answers.

import { WALL_CLASS, applyTheme, applyWallpaper } from '$lib/ui/theme';
import { setGlyphMode } from '$lib/state/shared/words/text';
import {
    terminalTheme,
    themeClass,
    wallpaperOnTheme,
    wallpaperSettings
} from '$lib/state/shared/words/appearance';
import type { ClientState } from '$lib/state/client/context';

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
export function useAppearance({ ui }: Pick<ClientState, 'ui'>): Appearance {
    const { crt, icons, textScale, theme, wallpaper } = ui;
    const wall = $derived(wallpaper() && wallpaperOnTheme(theme()));
    const paper = $derived(wallpaperSettings());
    const image = $derived(
        `--wall-dim: ${paper === null ? 1 : 1 - paper.dim}; --wall-image-blur: ${paper === null ? 0 : paper.blur}px`
    );

    $effect(() => {
        document.documentElement.style.setProperty('--text-scale', String(textScale() ?? 1));
        applyTheme(document, [themeClass(theme()), wall ? WALL_CLASS : ''].join(' '), crt());
        applyWallpaper(document, paper, wall);
        // The terminal palettes draw the ASCII stand-ins unless the viewer asked for the icons;
        // every other theme draws the icon config/catalogs/icons.yml maps each glyph name to.
        setGlyphMode(terminalTheme(theme()) && !icons() ? 'ascii' : 'icon');
    });

    return { wall: () => wall, image: () => image };
}
