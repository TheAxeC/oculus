<script lang="ts">
    // Layer 3, Present partial. The row of chips under a title, a section or a grid slide: one per
    // domain of a group's projects, or one per stage a grid looks for. The words and the hue of
    // each come from config/catalogs/vocab.yml by key, a stage's from the words of the deck's hub,
    // so no deck file carries either.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import { chipLabel, domainLabel, domainTone, stageTone } from '$lib/state/shared/words/tones';

    type Props = {
        /**
         * The domains, each the internal id of the domain a project's `domain:` resolves to, as the
         * merge resolves it, drawn with the `domains` entry's label and colour.
         */
        domains?: string[];
        /** Words of `stages`, drawn with their label and colour. */
        stages?: string[];
        /** The hub whose words the stages are drawn in. */
        hub?: string;
    };

    let { domains = [], stages = [], hub }: Props = $props();
</script>

{#if domains.length + stages.length > 0}
    <div class="legend">
        {#each domains as domain (domain)}
            <Tag label={domainLabel(domain)} tone={domainTone(domain)} />
        {/each}
        {#each stages as stage (stage)}
            <Tag label={chipLabel(stage, hub)} tone={stageTone(stage, hub)} />
        {/each}
    </div>
{/if}

<style>
    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.78125cqw;
        margin: 1.5625cqw 0 0.46875cqw;
    }
</style>
