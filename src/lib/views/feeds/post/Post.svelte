<script module lang="ts">
    // Layer 3, view registration. A LinkedIn post opens from the title of its card and is not
    // listed in the view catalogue: opened bare it can only say it was opened for no post.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'post',
        label: 'views.post',
        glyph: 'views.post_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One LinkedIn idea or post as its own tab, in the frame of every record's page
    // (views/shared/card/record/RecordPage.svelte): the card its feed's view draws, with `page`,
    // then the post's body as Markdown (views/shared/prose/RenderedMarkdown.svelte). The post it is
    // for is the `hub` and the `key`, its file's name, of the instance's state. Edit stays what it
    // is: it opens the text file, so the page has no editor.
    //
    // Mark posted renames the file to the next number and its answer names no new file, so the tab
    // follows from the feed (`promotedFile`, post-card.ts): an idea gone from the feed whose name
    // comes back under a number moves the tab there. A post the feed no longer holds says so.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import PostCard from '../../shared/card/feed/PostCard.svelte';
    import { linkedinSourcePath, postState, promotedFile } from '../../shared/card/feed/post-card';
    import RecordPage from '../../shared/card/record/RecordPage.svelte';
    import RenderedMarkdown from '../../shared/prose/RenderedMarkdown.svelte';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { splitPosts } from '$lib/state/feeds/linkedin';
    import { t } from '$lib/state/shared/words/text';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        feeds: { feed },
        layout: { restateInstance }
    } = useState();

    let { instance }: ViewProps = $props();

    const hub = $derived(instanceText(instance.state, 'hub'));
    const key = $derived(instanceText(instance.state, 'key'));
    const data = $derived(feed('linkedin'));
    /** The posts of the feed, split as the LinkedIn view splits them. */
    const split = $derived(splitPosts(data?.entries ?? []));
    const posts = $derived([...split.ideas, ...split.posts].filter((one) => rootOf(one) === hub));
    const entry = $derived(posts.find((one) => one.file === key) ?? null);
    const posted = $derived(entry !== null && split.posts.includes(entry));
    const hubFiles = $derived(data?.hubFiles ?? {});
    const folder = $derived(Object.hasOwn(hubFiles, hub) ? hubFiles[hub] : '');

    /** What the card's last write answered, the one outcome line this tab holds. */
    let said = $state('');

    // A Mark posted of this idea renamed its file: the tab moves to the numbered file.
    $effect(() => {
        if (entry !== null) return;
        const next = promotedFile(
            key,
            posts.map((one) => one.file)
        );
        if (next === null) return;
        restateInstance(instance.id, postState(hub, next, instanceText(instance.state, 'label')));
    });
</script>

<RecordPage title={entry?.title ?? t('views.post')} {instance} {said} data-post={key}>
    {#snippet card()}
        {#if key === ''}
            <Surface>
                <Empty message={t('linkedin.post_none')} glyph={t('views.linkedin_glyph')} />
            </Surface>
        {:else if entry === null}
            <Surface>
                <Empty message={t('linkedin.post_gone', key)} glyph={t('views.linkedin_glyph')} />
            </Surface>
        {:else}
            <PostCard
                {entry}
                id={instance.id}
                cursor={false}
                {folder}
                {posted}
                page
                onsaid={(answer: string) => (said = answer)}
            />
        {/if}
    {/snippet}

    {#if entry !== null}
        <Surface fitted>
            <RenderedMarkdown
                path={linkedinSourcePath(folder, entry.file)}
                root={hub}
                text={entry.body}
                framed
            />
        </Surface>
    {/if}
</RecordPage>
