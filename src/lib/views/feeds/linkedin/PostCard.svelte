<script lang="ts">
    // Layer 3, view partial of views/feeds/linkedin/Linkedin.svelte. One idea or numbered post with
    // its metadata, snippet, promotion write, and source action. Folder and cadence rules stay
    // outside this card.

    import { linkedinSourcePath, openLinkedinSource } from './post-card';
    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
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
        onsaid: (words: string) => void;
    };

    let { entry, id, cursor, folder, posted = false, onsaid }: Props = $props();

    const hub = $derived(rootOf(entry, client.fs.primary()));
    const number = $derived(/^\d+/.exec(entry.file)?.[0] ?? '');
    const path = $derived(linkedinSourcePath(folder, entry.file));

    function say(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
    }

    async function promote(): Promise<void> {
        const answer = await markPosted(entry.file, hub);
        say(answer);
    }

    function edit(): void {
        openLinkedinSource(client.layout, folder, entry.file, hub);
    }
</script>

<div
    data-linkedin-card={entry.file}
    data-editor-view="source"
    data-editor-root={hub}
    data-editor-path={path}
>
    <Card {id} {cursor} title={entry.title}>
        {#snippet meta()}
            <RootChip record={entry} />
            <Tag label={posted ? number : t('linkedin.idea_tag')} />
            {#if entry.category !== ''}
                <Tag label={entry.category} />
            {/if}
            {#if entry.date !== ''}
                <span class="date">{entry.date}</span>
            {/if}
        {/snippet}

        <p class="snippet">{snippet(entry.body)}</p>

        {#snippet footer()}
            <div class="actions">
                {#if !posted}
                    <ToolButton
                        label={t('linkedin.markpost')}
                        title={t('linkedin.markpost_tip')}
                        glyph="done"
                        onclick={promote}
                    />
                {/if}
                <ToolButton
                    label={t('linkedin.edit')}
                    title={t('linkedin.edit_tip')}
                    glyph="edit"
                    onclick={edit}
                />
            </div>
        {/snippet}
    </Card>
</div>

<style>
    .date {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .snippet {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    /* Drawn as the card around them says, ui/frame/Card.svelte's `--card-reveal`: transparent at
       rest, so the card keeps its size and Tab still reaches every control. */
    .actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        opacity: var(--card-reveal);
        transition: opacity 120ms ease-out;
    }
</style>
