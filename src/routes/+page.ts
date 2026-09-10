import { setCatalog, setGlyphs } from '$lib/state/text';
import { setVocab } from '$lib/state/tones';
import type { PageLoad } from './$types';

// The catalog, the glyphs and the tone vocabulary the server read are installed before the page
// renders, so a component can call t(), glyph() and toneOf() while it initialises. O6 replaces later
// reads with a push over the socket.
export const load: PageLoad = ({ data }) => {
    setCatalog(data.text);
    setGlyphs(data.glyphs);
    setVocab(data.vocab);
    return {};
};
