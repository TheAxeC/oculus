// Layer 2, client state. The web worker that matches the palette's file mode: it holds the names of
// the last answer prepared for matching and answers each query the page posts, so no keystroke is
// matched on the page's own thread. The protocol and the matching are in file-match.ts; the page's
// end is file-matcher.svelte.ts, which starts this module through Vite's `?worker` import.

import { fileList, fileWorkerCore, type FileWorkerIn, type FileWorkerOut } from './file-match.ts';

const handle = fileWorkerCore(
    fileList,
    (out: FileWorkerOut) => self.postMessage(out),
    (run) => void setTimeout(run, 0)
);

self.onmessage = (event: MessageEvent<FileWorkerIn>) => handle(event.data);
