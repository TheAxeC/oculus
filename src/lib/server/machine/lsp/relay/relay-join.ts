// Layer 2, server. Several servers for one language, joined the way VS Code's client joins its
// providers. A document is open on oculus's own server for its language (when there is one) and on
// every app server whose selector selects it. A request of the page that a server declared goes to
// each of them and the page gets one answer:
//
// - a list feature (completion, references, symbols, code actions, code lenses, links, inlay hints,
//   highlights, ranges) answers the lists joined, oculus's first and then the apps' in the Views
//   list's order; an item that a later request resolves (completion, code action, code lens, link,
//   inlay hint) carries the id of the server it came from in its `data`;
// - a hover answers the hovers of every server that had one, as one hover;
// - every other request (definition, rename, formatting, signature help, semantic tokens, ...)
//   goes to the first server that declared the feature, and only to it.
//
// A joined request waits for the app servers at most `JOIN_MS`; the ones that have not answered
// then get `$/cancelRequest`, and the page is answered with what came. The answer of oculus's own
// server is never cancelled and never held back by the apps: when it is slower than the bound, the
// page is answered as soon as it arrives, with what the apps gave by then.
//
// A capability an app server declares that oculus's own entry does not is registered with the
// page's client (`client/registerCapability`) so the client asks for it; one oculus declares
// already is asked for by the client already, and the request is joined here. Semantic tokens are
// not registered: the page draws a server's tokens from the legend the relay sends it.
//
// A request goes to a server of an app only for a feature that server declared, in its
// `initialize` answer or by registering it later, as VS Code's client asks a server only for what
// it declared. A request for a feature no server it could go to declared is answered with no
// result at once when the server it would go to is an app's; oculus's own server is sent it, since
// the page asks it only what its entry names and it answers every request it is sent. A
// hierarchy's follow-up needs the hierarchy's feature, as its first request does.

import type { LspRpc } from '../../../../data/model/index.ts';
import type { Held, Page } from '../held/held.ts';
import { isRecord } from '../wire.ts';
import { FEATURES } from '../../../../data/prose/lsp-servers.ts';
import { appInfo } from './relay-apps.ts';

/** The milliseconds a joined request waits for the servers of apps. */
export const JOIN_MS = 2000;

/** The capability that gates a request of the page. */
const CAPABILITY: Record<string, string | undefined> = {
    'textDocument/hover': 'hoverProvider',
    'textDocument/completion': 'completionProvider',
    'textDocument/signatureHelp': 'signatureHelpProvider',
    'textDocument/definition': 'definitionProvider',
    'textDocument/declaration': 'declarationProvider',
    'textDocument/typeDefinition': 'typeDefinitionProvider',
    'textDocument/implementation': 'implementationProvider',
    'textDocument/references': 'referencesProvider',
    'textDocument/documentHighlight': 'documentHighlightProvider',
    'textDocument/documentSymbol': 'documentSymbolProvider',
    'textDocument/codeAction': 'codeActionProvider',
    'textDocument/codeLens': 'codeLensProvider',
    'textDocument/documentLink': 'documentLinkProvider',
    'textDocument/formatting': 'documentFormattingProvider',
    'textDocument/rangeFormatting': 'documentRangeFormattingProvider',
    'textDocument/onTypeFormatting': 'documentOnTypeFormattingProvider',
    'textDocument/rename': 'renameProvider',
    'textDocument/prepareRename': 'renameProvider',
    'textDocument/foldingRange': 'foldingRangeProvider',
    'textDocument/selectionRange': 'selectionRangeProvider',
    'textDocument/inlayHint': 'inlayHintProvider',
    'textDocument/semanticTokens/full': 'semanticTokensProvider',
    'textDocument/semanticTokens/range': 'semanticTokensProvider',
    'textDocument/prepareCallHierarchy': 'callHierarchyProvider',
    'callHierarchy/incomingCalls': 'callHierarchyProvider',
    'callHierarchy/outgoingCalls': 'callHierarchyProvider',
    'textDocument/prepareTypeHierarchy': 'typeHierarchyProvider',
    'typeHierarchy/supertypes': 'typeHierarchyProvider',
    'typeHierarchy/subtypes': 'typeHierarchyProvider',
    'workspace/symbol': 'workspaceSymbolProvider'
};

/** The requests whose answers are lists the servers each add to. */
const LISTS = [
    'textDocument/completion',
    'textDocument/references',
    'textDocument/documentSymbol',
    'textDocument/codeAction',
    'textDocument/codeLens',
    'textDocument/documentLink',
    'textDocument/inlayHint',
    'textDocument/documentHighlight',
    'textDocument/foldingRange',
    'textDocument/selectionRange'
];

const HOVER = 'textDocument/hover';

/** The requests that resolve an item of a list answer, and the capability that offers them. */
const RESOLVES: Record<string, string | undefined> = {
    'completionItem/resolve': 'textDocument/completion',
    'codeAction/resolve': 'textDocument/codeAction',
    'codeLens/resolve': 'textDocument/codeLens',
    'documentLink/resolve': 'textDocument/documentLink',
    'inlayHint/resolve': 'textDocument/inlayHint'
};

/** The feature the page draws itself, which is never registered with the page's client. */
const DRAWN = 'semanticTokensProvider';

/** One server's share of a joined request. */
type Part = { held: Held; relayId: number; answered: boolean; result: unknown };

/** A request of the page that several servers answer. */
export type Join = {
    page: Page;
    channel: string;
    id: NonNullable<LspRpc['id']> | null;
    method: string;
    parts: Part[];
    timer: ReturnType<typeof setTimeout> | null;
    replied: boolean;
    /** The answer of every part that has answered, mapped to the page's addresses. */
    errors: unknown[];
    /** The entry's own result the joined answer is joined to (held/requests/merged.ts). */
    adds?: unknown;
};

/** Whether a server has declared the feature a request needs. */
export function declares(held: Held, method: string, language: string): boolean {
    const key = CAPABILITY[method];
    if (key === undefined) return true;
    const caps =
        appInfo(held.entry) === undefined ? held.entry.capabilities(language) : held.capabilities;
    const value = caps[key];
    return value !== undefined && value !== false && value !== null;
}

/**
 * How the servers of a document answer a request: joined as a list, as a hover, or by the first.
 */
export function joinKind(method: string): 'list' | 'hover' | 'first' {
    if (LISTS.includes(method)) return 'list';
    return method === HOVER ? 'hover' : 'first';
}

/** The servers of a document that declared the feature a request needs, in join order. */
export function declaring(helds: readonly Held[], method: string, language: string): Held[] {
    return helds.filter((held) => declares(held, method, language));
}

/**
 * Mark the items of a list answer with the server they came from, for the request that resolves
 * them.
 */
export function tagged(result: unknown, entryId: string): unknown {
    const mark = (item: unknown): unknown =>
        isRecord(item) ? { ...item, data: { oculusServer: entryId, data: item.data } } : item;
    if (Array.isArray(result)) return result.map(mark);
    if (isRecord(result) && Array.isArray(result.items)) {
        return { ...result, items: result.items.map(mark) };
    }
    return result;
}

/** A resolve request with the server it names taken out of its item, or its params as they are. */
export function untagged(
    method: string,
    params: unknown
): { entryId: string | null; params: unknown } {
    if (RESOLVES[method] === undefined || !isRecord(params)) return { entryId: null, params };
    const data = params.data;
    if (!isRecord(data) || typeof data.oculusServer !== 'string') return { entryId: null, params };
    return { entryId: data.oculusServer, params: { ...params, data: data.data } };
}

/** The request a resolve belongs to, for the capability that offers it. */
export function resolveOf(method: string): string | undefined {
    return RESOLVES[method];
}

/** The answers of a joined list request, put in one list. */
function listed(results: readonly unknown[]): unknown {
    const found = results.filter((one) => one !== null && one !== undefined);
    if (found.length === 0) return null;
    const lists = found.flatMap((one) => (isRecord(one) && Array.isArray(one.items) ? [one] : []));
    if (lists.length > 0) {
        return {
            isIncomplete: lists.some((one) => one.isIncomplete === true),
            items: found.flatMap((one) =>
                Array.isArray(one)
                    ? (one as unknown[])
                    : isRecord(one) && Array.isArray(one.items)
                      ? (one.items as unknown[])
                      : []
            )
        };
    }
    return found.flatMap((one) => (Array.isArray(one) ? (one as unknown[]) : []));
}

/** The text of one piece of a hover's contents. */
function hoverText(contents: unknown): string {
    if (typeof contents === 'string') return contents;
    if (Array.isArray(contents))
        return contents
            .map(hoverText)
            .filter((t) => t !== '')
            .join('\n\n');
    if (!isRecord(contents) || typeof contents.value !== 'string') return '';
    if (typeof contents.language === 'string') {
        return `\`\`\`${contents.language}\n${contents.value}\n\`\`\``;
    }
    return contents.value;
}

/** The hovers of several servers as one hover. */
function hovered(results: readonly unknown[]): unknown {
    const found = results.filter(isRecord);
    const text = found.map((one) => hoverText(one.contents)).filter((t) => t !== '');
    if (text.length === 0) return null;
    const range = found.find((one) => isRecord(one.range))?.range;
    return {
        contents: { kind: 'markdown', value: text.join('\n\n---\n\n') },
        ...(range === undefined ? {} : { range })
    };
}

/** The answer of a joined request from the answers that came, parts in join order. */
export function joined(join: Join): unknown {
    const results = join.parts.map((part) => part.result);
    return joinKind(join.method) === 'hover' ? hovered(results) : listed(results);
}

/**
 * Whether a joined request can be answered: all parts answered, or the bound passed and oculus's
 * own did.
 */
export function complete(join: Join, late: boolean): boolean {
    if (join.parts.every((part) => part.answered)) return true;
    return (
        late && join.parts.every((part) => part.answered || appInfo(part.held.entry) !== undefined)
    );
}

/**
 * The registrations a server's capabilities need the page's client to make, for a language: one
 * for each feature the server declares that the entry of oculus does not, with the document
 * selector of the language, semantic tokens left out.
 */
export function registrationsFor(
    capabilities: Record<string, unknown>,
    present: Record<string, unknown>,
    language: string
): { id: string; method: string; registerOptions: Record<string, unknown> }[] {
    const out = [];
    for (const [key, method] of Object.entries(FEATURES)) {
        if (key === DRAWN) continue;
        const value = capabilities[key];
        if (value === undefined || value === false || value === null) continue;
        if (present[key] !== undefined) continue;
        const options = isRecord(value) ? value : {};
        out.push({
            id: `oculus-app:${language}:${key}`,
            method,
            registerOptions: { ...options, documentSelector: [{ language }] }
        });
    }
    return out;
}
