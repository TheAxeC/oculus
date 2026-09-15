<script lang="ts">
    // Layer 3, Domains partial. One populated domain, its configured accent, registry prose,
    // grouped project links and schema-driven edit form.

    import Card from '$lib/ui/Card.svelte';
    import Tag from '$lib/ui/Tag.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import CrossLinks from '$lib/views/shared/CrossLinks.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Entry, SchemaField } from '$lib/state/collection';
    import { isDormant, type Domain, type Project } from '$lib/state/lines';
    import { t } from '$lib/state/text';
    import { domainTone } from '$lib/state/tones';

    type Props = {
        domain: Domain;
        cursor: boolean;
        projects: Project[];
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        editing: boolean;
        onedit: () => void;
        onsaid: (said: string) => void;
    };
    let { domain, cursor, projects, entry, schema, editing, onedit, onsaid }: Props = $props();

    function projectWord(): string {
        return projects.length === 1 ? t('programs.project') : t('programs.projects');
    }
</script>

<div class:dormant={isDormant(projects)} data-domain={domain.id}>
    <Card
        id={domain.id}
        {cursor}
        title={domain.title}
        titleHtml={inlineMarkdown(domain.title)}
        tone={domainTone(domain.id)}
    >
        {#snippet meta()}
            <Tag label={`${projects.length} ${projectWord()}`} />
            {#if entry !== null && schema !== undefined}
                <ToolButton
                    label={t('collection.form_edit_title')}
                    glyph={t('collection.edit_glyph')}
                    compact
                    active={editing}
                    onclick={onedit}
                />
            {/if}
        {/snippet}
        {#if domain.blurb}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p>{@html inlineMarkdown(domain.blurb)}</p>
        {/if}
        <CrossLinks {projects} />
        {#if editing && entry !== null}
            <EntryForm collection="domains" {schema} {entry} onclose={onedit} {onsaid} />
        {/if}
    </Card>
</div>

<style>
    .dormant {
        opacity: 0.62;
    }

    p {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
