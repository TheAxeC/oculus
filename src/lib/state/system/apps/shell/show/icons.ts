// Layer 2, client state. The icon of a command or a tree row an app declares: `$(name)` names a
// glyph of config/catalogs/glyphs.yml, and any other text is a file of the app, drawn as a picture
// from the app's address. A glyph name the vocabulary lacks draws no icon, so the words stand
// alone.

import { hasGlyph } from '../../../../shared/words/text.ts';

/** What an icon is drawn as: a glyph, a picture from an address, or nothing. */
export type AppIcon = { glyph: string } | { picture: string } | null;

const GLYPH = /^\$\(([^)]+)\)$/;

/** The icon `raw` names; `picture` gives the address of a file of the app. */
export function appIcon(raw: string, picture: (path: string) => string): AppIcon {
    if (raw === '') return null;
    const named = GLYPH.exec(raw);
    if (named !== null) return hasGlyph(named[1]) ? { glyph: named[1] } : null;
    const address = picture(raw);
    return address === '' ? null : { picture: address };
}

/** One run of an item's text: words, or a glyph (turning while its name ends in `~spin`). */
export type TextPart = { text: string } | { glyph: string; turning: boolean };

const INLINE = /\$\(([^)]+)\)/g;

/**
 * The runs of a status item's text. `$(name)` draws the glyph of that name; a name that is not a
 * glyph is drawn as written, `$(name)` included.
 */
export function textParts(text: string): TextPart[] {
    const parts: TextPart[] = [];
    let from = 0;
    const push = (part: TextPart): void => {
        const last = parts.at(-1);
        if (last !== undefined && 'text' in last && 'text' in part) last.text += part.text;
        else parts.push(part);
    };
    for (const found of text.matchAll(INLINE)) {
        if (found.index > from) push({ text: text.slice(from, found.index) });
        const [name, modifier] = found[1].split('~');
        push(hasGlyph(name) ? { glyph: name, turning: modifier === 'spin' } : { text: found[0] });
        from = found.index + found[0].length;
    }
    if (from < text.length) push({ text: text.slice(from) });
    return parts;
}
