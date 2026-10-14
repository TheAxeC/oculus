// Layer 3, primitive. What the transport does with the edits a server asks the page to make: the
// files an edit names, whether a document it names changed since the edit was computed, and the
// tokens that stand for an edit in the code actions Monaco is given. Monaco's own client applies a
// code action's or a rename's edit by naming each file's model, which a file no tab holds only has
// as a peek model, so the transport keeps the edit and gives Monaco a command that names it.
// Everything here is pure; the transport owns the documents.

import { libraryOf, placeOf } from '../uris';
import { ADDRESSES, APPLY_COMMAND, DROP, ORGANIZE, isRecord, type LspModel } from './messages';

/** The files a workspace edit names, and the version each entry says it was computed for. */
export type NamedBy = {
    /** The page's address of every file with a text edit, in the order the edit names them. */
    pages: string[];
    /**
     * The version a `documentChanges` entry names for a file, by address; null when it names none.
     */
    versions: Map<string, number | null>;
};

/**
 * The files a workspace edit names with a text edit. A create, rename or delete is for the page,
 * which makes the rename of a note in its notes folder and refuses every other.
 */
export function namedBy(edit: unknown): NamedBy {
    const named: NamedBy = { pages: [], versions: new Map() };
    if (!isRecord(edit)) return named;
    const add = (page: string, version: number | null): void => {
        if (!named.pages.includes(page)) named.pages.push(page);
        if (!named.versions.has(page) || version !== null) named.versions.set(page, version);
    };
    if (isRecord(edit.changes)) {
        for (const page of Object.keys(edit.changes)) add(page, null);
    }
    if (Array.isArray(edit.documentChanges)) {
        for (const change of edit.documentChanges as unknown[]) {
            const document = isRecord(change) ? change.textDocument : null;
            if (!isRecord(document) || typeof document.uri !== 'string') continue;
            add(document.uri, typeof document.version === 'number' ? document.version : null);
        }
    }
    return named;
}

/**
 * The first file of an edit whose document changed since the edit was computed: the version an
 * entry names, else the version the document had when the request was made (`asked`), is not the
 * version the document has now. A file the transport holds no document of is never stale here.
 */
export function staleFile(
    edit: unknown,
    now: ReadonlyMap<string, number>,
    asked: ReadonlyMap<string, number> | null
): string | null {
    const named = namedBy(edit);
    for (const page of named.pages) {
        const current = now.get(page);
        const wanted = named.versions.get(page) ?? asked?.get(page) ?? null;
        if (current !== undefined && wanted !== null && current !== wanted) return page;
    }
    return null;
}

/** An edit the transport kept for a code action. */
export type KeptEdit = {
    edit: unknown;
    /** The versions of the documents when the request was made; null for a server's own request. */
    asked: ReadonlyMap<string, number> | null;
    /** The client's address of the document the request was made for, null for none. */
    asking: string | null;
    /** The command the action ran after its edit, if it had one. */
    then: { command: string; arguments?: unknown[] } | null;
};

/** How many kept edits the transport remembers. */
const KEPT = 200;

/** The tokens of the edits the transport keeps, oldest dropped first. */
export class EditTokens {
    #kept = new Map<string, KeptEdit>();
    #next = 0;
    #prefix: string;

    constructor(prefix: string) {
        this.#prefix = prefix;
    }

    /** Keep an edit and answer the command that applies it. */
    command(
        kept: KeptEdit,
        title: string
    ): { title: string; command: string; arguments: string[] } {
        this.#next += 1;
        const token = `${this.#prefix}:${String(this.#next)}`;
        this.#kept.set(token, kept);
        if (this.#kept.size > KEPT) {
            const oldest = this.#kept.keys().next();
            if (oldest.done !== true) this.#kept.delete(oldest.value);
        }
        return { title, command: APPLY_COMMAND, arguments: [token] };
    }

    /** The edit a token stands for, or undefined for one this transport did not make. */
    get(token: unknown): KeptEdit | undefined {
        return typeof token === 'string' ? this.#kept.get(token) : undefined;
    }

    clear(): void {
        this.#kept.clear();
    }
}

/**
 * A code action with its edit replaced by the command that applies it. An action with no edit is
 * given as it is, for the client to resolve; a bare command is given as it is.
 */
export function keeping(
    action: unknown,
    tokens: EditTokens,
    context: Pick<KeptEdit, 'asked' | 'asking'>
): unknown {
    if (!isRecord(action) || action.edit === undefined) return action;
    const { edit, command, ...rest } = action;
    const then =
        isRecord(command) && typeof command.command === 'string'
            ? (command as KeptEdit['then'])
            : null;
    const kept: KeptEdit = { edit, asked: context.asked, asking: context.asking, then };
    const title = typeof action.title === 'string' ? action.title : '';
    return { ...rest, command: tokens.command(kept, title) };
}

/** The name a file's address is told to a reader by: `root/path`, or a library file's name. */
export function nameOfPage(page: string): string {
    const place = placeOf(page);
    if (place !== null) return `${place.root}/${place.path}`;
    return libraryOf(page)?.name ?? page;
}

/**
 * The `initialize` parameters with the capabilities of the edits the page makes: the server may
 * ask for `workspace/applyEdit`, and its workspace edits may hold `documentChanges` that are all
 * applied or none. No resource operation is declared, so a server sends none; the one the page
 * is sent is the rename of a note, in the Markdown entry's own answer to a rename on a link.
 */
export function declaringEdits(params: unknown): unknown {
    if (!isRecord(params)) return params;
    const capabilities = isRecord(params.capabilities) ? params.capabilities : {};
    const workspace = isRecord(capabilities.workspace) ? capabilities.workspace : {};
    return {
        ...params,
        capabilities: {
            ...capabilities,
            workspace: {
                ...workspace,
                applyEdit: true,
                workspaceEdit: { documentChanges: true, failureHandling: 'transactional' }
            }
        }
    };
}

/** The parameters of a request for the source actions of a kind over a model's whole text. */
export function sourceRequest(model: LspModel, only: string): Record<string, unknown> {
    const lines = model.getValue().split(/\r\n|\r|\n/);
    return {
        range: {
            start: { line: 0, character: 0 },
            end: { line: lines.length - 1, character: lines[lines.length - 1].length }
        },
        context: { diagnostics: [], only: [only], triggerKind: 1 }
    };
}

/**
 * The actions a server answered to a request for a kind of source action, each with its edit kept.
 * When none is an Organize Imports action and the server has a command of its own for it
 * (`fallback`, as pyright has), the action that runs that command is added.
 */
export function sourceActionsOf(
    answer: unknown,
    only: string,
    fallback: string | null,
    context: Pick<KeptEdit, 'asked' | 'asking'>,
    tokens: EditTokens
): unknown[] {
    const given = (Array.isArray(answer) ? (answer as unknown[]) : []).filter(
        (one) => isRecord(one) && typeof one.kind === 'string' && one.kind.startsWith(only)
    );
    const actions = given.map((one) => keeping(one, tokens, context));
    const organizes = actions.some((one) => isRecord(one) && String(one.kind).startsWith(ORGANIZE));
    if (!organizes && fallback !== null && context.asking !== null) {
        actions.push({
            title: 'Organize Imports',
            kind: ORGANIZE,
            command: { title: 'Organize Imports', command: fallback, arguments: [context.asking] }
        });
    }
    return actions;
}

/**
 * An answer for the client with every address of the page's form turned into the client's, by the
 * `models` made for them. A location whose file got no model (null) is dropped with the entry that
 * holds it, and the result is the symbol `DROP` when the whole answer was one.
 */
export function toClient(value: unknown, models: ReadonlyMap<string, string | null>): unknown {
    const address = (page: string): string | null | undefined => {
        if (!models.has(page)) return undefined;
        return models.get(page) ?? null;
    };
    const walk = (item: unknown): unknown => {
        if (Array.isArray(item)) return item.map(walk).filter((one) => one !== DROP);
        if (!isRecord(item)) return item;
        const copy: Record<string, unknown> = {};
        for (const [key, inner] of Object.entries(item)) {
            if (ADDRESSES.includes(key) && typeof inner === 'string') {
                const turned = address(inner);
                if (turned === null) return DROP;
                copy[key] = turned ?? inner;
            } else if (key === 'changes' && isRecord(inner)) {
                const changes: Record<string, unknown> = {};
                for (const [page, edits] of Object.entries(inner)) {
                    const turned = address(page);
                    if (turned === null) return DROP;
                    changes[turned ?? page] = walk(edits);
                }
                copy[key] = changes;
            } else if (key === 'arguments' && Array.isArray(inner)) {
                copy[key] = inner.map((one) => {
                    const turned = typeof one === 'string' ? address(one) : undefined;
                    return typeof one === 'string' ? (turned ?? one) : walk(one);
                });
            } else {
                const walked = walk(inner);
                if (walked === DROP) return DROP;
                copy[key] = walked;
            }
        }
        return copy;
    };
    return walk(value);
}
