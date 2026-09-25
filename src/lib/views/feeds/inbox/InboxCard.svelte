<script lang="ts">
    // Layer 3, view partial of views/feeds/inbox/Inbox.svelte. One thread of the plate: what it
    // wants, how old it is, the note about it, the answer that has been drafted for it, and the two
    // writes to the mailbox the view allows.
    //
    // The draft is an editor over the thread's own note. Typing in it writes nothing: the note is
    // saved by its own control, and the answer is sent by a control behind a confirmation naming
    // who it goes to and which account it goes from. Archive needs no draft, so it sits on the
    // card's own row beside the triage control, behind a confirmation of its own. There is no other
    // write to a mailbox anywhere on the page, and neither of these two ever creates a draft at the
    // provider.
    //
    // What is drawn of the message itself is the provider's own one-line snippet, which is all the
    // payload carries.

    import Card from '$lib/ui/frame/Card.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        archiveConfirm,
        kindOf,
        kindTone,
        sendConfirm,
        threadAge,
        type InboxThread
    } from '$lib/state/feeds/inbox';
    import type { MailAnswer, TriageFields } from '$lib/state/feeds/inbox.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        clock: { minuteNow }
    } = useState();

    type Props = {
        thread: InboxThread;
        id: string;
        cursor: boolean;
        /** The account's own label, which is what a confirmation names the mailbox by. */
        account: string;
        busy: boolean;
        /** Whether this card's draft editor is open, which the view keeps in its instance state. */
        draftOpen: boolean;
        onshowdraft: (thread: InboxThread, open: boolean) => void;
        ontriage: (thread: InboxThread, fields: TriageFields) => Promise<MailAnswer>;
        onreply: (thread: InboxThread, body: string) => Promise<MailAnswer>;
        onarchive: (thread: InboxThread) => Promise<MailAnswer>;
        onsaid: (words: string) => void;
    };

    let {
        thread,
        id,
        cursor,
        account,
        busy,
        draftOpen,
        onshowdraft,
        ontriage,
        onreply,
        onarchive,
        onsaid
    }: Props = $props();

    let asking: 'send' | 'archive' | null = $state(null);
    /**
     * The draft as the editor holds it; null while nothing has been typed since the last publish.
     */
    let typed: string | null = $state(null);

    const kind = $derived(kindOf(thread));
    const note = $derived(thread.triage);
    const saved = $derived(note.draft ?? '');
    const draft = $derived(typed ?? saved);
    const sender = $derived(thread.sender || thread.subject || t('inbox.thread'));
    const age = $derived(threadAge(thread, minuteNow()));

    /** The age in the reader's own words, and nothing when the provider's time cannot be read. */
    function ageText(): string {
        if (age === null) return '';
        if (age.unit === 'd') return t('inbox.age_days', age.value);
        return age.unit === 'h'
            ? t('inbox.age_hours', age.value)
            : t('inbox.age_minutes', age.value);
    }

    function kindLabel(): string {
        if (kind === 'reply') return t('inbox.reply');
        if (kind === 'action') return t('inbox.action');
        return kind === 'info' ? t('inbox.info') : t('inbox.unsorted');
    }

    /** One command's outcome as the one sentence the view says about it. */
    function say(answer: MailAnswer, done: string): void {
        onsaid(answer.ok ? done : t('inbox.refused', answer.error ?? ''));
    }

    async function mark(triaged: boolean): Promise<void> {
        say(
            await ontriage(thread, { triaged }),
            triaged ? t('inbox.said_triaged') : t('inbox.said_restored')
        );
    }

    async function saveDraft(): Promise<void> {
        const answer = await ontriage(thread, { draft });
        if (answer.ok) typed = null;
        say(answer, t('inbox.said_draft_saved'));
    }

    async function send(): Promise<void> {
        asking = null;
        const answer = await onreply(thread, draft);
        if (answer.ok) typed = null;
        say(answer, t('inbox.said_sent'));
    }

    async function archive(): Promise<void> {
        asking = null;
        say(await onarchive(thread), t('inbox.said_archived'));
    }
</script>

<div data-inbox={thread.id}>
    <Card {id} {cursor} title={sender} titleHtml={inlineMarkdown(sender)} tone={kindTone(kind)}>
        {#snippet meta()}
            <Tag label={kindLabel()} tone={kindTone(kind)} />
            <Tag label={account} />
            {#if ageText() !== ''}
                <span class="age">{ageText()}</span>
            {/if}
            {#if thread.messages > 1}
                <span class="age">{t('inbox.messages', thread.messages)}</span>
            {/if}
            <ToolButton
                label={t('inbox.archive')}
                title={t('inbox.archive_tip')}
                glyph="archived"
                compact
                disabled={busy}
                onclick={() => (asking = 'archive')}
            />
            {#if note.triaged}
                <ToolButton
                    label={t('inbox.restore')}
                    title={t('inbox.restore_tip')}
                    glyph="refresh"
                    compact
                    disabled={busy}
                    onclick={() => void mark(false)}
                />
            {:else}
                <ToolButton
                    label={t('inbox.triaged')}
                    title={t('inbox.triage_tip')}
                    glyph="done"
                    compact
                    disabled={busy}
                    onclick={() => void mark(true)}
                />
            {/if}
        {/snippet}

        {#if thread.subject !== ''}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="sub">{@html inlineMarkdown(thread.subject)}</p>
        {/if}
        {#if note.what}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="what">{@html inlineMarkdown(note.what)}</p>
        {/if}
        {#if thread.snippet !== ''}
            <p class="snippet">{thread.snippet}</p>
        {/if}

        <div class="draft">
            <ToolButton
                label={t('inbox.show_draft')}
                glyph="draft"
                active={draftOpen}
                expanded={draftOpen}
                onclick={() => onshowdraft(thread, !draftOpen)}
            />
            {#if draftOpen}
                <TextArea
                    value={draft}
                    label={t('inbox.draft_label')}
                    rows={6}
                    oninput={(value: string) => (typed = value)}
                />
                <div class="acts">
                    <ToolButton
                        label={t('inbox.save_draft')}
                        glyph="check"
                        compact
                        disabled={busy || draft === saved}
                        onclick={() => void saveDraft()}
                    />
                    <ToolButton
                        label={t('inbox.send')}
                        glyph="reply"
                        compact
                        disabled={busy || draft.trim() === ''}
                        onclick={() => (asking = 'send')}
                    />
                </div>
            {/if}
        </div>

        {#if thread.url}
            <p class="provider">
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, the provider's own page for this thread, rather than a route id resolve() takes -->
                <a href={thread.url} target="_blank" rel="noopener noreferrer">
                    <Glyph name="link" />
                    <span>{t('inbox.open_provider')}</span>
                </a>
            </p>
        {/if}
    </Card>
</div>

{#if asking === 'send'}
    <Confirm
        message={sendConfirm(thread, account)}
        detail={thread.subject}
        confirm={t('inbox.send_confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void send()}
        oncancel={() => (asking = null)}
    />
{:else if asking === 'archive'}
    <Confirm
        message={archiveConfirm(thread, account)}
        detail={thread.subject}
        confirm={t('inbox.archive_confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void archive()}
        oncancel={() => (asking = null)}
    />
{/if}

<style>
    .age {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .sub {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .snippet {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .sub,
    .what,
    .snippet,
    .provider {
        margin: 4px 0 0;
    }

    .draft {
        margin-top: 8px;
        display: grid;
        gap: 6px;
    }

    .acts {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .provider a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
    }
</style>
