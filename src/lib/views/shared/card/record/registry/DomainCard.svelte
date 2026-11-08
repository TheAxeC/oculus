<script lang="ts">
    // Layer 3, shared view partial, drawn by the Domains view and, with `page`, by the domain's
    // page (views/boards/entry/Entry.svelte). One domain as the record card
    // (views/shared/card/record/RecordCard.svelte): its configured accent, the tag counting its
    // projects, its registry prose, and the strip of its projects at the foot. Its projects are
    // every project that names it, dead ends included (state/boards/structure/lines.ts
    // `domainMembers`), which the tag counts and the strip groups, the dead ends a group of their
    // own as on the page's row; the dormant look reads the real ones among them. Its heading and
    // the strip's Page open the domain's page; the menu holds Page, the Add run, Edit, Edit in File
    // and Delete (views/shared/forms/registry/registry-card.svelte.ts). On the page the heading is
    // words, the strip holds Edit, the blurb is the left of the two columns of a record's page
    // under its small label (views/shared/card/record/RecordDetails.svelte), and the card draws no
    // strip of projects, which the row under the page's card counts.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import FieldMarkdown from '$lib/views/shared/card/text/FieldMarkdown.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import RecordField from '$lib/views/shared/card/record/RecordField.svelte';
    import { realProjects } from '$lib/state/sources/registries/venues';
    import { t } from '$lib/state/shared/words/text';
    import {
        createRegistryCard,
        type RegistryCardProps
    } from '$lib/views/shared/forms/registry/registry-card.svelte';
    import { projectCount } from '$lib/views/shared/card/card';
    import { inlineMarkdown, useHtmlMemo } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import { isDormant, type Domain } from '$lib/state/boards/structure/lines';
    import { domainTone, vocabOf } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';
    import { rootOf } from '$lib/state/shared/page/hubs';

    type Props = RegistryCardProps & { domain: Domain };
    let {
        domain,
        cursor,
        projects,
        entry,
        schema,
        file,
        fault,
        onsaid,
        page = false
    }: Props = $props();

    const client = useState();
    const {
        selectors: { configMap, registryKey }
    } = client;

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();
    const htmlMemo = useHtmlMemo();

    /** The key the domain's hub gives the domains registry, which its page and writes name. */
    const collection = $derived(registryKey('domains', rootOf(domain)));

    const card = createRegistryCard(client, () => ({
        file,
        entry,
        schema,
        fault,
        onsaid,
        collection,
        title: domain.title,
        page
    }));
</script>

{#snippet meta()}
    <Tag label={projectCount(projects.length)} />
{/snippet}

{#snippet text()}
    {#if domain.blurb}
        <div class="blurb">
            <FieldMarkdown text={domain.blurb} />
        </div>
    {/if}
{/snippet}

{#snippet left()}
    {#if domain.blurb}
        <RecordField label={t('domains.field_blurb')}>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render text()}
        </RecordField>
    {/if}
{/snippet}

<div
    class="slot"
    class:dormant={isDormant(realProjects(projects, configMap(), vocabOf), configMap(), vocabOf)}
    data-domain={domain.id}
>
    <RecordCard
        {...card.face}
        id={domain.id}
        {cursor}
        title={domain.title}
        titleHtml={inlineMarkdown(domain.title, cardMath(domain.title), htmlMemo)}
        tone={domainTone(domain.id)}
        record={domain}
        actions={card.actions}
        {onsaid}
        {meta}
        {text}
        {left}
        {projects}
        archival
    />
</div>

<style>
    /* The slot fills its grid cell and the record card fills the slot, so the cards of one row are
       one height and no empty cell is left under a short one. */
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* A dormant domain is faded as archival; while the pointer is over it or the keyboard focus is
       inside it the fade lifts, so it is read at full strength. */
    .dormant {
        opacity: 0.62;
        transition: opacity 120ms ease;
    }

    .dormant:hover,
    .dormant:focus-within {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        .dormant {
            transition: none;
        }
    }

    .blurb {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
