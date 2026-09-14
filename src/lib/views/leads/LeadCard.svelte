<script lang="ts">
    // Layer 3, view partial of views/Leads.svelte. One position lead with its fit, deadline,
    // posting, status writes, and confirmed deletion. Feed rules stay in state and server modules.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Confirm from '$lib/ui/Confirm.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { fitKey, fitTone, isClosed, leadId, type LeadEntry } from '$lib/state/leads';
    import { t } from '$lib/state/text';
    import type { WriteAnswer } from '$lib/state/writes.svelte';
    import { useState } from '$lib/state/use';

    const {
        writes: { deleteFeedEntry, writeFeedField }
    } = useState();

    type Props = {
        entry: LeadEntry;
        vocab: unknown;
        cursor: boolean;
        expired?: boolean;
        dismissed?: boolean;
        ondismiss: () => void;
        onsaid: (words: string) => void;
    };

    let {
        entry,
        vocab,
        cursor,
        expired = false,
        dismissed = false,
        ondismiss,
        onsaid
    }: Props = $props();
    let sure = $state(false);

    const text = (field: string): string => {
        const value = entry[field];
        return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    };
    const title = $derived(text('title'));
    const identity = $derived(leadId(entry));
    const institution = $derived(text('inst'));
    const country = $derived(text('country'));
    const type = $derived(text('typ'));
    const focus = $derived(text('focus'));
    const fit = $derived(text('fit'));
    const status = $derived(text('status').trim().toLowerCase());
    const deadline = $derived(text('deadline'));
    const url = $derived(text('url'));
    const key = $derived(fitKey(fit));
    const tone = $derived(fitTone(fit, vocab));
    const sub = $derived(`${institution} | ${country}`);
    const note = $derived(`${focus}${fit === '' ? '' : ` - ${fit}`}`);
    const deadlineTail = $derived(expired ? (isClosed(status) ? status : t('leads.expired')) : '');

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

    async function mark(next: string): Promise<void> {
        if (title === '') return;
        say(await writeFeedField('leads', title, 'status', next));
    }

    async function remove(): Promise<void> {
        sure = false;
        if (title === '') return;
        say(await deleteFeedEntry('leads', title));
    }
</script>

<div class:expired data-lead={title}>
    <Card
        id={identity}
        {cursor}
        {title}
        titleHtml={inlineMarkdown(title)}
        tone={expired ? 'grey' : tone}
    >
        {#snippet meta()}
            <Chip label={key ?? t('leads.fit_none')} {tone} />
            {#if expired}
                <Chip label={status || t('leads.expired')} tone="grey" />
            {/if}
            {#if deadline !== '' || expired}
                <span class="deadline">
                    <Glyph name="deadline" />
                    <span>{deadline || t('leads.no_deadline')}</span>
                    {#if deadlineTail !== ''}
                        <span> | {deadlineTail}</span>
                    {/if}
                </span>
            {/if}
            {#if identity !== ''}
                <span class="actions">
                    {#if status !== 'applied'}
                        <ToolButton
                            label={t('leads.action.applied')}
                            title={t('leads.action.mark_applied')}
                            compact
                            onclick={() => mark('applied')}
                        />
                    {/if}
                    {#if status !== 'declined'}
                        <ToolButton
                            label={t('leads.action.decline')}
                            title={t('leads.action.decline_tip')}
                            compact
                            onclick={() => mark('declined')}
                        />
                    {/if}
                    {#if status === 'applied' || status === 'declined'}
                        <ToolButton
                            label={t('project.action.reopen')}
                            title={t('leads.action.reopen_lead_tip')}
                            compact
                            onclick={() => mark('open')}
                        />
                    {/if}
                    <ToolButton
                        label={t('project.action.del')}
                        title={t('leads.action.delete_lead_tip')}
                        compact
                        onclick={() => (sure = true)}
                    />
                    <ToolButton
                        label={dismissed
                            ? t('leads.action.show_lead')
                            : t('leads.action.hide_lead')}
                        title={dismissed
                            ? t('leads.action.show_lead')
                            : t('leads.action.hide_lead')}
                        glyph="dismiss"
                        compact
                        onclick={ondismiss}
                    />
                </span>
            {/if}
        {/snippet}

        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p class="sub">{@html inlineMarkdown(sub)}</p>
        {#if country !== '' || type !== ''}
            <div class="chips">
                {#if country !== ''}
                    <Chip label={country} />
                {/if}
                {#if type !== ''}
                    <Chip label={type} />
                {/if}
            </div>
        {/if}
        {#if note !== ''}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="note">{@html inlineMarkdown(note)}</p>
        {/if}
        {#if url.startsWith('http')}
            <p class="posting">
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
                <a href={url} target="_blank" rel="noreferrer">
                    <Glyph name="link" />
                    <span>{t('leads.posting')}</span>
                </a>
            </p>
        {/if}
    </Card>
</div>

{#if sure}
    <Confirm
        message={t('leads.action.delete_lead_tip')}
        detail={title}
        confirm={t('project.action.del')}
        cancel={t('collection.form_cancel')}
        onconfirm={remove}
        oncancel={() => (sure = false)}
    />
{/if}

<style>
    .expired {
        opacity: 0.62;
        filter: grayscale(0.55);
    }

    .deadline,
    .actions,
    .chips,
    .posting a {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
    }

    .deadline {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .sub {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .sub,
    .note,
    .posting {
        margin: 4px 0 0;
    }

    .chips {
        margin-top: 6px;
    }

    .posting a {
        color: var(--accent-txt, var(--accent));
    }
</style>
