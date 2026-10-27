<script lang="ts">
    // Layer 3, shared view partial. The states of a view drawn from one feed file before the file
    // is read (views/feeds/leads/Leads.svelte, views/feeds/radar/Radar.svelte and
    // views/feeds/linkedin/Linkedin.svelte): waiting for the first feed, no file named while the
    // view gives words for that, the file missing, and the file unreadable with the reader's error,
    // each as the empty state ui/frame/Empty.svelte draws. Once the file is read it draws the
    // view's own content in their place, adding no element of its own, so each part stays an item
    // of the view's column.

    import type { Snippet } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import type { FeedState } from '$lib/state/feeds/feeds.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The feed, null before the first one arrives. */
        data: FeedState | null;
        /** The view's glyph, drawn while the feed is awaited and while no file is named. */
        glyph: string;
        /** The words drawn while the file is missing, already translated. */
        missing: string;
        /** The words drawn while no file is named, already translated; none draws `missing`. */
        unnamed?: string;
        /** The view's content, drawn once the file is read. */
        children: Snippet;
    };

    let { data, glyph, missing, unnamed, children }: Props = $props();
</script>

{#if data === null}
    <Empty message={t('app.waiting')} {glyph} />
{:else if data.missing && data.file === '' && unnamed !== undefined}
    <Empty message={unnamed} {glyph} />
{:else if data.missing}
    <Empty message={missing} glyph="warn" />
{:else if data.error !== undefined}
    <Empty message={t('radar.feed_error', data.file, data.error)} glyph="warn" />
{:else}
    {@render children()}
{/if}
