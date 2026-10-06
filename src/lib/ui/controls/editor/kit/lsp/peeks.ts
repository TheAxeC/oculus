// Layer 3, primitive. The models of files no tab holds. A location a server answers in a file no
// tab has open (a definition in a header, a reference in another module) needs a model for
// Monaco's peek and references widgets, which read the target's text through a model. The model is
// read through the services, made under the file's language and the page's address of it, and
// never sent to a server. A file that cannot be read, or is truncated, gets no model, and the
// location is dropped from the answer.
//
// Monaco has no read-only model, so a peek editor that is typed into is put back to the text that
// was read. A file's model is shared by the clients that ask for it and disposed with the last of
// them; one unattached to an editor is also disposed once the transport sweeps it.

import type * as Monaco from 'monaco-editor';
import { shikiId } from '../grammars';
import type { LspServices } from './services';
import type { Place } from './uris';

/** A model and the clients holding it. */
type Held = { model: Monaco.editor.ITextModel; holders: number; stop: { dispose(): void } };

/** The peek models of one page. */
export type Peeks = {
    /** The model of a file, read and made under the address; null when the file cannot be read. */
    acquire(
        services: LspServices,
        place: Place,
        page: string,
        spelling: number
    ): Promise<Monaco.editor.ITextModel | null>;
    /** Give a model back; it is disposed when no client holds it. */
    release(model: Monaco.editor.ITextModel): void;
};

/** The address a peek model has: the page's, with a variant when two addresses differ by case. */
function addressOf(monaco: typeof Monaco, page: string, spelling: number): Monaco.Uri {
    const uri = monaco.Uri.parse(page);
    return spelling === 0 ? uri : uri.with({ query: `spelling=${String(spelling)}` });
}

/** The peek models of a Monaco, and the load of the grammar a model's language needs. */
export function createPeeks(
    monaco: typeof Monaco,
    ensureLanguage: (name: string) => Promise<void>
): Peeks {
    const held = new Map<Monaco.editor.ITextModel, Held>();
    return {
        async acquire(services, place, page, spelling) {
            const uri = addressOf(monaco, page, spelling);
            const existing = monaco.editor.getModel(uri);
            const known = existing === null ? undefined : held.get(existing);
            if (existing !== null && known !== undefined) {
                known.holders += 1;
                return existing;
            }
            if (existing !== null) return null;
            const read = await services.readFile(place.root, place.path);
            if (read === null) return null;
            const again = monaco.editor.getModel(uri);
            const shared = again === null ? undefined : held.get(again);
            if (again !== null && shared !== undefined) {
                shared.holders += 1;
                return again;
            }
            if (again !== null) return null;
            await ensureLanguage(read.language);
            const model = monaco.editor.createModel(read.text, shikiId(read.language), uri);
            let restoring = false;
            const stop = model.onDidChangeContent(() => {
                if (restoring) return;
                restoring = true;
                model.setValue(read.text);
                restoring = false;
            });
            held.set(model, { model, holders: 1, stop });
            return model;
        },
        release(model) {
            const one = held.get(model);
            if (one === undefined) return;
            one.holders -= 1;
            if (one.holders > 0) return;
            held.delete(model);
            one.stop.dispose();
            if (!model.isDisposed()) model.dispose();
        }
    };
}
