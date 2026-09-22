// Layer 2, client state. Which of the two glyph vocabularies is in force: the characters
// config/catalogs/glyphs.yml names, or the ASCII stand-ins beside them.
//
// It is one rune and nothing else, and it lives apart from state/words/text.ts because that module
// is plain TypeScript and a rune needs a .svelte.ts file. The reason it has to be a rune at all:
// the swap happens where a glyph renders, so every component that drew one has to draw it again
// when the mode changes. state/words/text.ts reads this inside glyph() and asciiOf(), which is what
// makes the read part of the component's own effect.
//
// It is module-level for the same reason state/client/generation.svelte.ts is: it is read inside
// asciiOf() from every layer, `ui/` included, where there is no client object to read it from.

/** The characters as authored, or their ASCII stand-ins. */
export type GlyphMode = 'unicode' | 'ascii';

const held: { mode: GlyphMode } = $state({ mode: 'unicode' });

/** Which vocabulary is in force. */
export function glyphMode(): GlyphMode {
    return held.mode;
}

/** Put one of the two vocabularies in force. The shell's theme effect is what calls this. */
export function setGlyphMode(next: GlyphMode): void {
    held.mode = next;
}
