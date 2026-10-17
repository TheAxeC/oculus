// Layer 2, server. A Vite plugin that keeps PDF.js's stylesheet inside the PDF viewer.
//
// The PDF viewer (views/sources/file/pdf/viewer.svelte.ts) imports pdfjs-dist's pdf_viewer.css,
// whose rules name plain classes such as `.dialog` and `.toolbar` and set its variables on `:root`,
// so imported as it is they style every element of the page with such a class, a modal's box among
// them. This plugin wraps the whole sheet in `@scope (.oc-pdf)`, the viewer's own box
// (views/sources/file/pdf/viewer.css), and sets the variables of its `:root` rules on that box
// (`:scope`), so no rule of it reaches an element outside the viewer. The sheet holds style rules
// and `@media` blocks only, both of which a scope takes. It runs before Vite's own CSS handling,
// which then resolves the sheet's `url()`s as for any stylesheet, in development, in a build and
// under vitest alike.

import type { Plugin } from 'vite';

/** The end of the sheet's path, wherever node_modules is. */
const SHEET = '/pdfjs-dist/web/pdf_viewer.css';

/** The box the sheet is scoped to, the PDF viewer's root element. */
const VIEWER_BOX = '.oc-pdf';

/** The sheet's text scoped to the viewer's box. */
function scopedPdfSheet(css: string): string {
    return `@scope (${VIEWER_BOX}) {\n${css.replace(/:root\b/g, ':scope')}\n}\n`;
}

/** The plugin; it changes the one sheet and leaves every other module as it is. */
export function scopePdfStyles(): Plugin {
    return {
        name: 'oculus:scope-pdf-styles',
        enforce: 'pre',
        transform(code, id) {
            if (!id.split('?')[0].endsWith(SHEET)) return null;
            return { code: scopedPdfSheet(code), map: null };
        }
    };
}
