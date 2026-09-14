<script module lang="ts">
    // Layer 3, view registration. Agents closes the sessions flyout.
    import type { ViewRegistration } from '$lib/views/registry';
    export const registration: ViewRegistration = {
        id: 'agents',
        label: 'sessions.view_agents',
        glyph: 'sessions.agents_glyph',
        group: 'sessions',
        order: 6
    };
</script>

<script lang="ts">
    // Layer 3, view. The subagents one session dispatched, newest first: what kind it was, on what
    // model, what it was asked for, and how it went.
    //
    // A finished agent reports what it took. A running one is counted from its start to now, which
    // is the number that says whether to wait for it.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { compactCount, modelShort, seconds, span } from '$lib/state/format';
    import { instanceLayoutState, pinInstance, unpinInstance } from '$lib/state/layout.svelte';
    import { pinnedSession } from '$lib/state/selection.svelte';
    import { sessionFor, type SessionAgent } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from '$lib/views/registry';

    let { instance }: ViewProps = $props();

    /** The hue of the status dot: at work, come back, or come back with nothing. */
    const TONES: Record<string, string> = { running: 'green', error: 'red', done: 'slate' };

    const now = Date.now();

    const record = $derived(sessionFor(instance.id));
    const panePin = $derived(pinnedSession(instanceLayoutState(instance.id)));
    /** Newest first, which is the reverse of the order the transcript folded them in. */
    const agents = $derived([...(record?.agents ?? [])].reverse());

    function statusLabel(status: string): string {
        if (status === 'running') return t('sessions.ag_running');
        if (status === 'error') return t('sessions.ag_error');
        return t('sessions.ag_done');
    }

    function dotStyle(status: string): string {
        return `--tone: var(--c-${TONES[status] ?? 'slate'})`;
    }

    /** The right-hand line: how it went, how long it took, and how much it came back with. */
    function meta(agent: SessionAgent): string {
        const parts: string[] = [statusLabel(agent.status)];
        const took = seconds(agent.started, agent.ended, now);
        if (took !== null) parts.push(span(took));
        if (agent.resultChars > 0) {
            parts.push(t('sessions.ag_chars', compactCount(agent.resultChars)));
        }
        return parts.join(` ${t('sessions.meta_sep')} `);
    }

    /** Pin these agents to what they show, or return them to following the selection. */
    function togglePanePin(): void {
        if (panePin !== null) {
            unpinInstance(instance.id);
            return;
        }
        if (record !== null) {
            pinInstance(instance.id, record.id, record.title);
        }
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.view_agents')}>
        {#if record !== null || panePin !== null}
            <ToolButton
                label={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                title={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                pressed={panePin !== null}
                onclick={togglePanePin}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('sessions.view_agents')} toolbar={tools} tinted>
    <div class="agents" data-instance={instance.id}>
        {#if record === null}
            <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else if agents.length === 0}
            <Empty message={t('sessions.ag_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each agents as agent (agent.id)}
                <div class="agent">
                    <span class="dot" style={dotStyle(agent.status)}></span>
                    <span class="ty">
                        {agent.subagentType === '' ? t('sessions.ag_type') : agent.subagentType}
                    </span>
                    <span class="mo">{modelShort(agent.model)}</span>
                    <span class="ds" title={agent.description}>{agent.description}</span>
                    <span class="st">{meta(agent)}</span>
                </div>
            {/each}
        {/if}
    </div>
</Pane>

<style>
    .agents {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .agent {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
    }

    .dot {
        flex: 0 0 auto;
        width: 8px;
        height: 8px;
        border-radius: var(--radius-pill);
        background: var(--tone);
    }

    .ty {
        flex: 0 0 auto;
    }

    .st {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .mo {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .ds {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .st {
        margin-left: auto;
        font-family: var(--font-num);
    }

    /* The terminal shape: one row per agent, in the face a job list is read in. */
    :global(body.rice) .agents {
        font-family: var(--font-mono);
    }
</style>
