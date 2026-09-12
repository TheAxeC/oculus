<script lang="ts">
    // Layer 3, view partial of views/Leads.svelte. One position lead with its fit, deadline,
    // posting, status writes, and confirmed deletion. Feed rules stay in state and server modules.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Confirm from '$lib/ui/Confirm.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { inlineMarkdown } from '$lib/state/collection';
    import { fitKey, fitTone, isClosed, type LeadEntry } from '$lib/state/leads';
    import { t } from '$lib/state/text';
    import { deleteFeedEntry, writeFeedField, type WriteAnswer } from '$lib/state/writes.svelte';

    type Props = {
        entry: LeadEntry;
        vocab: unknown;
        expired?: boolean;
        onsaid: (words: string) => void;
    };

    let { entry, vocab, expired = false, onsaid }: Props = $props();
    let sure = $state(false);

    const text = (field: string): string => {
        const value = entry[field];
        return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    };
    const title = $derived(text('title'));
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
    const deadlineTail = $derived(
        expired ? (isClosed(status) ? status : t('sf.leads_expired')) : ''
    );

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
    <Card {title} titleHtml={inlineMarkdown(title)} tone={expired ? 'grey' : tone}>
        {#snippet meta()}
            <Chip label={key ?? t('sf.leads_fit_none')} {tone} />
            {#if expired}
                <Chip label={status || t('sf.leads_expired')} tone="grey" />
            {/if}
            {#if deadline !== '' || expired}
                <span class="deadline">
                    <Glyph name="deadline" />
                    <span>{deadline || t('sf.leads_no_deadline')}</span>
                    {#if deadlineTail !== ''}
                        <span> | {deadlineTail}</span>
                    {/if}
                </span>
            {/if}
            {#if title !== ''}
                <span class="actions">
                    {#if status !== 'applied'}
                        <ToolButton
                            label={t('actions.applied')}
                            title={t('actions.mark_applied')}
                            compact
                            onclick={() => mark('applied')}
                        />
                    {/if}
                    {#if status !== 'declined'}
                        <ToolButton
                            label={t('actions.decline')}
                            title={t('actions.decline_tip')}
                            compact
                            onclick={() => mark('declined')}
                        />
                    {/if}
                    {#if status === 'applied' || status === 'declined'}
                        <ToolButton
                            label={t('actions.reopen')}
                            title={t('actions.reopen_lead_tip')}
                            compact
                            onclick={() => mark('open')}
                        />
                    {/if}
                    <ToolButton
                        label={t('actions.del')}
                        title={t('actions.delete_lead_tip')}
                        compact
                        onclick={() => (sure = true)}
                    />
                </span>
            {/if}
        {/snippet}

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
            <p class="note">{@html inlineMarkdown(note)}</p>
        {/if}
        {#if url.startsWith('http')}
            <p class="posting">
                <a href={url} target="_blank" rel="noreferrer">
                    <Glyph name="link" />
                    <span>{t('sf.leads_posting')}</span>
                </a>
            </p>
        {/if}
    </Card>
</div>

{#if sure}
    <Confirm
        message={t('actions.delete_lead_tip')}
        detail={title}
        confirm={t('actions.del')}
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
