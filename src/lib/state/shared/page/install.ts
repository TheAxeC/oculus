// Layer 2, client state. What a page's load installs before it renders: the words, the glyphs, the
// icons, the tone vocabulary and the appearance the server read, so a component can call t(),
// glyph(), toneOf() and themes() while it initialises. The main page and the find bar's page both
// install the same five, and the configuration's generation is raised once, after the last setter.

import { configInstalled } from '../words/generation.svelte.ts';
import { setAppearance } from '../words/appearance.ts';
import { setCatalog, setGlyphs, setIcons } from '../words/text.ts';
import { setVocab } from '../words/tones.ts';

/** What the server hands a page's load of the configuration. */
export type PageConfig = {
    text: Record<string, string>;
    glyphs: Record<string, string>;
    icons: Record<string, string>;
    vocab: Record<string, unknown>;
};

/** Install the configuration a page was handed. */
export function installPageConfig(data: PageConfig): void {
    setCatalog(data.text);
    setGlyphs(data.glyphs);
    setIcons(data.icons);
    setVocab(data.vocab);
    setAppearance(data.vocab);
    configInstalled();
}
