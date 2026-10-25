<script lang="ts">
    // Layer 3, view partial of views/boards/focus/lanes/Lanes.svelte. One card on a lane: its
    // status marks, its name, its deadline, the move menu, and the lines saying what it waits on
    // and what is next. It draws what the lanes hand it and reads no store: the marks, the
    // deadline, the waiting line and the menu are the lanes' rules, and every press is handed back.
    // A project of a hub but the primary carries the hub's chip after its name, as the Command
    // center's rows and the Projects board's cards do.
    //
    // A card is its own markup rather than ui/frame/Card.svelte: it is a drag handle whose first
    // line is one row of the tree's height, which is a different thing from the titled box with a
    // meta row and a body that a board of projects draws. It carries `data-card` and `data-cursor`
    // all the same, which is what the workbench's keyboard cursor moves over, so a lane card is
    // reachable by key like every card the primitive draws, and Enter on the card under the cursor
    // presses its name, which opens the project.
    //
    // A web address written in the next line is a link (ui/display/text/LinkedText.svelte); the
    // waiting line is names and catalog words.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { firstSentence } from '$lib/state/boards/board';
    import type { Project } from '$lib/state/boards/focus';
    import { t } from '$lib/state/shared/words/text';
    import { chipGlyphName, chipLabel, statusMarkTone } from '$lib/state/shared/words/tones';
    import { rootOf } from '$lib/state/shared/page/hubs';

    type Props = {
        project: Project;
        /**
         * The status marks the card draws, every one in order: the words the lanes work out for the
         * lane the card is on (state/boards/focus.ts `laneMarks`), each word once.
         */
        marks: string[];
        /** The name the card draws, which the lanes work out from `focus_label_mode`. */
        label: string;
        /** Whether the instance's keyboard cursor is on this card. */
        current: boolean;
        /** The deadline badge, or null for a project with none. */
        due: { label: string; tone?: string } | null;
        /** What the card says it is waiting on, or the empty string. */
        wait: string;
        /** The move menu's choices: every lane the card may move to. */
        items: MenuItem[];
        onpick: (id: string) => void;
        onopen: () => void;
        ondragstart: (event: DragEvent) => void;
        ondragend: () => void;
    };

    let {
        project,
        marks,
        label,
        current,
        due,
        wait,
        items,
        onpick,
        onopen,
        ondragstart,
        ondragend
    }: Props = $props();

    /** How much of `next` a card shows. */
    const CARD_NEXT = 130;
</script>

<div
    class="card"
    role="listitem"
    data-card={project.id}
    data-cursor={current || undefined}
    draggable="true"
    title={project.title}
    {ondragstart}
    {ondragend}
>
    <div class="card-h">
        {#each marks as chip (chip)}
            <span class="mark">
                <Tag
                    label={chipLabel(chip, rootOf(project))}
                    glyph={chipGlyphName(chip, rootOf(project))}
                    tone={statusMarkTone(chip, rootOf(project))}
                />
            </span>
        {/each}
        <span class="name">
            <ToolButton plain cut dataCardToggle {label} onclick={onopen} />
        </span>
        <RootChip record={project} />
        {#if due}
            <span class="due">
                <Tag label={due.label} glyph={t('project.card.deadline_glyph')} tone={due.tone} />
            </span>
        {/if}
        <span class="move">
            <Menu label={t('focus.move_to')} {items} small placement="down" {onpick} />
        </span>
    </div>
    {#if wait !== ''}
        <p class="wait">{wait}</p>
    {/if}
    {#if project.next}
        <p class="next"><LinkedText text={firstSentence(project.next, CARD_NEXT)} /></p>
    {/if}
</div>

<style>
    /* `--row-reveal` says whether what the card draws only under the pointer or the keyboard is
       drawn: 0 at rest and 1 while the card is hovered, holds the focus, has the keyboard cursor
       or has its move menu open, and always on a screen whose pointer does not hover. */
    .card {
        --row-reveal: 0;
        min-width: 0;
        padding: 0 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--tone, var(--line));
        border-radius: var(--input-radius);
        background: var(--bg);
        cursor: grab;
    }

    .card:hover,
    .card:focus-within,
    .card[data-cursor],
    .card:has(:global([aria-expanded='true'])) {
        --row-reveal: 1;
    }

    @media (hover: none) {
        .card {
            --row-reveal: 1;
        }
    }

    /* The first line is one row of the tree's height; the waiting and next lines are 18 px
       lines. */
    .card-h {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    /* A status mark is its glyph and its word in the status's hue. It keeps its whole width, so a
       row with no room left for it wraps the mark to the next line rather than cutting its word. */
    .mark {
        flex: 0 0 auto;
        max-width: 100%;
    }

    /* The name is a plain button, inside the box below that draws its look. */
    .name {
        display: inline-flex;
        min-width: 0;
        max-width: 100%;
        white-space: nowrap;
        font-size: var(--fs-md);
        font-weight: 600;
        color: var(--ink-txt, var(--ink));
    }

    .name:hover,
    .name:has(:global(:focus-visible)) {
        color: var(--accent-txt, var(--accent));
        text-decoration: underline;
    }

    .due {
        margin-left: auto;
    }

    /* The move menu is drawn as the card around it says, and keeps the keyboard while it is not
       drawn. */
    .move {
        display: inline-flex;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }

    .wait,
    .next {
        margin: 0;
        font-size: var(--fs-sm);
        line-height: calc(18px * var(--text-scale, 1));
        color: var(--muted-txt, var(--muted));
    }
</style>
