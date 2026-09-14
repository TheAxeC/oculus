<script lang="ts">
    // Layer 3, view partial of views/Radar.svelte. One paper with its metadata, links, and writes.
    // It receives the feed entry and project map and keeps only the optional idea form locally.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import NewIdeaForm from '$lib/views/shared/NewIdeaForm.svelte';
    import { inlineMarkdown } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';
    import {
        crossLinksOf,
        ideaSeed,
        isNew,
        relevanceTone,
        type Project,
        type RadarEntry
    } from '$lib/state/radar';
    import { t } from '$lib/state/text';
    import { writeFeedField } from '$lib/state/writes.svelte';

    type Props = {
        entry: RadarEntry;
        lastRun: unknown;
        projects: Record<string, Project>;
        dismissed?: boolean;
        onsaid: (words: string) => void;
    };

    let { entry, lastRun, projects, dismissed = false, onsaid }: Props = $props();
    let spinning = $state(false);

    const text = (field: string): string => {
        const value = entry[field];
        return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    };
    const identity = $derived(text('title'));
    const title = $derived(identity || t('radar.untitled'));
    const relevance = $derived(text('relevance'));
    const motif = $derived(text('motif'));
    const note = $derived(text('why') || text('idea_spark'));
    const threat = $derived(text('threatens'));
    const found = $derived(text('found'));
    const links = $derived(crossLinksOf(entry, projects));
    const canSpin = $derived(text('bucket') === 'idea' || text('maps_to') === 'new-idea-candidate');
    const sub = $derived(
        [text('authors'), text('venue'), text('year')].filter(Boolean).join(t('venues.sep'))
    );

    async function mark(value: boolean | null): Promise<void> {
        if (identity === '') return;
        const answer = await writeFeedField('radar', identity, 'dismissed', value);
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }

    async function created(): Promise<void> {
        await mark(true);
    }
</script>

<Card {title} titleHtml={inlineMarkdown(title)} tone={relevanceTone(relevance)}>
    {#snippet meta()}
        {#if isNew(entry, lastRun)}
            <Chip label={t('radar.new')} filled tone="violet" />
        {/if}
        {#if relevance !== ''}
            <Chip label={relevance} tone={relevanceTone(relevance)} />
        {/if}
        {#if found !== ''}
            <span class="date">{found}</span>
        {/if}
        {#if dismissed && identity !== ''}
            <ToolButton
                label={t('radar.restore')}
                title={t('radar.restore_tip')}
                glyph="refresh"
                compact
                onclick={() => mark(null)}
            />
        {:else}
            {#if canSpin && identity !== ''}
                <ToolButton
                    label={t('radar.idea')}
                    title={t('radar.idea_tip')}
                    glyph="spark"
                    compact
                    active={spinning}
                    onclick={() => (spinning = !spinning)}
                />
            {/if}
            {#if identity !== ''}
                <ToolButton
                    label={t('radar.dismiss')}
                    title={t('radar.dismiss_tip')}
                    glyph="dismiss"
                    compact
                    onclick={() => mark(true)}
                />
            {/if}
        {/if}
    {/snippet}

    {#if sub !== ''}
        <p class="sub">{sub}</p>
    {/if}
    {#if motif !== ''}
        <div class="row">
            <Chip label={motif} />
        </div>
    {/if}
    {#if note !== ''}
        <p class="note">{@html inlineMarkdown(note)}</p>
    {/if}
    {#if threat !== ''}
        <p class="threat">
            <Glyph name="warn" />
            <span>{@html t('radar.threatens', inlineMarkdown(threat))}</span>
        </p>
    {/if}
    {#if links.length > 0 || text('maps_to') === 'new-idea-candidate'}
        <div class="row">
            {#each links as project (project.id)}
                <ToolButton
                    label={project.title}
                    glyph="goto"
                    onclick={() =>
                        openView('project', 'main', { id: project.id, label: project.title })}
                />
            {/each}
            {#if text('maps_to') === 'new-idea-candidate'}
                <Chip label={t('radar.new_idea_candidate')} glyph="spark" />
            {/if}
        </div>
    {/if}
    {#if text('url').startsWith('http')}
        <p class="paper">
            <a href={text('url')} target="_blank" rel="noreferrer">
                <Glyph name="link" />
                {t('radar.paper')}
            </a>
        </p>
    {/if}
    {#if spinning && identity !== ''}
        <NewIdeaForm
            seed={{ ...ideaSeed(entry), title: text('title') }}
            onclose={() => (spinning = false)}
            {onsaid}
            oncreated={created}
        />
    {/if}
</Card>

<style>
    .sub,
    .note,
    .threat,
    .paper {
        margin: 4px 0 0;
    }

    .sub {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .date {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .row,
    .threat {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
    }

    .threat {
        color: var(--c-red-txt);
    }

    .paper a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
    }
</style>
