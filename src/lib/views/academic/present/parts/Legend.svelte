<script lang="ts">
    // Layer 3, Present partial. The row of chips under a title, a section or a grid slide: one per
    // domain of a group's projects, or one per status chip a grid looks for. The words and the hue
    // of each come from config/catalogs/vocab.yml by key, so no deck file carries either.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import { chipLabel, domainLabel, domainTone, statusTone } from '$lib/state/shared/words/tones';

    type Props = {
        /** Domain keys, drawn with the `domains` entry's label and colour. */
        domains?: string[];
        /** Status chip keys, drawn with the legend's label and the status palette's colour. */
        statuses?: string[];
    };

    let { domains = [], statuses = [] }: Props = $props();
</script>

{#if domains.length + statuses.length > 0}
    <div class="legend">
        {#each domains as domain (domain)}
            <Tag label={domainLabel(domain)} tone={domainTone(domain)} />
        {/each}
        {#each statuses as status (status)}
            <Tag label={chipLabel(status)} tone={statusTone(status)} />
        {/each}
    </div>
{/if}

<style>
    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 20px 0 6px;
    }
</style>
