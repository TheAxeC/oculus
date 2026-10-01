<script module lang="ts">
    // Layer 3, view registration. Agents closes the Sessions page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
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
    // model, what it was asked for, and how it went. Each is named by the session's own transcript.
    //
    // A finished agent reports what it took, from its start to its end, and nothing when its end is
    // not known. A running one is counted from its start to now, which is the number that says
    // whether to wait for it, so the moment it counts to moves every second while a row runs.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import PickSession from '$lib/views/shared/sessions/PickSession.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { compactCount, modelShort, seconds, span } from '$lib/state/shared/words/format';
    import type { SessionAgent } from '$lib/state/client/selectors.svelte';
    import { agentTokens, anyRunning, newestFirst } from '$lib/state/sessions/folds';
    import SessionPicker from '$lib/views/shared/sessions/SessionPicker.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { sessionFor }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The hue of the status dot: at work, failed, stopped before it finished, or come back. */
    const TONES: Record<string, string> = {
        running: 'green',
        error: 'red',
        stopped: 'amber',
        done: 'slate'
    };

    /** How often a running row's count moves, in milliseconds. */
    const SECOND = 1000;

    /** The moment a running row counts to. */
    let now = $state(Date.now());

    const record = $derived(sessionFor(instance.id));
    /**
     * Newest first by the moment each started, sorted by the stamps rather than kept in the
     * server's list order; an agent with no stamp goes last.
     */
    const agents = $derived(newestFirst(record?.agents ?? []));

    /** Whether any row runs, which is what keeps the count moving. */
    const running = $derived(anyRunning(agents));

    $effect(() => {
        if (!running) return;
        now = Date.now();
        const timer = setInterval(() => (now = Date.now()), SECOND);
        return () => {
            clearInterval(timer);
        };
    });

    function statusLabel(status: string): string {
        if (status === 'running') return t('sessions.ag_running');
        if (status === 'error') return t('sessions.ag_error');
        if (status === 'stopped') return t('sessions.ag_stopped');
        return t('sessions.ag_done');
    }

    function dotStyle(status: string): string {
        return `--tone: var(--c-${TONES[status] ?? 'slate'})`;
    }

    /** The right-hand line: how it went, how long it took, and how much it came back with. */
    function meta(agent: SessionAgent): string {
        const parts: string[] = [statusLabel(agent.status)];
        const took =
            agent.status === 'running'
                ? seconds(agent.started, null, now)
                : agent.ended === null
                  ? null
                  : seconds(agent.started, agent.ended, now);
        if (took !== null) parts.push(span(took));
        if (agent.resultChars > 0) {
            parts.push(t('sessions.ag_chars', compactCount(agent.resultChars)));
        }
        const spent = agentTokens(agent);
        if (spent !== null) parts.push(t('sessions.ag_tokens', compactCount(spent)));
        return parts.join(` ${t('sessions.meta_sep')} `);
    }

    /** What the kind column says: the subagent's type, or the generic word when it has none. */
    function kind(agent: SessionAgent): string {
        return agent.subagentType === '' ? t('sessions.ag_type') : agent.subagentType;
    }
</script>

{#snippet bar()}
    <Toolbar label={t('sessions.agents_bar')}>
        <SessionPicker instance={instance.id} />
    </Toolbar>
{/snippet}

<Pane title={t('sessions.view_agents')} {bar} tinted>
    <div class="agents" data-instance={instance.id}>
        {#if record === null}
            <PickSession message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else if agents.length === 0}
            <Empty message={t('sessions.ag_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each agents as agent (agent.id)}
                <div class="agent" data-agent={agent.id}>
                    <span class="dot" style={dotStyle(agent.status)}></span>
                    <span class="ty">{kind(agent)}</span>
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
    }

    /* One line of the tree's row height; the kind and the task are the row's main words, the
       model and how it went are secondary. */
    .agent {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
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
        font-size: var(--fs-sm);
    }

    .mo {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
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
