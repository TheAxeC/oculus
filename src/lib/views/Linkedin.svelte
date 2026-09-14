<script module lang="ts">
    // Layer 3, view registration. LinkedIn closes the feeds group.
    import type { ViewRegistration } from './registry';
    import { linkedinBadge } from '$lib/state/rail-badges.svelte';
    export const registration: ViewRegistration = {
        id: 'linkedin',
        label: 'views.linkedin',
        glyph: 'views.linkedin_glyph',
        group: 'feeds',
        order: 3,
        badge: linkedinBadge,
        badgeTone: () => 'red'
    };
</script>

<script lang="ts">
    // Layer 3, view. LinkedIn reads its Markdown-folder feed, draws posting cadence and two card
    // sections, and keeps search plus the add-form disclosure in this view instance's saved state.

    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Intro from './shared/Intro.svelte';
    import PostCard from './linkedin/PostCard.svelte';
    import EntryForm from './shared/EntryForm.svelte';
    import Reveal from './shared/Reveal.svelte';
    import { feed } from '$lib/state/feeds.svelte';
    import {
        cadence,
        daysSince,
        linkedinSearch,
        localDate,
        parseLinkedinState,
        pickIdea,
        splitPosts,
        type LinkedinState,
        type SchemaField
    } from '$lib/state/linkedin';
    import { t } from '$lib/state/text';
    import { cardCursor } from '$lib/state/instance';
    import { feedIdents } from '$lib/state/palette';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import { addLinkedinIdea, type WriteAnswer } from '$lib/state/writes.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    const today = localDate(Date.now());
    const data = $derived(feed('linkedin'));
    const identOf = $derived(feedIdents('linkedin', data?.entries ?? []));
    const held = $derived(parseLinkedinState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const split = $derived(splitPosts(data?.entries ?? []));
    const ideas = $derived(linkedinSearch(split.ideas, held.search));
    const posts = $derived(linkedinSearch(split.posts, held.search));
    const days = $derived(daysSince(split.posts, today));
    const status = $derived(
        data?.cadenceDays === undefined ? 'no-dates' : cadence(days, data.cadenceDays)
    );
    const picked = $derived(pickIdea(split.ideas, today));
    const schema = $derived<SchemaField[]>([
        {
            field: 'title',
            type: 'text',
            required: true,
            label: t('linkedin.form_title')
        },
        {
            field: 'category',
            type: 'text',
            label: t('linkedin.form_category'),
            help: t('linkedin.form_category_help')
        }
    ]);
    let said = $state('');

    function write(next: Partial<LinkedinState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    async function add(fields: Record<string, unknown>): Promise<WriteAnswer> {
        return addLinkedinIdea(fields);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('linkedin.search')}>
        <Search
            value={held.search}
            placeholder={t('linkedin.search')}
            oninput={(search) => write({ search })}
        />
        <ToolButton
            label={t('linkedin.addidea')}
            title={t('linkedin.addidea_tip')}
            glyph="idea"
            active={held.adding}
            onclick={() => write({ adding: !held.adding })}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.linkedin')} toolbar={tools}>
    <div class="linkedin" data-instance={instance.id}>
        {#if data === null}
            <Empty message={t('app.waiting')} glyph="linkedin" />
        {:else if data.missing}
            <Empty message={t('linkedin.no_folder')} glyph="warn" />
        {:else if data.error !== undefined}
            <Empty message={t('radar.feed_error', data.file, data.error)} glyph="warn" />
        {:else}
            <Intro>
                <span
                    class="cadence"
                    class:overdue={status === 'overdue'}
                    class:ontrack={status === 'ontrack'}
                    data-cadence={status}
                >
                    {#if status === 'no-dates'}
                        <span>{t('linkedin.no_dates')}</span>
                    {:else if status === 'overdue'}
                        <Glyph name="warn" />
                        <span>{t('linkedin.overdue', days ?? '', data.cadenceDays ?? '')}</span>
                    {:else}
                        <span>{t('linkedin.ontrack', days ?? '')}</span>
                    {/if}
                </span>
            </Intro>

            {#if status === 'overdue'}
                <div class="nudge">
                    <strong>
                        <Glyph name="pin" />
                        {t('linkedin.postdue')}
                    </strong>
                    <span>{@html t('linkedin.nudge')}</span>
                    <strong>{picked?.title ?? t('linkedin.default_pick')}</strong>
                </div>
            {/if}

            {#if said !== ''}
                <p class="said">{said}</p>
            {/if}

            {#if held.adding}
                <EntryForm
                    collection="linkedin"
                    {schema}
                    entry={null}
                    onadd={add}
                    onclose={() => write({ adding: false })}
                    onsaid={(words) => (said = words)}
                />
            {/if}

            <section>
                <h3>
                    <Glyph name="idea" />
                    <span>{t('linkedin.ideas_hdr', split.ideas.length)}</span>
                </h3>
                {#if ideas.length > 0}
                    <div class="cards" data-linkedin-section="ideas">
                        {#each ideas as entry (entry.file)}
                            <Reveal
                                id={identOf(entry)}
                                wanted={held.reveal}
                                onrevealed={() => write({ reveal: '' })}
                            >
                                <PostCard
                                    {entry}
                                    id={entry.file}
                                    cursor={cursor === entry.file}
                                    folder={data.file}
                                    onsaid={(words) => (said = words)}
                                />
                            </Reveal>
                        {/each}
                    </div>
                {:else if split.ideas.length === 0}
                    <Empty message={t('linkedin.no_ideas')} glyph="idea" />
                {/if}
            </section>

            <section>
                <h3>
                    <Glyph name="done" />
                    <span>{t('linkedin.posted_hdr', split.posts.length)}</span>
                </h3>
                {#if posts.length > 0}
                    <div class="cards" data-linkedin-section="posted">
                        {#each posts as entry (entry.file)}
                            <Reveal
                                id={identOf(entry)}
                                wanted={held.reveal}
                                onrevealed={() => write({ reveal: '' })}
                            >
                                <PostCard
                                    {entry}
                                    id={entry.file}
                                    cursor={cursor === entry.file}
                                    folder={data.file}
                                    posted
                                    onsaid={(words) => (said = words)}
                                />
                            </Reveal>
                        {/each}
                    </div>
                {:else if split.posts.length === 0}
                    <Empty message={t('linkedin.no_posts')} glyph="done" />
                {/if}
            </section>
        {/if}
    </div>
</Pane>

<style>
    .linkedin {
        display: grid;
        gap: 12px;
    }

    .cadence {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--muted-txt, var(--muted));
    }

    .cadence.overdue {
        color: var(--c-red-txt);
    }

    .cadence.ontrack {
        color: var(--c-green-txt);
    }

    .nudge {
        padding: 8px 10px;
        border-left: 3px solid var(--c-red);
        background: var(--chip);
    }

    :global(body.wall) .nudge {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .nudge strong,
    .nudge span {
        margin-right: 4px;
    }

    .said,
    h3 {
        margin: 0;
    }

    .said {
        color: var(--muted-txt, var(--muted));
    }

    h3 {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-lg);
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
        gap: 8px;
        margin-top: 8px;
    }
</style>
