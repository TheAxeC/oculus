import { setAscii, setCatalog, setGlyphs } from '$lib/state/text';
import { setAppearance } from '$lib/state/appearance';
import { setVocab } from '$lib/state/tones';
import { setToken } from '$lib/state/writes.svelte';
import type { PageLoad } from './$types';

// The catalog, the glyphs and their ASCII stand-ins, the tone vocabulary and the appearance the
// server read are installed before the page renders, so a component can call t(), glyph(), toneOf()
// and themes() while it initialises. O6 replaces later reads with a push over the socket.
//
// The collection keys are not installed anywhere: they are handed to the page, which registers one
// view per key. They are data rather than state because the registry is not a store.
//
// The write token is installed the same way. This load runs again on invalidateAll(), so the token a
// restarted server minted replaces the stale one without the page being reloaded by hand.
export const load: PageLoad = ({ data }) => {
    setCatalog(data.text);
    setGlyphs(data.glyphs);
    setAscii(data.ascii);
    setVocab(data.vocab);
    setAppearance(data.vocab);
    setToken(data.token);
    return { collections: data.collections };
};
