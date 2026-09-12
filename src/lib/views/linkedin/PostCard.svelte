<script lang="ts">
    // Layer 3, view partial of views/Linkedin.svelte. One idea or numbered post with its metadata,
    // snippet, promotion write, and document action. Folder and cadence rules stay outside this card.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { HUB_ROOT } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';
    import { snippet, type LinkedinEntry } from '$lib/state/linkedin';
    import { t } from '$lib/state/text';
    import { markPosted, type WriteAnswer } from '$lib/state/writes.svelte';

    type Props = {
        entry: LinkedinEntry;
        folder: string;
        posted?: boolean;
        onsaid: (words: string) => void;
    };

    let { entry, folder, posted = false, onsaid }: Props = $props();

    const number = $derived(/^\d+/.exec(entry.file)?.[0] ?? '');
    const path = $derived(`${folder.replace(/\/$/, '')}/${entry.file}`);

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
        openView('document', 'main', { root: HUB_ROOT, path, label: entry.title });
    }
</script>

<div data-linkedin-card={entry.file} data-editor-path={path}>
    <Card title={entry.title}>
        {#snippet meta()}
            <Chip label={posted ? number : t('sf.linkedin_idea_tag')} />
            {#if entry.category !== ''}
                <Chip label={entry.category} />
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
                        label={t('sf.linkedin_markpost')}
                        title={t('sf.linkedin_markpost_tip')}
                        glyph="done"
                        onclick={promote}
                    />
                {/if}
                <ToolButton
                    label={t('sf.linkedin_edit')}
                    title={t('sf.linkedin_edit_tip')}
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
