// Layer 3, primitive. The picture beside a file suggested inside `\includegraphics{...}`. The
// suggestions are the language server's (texlab's File items); this module adds markdown
// documentation holding the picture to each item that names a picture the preview draws as an
// image (the picture types of `PICTURE_EXTENSIONS` in latex.ts other than `pdf`), so the completion
// list shows it as it shows any documentation. A `.pdf`, which the preview draws as its name, and
// an `.eps` get none. It is an EditorExtension (types.ts) that hands a hook to the language server
// kit for the completion answers of its own model and for the resolve of one of their items, and it
// adds nothing while the option is off.
//
// The address is the one the preview uses (`address`, the file route), made absolute on the
// page's origin, with each path segment percent-encoded and the characters `!'()*`, which
// `encodeURIComponent` leaves, encoded too, since a parenthesis would end the address in markdown.
// The alt text is the file's base name with every markdown special character escaped by a
// backslash. A file name of a repository is untrusted text, and neither part can end the image or
// start another element.

import { PICTURE_EXTENSIONS, pictureFile } from './latex';
import type { EditorExtension } from '../../types';

/** What the pictures read of the page. */
export type PictureDeps = {
    /** Whether `latex.includegraphics_preview` is on now. */
    enabled: () => boolean;
    /** The folder, against the root, a picture path in the text is resolved from. */
    folder: () => Promise<string>;
    /** Whether a file of the root exists. */
    exists: (path: string) => Promise<boolean>;
    /** The address the file route serves a file of the root at. */
    address: (path: string) => string;
    /** The origin of the page, which the address is made absolute on. */
    origin: () => string;
};

/** The kind a language server gives a file in a completion list. */
const FILE_KIND = 17;

/** Whether a name is a picture the preview draws as an image: a picture type other than `pdf`. */
function drawnAsImage(name: string): boolean {
    const dot = name.lastIndexOf('.');
    if (dot < 0) return false;
    const extension = name.slice(dot + 1).toLowerCase();
    return extension !== 'pdf' && (PICTURE_EXTENSIONS as readonly string[]).includes(extension);
}

/** The text of an `\includegraphics` call that ends at the caret: the path typed so far. */
const OPEN_CALL = /\\includegraphics\*?\s*(?:\[[^\]]*\])?\s*\{([^{}]*)$/;

/** The markdown specials: the backslash, the backtick and each of `*_{}[]()#+-.!<>`. */
const SPECIAL = /[\\`*_{}[\]()#+\-.!<>]/g;

/** A name as markdown text: each special character escaped by a backslash. */
function escapedAlt(name: string): string {
    return name.replace(SPECIAL, (one) => `\\${one}`);
}

/** The absolute address of a picture, safe inside the parentheses of a markdown image. */
function pictureAddress(address: string, origin: string): string {
    const absolute = new URL(address, origin).href;
    return absolute.replace(
        /[!'()*]/g,
        (one) => `%${one.charCodeAt(0).toString(16).toUpperCase()}`
    );
}

/** The markdown of one picture: its alt text and its address. */
function pictureMarkdown(path: string, address: string, origin: string): string {
    const name = path.split('/').at(-1) ?? path;
    return `![${escapedAlt(name)}](${pictureAddress(address, origin)})`;
}

/** One completion item as the server sent it, as far as the pictures read it. */
type Item = { kind?: unknown; label?: unknown; documentation?: unknown };

/** Whether a value is an item with a label and a kind. */
function isItem(value: unknown): value is Item {
    return typeof value === 'object' && value !== null && 'label' in value;
}

/** The path typed so far inside an `\includegraphics` call at the caret, or null outside one. */
function typedPath(before: string): string | null {
    return OPEN_CALL.exec(before)?.[1].trim() ?? null;
}

/**
 * The completion answer, or the one item a resolve answers, with documentation on each item that
 * is a picture of the folder; the answer as it was when the caret is not inside an
 * `\includegraphics` call.
 */
async function withPictures(before: string, result: unknown, deps: PictureDeps): Promise<unknown> {
    const typed = typedPath(before);
    if (typed === null) return result;
    const single = isItem(result);
    const items = single
        ? [result]
        : Array.isArray(result)
          ? result
          : typeof result === 'object' && result !== null && 'items' in result
            ? result.items
            : null;
    if (!Array.isArray(items)) return result;
    const folder = await deps.folder();
    const directory = typed.includes('/') ? typed.slice(0, typed.lastIndexOf('/') + 1) : '';
    const origin = deps.origin();
    const documented = await Promise.all(
        items.map(async (item: unknown) => {
            if (!isItem(item) || item.kind !== FILE_KIND || typeof item.label !== 'string') {
                return item;
            }
            if (!drawnAsImage(item.label)) return item;
            const file = await pictureFile(`${directory}${item.label}`, folder, deps.exists);
            if (file === null) return item;
            const value = pictureMarkdown(file, deps.address(file), origin);
            return { ...item, documentation: { kind: 'markdown', value } };
        })
    );
    if (single) return documented[0];
    return Array.isArray(result)
        ? documented
        : { ...(result as Record<string, unknown>), items: documented };
}

/** The picture preview of the completion list of one LaTeX model, while the option is on. */
export function latexPictures(deps: PictureDeps): EditorExtension {
    return (kit, _editor, model) => {
        const answering = kit.lsp.answering(model, async (position, result) => {
            if (!deps.enabled()) return result;
            const line = model.getLineContent(position.line + 1);
            return await withPictures(line.slice(0, position.character), result, deps);
        });
        return () => answering.dispose();
    };
}
