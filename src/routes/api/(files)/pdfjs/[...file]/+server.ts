// Layer 2, server route. The files PDF.js reads while it draws a PDF (character maps, standard
// fonts, WebAssembly decoders), served from the package's own folders. A route module may export
// only its verbs, so what it does lives in lib/server/content/latex/pdfjs-assets.ts and this is the
// few lines that join it to Kit. The origin guard in src/hooks.server.ts answers a request from
// another page before anything is read.

import { pdfjsAsset } from '$lib/server/content/latex/pdfjs-assets';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => pdfjsAsset(params.file);
