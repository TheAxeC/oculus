<script lang="ts">
    // Layer 3, shared view. One position lead as the record card
    // (views/shared/card/record/RecordCard.svelte): its fit, deadline and posting, drawn by the
    // Leads view (views/feeds/leads/Leads.svelte), where its title and the strip's Page open its
    // page, and on that page (views/boards/entry/Entry.svelte), where it is handed `page` and no
    // page opener, its title is words, and its subtasks and follow-ups are listed. A lead with no
    // key has no page, so its title is words and it offers no Page. Feed rules stay in state and
    // server modules.
    //
    // The strip holds Applied and Page, or Edit on the page. The menu holds Page, Edit, which opens
    // the editor beside the card (entry-actions.ts `editorRows`), and the posting in its Open run,
    // the Add run (entry-actions.ts `feedDated`), the Status submenu with Applied, Decline and
    // Reopen, and Delete, which asks first. Applied opens the Applications file of a hub beside the
    // view the card is drawn in, with an entry filled from the lead, and the lead is set to the one
    // status carrying `lead_applied` once that entry is placed (lead-apply.ts beside this file).
    // With more than one hub holding Applications, Applied is a menu of those hubs, in the strip
    // and in the Status submenu, the primary first, and the hub picked takes the entry; with one, a
    // press opens that hub's file. While the entry is being placed Applied waits, and a second
    // press or pick does nothing.
    //
    // The actions that write the lead are disabled, `blocked` as their title, while the leads file
    // has unsaved text in a source tab or the lead has no key to name it by. Decline is a status
    // write like Reopen: it sets the lead's status to the one word carrying `lead_declined` in the
    // hub's file, so the change log records it and Reopen puts the one word carrying `default_lead`
    // back. It is offered on an open lead alone, so a decline never writes over an outcome. An
    // action whose flag no word of the hub's `lead_statuses` carries, or two or more do, is
    // disabled with a title saying so, since it has no word to write. Each flag is a word's of
    // `statuses`, and the fit's colour a word of `leads_fit` and `palette`, in the words of the
    // lead's own hub. On the page of a lead of a file with no schema, which `held.schema` tells,
    // the card writes nothing: the menu holds the posting alone, and in the Leads view it keeps
    // every action.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import {
        appliedWord,
        declinedWord,
        fitKey,
        fitTone,
        isApplied,
        isClosed,
        isOpen,
        leadId,
        openWord,
        type LeadEntry
    } from '$lib/state/feeds/leads';
    import { posting } from './posting';
    import { textOrNumber } from '$lib/data/shapes/shapes';
    import { feedEntryId, feedRoot } from '$lib/state/shared/page/idents';
    import { chosenHub } from '$lib/state/shared/page/hubs';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import {
        pageAction,
        statusAction,
        type RecordAction
    } from '$lib/views/shared/card/record/record-menu';
    import type { CardAction } from '$lib/views/shared/card/card';
    import {
        keylessFeedEntry,
        pageFault,
        pageFile
    } from '$lib/views/shared/forms/entry/edit/page-file';
    import { blockedBy } from '$lib/views/shared/forms/entry-file';
    import { editorRows, feedDated } from '$lib/views/shared/forms/entry/entry-actions';
    import { t } from '$lib/state/shared/words/text';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';
    import { answerWords } from '$lib/views/shared/forms/answer-words';
    import { useState } from '$lib/state/client/use';
    import { applyFromLead, applyHubs } from './lead-apply';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        writes: { deleteFeedEntry, writeFeedField }
    } = client;

    type Props = {
        entry: LeadEntry;
        /** The lead's internal id, which its page and its editor name it by. */
        id: string;
        cursor: boolean;
        expired?: boolean;
        onsaid: (words: string) => void;
        /** The view instance the Applications tab of the `applied` action opens beside. */
        beside: string;
        /** Open the lead's page, where its fields are edited; none on that page itself. */
        onpage?: () => void;
        /** Drawn on the lead's own page: its subtasks and follow-ups listed. */
        page?: boolean;
        /** Why the actions that write the lead are disabled, '' when they are not. */
        blocked: string;
    };

    let {
        entry,
        id,
        cursor,
        expired = false,
        onsaid,
        beside,
        onpage,
        page = false,
        blocked: fileBlocked
    }: Props = $props();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();
    let sure = $state(false);
    /** Whether an application from this lead is being placed, during which a pick does nothing. */
    let applying = $state(false);

    /** The words of the lead's own hub, which the fit's colour and the status words are read in. */
    const vocab = $derived(vocabOf(feedRoot(entry)));
    /** One field of the lead as its words. */
    const word = (field: string): string => textOrNumber(entry[field]);
    const title = $derived(word('title'));
    const identity = $derived(leadId(entry));
    /** The lead's internal id, which its writes name it by. */
    const record = $derived(feedEntryId(entry));
    /** The file and the fault of a lead with no key, which has no page to read them from. */
    const keyless = $derived(
        record === '' ? keylessFeedEntry(client, 'leads', feedRoot(entry)) : null
    );
    /** Why the lead's writes are off: the view's reason, else that the lead has no key. */
    const blocked = $derived(
        fileBlocked !== '' || keyless === null
            ? fileBlocked
            : blockedBy(keyless.file, false, keyless.fault)
    );
    /** What opens the lead's page; a lead with no key has none. */
    const opener = $derived(record === '' ? undefined : onpage);
    const institution = $derived(word('inst'));
    const country = $derived(word('country'));
    const type = $derived(word('typ'));
    const focus = $derived(word('focus'));
    const fit = $derived(word('fit'));
    const status = $derived(word('status').trim().toLowerCase());
    const deadline = $derived(word('deadline'));
    const url = $derived(word('url'));
    const key = $derived(fitKey(fit, vocab));
    const tone = $derived(fitTone(fit, vocab));
    const sub = $derived(`${institution} | ${country}`);
    const note = $derived(`${focus}${fit === '' ? '' : ` - ${fit}`}`);
    /** The hubs whose Applications file an application from this lead can go to. */
    const hubs = $derived(applyHubs(client));
    const deadlineTail = $derived(
        expired ? (isClosed(vocab, status) ? status : t('leads.expired')) : ''
    );

    /**
     * The status each action writes, in the lead's own hub's words: the one word carrying its
     * flag, the empty text when no word or more than one does, which disables the action.
     */
    const writes = $derived({
        applied: appliedWord(vocab),
        declined: declinedWord(vocab),
        open: openWord(vocab)
    });

    /** The lead's lines and deadline, which the card's Add run writes; none with no schema. */
    const dated = $derived(feedDated(client, 'leads', entry, blocked, page));

    /** An action's own words, or the words saying why it is disabled. */
    function why(own: string): string {
        return blocked === '' ? own : blocked;
    }

    /**
     * The words of an action that writes `word`: why it is disabled, `none` when no one word
     * carries its flag and the blocking words while the leads file is blocked, and its own words
     * otherwise.
     */
    function whyWriting(own: string, word: string, none: string): string {
        return blocked === '' && word === '' ? none : why(own);
    }

    /** Applied: one action with one hub, a menu of the hubs with more than one. */
    function appliedAction(): CardAction {
        const off = blocked !== '' || writes.applied === '';
        const many = hubs.length > 1;
        const own = many ? t('leads.action.applied_hub_tip') : t('leads.action.applied_tip');
        return {
            id: 'applied',
            label: t('leads.action.applied'),
            title: whyWriting(own, writes.applied, t('leads.action.applied_none')),
            turning: applying,
            disabled: off,
            items: many
                ? hubs.map((hub) => ({
                      id: `applied:${hub}`,
                      label: hub,
                      disabled: off || applying,
                      onclick: () => apply(hub)
                  }))
                : undefined,
            onclick: () => apply(chosenHub(hubs, client.fs.primary()) ?? '')
        };
    }

    /** The statuses the card writes: Applied, Decline on an open lead, Reopen on a closed one. */
    const states = $derived.by((): CardAction[] => {
        const rows: CardAction[] = [];
        if (!isApplied(vocab, status)) rows.push(appliedAction());
        if (isOpen(vocab, status)) {
            rows.push({
                id: 'decline',
                label: t('leads.action.decline'),
                title: whyWriting(
                    t('leads.action.decline_tip'),
                    writes.declined,
                    t('leads.action.decline_none')
                ),
                disabled: blocked !== '' || writes.declined === '',
                onclick: () => mark(writes.declined)
            });
        }
        if (isClosed(vocab, status)) {
            rows.push({
                id: 'reopen',
                label: t('leads.action.reopen'),
                title: whyWriting(
                    t('leads.action.reopen_tip'),
                    writes.open,
                    t('leads.action.reopen_none')
                ),
                disabled: blocked !== '' || writes.open === '',
                onclick: () => mark(writes.open)
            });
        }
        return rows;
    });

    /** The lead as a page, whose file and fault the Edit row is decided by. */
    const held = $derived(client.pages.pageOf('leads', id));

    /**
     * The card's actions: Page, Edit and the posting, then, for a lead with an identity, the Status
     * submenu and Delete.
     */
    const actions = $derived.by((): RecordAction[] => {
        const rows: RecordAction[] = opener === undefined ? [] : [pageAction(opener)];
        const file = held === null ? (keyless?.file ?? null) : pageFile(client, held);
        const fault = held === null ? keyless?.fault : pageFault(client, held);
        rows.push(...editorRows(client, 'leads', id, title, file, fault, keyless?.schema));
        const link = posting(url);
        if (link !== undefined) {
            rows.push({
                id: 'posting',
                label: t('leads.posting'),
                title: link,
                glyph: 'link',
                run: 'open',
                onclick: () => {
                    window.open(link, '_blank', 'noreferrer');
                }
            });
        }
        if (identity === '' || (page && held?.schema === undefined)) return rows;
        return [
            ...rows,
            ...statusAction(states, blocked === '' ? undefined : blocked),
            {
                id: 'delete',
                label: t('entry_form.delete'),
                title: why(t('leads.action.delete_lead_tip')),
                glyph: t('entry_form.delete_glyph'),
                disabled: blocked !== '',
                onclick: () => {
                    sure = true;
                }
            }
        ];
    });

    function say(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
    }

    /** Write the lead's status; a word no flag of the config gives, the empty text, writes none. */
    async function mark(next: string): Promise<void> {
        if (record === '' || next === '') return;
        say(await writeFeedField('leads', record, 'status', next));
    }

    /**
     * Open the Applications file of the hub `hub` with an entry filled from this lead, and mark
     * the lead applied; a press or pick while one is placed does nothing.
     */
    async function apply(hub: string): Promise<void> {
        if (applying) return;
        applying = true;
        try {
            onsaid(await applyFromLead(client, entry, beside, hub));
        } finally {
            applying = false;
        }
    }

    async function remove(): Promise<void> {
        sure = false;
        if (record === '') return;
        say(await deleteFeedEntry('leads', record));
    }
</script>

{#snippet meta()}
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
{/snippet}

{#snippet text()}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
    <p class="sub">{@html inlineMarkdown(sub, cardMath(sub))}</p>
    {#if country !== '' || type !== ''}
        <div class="chips">
            {#if country !== ''}
                <Tag label={country} />
            {/if}
            {#if type !== ''}
                <Tag label={type} wrap />
            {/if}
        </div>
    {/if}
    {#if note !== ''}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p class="note">{@html inlineMarkdown(note, cardMath(note))}</p>
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
{/snippet}

<div class="slot" class:expired data-lead={title}>
    <RecordCard
        id={identity}
        {cursor}
        {title}
        titleHtml={inlineMarkdown(title, cardMath(title))}
        ontitle={opener}
        tone={expired ? 'grey' : tone}
        record={{ root: feedRoot(entry) }}
        {actions}
        strip={['applied', page ? 'editor' : 'page']}
        {dated}
        {onsaid}
        {meta}
        {text}
    />
</div>

{#if sure}
    <Confirm
        message={t('leads.action.delete_lead_ask')}
        detail={title}
        confirm={t('entry_form.delete')}
        cancel={t('collection.form_cancel')}
        onconfirm={remove}
        oncancel={() => (sure = false)}
    />
{/if}

<style>
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* An expired lead is faded and greyed as archival; while the pointer is over it or the keyboard
       focus is inside it both lift, so it is read at full strength. */
    .expired {
        opacity: 0.62;
        filter: grayscale(0.55);
        transition:
            opacity 120ms ease,
            filter 120ms ease;
    }

    .expired:hover,
    .expired:focus-within {
        opacity: 1;
        filter: none;
    }

    @media (prefers-reduced-motion: reduce) {
        .expired {
            transition: none;
        }
    }

    .deadline,
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
        font-size: var(--fs-sm);
    }

    .sub,
    .note,
    .posting {
        margin: 4px 0 0;
        overflow-wrap: anywhere;
    }

    /* The country and the post type, in a row as wide as the card: the type is a sentence, which
       wraps inside the card rather than widening it past its column. */
    .chips {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        min-width: 0;
        margin-top: 6px;
    }

    .posting a {
        color: var(--accent-txt, var(--accent));
    }
</style>
