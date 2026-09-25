import { setCatalog, setGlyphs, setIcons } from '$lib/state/words/text';
import { setAppearance } from '$lib/state/words/appearance';
import { setVocab } from '$lib/state/words/tones';
import { configInstalled } from '$lib/state/words/generation.svelte';
import type { PageLoad } from './$types';

// The catalog, the glyph names with their ASCII stand-ins, the tone vocabulary and the appearance
// the server read are installed before the page renders, so a component can call t(), glyph(),
// toneOf() and themes() while it initialises. Every later change reaches the page as a push on the
// `config` channel instead.
//
// The collection keys are not installed anywhere: they are handed to the page, which registers one
// view per key in the registry of the client it builds. The seed of the `config` channel is handed
// on the same way, since the channel belongs to that client's socket.
//
// The write token is handed on rather than installed: it belongs to the client the page builds, and
// the page puts it in that client's write store. This load runs again on invalidateAll(), so the
// token a restarted server minted replaces the stale one without the page being reloaded by hand.
// That second run replaces the four catalogs as well, which is why it raises the configuration's
// generation at the end, after the last setter: a page already drawn then draws again with what
// this installed instead of holding what it loaded with.
export const load: PageLoad = ({ data }) => {
    setCatalog(data.text);
    setGlyphs(data.glyphs);
    setIcons(data.icons);
    setVocab(data.vocab);
    setAppearance(data.vocab);
    configInstalled();
    return { collections: data.collections, seed: data.seed, token: data.token };
};
