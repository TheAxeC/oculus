<script lang="ts">
    // Layer 3, partial of views/sessions/session-detail/SessionDetail.svelte. The rows of the
    // Agents section: the subagents one session dispatched, newest first, as the rows of the
    // section's tree (level 2, ids from rowKey). Each says what kind it was, on what model, what it
    // was asked for, and how it went. Each is named by the session's own transcript.
    //
    // A press on a row opens the agent's own transcript in a Transcript tab keyed on the session
    // and the agent, or brings that tab forward. A row whose agent named no transcript (no agent
    // id, its file not there, or for a Codex agent no session of its own in the payload) has no
    // press and says so in its title.
    //
    // A finished agent reports what it took, from its start to its end, and nothing when its end is
    // not known. A running one is counted from its start to now, which is the number that says
    // whether to wait for it, so the moment it counts to moves every second while a row runs. The
    // timer belongs to these rows, which the section draws only while it is open, so a closed
    // section runs no timer.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { compactCount, modelShort, seconds, span } from '$lib/state/shared/words/format';
    import type { GroupedSession, SessionAgent } from '$lib/state/client/selectors.svelte';
    import { useState } from '$lib/state/client/use';
    import { agentTokens, anyRunning } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { rowKey } from './session-sections';

    const {
        layout: { openView },
        selectors: { sessionById }
    } = useState();

    /** The agents newest first, the session that sent them, and the tree they are drawn in. */
    let {
        agents,
        session,
        nav
    }: { agents: SessionAgent[]; session: GroupedSession | null; nav: TreeNav } = $props();

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
            parts.push(
                agent.resultChars === 1
                    ? t('sessions.ag_chars_one')
                    : t('sessions.ag_chars', compactCount(agent.resultChars))
            );
        }
        const spent = agentTokens(agent);
        if (spent !== null) {
            parts.push(
                spent === 1
                    ? t('sessions.ag_tokens_one')
                    : t('sessions.ag_tokens', compactCount(spent))
            );
        }
        return parts.join(` ${t('sessions.meta_sep')} `);
    }

    /** What the kind column says: the subagent's type, or the generic word when it has none. */
    function kind(agent: SessionAgent): string {
        return agent.subagentType === '' ? t('sessions.ag_type') : agent.subagentType;
    }

    /**
     * Whether the agent's own transcript can be read: the record names it, and a Codex agent's
     * rollout is a session the payload holds.
     */
    function readable(agent: SessionAgent): boolean {
        if (session === null || agent.agentId === '') return false;
        return session.tool !== 'codex' || sessionById(agent.agentId) !== null;
    }

    /** Open the agent's transcript, or bring its open tab forward. */
    function open(agent: SessionAgent): void {
        if (session === null) return;
        const label = `${kind(agent)} ${agent.description}`.trim();
        openView('transcript', { session: session.id, agent: agent.id, label });
    }
</script>

{#if agents.length === 0}
    <li role="none">
        <Empty message={t('sessions.ag_empty')} glyph={t('sessions.empty_glyph')} />
    </li>
{:else}
    {#each agents as agent (agent.id)}
        <li role="none" data-agent={agent.id}>
            <TreeItem
                label={kind(agent)}
                name={`${kind(agent)} ${agent.description}`}
                id={rowKey('agent', agent.id)}
                {nav}
                level={2}
                title={readable(agent) ? undefined : t('sessions.ag_no_transcript')}
                onclick={readable(agent) ? () => open(agent) : undefined}
            >
                {#snippet words()}
                    <span class="dot" style={dotStyle(agent.status)}></span>
                    <span>{kind(agent)}</span>
                    <span class="mo">{modelShort(agent.model)}</span>
                    <span title={agent.description}>{agent.description}</span>
                {/snippet}
                {#snippet end()}
                    {meta(agent)}
                {/snippet}
            </TreeItem>
        </li>
    {/each}
{/if}

<style>
    .dot {
        display: inline-block;
        vertical-align: middle;
        width: 8px;
        height: 8px;
        margin-right: 6px;
        border-radius: var(--radius-pill);
        background: var(--tone);
    }

    .mo {
        margin: 0 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
