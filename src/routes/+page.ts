import { setCatalog, setGlyphs } from '$lib/state/text';
import { setAppearance } from '$lib/state/appearance';
import { setVocab } from '$lib/state/tones';
import type { PageLoad } from './$types';

// The catalog, the glyphs, the tone vocabulary and the theme list the server read are installed
// before the page renders, so a component can call t(), glyph(), toneOf() and themes() while it
// initialises. O6 replaces later reads with a push over the socket.
export const load: PageLoad = ({ data }) => {
    setCatalog(data.text);
    setGlyphs(data.glyphs);
    setVocab(data.vocab);
    setAppearance(data.vocab);
    return {};
};
