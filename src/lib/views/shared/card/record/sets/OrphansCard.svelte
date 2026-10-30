<script lang="ts">
    // Layer 3, shared view partial, drawn by the Pillars view and at the top of the set's page
    // (views/boards/listing/Listing.svelte). The Orphans card, drawn as the record card
    // (views/shared/card/record/RecordCard.svelte): the real projects outside the tiers
    // `research_audit.skip_tiers` names whose `pillars:` names no line of the pillars file, as the
    // project strip at its foot, or the confirmation when there are none. Its title opens the set's
    // page (`ontitle`), with no orphans too, and on that page, which lists the projects, the card
    // is drawn with no strip. The card has no action, so no menu of its own.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Project } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        id: string;
        cursor: boolean;
        projects: Project[];
        /** Open the set's page; none draws the title as words. */
        ontitle?: () => void;
        /** Whether the foot draws the project strip. */
        listed?: boolean;
    };
    let { id, cursor, projects, ontitle, listed = true }: Props = $props();

    function title(): string {
        return projects.length > 0 ? t('pillars.orphans') : t('pillars.no_orphans');
    }

    function blurb(): string {
        return projects.length > 0 ? t('pillars.orphans_blurb') : t('pillars.no_orphans_blurb');
    }
</script>

{#snippet meta()}
    <Glyph name={projects.length > 0 ? 'warn' : 'check'} />
    {#if projects.length > 0}
        <Tag label={t('pillars.on_no_line', projects.length)} />
    {/if}
{/snippet}

{#snippet text()}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
    <p>{@html inlineMarkdown(blurb())}</p>
{/snippet}

<div class="slot" data-pillar-orphans>
    <RecordCard
        {id}
        {cursor}
        title={title()}
        {ontitle}
        {meta}
        {text}
        projects={listed ? projects : undefined}
    />
</div>

<style>
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    p {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
