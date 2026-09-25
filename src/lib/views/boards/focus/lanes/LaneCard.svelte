<script lang="ts">
    // Layer 3, view partial of views/boards/focus/lanes/Lanes.svelte. One card on a lane: the
    // priority flames at its leading edge, its status marks, its name, its deadline, the move menu,
    // and the lines saying what it waits on and what is next. It draws what the lanes hand it and
    // reads no store: the deadline, the waiting line, the flame count and the menu are the lanes'
    // rules, and every press is handed back.
    //
    // A card is its own markup rather than ui/frame/Card.svelte: it is a drag handle with a
    // click-to-cycle badge at its leading edge, which is a different thing from the card a board of
    // projects draws. It carries `data-card` and `data-cursor` all the same, which is what the
    // workbench's keyboard cursor moves over, so a lane card is reachable by key like every card
    // the primitive draws.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { firstSentence } from '$lib/state/boards/board';
    import { labelOf, type Project } from '$lib/state/boards/focus';
    import { t } from '$lib/state/shared/words/text';
    import { chipGlyphName, chipLabel, statusMarkTone } from '$lib/state/shared/words/tones';

    type Props = {
        project: Project;
        /** Whether the instance's keyboard cursor is on this card. */
        current: boolean;
        /** The deadline badge, or null for a project with none. */
        due: { label: string; tone?: string } | null;
        /** What the card says it is waiting on, or the empty string. */
        wait: string;
        /** How many flames the badge draws, and whether none is set, which draws one faint. */
        flames: number;
        unset: boolean;
        /** The move menu's choices: every lane, then every priority. */
        items: MenuItem[];
        onpick: (id: string) => void;
        oncycle: () => void;
        onopen: () => void;
        ondragstart: (event: DragEvent) => void;
        ondragend: () => void;
    };

    let {
        project,
        current,
        due,
        wait,
        flames,
        unset,
        items,
        onpick,
        oncycle,
        onopen,
        ondragstart,
        ondragend
    }: Props = $props();

    /** How much of `next` a card shows. */
    const CARD_NEXT = 130;

    /** How many status chips a card carries; the rest are on the project's own tab. */
    const CARD_CHIPS = 2;
</script>

<div
    class="card"
    role="listitem"
    data-card={project.id}
    data-cursor={current || undefined}
    draggable={!project.ghost}
    title={project.title}
    {ondragstart}
    {ondragend}
>
    <div class="card-h">
        {#if project.ghost}
            <span class="chipicon" title={t('project.card.ghost_badge_tip')}>
                <Glyph name={t('board.warn_glyph')} />
            </span>
        {:else}
            <button
                type="button"
                class="flames"
                class:unset
                title={project.priority ?? t('focus.set_priority')}
                onclick={oncycle}
            >
                {#each { length: flames } as _, at (at)}
                    <Glyph name={t('focus.fire_glyph')} />
                {/each}
            </button>
        {/if}
        {#each project.chips.slice(0, CARD_CHIPS) as chip (chip)}
            <span class="mark">
                <Tag
                    label={chipLabel(chip)}
                    glyph={chipGlyphName(chip)}
                    tone={statusMarkTone(chip)}
                />
            </span>
        {/each}
        <button type="button" class="name" onclick={onopen}>
            {labelOf(project)}
        </button>
        {#if due}
            <span class="due">
                <Tag label={due.label} glyph={t('project.card.deadline_glyph')} tone={due.tone} />
            </span>
        {/if}
        {#if !project.ghost}
            <Menu label={t('focus.move_to')} {items} placement="down" {onpick} />
        {/if}
    </div>
    {#if wait !== ''}
        <p class="wait">{wait}</p>
    {/if}
    {#if project.next}
        <p class="next">{firstSentence(project.next, CARD_NEXT)}</p>
    {/if}
</div>

<style>
    .card {
        min-width: 0;
        padding: 6px 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--tone, var(--line));
        border-radius: 6px;
        background: var(--bg);
        cursor: grab;
    }

    .card-h {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 5px;
    }

    .flames,
    .name {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        cursor: pointer;
    }

    .flames {
        display: inline-flex;
        flex: 0 0 auto;
        font-size: var(--fs-xxs);
        line-height: 1;
    }

    .flames.unset {
        opacity: 0.22;
    }

    .flames.unset:hover,
    .flames.unset:focus-visible {
        opacity: 0.6;
    }

    /* The ghost badge: a line icon whose words are its tooltip. */
    .chipicon {
        flex: 0 0 auto;
        font-size: var(--fs-xs);
        line-height: 1;
    }

    /* A status mark is its glyph and its word in the status's hue. It keeps its whole width, so a
       row with no room left for it wraps the mark to the next line rather than cutting its word. */
    .mark {
        flex: 0 0 auto;
        max-width: 100%;
    }

    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
        font-weight: 650;
        color: var(--ink-txt, var(--ink));
    }

    .name:hover,
    .name:focus-visible {
        color: var(--accent-txt, var(--accent));
        text-decoration: underline;
    }

    .due {
        margin-left: auto;
    }

    .wait,
    .next {
        margin: 2px 0 0;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }
</style>
