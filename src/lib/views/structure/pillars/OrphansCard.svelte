<script lang="ts">
    // Layer 3, Pillars partial. The portfolio-fit callout: unmatched real projects, or the clean
    // confirmation when every real project names a registry line.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Project } from '$lib/state/boards/collection';
    import { t } from '$lib/state/words/text';

    type Props = { id: string; cursor: boolean; projects: Project[] };
    let { id, cursor, projects }: Props = $props();

    function title(): string {
        return projects.length > 0 ? t('pillars.orphans') : t('pillars.no_orphans');
    }

    function blurb(): string {
        return projects.length > 0 ? t('pillars.orphans_blurb') : t('pillars.no_orphans_blurb');
    }
</script>

<div data-pillar-orphans>
    <Card {id} {cursor} title={title()}>
        {#snippet meta()}
            <Glyph name={projects.length > 0 ? 'warn' : 'check'} />
            {#if projects.length > 0}
                <Tag label={t('pillars.untagged', projects.length)} />
            {/if}
        {/snippet}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p>{@html inlineMarkdown(blurb())}</p>
        {#if projects.length > 0}
            <CrossLinks {projects} />
        {/if}
    </Card>
</div>

<style>
    p {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
