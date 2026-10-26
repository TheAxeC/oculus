<script lang="ts">
    // Layer 3, view partial of views/boards/focus/lanes/Lanes.svelte. One card on a lane: its name
    // alone on the first line with its deadline and the move menu, then its tags, then the
    // lines saying what it waits on and what is next. It draws what the lanes hand it and reads no
    // store: the marks, the facts, the deadline, the waiting line and the menu are the lanes'
    // rules, and every press is handed back. A project of a hub but the primary carries the hub's
    // chip after its name, as the Command center's rows and the Projects board's cards do.
    //
    // The tags are drawn as the facts row of a project board card draws its facts
    // (views/shared/card/project/CardFacts.svelte): each a glyph and its words, wrapped in
    // ui/menu/Tooltip.svelte with the words of its kind ("Stage: Submitted", "Venue: Neural
    // Networks"). They are, in order, the status marks the lanes give (the stage, the form and the
    // chips each in its word's hue, tones.ts `statusMarkTone`, a chip whose word carries `blocked`
    // in red), then the facts (the user's role, the tier, the venue by its short name with its
    // whole name in the tip). Every tag is drawn: the tags a line has no room for wrap onto a
    // further line under it, and the name stays alone on its own line above them.
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

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import { wordGlyph } from '$lib/views/shared/card/card';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { firstSentence } from '$lib/state/boards/board';
    import { isBlocked, type LaneFact, type Project } from '$lib/state/boards/focus';
    import { t } from '$lib/state/shared/words/text';
    import {
        chipGlyphName,
        chipLabel,
        statusMarkTone,
        vocabOf
    } from '$lib/state/shared/words/tones';
    import { rootOf } from '$lib/state/shared/page/hubs';

    type Props = {
        project: Project;
        /**
         * The status marks the card draws, every one in order: the words the lanes work out for the
         * lane the card is on (state/boards/focus.ts `laneMarks`), each word once.
         */
        marks: string[];
        /**
         * The facts drawn after the marks: the user's role, the tier and the venue where each says
         * something (state/boards/focus.ts `laneFacts`).
         */
        facts: LaneFact[];
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
        facts,
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

    /**
     * One tag of the card: its words, its glyph, its tone, the words of its tip, whether it
     * is drawn as a chip (a form or a chip) or as a tag (the stage and the facts), and whether its
     * words are cut past a bounded width (the venue, whose whole name is in its tip).
     */
    type Tagged = {
        key: string;
        label: string;
        glyph: string;
        tone: string | undefined;
        tip: string;
        chip: boolean;
        cut: boolean;
    };

    /** The glyph of each kind of fact. */
    const FACT_GLYPHS: Record<LaneFact['kind'], string> = {
        role: t('project.card.role_glyph'),
        tier: t('project.card.tier_glyph'),
        venue: t('project.card.venue_glyph')
    };

    /** The words of a fact's tip, which name its kind: "Role: Supervisor", "Venue: ...". */
    function factTip(fact: LaneFact): string {
        if (fact.kind === 'role') return t('project.card.lead_tip', fact.whole);
        if (fact.kind === 'tier') return t('project.card.tier_tip', fact.whole);
        return t('project.card.venue_tip', fact.whole);
    }

    const hub = $derived(rootOf(project));

    /** The tags in the order drawn: the marks, then the facts. */
    const tags: Tagged[] = $derived([
        ...marks.map((word): Tagged => {
            const words = chipLabel(word, hub);
            const glyph = wordGlyph(chipGlyphName(word, hub));
            if (word === project.stage) {
                const tip = t('project.card.stage_tip', words);
                const tone = statusMarkTone(word, hub);
                const key = `mark:${word}`;
                return { key, label: words, glyph, tone, tip, chip: false, cut: false };
            }
            const form = word === project.form;
            const blocked = !form && isBlocked({ chips: [word] }, vocabOf(hub));
            return {
                key: `mark:${word}`,
                label: words,
                glyph,
                tone: blocked ? 'red' : statusMarkTone(word, hub),
                tip: form ? t('project.card.form_tip', words) : t('project.card.chip_tip', words),
                chip: true,
                cut: false
            };
        }),
        ...facts.map((fact): Tagged => ({
            key: `fact:${fact.kind}`,
            label: fact.label,
            glyph: FACT_GLYPHS[fact.kind],
            tone: undefined,
            tip: factTip(fact),
            chip: false,
            cut: fact.kind === 'venue'
        }))
    ]);
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
    {#if tags.length > 0}
        <div class="tags">
            {#each tags as one (one.key)}
                <Tooltip text={one.tip}>
                    {#if one.chip}
                        <Chip label={one.label} glyph={one.glyph} tone={one.tone} />
                    {:else if one.cut}
                        <span class="cut">
                            <Tag label={one.label} glyph={one.glyph} tone={one.tone} />
                        </span>
                    {:else}
                        <Tag label={one.label} glyph={one.glyph} tone={one.tone} />
                    {/if}
                </Tooltip>
            {/each}
        </div>
    {/if}
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

    /* The first line is one row of the tree's height and never wraps: the name takes what the
       hub chip, the deadline and the move menu leave, and is cut. The waiting and next lines are
       18 px lines. */
    .card-h {
        display: flex;
        align-items: center;
        gap: 5px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    /* The name is a plain button, inside the box below that draws its look. */
    .name {
        display: inline-flex;
        flex: 1 1 auto;
        min-width: 0;
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
        display: inline-flex;
        flex: none;
    }

    /* The tags: as many to a line as fit, the rest wrapping onto further lines. */
    .tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 6px;
        min-width: 0;
        padding-bottom: 4px;
    }

    /* A venue tag is cut with an ellipsis past this width, its whole name in its tip, so a long
       venue name shortens rather than taking a line of its own. */
    .cut {
        display: inline-flex;
        min-width: 0;
        max-width: 14em;
    }

    /* The move menu is drawn as the card around it says, and keeps the keyboard while it is not
       drawn. */
    .move {
        display: inline-flex;
        flex: none;
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
