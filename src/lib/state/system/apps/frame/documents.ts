// Layer 2, client state. The bytes of the file a custom editor was opened on: `document.read`,
// `document.save` and `document.dirty` of the editor's frame. The page reads and writes through the
// server's document route (`/api/app-document`), which applies the checks `open({ file })` applies
// and, on a save, compares the hash of the bytes last read with the file on disk. A save while a
// source tab of the same file holds unsaved text is refused `refused:unsaved`, the text kept; a
// file that changed on disk since it was read is saved over only when the reader says so.

import { t } from '../../../shared/words/text.ts';
import type { WritesStore } from '../../../shared/stores/shapes.ts';
import { fromBase64, toBase64 } from './bytes.ts';
import type { ServerAnswer } from './methods.ts';
import { REFUSED, failedWith, refusedWith } from './rules.ts';

/** What the document of one editor tab needs of the rest of the page. */
export type DocumentDeps = {
    /** The app's view id. */
    app: string;
    /** The app's title, for the question a changed file asks. */
    title: () => string;
    file: { root: string; path: string };
    get: (address: string) => Promise<Response>;
    post: WritesStore['postCommand'];
    /** Whether a source tab of the file holds unsaved text. */
    unsaved: (root: string, path: string) => boolean;
    /** Ask the reader, in the tab, whether to go on. */
    ask: (question: { message: string; detail: string }) => Promise<boolean>;
    /** Mark the tab as holding unsaved changes, or clear the mark. */
    mark: (dirty: boolean) => void;
};

type DocumentAnswer = ServerAnswer & { hash?: string; content?: string };

export function createDocument(deps: DocumentDeps) {
    const { file } = deps;
    let hash = '';

    /** One call to the document route: a read when `post` is null, else a save. */
    async function call(post: { base: string; content: string } | null): Promise<DocumentAnswer> {
        const query = { app: deps.app, ...file };
        try {
            if (post === null) {
                const response = await deps.get(
                    `/api/app-document?${new URLSearchParams(query).toString()}`
                );
                return (await response.json()) as DocumentAnswer;
            }
            const posted = await deps.post('/api/app-document', { ...query, ...post });
            if (!posted.ok) return { ok: false, word: failedWith(posted.status) };
            return posted.body as unknown as DocumentAnswer;
        } catch {
            return { ok: false, word: failedWith(0) };
        }
    }

    return {
        read: async (): Promise<ServerAnswer | null> => {
            const answer = await call(null);
            if (!answer.ok) return answer;
            hash = answer.hash ?? '';
            return { ok: true, value: fromBase64(answer.content ?? '') };
        },
        save: async (bytes: Uint8Array): Promise<ServerAnswer | null> => {
            if (deps.unsaved(file.root, file.path)) {
                return { ok: false, word: refusedWith('unsaved') };
            }
            const body = { base: hash, content: toBase64(bytes) };
            let answer = await call(body);
            if (!answer.ok && answer.word === 'changed') {
                const yes = await deps.ask({
                    message: t('apps.document_changed', deps.title(), file.path),
                    detail: ''
                });
                if (!yes) return { ok: false, word: REFUSED.declined };
                const current = await call(null);
                if (!current.ok) return current;
                answer = await call({ ...body, base: current.hash ?? '' });
            }
            if (!answer.ok) return answer;
            hash = answer.hash ?? hash;
            return { ok: true, value: null };
        },
        dirty: (flag: boolean): void => deps.mark(flag)
    };
}
