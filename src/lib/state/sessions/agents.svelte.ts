// Layer 2, client state. What the composer and the Customizations section ask the server for: the
// choices of config/catalogs/agents.yml with the configured accounts (GET /api/agents), the
// customizations of one agent, account and workspace (GET /api/customizations), one of their files
// for the viewer, and a session's transcript saved as Markdown.
//
// Each answer is held per key in the client state's query client and asked for the first time a
// view reads it, on a microtask (state/client/queries.svelte.ts), so a read from a $derived
// never writes state while the derived runs. A key whose answer is still out is not asked twice,
// and a refresh cancels the request still out for its key, so an answer that would land after the
// key was asked again is never held.

import type { AgentsAnswer, CustomizationsAnswer, AgentId } from '../../data/model/index.ts';
import type { Queries } from '../shared/stores/shapes.ts';

export type {
    AgentAccount,
    AgentChoice,
    AgentChoiceList,
    AgentChoices,
    AgentChoicesFinding,
    AgentId,
    AgentsAnswer,
    ComposeStart,
    CustomizationItem,
    CustomizationKind,
    CustomizationRow,
    CustomizationsAnswer
} from '../../data/model/index.ts';

/** One held answer: the value once it lands, or what the request failed with. */
export type Held<T> = { value: T | null; pending: boolean; error: string };

/** What a key reads as before its first answer. */
const PENDING = { value: null, pending: true, error: '' };

/** The text of one customization file, as the viewer reads it. */
export type CustomizationText = { path: string; text: string };

/** The scope one Customizations read is for. */
export type CustomizationScope = { agent: AgentId; account: string; workspace: string };

export type AgentsStore = {
    agentChoices: (account?: string) => Held<AgentsAnswer>;
    customizations: (scope: CustomizationScope) => Held<CustomizationsAnswer>;
    customizationText: (scope: CustomizationScope, path: string) => Held<CustomizationText>;
    refreshCustomizations: (scope: CustomizationScope) => void;
    exportSession: (id: string) => boolean;
};

/** The query string of one scope, which is also its key. */
export function scopeQuery(scope: CustomizationScope): string {
    const params = new URLSearchParams({
        agent: scope.agent,
        account: scope.account,
        workspace: scope.workspace
    });
    return params.toString();
}

/** The URL a session's Markdown export is saved from. */
export function exportUrl(id: string): string {
    return `/api/transcript?${new URLSearchParams({ id, format: 'markdown' }).toString()}`;
}

export function createAgents(queries: Queries): AgentsStore {
    /** Ask one URL, answering what came back as the key's held shape. */
    async function ask(url: string): Promise<Held<unknown>> {
        try {
            const response = await fetch(url);
            const body = (await response.json()) as { error?: unknown };
            return response.ok
                ? { value: body, pending: false, error: '' }
                : {
                      value: null,
                      pending: false,
                      error: typeof body.error === 'string' ? body.error : String(response.status)
                  };
        } catch (error) {
            return {
                value: null,
                pending: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /** One key's answer, asked for the first time it is read. */
    function read<T>(key: string, url: string): Held<T> {
        const { data } = queries.read(['agents', key], () => ask(url), {
            enabled: typeof fetch === 'function'
        });
        return (data ?? PENDING) as Held<T>;
    }

    function agentChoices(account = ''): Held<AgentsAnswer> {
        const query = account === '' ? '' : `?${new URLSearchParams({ account }).toString()}`;
        return read<AgentsAnswer>(`agents:${account}`, `/api/agents${query}`);
    }

    function customizations(scope: CustomizationScope): Held<CustomizationsAnswer> {
        const query = scopeQuery(scope);
        return read<CustomizationsAnswer>(`custom:${query}`, `/api/customizations?${query}`);
    }

    function customizationText(scope: CustomizationScope, path: string): Held<CustomizationText> {
        const query = `${scopeQuery(scope)}&${new URLSearchParams({ file: path }).toString()}`;
        return read<CustomizationText>(`file:${query}`, `/api/customizations?${query}`);
    }

    /** Ask the scope's rows again; the held rows stay drawn until the new ones land. */
    function refreshCustomizations(scope: CustomizationScope): void {
        const query = scopeQuery(scope);
        queries.refetch(
            ['agents', `custom:${query}`],
            () => ask(`/api/customizations?${query}`),
            'replace'
        );
    }

    /**
     * Save a session's transcript as Markdown through the browser's own download, which the
     * endpoint's attachment header names. False where there is no document to click in.
     */
    function exportSession(id: string): boolean {
        if (typeof document === 'undefined' || id === '') return false;
        const link = document.createElement('a');
        link.href = exportUrl(id);
        link.download = '';
        link.rel = 'noopener';
        document.body.append(link);
        link.click();
        link.remove();
        return true;
    }

    return {
        agentChoices,
        customizations,
        customizationText,
        refreshCustomizations,
        exportSession
    };
}
