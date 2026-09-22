// Layer 2, client state. Which generation of the configuration the page is drawing: one counter the
// config push raises once, after the catalog, the glyph vocabulary, the tone vocabulary and the
// appearance have all been installed.
//
// It is one rune and nothing else, and it lives apart from state/words/text.ts,
// state/words/tones.ts and state/words/appearance.ts because those three are plain TypeScript and a
// rune needs a .svelte.ts file. The reason it has to be a rune at all: those three hold what the
// server last sent in plain module variables, so a template that called t(), toneOf() or themes()
// has nothing to re-run when a push replaces one of them. Every exported reader of the three reads
// this counter first, which puts the read inside the caller's own effect, exactly as
// state/words/glyphmode.svelte.ts does for a glyph.
//
// One counter for the whole push rather than one per store: the readers are many and the push is
// one, and a single raise after every setter is what makes a component see the new strings and the
// new tones together instead of half of each.
//
// It is module-level, with the three catalogs whose reads it makes reactive, and is named in the
// boundaries rule beside them: the catalogs it stands for are module-level, so a counter held per
// client would say a push had landed for one client and not for another over the same three maps.

const held: { generation: number } = $state({ generation: 0 });

/**
 * The generation of the installed configuration. Reading it inside a template or a $derived is what
 * makes that caller draw again on the next push; reading it anywhere else is an ordinary number.
 */
export function configGeneration(): number {
    return held.generation;
}

/** Announce a config push as installed in full. The socket calls this once, after every setter. */
export function configInstalled(): void {
    held.generation += 1;
}
