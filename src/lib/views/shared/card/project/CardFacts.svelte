<script lang="ts">
    // Layer 3, shared view. The top row of a project card: the facts that say what the project is,
    // each a glyph and its words, in this order: the Lead badge while the project's `lead:` names
    // the person the workspace setting `self` names, the Focus lane it sits on among its own hub's
    // lanes, its form and its chips with their words and glyphs of `forms` and `chips` of its hub's
    // words, its code status, whether it is reproduced, and its compute resources. The stage is the
    // card's filled chip, drawn by ProjectCard.svelte in its heading.
    //
    // Each fact is wrapped in ui/menu/Tooltip.svelte with the words of its kind ("Focus lane:
    // Review", "Code: deposited"), which the pointer's rest shows. The wrappers take no tab stop,
    // so a card gains no stops before its controls; a reader of the page reads each fact's own
    // words.
    //
    // A glyph named by a hub's words is drawn only where the glyph vocabulary holds it, through
    // card.ts `laneGlyph`, `wordGlyph` and `computeGlyph`, which give a stand-in otherwise, so
    // every fact carries a glyph and no name from a hub's file reaches a Glyph that would throw. A
    // form or a chip has no colour of its own, so each is drawn in the neutral tone.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import { codeLabel, computeGlyph, laneGlyph, wordGlyph } from '../card';
    import type { BoardItem } from '$lib/state/boards/board';
    import { projectLane } from '$lib/state/boards/focus';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { UNKNOWN_TONE, chipGlyphName, chipLabel, vocabOf } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The joined board item whose facts are drawn. */
        item: BoardItem;
    };
    let { item }: Props = $props();

    const hub = $derived(rootOf(item.project));

    /** The Focus board lane the project sits on, among its own hub's lanes. */
    const lane = $derived(projectLane(item.project, vocabOf));

    /** Whether the word at place `at` of `item.chips` is the project's form, which comes first. */
    function isForm(at: number): boolean {
        return at === 0 && item.project.form !== undefined;
    }
</script>

{#if item.lead}
    <Tooltip text={t('project.card.lead_tip', t('roles.lead'))}>
        <Tag label={t('roles.lead')} glyph={t('roles.lead_glyph')} />
    </Tooltip>
{/if}
{#if lane}
    <Tooltip text={t('project.card.lane_tip', lane.label)}>
        <Tag label={lane.label} glyph={laneGlyph(lane.icon)} />
    </Tooltip>
{/if}
{#each item.chips as chip, at (`${String(at)}:${chip}`)}
    <Tooltip
        text={isForm(at)
            ? t('project.card.form_tip', chipLabel(chip, hub))
            : t('project.card.chip_tip', chipLabel(chip, hub))}
    >
        <Chip
            label={chipLabel(chip, hub)}
            glyph={wordGlyph(chipGlyphName(chip, hub))}
            tone={UNKNOWN_TONE}
        />
    </Tooltip>
{/each}
{#if item.code !== ''}
    <Tooltip text={t('project.card.code_tip', codeLabel(item.code, t))}>
        <Tag label={codeLabel(item.code, t)} glyph={t('project.card.code_glyph')} />
    </Tooltip>
{/if}
{#if item.reproduced}
    <Tooltip text={t('project.card.repro_tip')}>
        <Tag label={t('board.repro_yes')} glyph={t('project.card.repro_glyph')} />
    </Tooltip>
{/if}
{#each item.compute as resource (resource.id)}
    <Tooltip text={t('project.card.compute_tip', resource.label)}>
        <Tag label={resource.label} glyph={computeGlyph(resource.kind)} />
    </Tooltip>
{/each}
