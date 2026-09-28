<script module lang="ts">
    // Layer 3, view registration. Timeline follows Transcript in the Sessions page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'timeline',
        label: 'sessions.view_timeline',
        glyph: 'sessions.timeline_glyph',
        group: 'sessions',
        order: 3
    };
</script>

<script lang="ts">
    // Layer 3, view. What the session did, newest last, one group per turn under the prompt that
    // opened it and that prompt's time; each event a clock, what kind of thing it was, and the
    // thing itself. A path is shown as its basename with the whole of it in the tooltip; a prompt
    // keeps its words, because a slash in a prompt is not a path.
    //
    // Where it is scrolled to is the one piece of behaviour here. A fresh session, or a view just
    // opened, starts at the newest event, since that is what a timeline is read for. After that the
    // reader is left where they are: a push arriving while somebody is reading upwards must not
    // yank the column back down.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import PickSession from '$lib/views/shared/sessions/PickSession.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import { basename, clock, compactCount } from '$lib/state/shared/words/format';
    import { timelineTurns } from '$lib/state/sessions/folds';
    import SessionPicker from '$lib/views/shared/sessions/SessionPicker.svelte';
    import type { SessionEvent } from '$lib/state/client/selectors.svelte';
    import { asText } from '$lib/state/forms/schema';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { sessionFor }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The kinds with a hue of their own; anything else prints itself muted. */
    const TONES: Record<string, string> = {
        prompt: 'blue',
        tool: 'teal',
        edit: 'amber',
        turn: 'green',
        bust: 'red'
    };

    const record = $derived(sessionFor(instance.id));
    const events = $derived(record?.timeline ?? []);
    const turns = $derived(timelineTurns(events));

    let column: HTMLDivElement | undefined = $state();

    /**
     * The session on screen. A change to it is what makes the column fresh and sends it to the
     * foot.
     */
    let shown = '';

    $effect(() => {
        const id = record?.id ?? '';
        // The count is read here as well as the id, so a push on the session already shown re-runs
        // this too; then the column follows the newest event only if the reader was at the foot.
        const count = events.length;
        const box = column;
        if (box === undefined) return;
        const fresh = id !== shown;
        shown = id;
        if (fresh || (count > 0 && atFoot(box))) box.scrollTop = box.scrollHeight;
    });

    /** Pixels from the foot that still count as reading the newest event. */
    const SLACK = 24;

    function atFoot(box: HTMLDivElement): boolean {
        return box.scrollTop + box.clientHeight >= box.scrollHeight - SLACK;
    }

    /** The tag's word. The five known kinds have one; anything else says what it calls itself. */
    function kindLabel(kind: string): string {
        if (kind === 'prompt') return t('sessions.ev_k_prompt');
        if (kind === 'tool') return t('sessions.ev_k_tool');
        if (kind === 'edit') return t('sessions.ev_k_edit');
        if (kind === 'turn') return t('sessions.ev_k_turn');
        if (kind === 'bust') return t('sessions.ev_k_bust');
        return kind;
    }

    /** What the row reads: a turn as its length, a bust as its size, a path as its basename. */
    function text(event: SessionEvent): string {
        const held = asText(event.text);
        if (event.kind === 'turn') {
            return t('sessions.ev_turn', String(Math.round((Number(held) || 0) / 1000)));
        }
        if (event.kind === 'bust') {
            return t('sessions.ev_bust', compactCount(Number(held) || 0));
        }
        if (event.kind === 'tool' || event.kind === 'edit') return basename(held);
        return held;
    }

    /** The tooltip: the whole path, and nothing where the row already says everything it has. */
    function tip(event: SessionEvent): string | undefined {
        const held = asText(event.text);
        if (event.kind === 'turn' || event.kind === 'bust') return undefined;
        if (event.kind === 'tool' || event.kind === 'edit') {
            return basename(held) === held ? undefined : held;
        }
        return held;
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.view_timeline')}>
        <SessionPicker instance={instance.id} />
    </Toolbar>
{/snippet}

<Pane title={t('sessions.view_timeline')} toolbar={tools} tinted>
    <div class="timeline" bind:this={column} data-instance={instance.id}>
        {#if record === null}
            <PickSession message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else if events.length === 0}
            <Empty message={t('sessions.tl_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each turns as turn, index (`${index}:${turn.at ?? ''}`)}
                <section class="turn" data-turn={index}>
                    <h4 class="turn-h">
                        <span class="ts">{clock(turn.at)}</span>
                        {#if turn.prompt !== null}
                            <Tag label={kindLabel('prompt')} tone="blue" />
                            <span class="tx" title={tip(turn.prompt)}>{text(turn.prompt)}</span>
                        {:else}
                            <span class="tx">{t('sessions.tl_before')}</span>
                        {/if}
                    </h4>
                    {#each turn.events as event, at (`${at}:${event.ts ?? ''}`)}
                        <div class="event">
                            <span class="ts">{clock(event.ts)}</span>
                            <Tag label={kindLabel(event.kind)} tone={TONES[event.kind]} />
                            <span class="tx" title={tip(event)}>{text(event)}</span>
                        </div>
                    {/each}
                </section>
            {/each}
        {/if}
    </div>
</Pane>

<style>
    .timeline {
        display: flex;
        flex-direction: column;
        gap: 2px;
        height: 100%;
        overflow: auto;
    }

    .turn {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--line);
    }

    .turn-h {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        margin: 0;
        font-size: var(--fs-sm);
        font-weight: 700;
    }

    .turn .event {
        padding-left: 12px;
    }

    .event {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
    }

    .ts {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    .tx {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* The terminal shape: a log, in the face a log is read in. */
    :global(body.rice) .timeline {
        font-family: var(--font-mono);
    }
</style>
