<script lang="ts">
    // Layer 3, shared view partial, drawn by views/feeds/linkedin/Linkedin.svelte and at the top of
    // the post's page (views/feeds/post/Post.svelte). One idea or numbered post as the record card
    // (views/shared/card/record/RecordCard.svelte): its metadata and snippet, and a title opening
    // the post's page. The strip holds Mark posted, on an idea, and Edit, which opens the post's
    // source file; the menu holds Mark posted in its Status submenu and Edit. With `page` set the
    // title opens nothing and the snippet is left out, since the page draws the post's whole body.
    // Folder and cadence rules stay outside this card. A web address written in the snippet is a
    // link (ui/display/text/LinkedText.svelte).

    import { linkedinSourcePath, openLinkedinSource, postState } from './post-card';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import { statusAction, type RecordAction } from '$lib/views/shared/card/record/record-menu';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { snippet, type LinkedinEntry } from '$lib/state/feeds/linkedin';
    import { t } from '$lib/state/shared/words/text';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';
    import { answerWords } from '$lib/views/shared/forms/answer-words';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        writes: { markPosted }
    } = client;

    type Props = {
        entry: LinkedinEntry;
        id: string;
        cursor: boolean;
        folder: string;
        posted?: boolean;
        /** Whether the card is the top of the post's own page. */
        page?: boolean;
        onsaid: (words: string) => void;
    };

    let { entry, id, cursor, folder, posted = false, page = false, onsaid }: Props = $props();

    const hub = $derived(rootOf(entry));
    const number = $derived(/^\d+/.exec(entry.file)?.[0] ?? '');
    const path = $derived(linkedinSourcePath(folder, entry.file));

    /** Mark posted, in the Status submenu while the post is an idea, then Edit. */
    const actions = $derived.by((): RecordAction[] => [
        ...statusAction(
            posted
                ? []
                : [
                      {
                          id: 'posted',
                          label: t('linkedin.markpost'),
                          title: t('linkedin.markpost_tip'),
                          glyph: 'done',
                          onclick: promote
                      }
                  ]
        ),
        {
            id: 'edit',
            label: t('linkedin.edit'),
            title: t('linkedin.edit_tip'),
            glyph: 'edit',
            onclick: edit
        }
    ]);

    function say(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
    }

    async function promote(): Promise<void> {
        const answer = await markPosted(entry.id);
        say(answer);
    }

    function edit(): void {
        openLinkedinSource(client.layout, folder, entry.file, hub);
    }

    /** Open the post's page as the preview tab of the pane beside this one. */
    function open(): void {
        const state = postState(hub, entry.file, entry.title);
        client.layout.openBeside('post', state, undefined, undefined, { preview: true });
    }
</script>

{#snippet meta()}
    <Tag label={posted ? number : t('linkedin.idea_tag')} />
    {#if entry.category !== ''}
        <Tag label={entry.category} />
    {/if}
    {#if entry.date !== ''}
        <span class="date">{entry.date}</span>
    {/if}
{/snippet}

{#snippet text()}
    <p class="snippet"><LinkedText text={snippet(entry.body)} /></p>
{/snippet}

<div
    class="slot"
    data-linkedin-card={entry.file}
    data-editor-view="source"
    data-editor-root={hub}
    data-editor-path={path}
>
    <RecordCard
        {id}
        {cursor}
        title={entry.title}
        ontitle={page ? undefined : open}
        record={entry}
        {actions}
        strip={['posted', 'edit']}
        {onsaid}
        {meta}
        text={page ? undefined : text}
    />
</div>

<style>
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .date {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .snippet {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }
</style>
