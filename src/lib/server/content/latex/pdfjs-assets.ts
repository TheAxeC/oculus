// Layer 2, server. The files PDF.js reads while it draws a PDF: the character maps a font without
// an embedded encoding needs, the standard fonts a PDF names without embedding, and the WebAssembly
// decoders for the image formats the browser has none for. The viewer (views/sources/file/pdf/)
// points PDF.js at /api/pdfjs/<folder>/<name>, and this answers it from the folders of the package
// itself.
//
// Only a name the package's own `cmaps/`, `standard_fonts/` or `wasm/` folder lists is served, read
// from a listing taken at each request, so no path the request composes reaches a file outside
// them. The package folder is found through Node's resolution of `pdfjs-dist/package.json`, which
// is where the package is installed whatever the layout of node_modules.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { z } from 'zod';

/** The folders of the package a request may name. */
const FOLDERS = ['cmaps', 'standard_fonts', 'wasm'] as const;

/** A request's path: one of the folders and the name of a file in it. */
const assetShape = z.tuple([z.enum(FOLDERS), z.string().min(1)]);

/** What each extension is sent as; every other file is sent as plain bytes. */
const TYPES: Record<string, string> = {
    '.wasm': 'application/wasm',
    '.js': 'text/javascript',
    '.ttf': 'font/ttf'
};

/** A day: the files belong to the installed version of the package, which a reinstall replaces. */
const CACHE = 'public, max-age=86400';

/** The package's folder, resolved from this module. */
function packageFolder(): string {
    return dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));
}

/** The file one PDF.js request names, or the 404 for a name the package's folders do not list. */
export function pdfjsAsset(file: string): Response {
    const named = assetShape.safeParse(file.split('/'));
    if (!named.success) return new Response(null, { status: 404 });
    const [folder, name] = named.data;
    const base = join(packageFolder(), folder);
    try {
        const path = join(base, name);
        if (!readdirSync(base).includes(name) || !statSync(path).isFile()) {
            return new Response(null, { status: 404 });
        }
        const type = TYPES[extname(name).toLowerCase()] ?? 'application/octet-stream';
        return new Response(readFileSync(path), {
            headers: { 'content-type': type, 'cache-control': CACHE }
        });
    } catch {
        return new Response(null, { status: 404 });
    }
}
