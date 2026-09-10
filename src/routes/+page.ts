import { setCatalog, setGlyphs } from '$lib/state/text';
import type { PageLoad } from './$types';

// The catalog and the glyphs the server read are installed before the page renders, so a component
// can call t() and glyph() while it initialises. O6 replaces later reads with a push over the socket.
export const load: PageLoad = ({ data }) => {
    setCatalog(data.text);
    setGlyphs(data.glyphs);
    return {};
};
