// The computed-style readings the browser specs share: a colour's alpha, in either of the two
// forms a browser returns it in.

/** The alpha of a computed colour, in either the comma form or the slash form a browser may return. */
export function alphaOf(colour: string): number {
    const slash = colour.match(/\/\s*([\d.]+)(%?)\s*\)/);
    if (slash !== null) {
        return slash[2] === '%' ? Number.parseFloat(slash[1]) / 100 : Number.parseFloat(slash[1]);
    }
    const comma = colour.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
    return comma === null ? 1 : Number.parseFloat(comma[1]);
}
