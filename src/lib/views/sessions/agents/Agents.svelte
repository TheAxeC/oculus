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
    // Layer 3, view. The agents one session dispatched, newest first: what kind it was, on what
    // model, what it was asked for, and how it went.
    //
    // Two kinds share the list. A subagent is named by the session's own transcript. A launched
    // builder is a process of its own (a Codex worker, or `claude -p`) that the launch note
    // ~/.oculus/dispatches.json places under the session that launched it: it is marked, names its
    // harness, carries a Codex rollout's token totals, and opens its own transcript in the
    // Transcript view once the payload holds that transcript's session.
    //
    // A finished agent reports what it took, from its start to its end, and nothing when its end is
    // not known. A running one is counted from its start to now, which is the number that says
    // whether to wait for it, so the moment it counts to moves every second while a row runs.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import PickSession from '$lib/views/shared/sessions/PickSession.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { compactCount, modelShort, seconds, span } from '$lib/state/shared/words/format';
    import type { SessionAgent } from '$lib/state/client/selectors.svelte';
    import { agentTokens, anyRunning, newestFirst } from '$lib/state/sessions/folds';
    import SessionPicker from '$lib/views/shared/sessions/SessionPicker.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView },
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
     * Newest first by the moment each started. The server lists the transcript's subagents and the
     * launched builders in two runs, so the order is the stamps', not the list's; an agent with no
     * stamp goes last.
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
        const tokens = agent.dispatch?.tokens ?? null;
        const spent = tokens === null ? agentTokens(agent) : tokens.input + tokens.output;
        if (spent !== null) parts.push(t('sessions.ag_tokens', compactCount(spent)));
        return parts.join(` ${t('sessions.meta_sep')} `);
    }

    /** What the kind column says: the harness of a launched builder, else the subagent's type. */
    function kind(agent: SessionAgent): string {
        const harness = agent.dispatch?.harness;
        if (harness === 'claude') return t('sessions.ag_claude');
        if (harness === 'codex') return t('sessions.ag_codex');
        if (harness !== undefined) return t('sessions.ag_type');
        return agent.subagentType === '' ? t('sessions.ag_type') : agent.subagentType;
    }

    /** A row's tooltip: what it was asked for, and for a launch, who launched it and where. */
    function tip(agent: SessionAgent): string {
        const dispatch = agent.dispatch;
        if (dispatch === undefined) return agent.description;
        return t('sessions.ag_launched_tip', agent.description, dispatch.launcher, dispatch.cwd);
    }

    /** Show a launched builder's own turns, in a Transcript view pinned to its session. */
    function openBuilder(agent: SessionAgent): void {
        const session = agent.dispatch?.session ?? null;
        if (session !== null) openView('transcript', { session, label: agent.description });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.view_agents')}>
        <SessionPicker instance={instance.id} />
    </Toolbar>
{/snippet}

<Pane title={t('sessions.view_agents')} toolbar={tools} tinted>
    <div class="agents" data-instance={instance.id}>
        {#if record === null}
            <PickSession message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else if agents.length === 0}
            <Empty message={t('sessions.ag_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each agents as agent (agent.id)}
                <div
                    class="agent"
                    data-agent={agent.id}
                    data-launched={agent.dispatch === undefined ? undefined : 'true'}
                >
                    <span class="dot" style={dotStyle(agent.status)}></span>
                    {#if agent.dispatch !== undefined}
                        <Tag label={t('sessions.ag_launched')} />
                    {/if}
                    <span class="ty">{kind(agent)}</span>
                    <span class="mo">{modelShort(agent.model)}</span>
                    <span class="ds" title={tip(agent)}>{agent.description}</span>
                    <span class="st">{meta(agent)}</span>
                    {#if (agent.dispatch?.session ?? null) !== null}
                        <ToolButton
                            label={t('sessions.ag_open')}
                            title={t('sessions.ag_open')}
                            glyph={t('sessions.transcript_glyph')}
                            compact
                            onclick={() => openBuilder(agent)}
                        />
                    {/if}
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
