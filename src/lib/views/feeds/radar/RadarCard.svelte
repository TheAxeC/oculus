<script lang="ts">
    // Layer 3, view partial of views/feeds/radar/Radar.svelte. One paper with its metadata, links,
    // and writes: Dismiss and Restore set the entry's `dismissed`, Delete asks first and removes
    // the entry, and the title opens the paper's page, where its fields are edited. It receives the
    // feed entry and project map and keeps only the optional idea form locally. The source line
    // (authors, venue, year) is one line, cut with an ellipsis where the card ends, and its whole
    // text is the line's tooltip. A project link ends in an ellipsis where the card ends, with the
    // whole title as its tooltip.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import NewIdeaForm from '$lib/views/shared/forms/NewIdeaForm.svelte';
    import DeleteAsk from '$lib/views/shared/forms/entry/DeleteAsk.svelte';
    import { pageFault, pageFile } from '$lib/views/shared/forms/entry/edit/page-file';
    import { blockedBy } from '$lib/views/shared/forms/entry-file';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        crossLinksOf,
        ideaSeed,
        isNew,
        relevanceTone,
        type Project,
        type RadarEntry
    } from '$lib/state/feeds/radar';
    import { posting } from '$lib/views/shared/forms/posting';
    import { textOrNumber } from '$lib/data/shapes/shapes';
    import { entryPageState } from '$lib/state/forms/page-entry';
    import { feedRoot } from '$lib/state/shared/page/idents';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { openView },
        pages: { pageOf },
        source: { unsavedFile },
        writes: { writeFeedField }
    } = client;

    type Props = {
        entry: RadarEntry;
        id: string;
        cursor: boolean;
        lastRun: unknown;
        projects: Record<string, Project>;
        dismissed?: boolean;
        onsaid: (words: string) => void;
    };

    let { entry, id, cursor, lastRun, projects, dismissed = false, onsaid }: Props = $props();
    let spinning = $state(false);

    /** True while the question before a delete is open. */
    let deleting = $state(false);

    const page = $derived(pageOf('radar', id));
    const file = $derived(page === null ? null : pageFile(client, page));
    /** Why Delete is disabled: unsaved text of the radar file, or a title no write addresses. */
    const blocked = $derived(
        blockedBy(
            file,
            file !== null && unsavedFile(file.root, file.path),
            page === null ? undefined : pageFault(client, page)
        )
    );

    const text = (field: string): string => textOrNumber(entry[field]);
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
        const answer = await writeFeedField('radar', identity, 'dismissed', value, feedRoot(entry));
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

<Card
    {id}
    {cursor}
    {title}
    titleHtml={inlineMarkdown(title)}
    ontitle={identity === ''
        ? undefined
        : () => openView('entry', entryPageState('radar', id, title))}
    tone={relevanceTone(relevance)}
>
    {#snippet meta()}
        <RootChip record={{ root: feedRoot(entry) }} />
        {#if isNew(entry, lastRun)}
            <Tag label={t('radar.new')} tone="violet" />
        {/if}
        {#if relevance !== ''}
            <Tag label={relevance} tone={relevanceTone(relevance)} />
        {/if}
        {#if found !== ''}
            <span class="date">{found}</span>
        {/if}
        {#if identity !== ''}
            <span class="controls">
                {#if dismissed}
                    <ToolButton
                        label={t('radar.restore')}
                        title={t('radar.restore_tip')}
                        glyph="refresh"
                        compact
                        onclick={() => mark(null)}
                    />
                {:else}
                    {#if canSpin}
                        <ToolButton
                            label={t('radar.idea')}
                            title={t('radar.idea_tip')}
                            glyph="spark"
                            compact
                            active={spinning}
                            onclick={() => (spinning = !spinning)}
                        />
                    {/if}
                    <ToolButton
                        label={t('radar.dismiss')}
                        title={t('radar.dismiss_tip')}
                        glyph="dismiss"
                        compact
                        onclick={() => mark(true)}
                    />
                {/if}
                <ToolButton
                    label={t('entry_form.delete')}
                    title={blocked === '' ? t('radar.delete_tip') : blocked}
                    disabled={blocked !== ''}
                    glyph={t('entry_form.delete_glyph')}
                    compact
                    onclick={() => (deleting = true)}
                />
            </span>
        {/if}
    {/snippet}

    {#if sub !== ''}
        <p class="sub" title={sub}>
            {sub}
        </p>
    {/if}
    {#if motif !== ''}
        <div class="row">
            <Tag label={motif} />
        </div>
    {/if}
    {#if note !== ''}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p class="note">{@html inlineMarkdown(note)}</p>
    {/if}
    {#if threat !== ''}
        <p class="threat">
            <Glyph name="warn" />
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
            <span>{@html t('radar.threatens', inlineMarkdown(threat))}</span>
        </p>
    {/if}
    {#if links.length > 0 || text('maps_to') === 'new-idea-candidate'}
        <div class="row">
            {#each links as project (project.id)}
                <span class="link">
                    <ToolButton
                        label={project.title}
                        title={project.title}
                        glyph="goto"
                        cut
                        onclick={() =>
                            openView('project', { id: project.id, label: project.title })}
                    />
                </span>
            {/each}
            {#if text('maps_to') === 'new-idea-candidate'}
                <Tag label={t('radar.new_idea_candidate')} glyph="spark" />
            {/if}
        </div>
    {/if}
    {#if posting(text('url')) !== undefined}
        <p class="paper">
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
            <a href={posting(text('url'))} target="_blank" rel="noreferrer">
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

{#if deleting}
    <DeleteAsk collection="radar" {id} {onsaid} onclose={() => (deleting = false)} />
{/if}

<style>
    .sub,
    .note,
    .threat,
    .paper {
        margin: 4px 0 0;
        overflow-wrap: anywhere;
    }

    .sub {
        min-width: 0;
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Drawn as the card around them says, ui/frame/Card.svelte's `--card-reveal`: transparent at
       rest, so the card keeps its size and Tab still reaches every control, and drawn while the
       pointer is over the card or the keyboard is inside it. */
    .controls {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        opacity: var(--card-reveal);
        transition: opacity 120ms ease-out;
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

    /* A flex box capped at the row's width. The tooltip's wrapper around the project's button is
       its flex item and gives way to the room left, the button fills the wrapper, and the button
       cuts its own label, so a long title ends in an ellipsis where the card ends. */
    .link {
        display: flex;
        min-width: 0;
        max-width: 100%;
    }

    .paper a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
    }
</style>
