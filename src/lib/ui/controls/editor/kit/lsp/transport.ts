// Layer 3, primitive. The transport one language's Monaco LSP client runs over: it carries the
// client's messages to the page's port and the port's to the client, and owns which models the
// server sees, which Monaco's client leaves to its host. It is written over a minimal model
// interface and a port, with no DOM, so its document set and its rewriting of addresses run in the
// unit suite's client runtime without a Monaco.
//
// A model is registered with the file it shows. The transport sends its own `didOpen` with the
// text and version 1, numbers every later `didChange` of the file, and sends `didClose` when the
// last model of the file goes. The client's synchroniser opens every model of the page, whatever
// its language or owner, so every `didOpen`, `didChange` and `didClose` the client sends is
// dropped here. A feature request from a model that is not registered (a diff side, a merge pane,
// a model of another language) is answered at once with an empty result and never reaches the
// port. Two models of one file are one document: the server follows the first registered model,
// and a request from either is sent for the file.
//
// The client names a document by its model's `inmemory:` address and the relay by the page's
// address (uris.ts); the transport turns each into the other, in every field that holds one. A
// location in a file no model holds is answered with a peek model the host reads and makes
// (`TransportHost.peek`), and a location the host cannot make a model of is dropped from the
// answer. The client finds a model by its address lower-cased, so two models whose addresses
// differ only in case are given addresses that do not.
//
// What the client has no handler for is the transport's own: `publishDiagnostics` and
// `inactiveRegions` go to the host, and `workspace/semanticTokens/refresh` is answered and told to
// the host. An edit a server asks for (its `workspace/applyEdit`, a rename's answer, a code
// action's edit) is never given to Monaco, whose client applies an edit to the models it can name:
// the transport hands the whole edit to the host (`TransportHost.applyEdit`), which edits the
// tabs and writes the other files or refuses the whole edit with a notice. A code action's edit is
// kept under a token and the action carries the command that applies it (`APPLY_COMMAND`), so an
// action that names other files is offered like any other. An edit whose document changed since
// the request it answers was made is refused. The client declares `workspace.applyEdit` and a
// `workspace.workspaceEdit` of `documentChanges` with transactional failure handling to the
// server. A request of the client the relay could not pass on to a server is answered with no
// result. The host's own questions to the server (the
// symbols, the semantic tokens, the formatting) go through `ask`, which answers the protocol's
// result as the relay sent it, addresses in the page's form.
//
// A rename is asked in two steps and the transport answers each as VS Code's language client does
// (transport/renames.ts). The `prepareRename` the client sends is held back until the server has
// answered; a refusal or no answer rejects it with the sentence, which Monaco shows at the caret,
// and every other answer is passed on. The rename a server refuses is told as a notice of the page,
// since the box is closed by then. The edit a rename answers is handed to the host with the mark
// of whether the reader asked for the preview (`TransportHost.applyEdit`), and the host decides
// whether it is made at once or shown first. The places a definition, declaration, type definition
// or implementation answer names are told to the host (`TransportHost.targeted`).
//
// A library file a server names in an answer (`oculus-lib:` in uris.ts) is told to the host with
// the root of the document the request was made for, and is answered like any other file: the model
// of the tab that holds it, else a peek model the host reads through the channel. A library address
// of an answer to a request no document made names no root to read it under, so the location is
// dropped. A library tab registers its model under the library address, which is then the page's
// address of the document in every message the transport sends.
//
// The messages the relay adds to the channel (those with an `oculus` field) belong to the state
// side and are ignored here, but for the `state` of a root (transport/roots.ts). A root that left
// (`failed` with the code `root_gone`) holds none of its documents on the relay any more, so a
// request for one of its documents is answered with a null result and not sent, and an error
// answer for such a request that arrives after the root left is answered with a null result as
// well, as a request the relay cancelled is; Monaco's client turns an error into a rejection that
// it throws to the page. When the root is served again the open documents under it are put on the
// server again. Messages are handled one at a time in the order they arrived, so a peek read in
// the middle of one answer never lets a later one overtake it. The answer to a completion request
// is given to the host last (`TransportHost.completed`), which may add to its items, and so is the
// answer to the resolve of one of them, with the params of the completion request whose answer the
// client listed when it asked for the resolve.

import type { LspDiagnostic, LspEditOutcome, LspFrame, LspPort } from './services';
import {
    APPLY_COMMAND,
    BARE_DOCUMENT,
    Closed,
    DROP,
    NO_DOCUMENT,
    OWN,
    REQUEST_CANCELLED,
    SPELLINGS,
    SYNC,
    changesOf,
    isRecord,
    keyOf,
    type LspModel,
    type LspRange,
    type ModelChange,
    type Rpc,
    type TextEdit
} from './transport/messages';
import { Connection } from './transport/connection';
import { addressesIn, pageOf, toPage } from './transport/addresses';
import { GoneRoots } from './transport/roots';
import { EDITING, type Doc, type Own, type Peek, type Waiting } from './transport/records';
import {
    JUMPS,
    PREPARE,
    RENAME,
    Settling,
    placesOf,
    refusalOf,
    type Jump
} from './transport/renames';
import {
    EditTokens,
    declaringEdits,
    keeping,
    nameOfPage,
    sourceActionsOf,
    sourceRequest,
    staleFile,
    toClient,
    type KeptEdit
} from './transport/edits';
import { libraryOf, pageUri, placeOf, type Place, type Target } from './uris';

/** What the host does for the transport. */
export type TransportHost = {
    /**
     * Make a read-only model of a file no tab holds, under the page's address of it, `spelling`
     * naming the variant of the address to use when the plain one differs from another model's only
     * by case (0 for the plain one). Null when the file cannot be read.
     */
    peek(target: Target, page: string, spelling: number): Promise<LspModel | null>;
    /** Dispose a peek model the transport has no use for. */
    drop(model: LspModel): void;
    /** Apply edits to a registered model as one undo stop; false when it could not be. */
    apply(model: LspModel, edits: readonly TextEdit[]): boolean;
    /**
     * Make the edit a server asked for, all or none; the outcome says why not. `preview` is set for
     * the answer of a rename the reader asked to see before it is made, which is then shown and
     * not made until the reader says so.
     */
    applyEdit(edit: unknown, preview: boolean): Promise<LspEditOutcome>;
    /** The reader asks for the next rename to be previewed, or the mark is cleared (false). */
    markPreview(marked: boolean): void;
    /** Whether the next rename was marked for the preview; reading it clears the mark. */
    takePreview(): boolean;
    /**
     * The places the answer to a jump named, for the editor with the address `asking` (the
     * client's address of its model), in the client's addresses.
     */
    targeted(asking: string, places: readonly Jump[]): void;
    /** A catalog line of the page's words, filled with `words`. */
    words(key: string, ...words: string[]): string;
    /**
     * A server's diagnostics for one file, whether or not a model holds it: the file's address,
     * and its place when it is a file of a served root.
     */
    diagnostics(page: string, place: Place | null, items: readonly LspDiagnostic[]): void;
    /** The regions of a file clangd found inactive, by the file's address. */
    inactive(page: string, regions: readonly LspRange[]): void;
    /** A server named a library file in an answer to a request made for a document of the root. */
    library(address: string, root: string): void;
    /** The server asks for its semantic tokens again. */
    refreshTokens(): void;
    /** The capabilities the server's `initialize` answer declared. */
    declared(capabilities: Record<string, unknown>): void;
    /** Shows a notice by its catalog key, with the words it is said with. */
    notice(key: string, ...words: string[]): void;
    /**
     * The answer to a completion request, or the one item a resolve answers, in the client's form,
     * for the host to add to; `request` is the client's params of the completion request. It
     * answers `result` itself when it adds nothing.
     */
    completed(request: unknown, result: unknown): Promise<unknown>;
};

/** The transport of one language over one open period of its port. */
export class LspTransport {
    readonly state = new Connection();
    #port: LspPort;
    #host: TransportHost;
    #language: string;
    #now: () => number;
    #listener: ((message: Rpc) => void) | undefined;
    #early: Rpc[] = [];
    #docs = new Map<string, Doc>();
    #byModel = new Map<LspModel, Doc>();
    #watching = new Map<LspModel, { dispose(): void }>();
    /** The client's address of every model it may name, by that address, to the page's address. */
    #addresses = new Map<string, string>();
    /** The same addresses lower-cased, which is how the client looks a model up. */
    #lowered = new Map<string, string>();
    #peeks = new Map<string, Peek>();
    #gone = new GoneRoots();
    #waiting = new Map<number | string, Waiting>();
    #tokens: EditTokens;
    #own = new Map<string, Own>();
    #next = 0;
    /** The params of the last completion request answered, the list the client shows. */
    #listed: unknown = null;
    #chain: Promise<void> = Promise.resolve();
    #closed = false;
    #stops: (() => void)[] = [];

    constructor(port: LspPort, language: string, host: TransportHost, now: () => number) {
        this.#port = port;
        this.#language = language;
        this.#tokens = new EditTokens(language);
        this.#host = host;
        this.#now = now;
        this.state.set(port.state.value);
        this.#stops.push(
            port.state.onChange((value) => {
                this.state.set(value);
                if (value === 'closed') this.close();
            }),
            port.listen((frame) => this.#enqueue(() => this.#handle(frame)))
        );
    }

    toString(): string {
        return `oculus lsp:${this.#language}`;
    }

    /** The client's listener for what comes from the relay; messages that came before it wait. */
    setListener(listener: ((message: Rpc) => void) | undefined): void {
        this.#listener = listener;
        if (listener === undefined) return;
        for (const message of this.#early.splice(0)) listener(message);
    }

    /** Whether the transport ended: its port closed, or the host ended it. */
    get closed(): boolean {
        return this.#closed;
    }

    // ------------------------------------------------------------------ documents

    /** Whether a model is registered. */
    has(model: LspModel): boolean {
        return this.#byModel.has(model);
    }

    /** The models of every registered document. */
    registered(): LspModel[] {
        return [...this.#byModel.keys()];
    }

    /**
     * Register a model with the file it shows, and open the file on the server when it is new. A
     * library file is registered under its library address, with the root it was named under.
     */
    register(model: LspModel, place: Place, address?: string): void {
        if (this.#closed || this.#byModel.has(model)) return;
        const page = address ?? pageUri(place);
        let doc = this.#docs.get(page);
        const first = doc === undefined;
        if (doc === undefined) {
            doc = { place, page, language: model.getLanguageId(), models: [], version: 1 };
            this.#docs.set(page, doc);
        }
        doc.models.push(model);
        this.#byModel.set(model, doc);
        this.#name(model, page);
        this.#watching.set(
            model,
            model.onDidChangeContent((event) => this.#changed(model, doc, event.changes))
        );
        this.#retire(page);
        if (first) this.#sendOpen(doc);
    }

    /** The `didOpen` that puts a document on the server, with the text of its first model. */
    #sendOpen(doc: Doc): void {
        this.#write({
            jsonrpc: '2.0',
            method: 'textDocument/didOpen',
            params: {
                textDocument: {
                    uri: doc.page,
                    languageId: doc.language,
                    version: doc.version,
                    text: doc.models[0].getValue()
                }
            }
        });
    }

    /** Take a model away; the file is closed on the server with its last model. */
    unregister(model: LspModel): void {
        const doc = this.#byModel.get(model);
        if (doc === undefined) return;
        this.#byModel.delete(model);
        this.#watching.get(model)?.dispose();
        this.#watching.delete(model);
        this.#forget(keyOf(model));
        const wasPrimary = doc.models[0] === model;
        doc.models = doc.models.filter((one) => one !== model);
        if (doc.models.length === 0) {
            this.#docs.delete(doc.page);
            this.#write({
                jsonrpc: '2.0',
                method: 'textDocument/didClose',
                params: { textDocument: { uri: doc.page } }
            });
            return;
        }
        if (!wasPrimary) return;
        // The server follows the first model, so the new first model's whole text replaces it.
        doc.version += 1;
        this.#write({
            jsonrpc: '2.0',
            method: 'textDocument/didChange',
            params: {
                textDocument: { uri: doc.page, version: doc.version },
                contentChanges: [{ text: doc.models[0].getValue() }]
            }
        });
    }

    /** One change of a model: sent for the file when the model is the one the server follows. */
    #changed(model: LspModel, doc: Doc, changes: readonly ModelChange[]): void {
        if (this.#closed || doc.models[0] !== model) return;
        doc.version += 1;
        this.#write({
            jsonrpc: '2.0',
            method: 'textDocument/didChange',
            params: {
                textDocument: { uri: doc.page, version: doc.version },
                contentChanges: changesOf(changes)
            }
        });
    }

    /** Remember a model's address in the client's form, and that it names the page's. */
    #name(model: LspModel, page: string): void {
        const key = keyOf(model);
        this.#addresses.set(key, page);
        this.#lowered.set(key.toLowerCase(), key);
    }

    #forget(key: string): void {
        this.#addresses.delete(key);
        this.#lowered.delete(key.toLowerCase());
    }

    /** A peek model of a file a tab opened is not needed: the tab's model answers. */
    #retire(page: string): void {
        const peek = this.#peeks.get(page);
        if (peek === undefined) return;
        this.#peeks.delete(page);
        this.#forget(keyOf(peek.model));
        this.#host.drop(peek.model);
    }

    /** Peek models no editor shows, past the seconds a new one is given to be shown. */
    sweep(shown: (model: LspModel) => boolean, graceMs: number): void {
        for (const [page, peek] of this.#peeks) {
            if (this.#now() - peek.made < graceMs || shown(peek.model)) continue;
            this.#peeks.delete(page);
            this.#forget(keyOf(peek.model));
            this.#host.drop(peek.model);
        }
    }

    // ------------------------------------------------------------------ to the server

    /** What the client sends: the one method of the client's transport. */
    send(message: Rpc): Promise<void> {
        if (this.#closed) return Promise.resolve();
        const method = message.method;
        if (method === undefined) {
            this.#write(message);
            return Promise.resolve();
        }
        if (message.id === undefined || message.id === null) {
            if (!SYNC.includes(method)) this.#write(message);
            return Promise.resolve();
        }
        const id = message.id;
        if (method === 'initialize') {
            this.#waiting.set(id, { method, params: message.params, asking: null, asked: null });
            this.#write({ ...message, params: declaringEdits(message.params) });
            return Promise.resolve();
        }
        if (method === 'codeAction/resolve' && this.#isKept(message.params)) {
            // An action whose edit the transport keeps has nothing for the server to resolve.
            const result = message.params;
            this.#enqueue(() => this.#deliver({ jsonrpc: '2.0', id, result }));
            return Promise.resolve();
        }
        return this.#forward(id, method, message.params);
    }

    /** One request of the client sent to the server with its addresses turned. */
    #forward(id: number | string, method: string, given: unknown): Promise<void> {
        const asking = this.#askingOf(given);
        const params = toPage(this.#addresses, given);
        if (params === null || this.#left(asking)) {
            this.#enqueue(() => this.#deliver({ jsonrpc: '2.0', id, result: null }));
            return Promise.resolve();
        }
        const asked = EDITING.includes(method) ? this.#versions() : null;
        const listed = method === 'completionItem/resolve' ? { listed: this.#listed } : {};
        // A rename is previewed when the reader marked it; asking whether a rename can be made
        // clears an earlier mark, and the client is told nothing until the server has answered.
        if (method === PREPARE) this.#host.markPreview(false);
        const preview = method === RENAME ? { preview: this.#host.takePreview() } : {};
        const settle = method === PREPARE ? new Settling() : undefined;
        this.#waiting.set(id, {
            method,
            params: given,
            asking,
            asked,
            ...listed,
            ...preview,
            settle
        });
        this.#write({ jsonrpc: '2.0', id, method, params: params.value });
        return settle?.promise ?? Promise.resolve();
    }

    /**
     * The text the server holds of every document of this transport, by the page's address of the
     * file: the text of the document's first model, which the server follows.
     */
    documents(): Map<string, string> {
        return new Map(
            [...this.#docs].flatMap(([page, doc]) =>
                doc.models.length === 0 ? [] : [[page, doc.models[0].getValue()] as const]
            )
        );
    }

    /** The version of every document the server holds. */
    #versions(): Map<string, number> {
        return new Map([...this.#docs].map(([page, doc]) => [page, doc.version]));
    }

    /** Whether a code action is one whose edit the transport keeps, by its command. */
    #isKept(action: unknown): boolean {
        const command = isRecord(action) ? action.command : null;
        return isRecord(command) && command.command === APPLY_COMMAND;
    }

    /** The client's address of the document a request is made for, or null for none. */
    #askingOf(params: unknown): string | null {
        const document = isRecord(params) ? params.textDocument : null;
        return isRecord(document) && typeof document.uri === 'string' ? document.uri : null;
    }

    /** Write a message to the port; one that cannot be sent is dropped, never queued. */
    #write(message: Rpc): boolean {
        if (this.#closed) return false;
        return this.#port.send(message);
    }

    /**
     * Ask the server about a registered model's file and answer the protocol's result, addresses in
     * the page's form. Rejects with `Closed` when the port is closed or the transport ended, and
     * with the server's own error otherwise.
     */
    ask(model: LspModel, method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        const doc = this.#byModel.get(model);
        if (this.#closed || doc === undefined) return Promise.reject(new Closed());
        return this.#askAbout(doc, method, params);
    }

    /**
     * Run a command of the server; the addresses of its arguments are turned as a request's are.
     * Null when an argument names no registered model or the transport has ended, so another
     * language's transport may be asked.
     */
    command(command: string, args: readonly unknown[]): Promise<unknown> | null {
        if (this.#closed) return null;
        if (command === APPLY_COMMAND) {
            const kept = this.#tokens.get(args[0]);
            return kept === undefined ? null : this.#applyKept(kept);
        }
        const turned = toPage(this.#addresses, { arguments: args });
        if (turned === null) return null;
        const { arguments: given } = turned.value as { arguments: unknown[] };
        return this.#request({ command, arguments: given }, 'workspace/executeCommand', null);
    }

    /** Make the edit a code action kept, then run the command the action had after it. */
    async #applyKept(kept: KeptEdit): Promise<unknown> {
        if (kept.asking !== null && !this.#addresses.has(kept.asking)) {
            this.#host.notice('lsp_edit_gone');
            return null;
        }
        const outcome = await this.#commit(kept.edit, kept.asked);
        if (!outcome.applied) {
            this.#host.notice(outcome.notice, ...outcome.words);
            return null;
        }
        if (kept.then === null) return null;
        return (await this.command(kept.then.command, kept.then.arguments ?? [])) ?? null;
    }

    /**
     * Make an edit a server asked for through the host, unless a document it names changed since
     * the request it answers (`asked`) or the version its entry names is not the document's.
     */
    async #commit(
        edit: unknown,
        asked: ReadonlyMap<string, number> | null,
        preview = false
    ): Promise<LspEditOutcome> {
        const stale = staleFile(edit, this.#versions(), asked);
        if (stale !== null) {
            return { applied: false, notice: 'lsp_edit_changed', words: [nameOfPage(stale)] };
        }
        return await this.#host.applyEdit(edit, preview);
    }

    /**
     * The code actions of a kind of source action a registered model's server offers: the actions
     * the server answers to a request for that kind alone, with their edits kept for the page to
     * apply. When the server answers none for Organize Imports and has a command of its own for it
     * (`fallback`), the action that runs the command.
     */
    async sourceActions(
        model: LspModel,
        only: string,
        fallback: string | null
    ): Promise<unknown[]> {
        const doc = this.#byModel.get(model);
        if (this.#closed || doc === undefined) throw new Closed();
        const asking = keyOf(model);
        const asked = this.#versions();
        const answer = await this.#askAbout(
            doc,
            'textDocument/codeAction',
            sourceRequest(model, only)
        );
        return sourceActionsOf(answer, only, fallback, { asking, asked }, this.#tokens);
    }

    #askAbout(doc: Doc, method: string, params: Record<string, unknown>): Promise<unknown> {
        let document: Record<string, unknown> = { textDocument: { uri: doc.page } };
        if (BARE_DOCUMENT.includes(method)) document = { uri: doc.page };
        // A request about the workspace, or about an item an answer gave, names no document; the
        // relay finds the server by the item's file or, for a symbol query, by the root.
        else if (NO_DOCUMENT.includes(method)) {
            document = method === 'workspace/symbol' ? { root: doc.place.root } : {};
        }
        return this.#request({ ...params, ...document }, method, doc.place.root);
    }

    /** One request of the host's own, under an id the client's counter cannot make. */
    #request(
        params: Record<string, unknown>,
        method: string,
        root: string | null
    ): Promise<unknown> {
        const id = `${OWN}${(this.#next += 1)}`;
        return new Promise<unknown>((resolve, reject) => {
            this.#own.set(id, { resolve, reject, root });
            if (!this.#write({ jsonrpc: '2.0', id, method, params })) {
                this.#own.delete(id);
                reject(new Closed());
            }
        });
    }

    // ------------------------------------------------------------------ from the server

    #enqueue(job: () => void | Promise<void>): void {
        this.#chain = this.#chain
            .then(() => (this.#closed ? undefined : job()))
            .catch(() => undefined);
    }

    #deliver(message: Rpc): void {
        if (this.#closed) return;
        if (this.#listener === undefined) this.#early.push(message);
        else this.#listener(message);
    }

    /**
     * The relay's `state` of a root. A root that is served again after its server ended with the
     * code `root_gone` has the open documents under it put on the server again.
     */
    #rootState(frame: LspFrame): void {
        const root = this.#gone.hear(frame);
        if (root === null) return;
        for (const doc of this.#docs.values()) {
            if (doc.place.root === root) this.#sendOpen(doc);
        }
    }

    async #handle(frame: LspFrame): Promise<void> {
        if ('oculus' in frame) {
            this.#rootState(frame);
            return;
        }
        const message = frame as Rpc;
        if (message.method === undefined) {
            await this.#response(message);
            return;
        }
        if (message.id !== undefined && message.id !== null) {
            await this.#serverRequest(message);
            return;
        }
        this.#notification(message);
    }

    async #response(message: Rpc): Promise<void> {
        const id = message.id;
        if (id === undefined || id === null) return;
        if (typeof id === 'string' && id.startsWith(OWN)) {
            const own = this.#own.get(id);
            this.#own.delete(id);
            if (own === undefined) return;
            if (message.error !== undefined) own.reject(new Error(message.error.message));
            else {
                this.#named(message.result, own.root);
                own.resolve(message.result ?? null);
            }
            return;
        }
        const waiting = this.#waiting.get(id);
        if (waiting === undefined) return;
        this.#waiting.delete(id);
        if (waiting.settle !== undefined) {
            // The server refused a rename, or answered none: Monaco shows the words there.
            const refusal = this.#left(waiting.asking)
                ? null
                : refusalOf(message, (key, ...words) => this.#host.words(key, ...words));
            if (refusal !== null) {
                waiting.settle.reject(refusal);
                return;
            }
            waiting.settle.resolve();
        }
        // A request the relay could not pass on, as while its server restarts, is answered with no
        // result: the Monaco client turns an error into a provider's rejection, which Monaco throws
        // to the page as an uncaught error.
        if (message.error?.code === REQUEST_CANCELLED) {
            this.#deliver({ jsonrpc: '2.0', id, result: null });
            return;
        }
        // The relay holds no document of a root that left, so its error for one is no answer.
        if (message.error !== undefined && this.#left(waiting.asking)) {
            this.#deliver({ jsonrpc: '2.0', id, result: null });
            return;
        }
        if (message.error !== undefined && waiting.method === RENAME) {
            // The box is closed by now and the caret may have moved, so the refusal is a notice.
            const given = message.error.message;
            const words = given === '' ? this.#host.words('lsp_rename_refused_empty') : given;
            this.#host.notice('lsp_edit_refused', words);
            this.#deliver({ jsonrpc: '2.0', id, result: null });
            return;
        }
        if (message.error !== undefined) {
            this.#deliver({ jsonrpc: '2.0', id, error: message.error });
            return;
        }
        if (waiting.method === 'initialize') {
            this.#declared(message.result);
            this.#deliver({ jsonrpc: '2.0', id, result: message.result ?? null });
            return;
        }
        // The model the request was made for went before the answer came: nothing is made for it.
        if (waiting.asking !== null && !this.#addresses.has(waiting.asking)) {
            if (waiting.method === RENAME && message.result != null) {
                this.#host.notice('lsp_edit_gone');
            }
            this.#deliver({ jsonrpc: '2.0', id, result: null });
            return;
        }
        let result: unknown = message.result ?? null;
        if (waiting.method === 'textDocument/codeAction') {
            result = this.#codeActions(waiting, result);
        } else if (waiting.method === 'codeAction/resolve') {
            result = keeping(result, this.#tokens, waiting);
        } else if (waiting.method === RENAME && result !== null) {
            // Monaco's rename applies the edit it is given to the models it can name and announces
            // what it applied, so the page makes the real edit and Monaco is given no result: an
            // empty edit would be announced as "Made 0 edits in 0 files". Monaco's standalone
            // editor writes its "No result." for that answer to the console only.
            const outcome = await this.#commit(result, waiting.asked, waiting.preview === true);
            if (!outcome.applied) this.#host.notice(outcome.notice, ...outcome.words);
            this.#deliver({ jsonrpc: '2.0', id, result: null });
            return;
        }
        const turned = await this.#in(result, waiting.asking);
        if (turned === DROP) {
            this.#deliver({ jsonrpc: '2.0', id, result: null });
            return;
        }
        if (JUMPS.includes(waiting.method) && waiting.asking !== null) {
            this.#host.targeted(waiting.asking, placesOf(turned));
        }
        if (waiting.method === 'textDocument/completion') this.#listed = waiting.params;
        const request =
            waiting.method === 'textDocument/completion'
                ? waiting.params
                : waiting.method === 'completionItem/resolve'
                  ? waiting.listed
                  : undefined;
        const shown = request === undefined ? turned : await this.#host.completed(request, turned);
        this.#deliver({ jsonrpc: '2.0', id, result: shown });
    }

    /** The capabilities the server declared at `initialize`, told to the host. */
    #declared(result: unknown): void {
        const capabilities = isRecord(result) ? result.capabilities : null;
        if (isRecord(capabilities)) this.#host.declared(capabilities);
    }

    /**
     * The answer to a code action request: each action's edit is kept for the page to apply and the
     * action carries the command that applies it.
     */
    #codeActions(waiting: Waiting, result: unknown): unknown {
        if (!Array.isArray(result)) return result;
        return (result as unknown[]).map((action) => keeping(action, this.#tokens, waiting));
    }

    /** The document a client address names, when it is registered. */
    #docOf(address: string | null): Doc | undefined {
        if (address === null) return undefined;
        const page = this.#addresses.get(address);
        return page === undefined ? undefined : this.#docs.get(page);
    }

    /** Whether the document a client address names belongs to a root that left. */
    #left(address: string | null): boolean {
        return this.#gone.has(this.#docOf(address)?.place.root);
    }

    /** A request of the server's the relay passed on. */
    async #serverRequest(message: Rpc): Promise<void> {
        const id = message.id ?? null;
        const reply = (result: unknown): void => void this.#write({ jsonrpc: '2.0', id, result });
        switch (message.method) {
            case 'workspace/applyEdit': {
                const edit = isRecord(message.params) ? message.params.edit : null;
                const outcome = await this.#commit(edit, null);
                if (outcome.applied) reply({ applied: true });
                else {
                    this.#host.notice(outcome.notice, ...outcome.words);
                    reply({ applied: false, failureReason: outcome.notice });
                }
                return;
            }
            case 'workspace/semanticTokens/refresh':
                reply(null);
                this.#host.refreshTokens();
                return;
            case 'workspace/inlayHint/refresh':
                this.#deliver(message);
                return;
            default:
                void this.#write({
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32601, message: `${message.method ?? ''} is not handled` }
                });
        }
    }

    #notification(message: Rpc): void {
        const params = isRecord(message.params) ? message.params : {};
        if (message.method === 'textDocument/publishDiagnostics') {
            const page = pageOf(params.uri);
            if (page === null || !Array.isArray(params.diagnostics)) return;
            const place = placeOf(page);
            this.#host.diagnostics(
                place === null ? page : pageUri(place),
                place,
                params.diagnostics as LspDiagnostic[]
            );
        } else if (message.method === 'textDocument/inactiveRegions') {
            const document = params.textDocument;
            const page = pageOf(isRecord(document) ? document.uri : undefined);
            if (page === null || !Array.isArray(params.regions)) return;
            const place = placeOf(page);
            this.#host.inactive(
                place === null ? page : pageUri(place),
                params.regions as LspRange[]
            );
        }
    }

    // ------------------------------------------------------------------ addresses in answers

    /** Tell the host the library files an answer names, under the root its request was for. */
    #named(value: unknown, root: string | null): void {
        if (root === null) return;
        for (const address of addressesIn(value)) {
            if (libraryOf(address) !== null) this.#host.library(address, root);
        }
    }

    /**
     * An answer for the client: every address of the page's form turned into the client's, the
     * address of a registered model, or of a peek model made for a file no tab holds. A location
     * that names a file that gets no model is dropped with the entry that holds it, and the answer
     * is the symbol `DROP` when the whole answer was one.
     */
    async #in(value: unknown, asking: string | null): Promise<unknown> {
        const root = this.#docOf(asking)?.place.root ?? null;
        const models = new Map<string, string | null>();
        for (const page of addressesIn(value)) {
            if (libraryOf(page) !== null) {
                if (root === null) {
                    models.set(page, null);
                    continue;
                }
                this.#host.library(page, root);
            } else if (placeOf(page) === null) continue;
            models.set(page, await this.#modelFor(page, asking));
        }
        return toClient(value, models);
    }

    /**
     * The client's address for a file named by the page's address: the asking model's when the file
     * is the asking one's, else the first model of a registered file, else a peek model the host
     * reads, or null when there is none to be had.
     */
    async #modelFor(page: string, asking: string | null): Promise<string | null> {
        const doc = this.#docs.get(page);
        if (doc !== undefined) {
            if (asking !== null && this.#addresses.get(asking) === page) return asking;
            return keyOf(doc.models[0]);
        }
        const kept = this.#peeks.get(page);
        if (kept !== undefined) return keyOf(kept.model);
        const target: Target | null = placeOf(page) ?? libraryOf(page);
        if (target === null) return null;
        for (let spelling = 0; spelling < SPELLINGS; spelling += 1) {
            const model = await this.#host.peek(target, page, spelling);
            if (model === null) return null;
            // While the file was read, a tab may have opened it or an answer may have made its
            // peek.
            if (this.#closed || this.#docs.has(page) || this.#peeks.has(page)) {
                this.#host.drop(model);
                return this.#closed ? null : await this.#modelFor(page, asking);
            }
            const key = keyOf(model);
            const clash = this.#lowered.get(key.toLowerCase());
            if (clash !== undefined && clash !== key) {
                this.#host.drop(model);
                continue;
            }
            this.#peeks.set(page, { model, page, made: this.#now() });
            this.#name(model, page);
            return key;
        }
        return null;
    }

    // ------------------------------------------------------------------ the end

    /** End the transport: nothing more is sent, and what waits is rejected. */
    close(): void {
        if (this.#closed) return;
        this.#closed = true;
        this.state.set('closed');
        for (const stop of this.#stops.splice(0)) stop();
        for (const watch of this.#watching.values()) watch.dispose();
        this.#watching.clear();
        for (const own of this.#own.values()) own.reject(new Closed());
        this.#own.clear();
        for (const waiting of this.#waiting.values()) waiting.settle?.resolve();
        this.#waiting.clear();
        this.#tokens.clear();
        for (const peek of this.#peeks.values()) this.#host.drop(peek.model);
        this.#peeks.clear();
        this.#docs.clear();
        this.#byModel.clear();
        this.#addresses.clear();
        this.#lowered.clear();
    }

    /** The page's address of a model's file, for the host's own use. */
    pageOf(model: LspModel): string | null {
        return this.#byModel.get(model)?.page ?? null;
    }
}
