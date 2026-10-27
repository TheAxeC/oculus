<script lang="ts">
    // Layer 3, shared view. The top row of a project card: the facts that say what the project is,
    // each a glyph and its words, in this order: the Lead badge while the project's `lead:` names
    // the user (the person marked `self: true`), the Focus lane it sits on among its own hub's
    // lanes, its form and its chips with their words and glyphs of `forms` and `chips` of its hub's
    // words, its code status, whether it is reproduced, its compute resources, and last the name of
    // its folder with the folder glyph. The stage is the card's filled chip, drawn by
    // ProjectCard.svelte in its heading.
    //
    // The folder is the workspace folder the project is read from, else the last part of its
    // `folder:`; its tip is the whole path, the workspace folder's directory or the hub-relative
    // `folder:`, and a press opens the folder as the card's Folder action does. A project with no
    // folder draws none.
    //
    // Each fact is wrapped in ui/menu/Tooltip.svelte with the words of its kind ("Focus lane:
    // Review", "Code: deposited"), which the pointer's rest shows. The wrappers take no tab stop,
    // so a card gains no stops before its controls; a reader of the page reads each fact's own
    // words.
    //
    // A glyph named by a hub's words is drawn only where the glyph vocabulary holds it, through
    // card.ts `laneGlyph`, `wordGlyph` and `computeGlyph`, which give a stand-in otherwise, so
    // every fact carries a glyph and no name from a hub's file reaches a Glyph that would throw. A
    // form or a chip is drawn in the hue of its word (tones.ts `statusMarkTone`, the colour its
    // legend `icon` names), and the neutral tone for a word with none, except a chip whose word of
    // `chips` carries the flag `blocked`, which is drawn red, as the card's BLOCKED line is.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import { codeLabel, computeGlyph, laneGlyph, wordGlyph } from '../card';
    import type { BoardItem } from '$lib/state/boards/board';
    import { isBlocked, projectLane } from '$lib/state/boards/focus';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import {
        chipGlyphName,
        chipLabel,
        statusMarkTone,
        vocabOf
    } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The joined board item whose facts are drawn. */
        item: BoardItem;
        /** Open the project's folder, as the card's Folder action does. */
        onfolder: () => void;
    };
    let { item, onfolder }: Props = $props();

    const hub = $derived(rootOf(item.project));

    /** The words of the project's own hub, which say which chip blocks it. */
    const words = $derived(vocabOf(hub));

    /** The folder's name and its whole path, or null for a project with no folder. */
    const folder = $derived.by((): { name: string; path: string } | null => {
        const own = item.project.workspaceFolder;
        if (own !== undefined) return { name: own.root, path: own.dir };
        const path = item.project.folder;
        return path === '' ? null : { name: path.split('/').at(-1) ?? path, path };
    });

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
            tone={!isForm(at) && isBlocked({ chips: [chip] }, words)
                ? 'red'
                : statusMarkTone(chip, hub)}
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
{#if folder !== null}
    <span class="folder">
        <ToolButton plain label={folder.name} title={folder.path} onclick={onfolder}>
            <Tag label={folder.name} glyph={t('project.card.folder_glyph')} />
        </ToolButton>
    </span>
{/if}

<style>
    /* The folder's box, which draws its look: no frame until the pointer is over it, then the chip
       surface, as a cross-link of the card does. Its name is in the monospace face, the one line
       of the card that names a place on disk. */
    .folder {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: 100%;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
    }

    .folder:hover {
        background: var(--chip);
    }
</style>
