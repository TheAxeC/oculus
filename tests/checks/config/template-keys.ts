// Layer 4, test helper. The keys a template of docs/templates.md shows: the YAML block under a
// heading of the page, and the dotted path of every key the block holds, set or commented.
//
// A block is read a line at a time. A line that starts with `#` is read without it and one space
// after it, so a commented key counts as a key. A line is a key when it is spaces, then a name of
// letters, digits, `_` and `-`, then a colon and a space or the line's end, which no sentence of a
// comment is, since its first word is followed by a space. A key's path is the keys it is indented
// under, joined by dots. An `example:` key and the key lines after it at its indent or deeper are
// left out, since they show a value and name no key; the page writes an example's value at the
// indent of `example:` itself. A path counts when no other key sits under it: `slurm` holds
// `resource`, so `slurm.resource` is the key the block shows.

/** A key line once its comment mark is taken off: its indent and its name. */
const KEY_LINE = /^( *)([A-Za-z_][A-Za-z0-9_-]*):(?: |$)/;

/** The key that shows a value under a key, which names no key of its own. */
const EXAMPLE = 'example';

/** The first YAML block under the heading of a page that reads exactly `heading`. */
export function templateBlock(page: string, heading: string): string {
    const lines = page.split('\n');
    const at = lines.indexOf(heading);
    if (at < 0) throw new Error(`no heading ${heading} in the page`);
    const open = lines.indexOf('```yaml', at);
    const close = lines.indexOf('```', open + 1);
    if (open < 0 || close < 0) throw new Error(`no YAML block under ${heading}`);
    return lines.slice(open + 1, close).join('\n');
}

/** The dotted path of every key a block holds, set or commented, the paths under none other. */
export function templateKeys(block: string): string[] {
    const held: { indent: number; name: string }[] = [];
    const paths: string[] = [];
    let skipUnder: number | null = null;
    for (const raw of block.split('\n')) {
        const line = raw.startsWith('#') ? raw.slice(1).replace(/^ /, '') : raw;
        const key = KEY_LINE.exec(line);
        if (key === null) continue;
        const indent = key[1].length;
        const name = key[2];
        if (skipUnder !== null && indent >= skipUnder) continue;
        skipUnder = null;
        while (held.length > 0 && held[held.length - 1].indent >= indent) held.pop();
        if (name === EXAMPLE) {
            skipUnder = indent;
            continue;
        }
        held.push({ indent, name });
        paths.push(held.map((one) => one.name).join('.'));
    }
    const leaves = paths.filter((path) => !paths.some((other) => other.startsWith(`${path}.`)));
    return [...new Set(leaves)].sort();
}

/** The keys a list names that a block lacks, and the keys a block shows that the list lacks. */
export function keyDifference(
    listed: readonly string[],
    shown: readonly string[]
): { missing: string[]; extra: string[] } {
    return {
        missing: listed.filter((key) => !shown.includes(key)).sort(),
        extra: shown.filter((key) => !listed.includes(key)).sort()
    };
}
