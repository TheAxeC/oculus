<script lang="ts">
    // Layer 3, partial of views/sessions/session-detail/SessionDetail.svelte. The body of the
    // Timeline section: what the session did, newest last, one group per turn under the prompt that
    // opened it and that prompt's time; each event a clock, what kind of thing it was, and the
    // thing itself. A path is shown as its last name with the whole of it in the tooltip; a prompt
    // keeps its words, because a slash in a prompt is not a path.
    //
    // The turns scroll in a box of their own, at most 40vh tall, so the section under it stays
    // reachable, and where the box stands is the one piece of behaviour here. A fresh session, or a
    // section just opened, starts at the newest event, since that is what a timeline is read for.
    // After that the reader is left where they are: a push arriving while somebody is reading
    // upwards must not yank the box back down.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import { clock, compactCount } from '$lib/state/shared/words/format';
    import { nameOf } from '$lib/state/sources/explorer/file-type';
    import { timelineTurns } from '$lib/state/sessions/folds';
    import type { GroupedSession, SessionEvent } from '$lib/state/client/selectors.svelte';
    import { asText } from '$lib/state/forms/schema';
    import { t } from '$lib/state/shared/words/text';
    import { useShown } from '$lib/state/client/use';

    type Props = {
        record: GroupedSession;
        /**
         * Where the section stands among the others. A move can take the box out of the page and
         * put it back, which sets its scroll to the top with no scroll event, so each new place
         * puts the box back where the reader left it.
         */
        place: number;
    };

    let { record, place }: Props = $props();

    const tabShown = useShown();

    /** The kinds with a hue of their own; anything else prints itself muted. */
    const TONES: Record<string, string> = {
        prompt: 'blue',
        tool: 'teal',
        edit: 'amber',
        turn: 'green',
        bust: 'red'
    };

    const turns = $derived(timelineTurns(record.timeline));

    let box: HTMLDivElement | undefined = $state();

    /** The session on screen. A change to it sends the box to the foot. */
    let shown = '';

    /**
     * Whether the reader was at the foot the last time the box scrolled. It is kept by the scroll
     * listener rather than measured in an effect, because an effect runs with a push's rows already
     * in the DOM, when the old position is no longer at the foot of the new height.
     */
    let stuck = true;

    /** Where the reader left the box the last time it scrolled. */
    let offset = 0;

    /** Pixels from the foot that still count as reading the newest event. */
    const SLACK = 24;

    function scrolled(): void {
        if (box === undefined) return;
        stuck = box.scrollTop + box.clientHeight >= box.scrollHeight - SLACK;
        offset = box.scrollTop;
    }

    $effect(() => {
        const id = record.id;
        // The count is read here as well as the id, so a push on the session already shown re-runs
        // this too; then the box follows the newest event only if the reader was at the foot.
        const count = record.timeline.length;
        const held = box;
        if (held === undefined) return;
        if (id !== shown) stuck = true;
        shown = id;
        if (stuck && count > 0) held.scrollTop = held.scrollHeight;
    });

    /** The section's place, or null while the tab is hidden and a scroll does nothing. */
    const standing = $derived(tabShown() ? place : null);

    // A move of the section, and a return to a hidden tab, each put the box back where the reader
    // left it, or at the foot of a session picked while the tab was hidden.
    $effect(() => {
        if (box === undefined || standing === null) return;
        box.scrollTop = stuck ? box.scrollHeight : offset;
    });

    /** The tag's word. The five known kinds have one; anything else says what it calls itself. */
    function kindLabel(kind: string): string {
        if (kind === 'prompt') return t('sessions.ev_k_prompt');
        if (kind === 'tool') return t('sessions.ev_k_tool');
        if (kind === 'edit') return t('sessions.ev_k_edit');
        if (kind === 'turn') return t('sessions.ev_k_turn');
        if (kind === 'bust') return t('sessions.ev_k_bust');
        return kind;
    }

    /** What the row reads: a turn as its length, a bust as its size, a path as its last name. */
    function text(event: SessionEvent): string {
        const held = asText(event.text);
        if (event.kind === 'turn') {
            return t('sessions.ev_turn', String(Math.round((Number(held) || 0) / 1000)));
        }
        if (event.kind === 'bust') {
            const tokens = Number(held) || 0;
            return tokens === 1
                ? t('sessions.ev_bust_one')
                : t('sessions.ev_bust', compactCount(tokens));
        }
        if (event.kind === 'tool' || event.kind === 'edit') return nameOf(held);
        return held;
    }

    /** The tooltip: the whole path, and nothing where the row already says everything it has. */
    function tip(event: SessionEvent): string | undefined {
        const held = asText(event.text);
        if (event.kind === 'turn' || event.kind === 'bust') return undefined;
        if (event.kind === 'tool' || event.kind === 'edit') {
            return nameOf(held) === held ? undefined : held;
        }
        return held;
    }
</script>

<div class="turns" bind:this={box} onscroll={scrolled}>
    {#if turns.length === 0}
        <Empty message={t('sessions.tl_empty')} glyph={t('sessions.empty_glyph')} />
    {:else}
        {#each turns as turn, index (`${index}:${turn.at ?? ''}`)}
            <section class="turn">
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

<style>
    .turns {
        display: flex;
        flex-direction: column;
        max-height: 40vh;
        overflow: auto;
    }

    .turn {
        display: flex;
        flex-direction: column;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--line);
    }

    /* A prompt and an event are each one line of the tree's row height, the event indented one
       level under its prompt; the words are the view's size, inherited from `.session`, and the
       clock stands one step under them. */
    .turn-h,
    .event {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .turn-h {
        margin: 0;
        font-weight: 700;
    }

    .turn .event {
        padding-left: calc(var(--tree-indent) * var(--text-scale, 1));
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
</style>
