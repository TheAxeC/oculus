<script module lang="ts">
    // Layer 3, view registration. LinkedIn follows Position Leads in the Incoming page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'linkedin',
        label: 'views.linkedin',
        glyph: 'views.linkedin_glyph',
        group: 'incoming',
        order: 3,
        badgeGlyph: (client) => client.railBadges.linkedinBadgeGlyph(),
        badgeMark: 'views.linkedin_badge_mark',
        badgeTone: () => 'red'
    };
</script>

<script lang="ts">
    // Layer 3, view. LinkedIn reads its Markdown-folder feed, draws posting cadence and two card
    // sections, and keeps its search in this view instance's saved state. Add asks for the title
    // and the category in a prompt, writes the idea file and opens it at its body.
    //
    // It carries no toolbar control over its own source, which the four views drawn from one file
    // do: `linkedin_dir` names a folder of one Markdown file per post and no index, so there is no
    // one file for such a control to open. Each card's own control opens the post it draws, which
    // is the way into the text from here.
    //
    // Over a wallpaper each card is its own surface and the amber nudge paints its own opaque box;
    // the intro, the said line and each section's heading are read off a `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import PostCard from './PostCard.svelte';
    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import type { PromptRequest } from '$lib/ui/forms/prompt';
    import { answerWords } from '../../shared/forms/answer-words';
    import { openSourceFile } from '../../shared/links/source-file';
    import { linkedinSourcePath } from './post-card';
    import Reveal from '../../shared/card/Reveal.svelte';
    import {
        cadence,
        daysSince,
        linkedinSearch,
        localDate,
        parseLinkedinState,
        pickIdea,
        splitPosts,
        type LinkedinEntry,
        type LinkedinState
    } from '$lib/state/feeds/linkedin';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { IDEA_BODY_LINE } from '$lib/data/prose/linkedin-idea';
    import { t } from '$lib/state/shared/words/text';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { feedIdents } from '$lib/state/shared/page/idents';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        feeds: { feed },
        ui: { instanceState, setInstanceState },
        writes: { addLinkedinIdea }
    } = client;

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
    let said = $state('');

    /** The folder of the hub a post is of: the feed's own for the primary hub, else the hub's. */
    function folderOf(entry: LinkedinEntry): string {
        if (entry.root === undefined) return data?.file ?? '';
        const root = rootOf(entry, client.fs.primary());
        const held = data?.hubFiles ?? {};
        return Object.hasOwn(held, root) ? held[root] : '';
    }

    function write(next: Partial<LinkedinState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    /** The question Add asks, held while the prompt is open. */
    let prompting: PromptRequest | null = $state(null);

    /** Ask for the title and the category of a new idea. */
    function ask(): void {
        prompting = {
            message: t('linkedin.add_ask'),
            fields: [
                { label: t('linkedin.form_title'), value: '' },
                {
                    label: t('linkedin.form_category'),
                    value: '',
                    placeholder: t('linkedin.form_category_help')
                }
            ],
            verb: t('linkedin.add_verb'),
            act: ([title, category]) => {
                prompting = null;
                void add(title, category);
            }
        };
    }

    /** Write the idea file, then open it at its body (the line the server's stub starts it on). */
    async function add(title: string, category: string): Promise<void> {
        const answer = await addLinkedinIdea({ title, category });
        if (!answer.ok || answer.refused.length > 0) {
            said = answerWords(answer);
            return;
        }
        said = '';
        const root = client.fs.primary();
        if (data === null || answer.id === undefined || root === null) return;
        openSourceFile(client, {
            root,
            path: linkedinSourcePath(data.file, answer.id),
            line: IDEA_BODY_LINE
        });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('linkedin.toolbar')} overflow>
        <ToolButton
            bare
            label={t('linkedin.addidea')}
            title={t('linkedin.addidea_tip')}
            glyph="add"
            onclick={ask}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('linkedin.filters')}>
        <Search
            fill
            value={held.search}
            placeholder={t('linkedin.search')}
            oninput={(search: string) => write({ search })}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.linkedin')} toolbar={tools} {bar}>
    <div class="linkedin" data-instance={instance.id}>
        {#if data === null}
            <Empty message={t('app.waiting')} glyph="linkedin" />
        {:else if data.missing && data.file === ''}
            <Empty message={t('linkedin.unnamed')} glyph="linkedin" />
        {:else if data.missing}
            <Empty message={t('linkedin.no_folder', data.file)} glyph="warn" />
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
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
                    <span>{@html t('linkedin.nudge')}</span>
                    <strong>{picked?.title ?? t('linkedin.default_pick')}</strong>
                </div>
            {/if}

            {#if said !== ''}
                <Surface>
                    <p class="said">{said}</p>
                </Surface>
            {/if}

            <section>
                <Surface>
                    <h3>
                        <Glyph name="idea" />
                        <span>{t('linkedin.ideas_hdr', split.ideas.length)}</span>
                    </h3>
                </Surface>
                {#if ideas.length > 0}
                    <div class="cards" data-linkedin-section="ideas">
                        {#each ideas as entry (identOf(entry))}
                            <Reveal
                                id={identOf(entry)}
                                wanted={held.reveal}
                                onrevealed={() => write({ reveal: '' })}
                            >
                                <PostCard
                                    {entry}
                                    id={identOf(entry)}
                                    cursor={cursor === identOf(entry)}
                                    folder={folderOf(entry)}
                                    onsaid={(words: string) => (said = words)}
                                />
                            </Reveal>
                        {/each}
                    </div>
                {:else if split.ideas.length === 0}
                    <Empty message={t('linkedin.no_ideas')} glyph="idea" />
                {/if}
            </section>

            <section>
                <Surface>
                    <h3>
                        <Glyph name="done" />
                        <span>{t('linkedin.posted_hdr', split.posts.length)}</span>
                    </h3>
                </Surface>
                {#if posts.length > 0}
                    <div class="cards" data-linkedin-section="posted">
                        {#each posts as entry (identOf(entry))}
                            <Reveal
                                id={identOf(entry)}
                                wanted={held.reveal}
                                onrevealed={() => write({ reveal: '' })}
                            >
                                <PostCard
                                    {entry}
                                    id={identOf(entry)}
                                    cursor={cursor === identOf(entry)}
                                    folder={folderOf(entry)}
                                    posted
                                    onsaid={(words: string) => (said = words)}
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

{#if prompting !== null}
    <Prompt
        request={prompting}
        cancel={t('ui.confirm_cancel')}
        oncancel={() => (prompting = null)}
    />
{/if}

<style>
    /* One column the width of the pane, however long a line inside it: a grid's own column would
       otherwise grow to the widest line it holds and widen the pane. */
    .linkedin {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
    }

    /* A part on a `Surface` is the grid's item through the Surface's box over a wallpaper and by
       itself without one (`display: contents`), so both shrink to the column. */
    .linkedin > :global(*),
    .linkedin > :global([data-surface]) > :global(*),
    .cards > :global(*) {
        min-width: 0;
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

    /* The amber message box: a 1px border and tint, 4px of room (.4em) round 12px words on 17px
       lines, the shape ui/frame/Empty.svelte gives an error box in red. */
    .nudge {
        padding: 0.4em;
        border: 1px solid var(--c-amber);
        background: var(--c-amber-bg);
        color: var(--c-amber-txt);
        font-size: var(--fs-sm);
        line-height: calc(17px * var(--text-scale, 1));
        overflow-wrap: anywhere;
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
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
        gap: 8px;
        margin-top: 8px;
    }
</style>
