<script lang="ts">
    // Layer 3, view partial of views/Linkedin.svelte. One idea or numbered post with its metadata,
    // snippet, promotion write, and source action. Folder and cadence rules stay outside this card.

    import { linkedinSourcePath, openLinkedinSource } from './post-card';
    import Card from '$lib/ui/Card.svelte';
    import Tag from '$lib/ui/Tag.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { HUB_ROOT } from '$lib/state/collection';
    import { snippet, type LinkedinEntry } from '$lib/state/linkedin';
    import { t } from '$lib/state/text';
    import type { WriteAnswer } from '$lib/state/writes.svelte';
    import { useState } from '$lib/state/use';

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

    const number = $derived(/^\d+/.exec(entry.file)?.[0] ?? '');
    const path = $derived(linkedinSourcePath(folder, entry.file));

    function say(answer: WriteAnswer): void {
        if (!answer.ok) {
            onsaid(t('editor.failed', answer.error ?? ''));
        } else if (answer.refused.length > 0) {
            onsaid(
                t(
                    'editor.failed',
                    answer.refused.map((one) => `${one.field}: ${one.reason}`).join('; ')
                )
            );
        } else {
            onsaid(t('editor.saved', answer.changed.join(', ')));
        }
    }

    async function promote(): Promise<void> {
        const answer = await markPosted(entry.file);
        say(answer);
    }

    function edit(): void {
        openLinkedinSource(client.layout, folder, entry.file);
    }
</script>

<div
    data-linkedin-card={entry.file}
    data-editor-view="source"
    data-editor-root={HUB_ROOT}
    data-editor-path={path}
>
    <Card {id} {cursor} title={entry.title}>
        {#snippet meta()}
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
    }

    .actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
    }
</style>
