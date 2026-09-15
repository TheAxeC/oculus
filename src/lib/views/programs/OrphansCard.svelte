<script lang="ts">
    // Layer 3, Programs partial. The portfolio-fit callout: unmatched real projects, or the clean
    // confirmation when every real project names a registry line.

    import Card from '$lib/ui/Card.svelte';
    import Tag from '$lib/ui/Tag.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import CrossLinks from '$lib/views/shared/CrossLinks.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Project } from '$lib/state/collection';
    import { t } from '$lib/state/text';

    type Props = { id: string; cursor: boolean; projects: Project[] };
    let { id, cursor, projects }: Props = $props();

    function title(): string {
        return projects.length > 0 ? t('programs.orphans') : t('programs.no_orphans');
    }

    function blurb(): string {
        return projects.length > 0 ? t('programs.orphans_blurb') : t('programs.no_orphans_blurb');
    }
</script>

<div data-program-orphans>
    <Card {id} {cursor} title={title()}>
        {#snippet meta()}
            <Glyph name={projects.length > 0 ? 'warn' : 'check'} />
            {#if projects.length > 0}
                <Tag label={t('programs.untagged', projects.length)} />
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
