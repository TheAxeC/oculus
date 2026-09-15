<script lang="ts">
    // Layer 3, view partial of views/Inbox.svelte. One inbox thread with its kind, note, optional
    // draft and Gmail link, plus the one triage or restore write allowed for its section.

    import Card from '$lib/ui/Card.svelte';
    import Tag from '$lib/ui/Tag.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { kindOf, kindTone, type InboxEntry } from '$lib/state/inbox';
    import { t } from '$lib/state/text';
    import type { WriteAnswer } from '$lib/state/writes.svelte';
    import { useState } from '$lib/state/use';

    const {
        writes: { writeFeedField }
    } = useState();

    type Props = {
        entry: InboxEntry;
        id: string;
        cursor: boolean;
        triaged?: boolean;
        onsaid: (words: string) => void;
    };

    let { entry, id, cursor, triaged = false, onsaid }: Props = $props();
    let draftOpen = $state(false);

    const text = (field: string): string => {
        const value = entry[field];
        return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    };
    const identity = $derived(text('id'));
    const subject = $derived(text('subject'));
    const sender = $derived(text('sender') || subject || t('inbox.thread'));
    const kind = $derived(kindOf(entry));
    const age = $derived(text('age'));
    const what = $derived(text('what'));
    const draft = $derived(text('draft'));
    const url = $derived(text('url'));

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

    async function mark(value: true | null): Promise<void> {
        if (identity === '') return;
        say(await writeFeedField('inbox', identity, 'triaged', value));
    }

    function kindLabel(): string {
        if (kind === 'reply') return t('inbox.reply');
        if (kind === 'action') return t('inbox.action');
        return t('inbox.info');
    }
</script>

<div data-inbox={identity}>
    <Card {id} {cursor} title={sender} titleHtml={inlineMarkdown(sender)} tone={kindTone(kind)}>
        {#snippet meta()}
            <Tag label={kindLabel()} tone={kindTone(kind)} />
            {#if age !== ''}
                <span class="age">{age}</span>
            {/if}
            {#if identity !== ''}
                {#if triaged}
                    <ToolButton
                        label={t('inbox.restore')}
                        title={t('inbox.restore_tip')}
                        glyph="refresh"
                        compact
                        onclick={() => mark(null)}
                    />
                {:else}
                    <ToolButton
                        label={t('inbox.triaged')}
                        title={t('inbox.triage_tip')}
                        glyph="done"
                        compact
                        onclick={() => mark(true)}
                    />
                {/if}
            {/if}
        {/snippet}

        {#if subject !== ''}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="sub">{@html inlineMarkdown(subject)}</p>
        {/if}
        {#if what !== ''}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="what">{@html inlineMarkdown(what)}</p>
        {/if}
        {#if draft !== ''}
            <div class="draft">
                <ToolButton
                    label={t('inbox.show_draft')}
                    glyph="draft"
                    active={draftOpen}
                    expanded={draftOpen}
                    onclick={() => (draftOpen = !draftOpen)}
                />
                {#if draftOpen}
                    <pre>{draft}</pre>
                {/if}
            </div>
        {/if}
        {#if url.startsWith('http')}
            <p class="gmail">
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
                <a href={url} target="_blank" rel="noopener noreferrer">
                    <Glyph name="link" />
                    <span>{t('inbox.open_gmail')}</span>
                </a>
            </p>
        {/if}
    </Card>
</div>

<style>
    .age {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .sub {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .sub,
    .what,
    .gmail {
        margin: 4px 0 0;
    }

    .draft {
        margin-top: 8px;
    }

    pre {
        margin: 8px 0 0;
        padding: 8px;
        overflow: auto;
        border: 1px solid var(--line);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-family: var(--font-mono);
        white-space: pre-wrap;
    }

    /* Inside a card that is already translucent: a second layer would read as one nearly solid one, so the block keeps its border and paints nothing. */
    :global(body.wall) pre {
        background: transparent;
    }

    .gmail a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
    }
</style>
