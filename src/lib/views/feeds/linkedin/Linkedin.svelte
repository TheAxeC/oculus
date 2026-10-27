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
    // sections, Ideas and Posted, and keeps its search and its folded sections in this view
    // instance's saved state. Each section is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), headed with the count of the posts the search leaves,
    // folded by `ideas` or `posted` under `folded`, its cards in the shared card grid
    // (views/shared/card/record/CardGrid.svelte); a post asked to be revealed opens its folded
    // section before it is scrolled to. Add asks for the title and the category in a prompt, writes
    // the idea file and opens it at its body.
    //
    // It carries no toolbar control over its own source, which the four views drawn from one file
    // do: `linkedin_dir` names a folder of one Markdown file per post and no index, so there is no
    // one file for such a control to open. Each card's own control opens the post it draws, which
    // is the way into the text from here.
    //
    // Over a wallpaper each card is its own surface and the amber nudge paints its own opaque box;
    // the cadence line and the said line are read off a `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import CardGrid from '../../shared/card/record/CardGrid.svelte';
    import FeedFile from '../../shared/card/feed/FeedFile.svelte';
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
    import { addressOfId, rootOf } from '$lib/state/shared/page/hubs';
    import { IDEA_BODY_LINE } from '$lib/data/prose/linkedin-idea';
    import { t } from '$lib/state/shared/words/text';
    import { stateFolds } from '$lib/state/shared/page/folds';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
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
    /** The presses that fold and unfold a section, `ideas` or `posted`. */
    const folds = stateFolds(
        () => held.folded,
        (folded) => write({ folded })
    );
    let said = $state('');

    /** The folder of the hub a post is of: the folder of that hub's feed. */
    function folderOf(entry: LinkedinEntry): string {
        const root = rootOf(entry);
        const held = data?.hubFiles ?? {};
        return Object.hasOwn(held, root) ? held[root] : '';
    }

    function write(next: Partial<LinkedinState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }

    /** The section of the post asked to be revealed, which is unfolded so its card is shown. */
    const revealedSection = $derived.by(() => {
        const wanted = held.reveal ?? '';
        if (wanted === '') return undefined;
        if (ideas.some((entry) => identOf(entry) === wanted)) return 'ideas';
        return posts.some((entry) => identOf(entry) === wanted) ? 'posted' : undefined;
    });
    $effect(() => folds.open(revealedSection));

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

    /**
     * Write the idea file, then open it at its body (the line the server's stub starts it on), in
     * the folder of the hub the answer's id names, which is the hub the server wrote.
     */
    async function add(title: string, category: string): Promise<void> {
        const answer = await addLinkedinIdea({ title, category });
        if (!answer.ok || answer.refused.length > 0) {
            said = answerWords(answer);
            return;
        }
        said = '';
        if (answer.id === undefined) return;
        const { hub, key } = addressOfId(answer.id);
        const folders = data?.hubFiles ?? {};
        if (hub === '' || !Object.hasOwn(folders, hub)) return;
        openSourceFile(client, {
            root: hub,
            path: linkedinSourcePath(folders[hub], key),
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
        <FeedFile
            {data}
            glyph="linkedin"
            missing={t('linkedin.no_folder', data?.file ?? '')}
            unnamed={t('linkedin.unnamed')}
        >
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
                        <span>{t('linkedin.overdue', days ?? '', data?.cadenceDays ?? '')}</span>
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

            <GroupHead
                label={t('linkedin.ideas_hdr')}
                glyph="idea"
                count={ideas.length}
                open={!held.folded.includes('ideas')}
                ontoggle={() => folds.toggle('ideas')}
            >
                {#if ideas.length > 0}
                    <CardGrid data-linkedin-section="ideas">
                        {#each ideas as entry (identOf(entry))}
                            <Reveal
                                id={identOf(entry)}
                                wanted={held.folded.includes('ideas') ? '' : held.reveal}
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
                    </CardGrid>
                {:else if split.ideas.length === 0}
                    <Empty message={t('linkedin.no_ideas')} glyph="idea" />
                {/if}
            </GroupHead>

            <GroupHead
                label={t('linkedin.posted_hdr')}
                glyph="done"
                count={posts.length}
                open={!held.folded.includes('posted')}
                ontoggle={() => folds.toggle('posted')}
            >
                {#if posts.length > 0}
                    <CardGrid data-linkedin-section="posted">
                        {#each posts as entry (identOf(entry))}
                            <Reveal
                                id={identOf(entry)}
                                wanted={held.folded.includes('posted') ? '' : held.reveal}
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
                    </CardGrid>
                {:else if split.posts.length === 0}
                    <Empty message={t('linkedin.no_posts')} glyph="done" />
                {/if}
            </GroupHead>
        </FeedFile>
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
    .linkedin > :global([data-surface]) > :global(*) {
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

    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
