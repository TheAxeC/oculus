// Layer 2, client state. Which of the two ways a glyph is drawn is in force: the line icon
// config/catalogs/icons.yml maps its name to, or the ASCII stand-in config/catalogs/glyphs.yml
// gives it.
//
// It is one rune and nothing else, and it lives apart from state/words/text.ts because that module
// is plain TypeScript and a rune needs a .svelte.ts file. The reason it has to be a rune at all:
// the swap happens where a glyph renders, so every component that drew one has to draw it again
// when the mode changes. state/words/text.ts reads this inside iconSvg() and bracketedGlyph(),
// which is what makes the read part of the component's own effect.
//
// It is module-level for the same reason state/client/generation.svelte.ts is: it is read inside
// iconSvg() from every layer, `ui/` included, where there is no client object to read it from.

/** The line icons, or the ASCII stand-ins. */
export type GlyphMode = 'icon' | 'ascii';

const held: { mode: GlyphMode } = $state({ mode: 'icon' });

/** Which way of drawing a glyph is in force. */
export function glyphMode(): GlyphMode {
    return held.mode;
}

/** Put one of the two in force. The shell's theme effect is what calls this. */
export function setGlyphMode(next: GlyphMode): void {
    held.mode = next;
}
