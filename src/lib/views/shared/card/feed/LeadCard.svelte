<script lang="ts">
    // Layer 3, shared view. One position lead with its fit, deadline, posting, status writes and
    // confirmed deletion, drawn by the Leads view (views/feeds/leads/Leads.svelte), where its title
    // opens its page, and on that page (views/boards/entry/Entry.svelte), where it is handed no
    // page opener and its title is words. Feed rules stay in state and server modules.
    //
    // The `applied` control opens Applications beside the view the card is drawn in, with an entry
    // filled from the lead, and the lead is set to `applied` once that entry is placed
    // (views/shared/card/feed/lead-apply.ts). The controls that write the lead are disabled,
    // `blocked` as their title, while the leads file has unsaved text in a source tab. The
    // `decline` control is a status write like reopen: it sets the lead's status to `declined` in
    // the hub's file, so the change log records it and reopen puts `open` back. It is offered on an
    // open lead alone, so a decline never writes over an outcome.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        APPLIED,
        DECLINED,
        OPEN,
        fitKey,
        fitTone,
        isClosed,
        isOpen,
        leadId,
        type LeadEntry
    } from '$lib/state/feeds/leads';
    import { posting } from '$lib/views/shared/forms/posting';
    import { textOrNumber } from '$lib/data/shapes/shapes';
    import { feedRoot } from '$lib/state/shared/page/idents';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';
    import { answerWords } from '$lib/views/shared/forms/answer-words';
    import { useState } from '$lib/state/client/use';
    import { applyFromLead } from './lead-apply';

    const client = useState();
    const {
        writes: { deleteFeedEntry, writeFeedField }
    } = client;

    type Props = {
        entry: LeadEntry;
        vocab: unknown;
        cursor: boolean;
        expired?: boolean;
        onsaid: (words: string) => void;
        /** The view instance the Applications tab of the `applied` control opens beside. */
        beside: string;
        /** Open the lead's page, where its fields are edited; none on that page itself. */
        onpage?: () => void;
        /** Why the controls that write the lead are disabled, '' when they are not. */
        blocked: string;
    };

    let {
        entry,
        vocab,
        cursor,
        expired = false,
        onsaid,
        beside,
        onpage,
        blocked
    }: Props = $props();
    let sure = $state(false);

    const text = (field: string): string => textOrNumber(entry[field]);
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

    /** A control's own words, or the words saying why it is disabled. */
    function why(own: string): string {
        return blocked === '' ? own : blocked;
    }

    function say(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
    }

    async function mark(next: string): Promise<void> {
        if (title === '') return;
        say(await writeFeedField('leads', title, 'status', next, feedRoot(entry)));
    }

    /** Open Applications with an entry filled from this lead, and mark the lead applied. */
    async function apply(): Promise<void> {
        onsaid(await applyFromLead(client, entry, beside));
    }

    async function remove(): Promise<void> {
        sure = false;
        if (title === '') return;
        say(await deleteFeedEntry('leads', title, feedRoot(entry)));
    }
</script>

<div class:expired data-lead={title}>
    <Card
        id={identity}
        {cursor}
        {title}
        titleHtml={inlineMarkdown(title)}
        ontitle={onpage}
        tone={expired ? 'grey' : tone}
    >
        {#snippet meta()}
            <RootChip record={{ root: feedRoot(entry) }} />
            <Tag label={key ?? t('leads.fit_none')} {tone} />
            {#if expired}
                <Tag label={status || t('leads.expired')} tone="grey" />
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
                    {#if status !== APPLIED}
                        <ToolButton
                            label={t('leads.action.applied')}
                            title={why(t('leads.action.applied_tip'))}
                            small
                            disabled={blocked !== ''}
                            onclick={apply}
                        />
                    {/if}
                    {#if isOpen(status)}
                        <ToolButton
                            label={t('leads.action.decline')}
                            title={why(t('leads.action.decline_tip'))}
                            small
                            disabled={blocked !== ''}
                            onclick={() => mark(DECLINED)}
                        />
                    {/if}
                    {#if isClosed(status)}
                        <ToolButton
                            label={t('leads.action.reopen')}
                            title={why(t('leads.action.reopen_tip'))}
                            small
                            disabled={blocked !== ''}
                            onclick={() => mark(OPEN)}
                        />
                    {/if}
                    <ToolButton
                        label={t('project.action.del')}
                        title={why(t('leads.action.delete_lead_tip'))}
                        small
                        disabled={blocked !== ''}
                        onclick={() => (sure = true)}
                    />
                </span>
            {/if}
        {/snippet}

        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p class="sub">{@html inlineMarkdown(sub)}</p>
        {#if country !== '' || type !== ''}
            <div class="chips">
                {#if country !== ''}
                    <Tag label={country} />
                {/if}
                {#if type !== ''}
                    <Tag label={type} />
                {/if}
            </div>
        {/if}
        {#if note !== ''}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="note">{@html inlineMarkdown(note)}</p>
        {/if}
        {#if posting(url) !== undefined}
            <p class="posting">
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
                <a href={posting(url)} target="_blank" rel="noreferrer">
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

    /* Drawn as the card around them says, ui/frame/Card.svelte's `--card-reveal`: transparent at
       rest, so the card keeps its size and Tab still reaches every control. */
    .actions {
        opacity: var(--card-reveal);
        transition: opacity 120ms ease-out;
    }

    .sub {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .sub,
    .note,
    .posting {
        margin: 4px 0 0;
        overflow-wrap: anywhere;
    }

    .chips {
        margin-top: 6px;
    }

    .posting a {
        color: var(--accent-txt, var(--accent));
    }
</style>
