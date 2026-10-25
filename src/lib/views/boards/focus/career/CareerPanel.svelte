<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The career banner at the top of the
    // board. Its heading is the row the command center and the tasks section draw theirs with
    // (FoldHead.svelte): the fold control, named "Fold Career strategy" or "Unfold Career
    // strategy", then the career file's title and its next milestone with its day, one line cut
    // with an ellipsis (state/boards/career.ts `foldedLine`). Unfolded, it is the whole panel: the
    // situation, one fact a row, the goal, the next milestone with its day and the days left to it,
    // the order of work with its note, and the track record, the user's projects counted by each
    // record row of `categories:` for each role and the funding the user leads that was obtained
    // (`trackRecord`). Each section is drawn only when it has something. A web address written in
    // a fact, the goal, the milestone, a task or a note is a link
    // (ui/display/text/LinkedText.svelte).
    //
    // Its Edit control opens the editor of the career file's sections, built from the file's own
    // `schema:` (views/shared/forms/entry/edit/EntryEditor.svelte), in place of the read-only
    // sections. The edits are kept in the Focus view's instance state, so the editor stays open
    // while edits are unsaved, and closing it over them asks first. The file has no Add and no
    // Delete: it is one file, not a list of entries.
    //
    // Folded by default, so the banner takes one line above the command center. Folded, the panel
    // is hidden until found and stays mounted, so the editor keeps its refusals, its result words
    // and a save in flight across a fold and an unfold, and the browser's find-in-page searches its
    // text while it is folded: a match inside it fires `beforematch`, which unfolds the banner. It
    // draws nothing when the hub holds no career file, which is the ordinary case for a hub that
    // keeps no career plan, and the board then starts at the command center.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import FoldHead from '../FoldHead.svelte';
    import EntryEditor from '../../../shared/forms/entry/edit/EntryEditor.svelte';
    import { pageFile } from '../../../shared/forms/entry/edit/page-file';
    import { daysLeft, foldedLine, trackRecord } from '$lib/state/boards/career';
    import { CAREER } from '$lib/state/forms/page-entry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        entities: { portfolio },
        formDraft: { draftEdits, revertDraft },
        pages: { pageNamed },
        selectors: { configMap }
    } = client;

    type Props = {
        /** The view instance that keeps the career editor's unsaved edits. */
        instance: string;
        /** The moment the board counts from, which the milestone's days left are counted to. */
        now: number;
    };

    let { instance, now }: Props = $props();

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const career = $derived(snapshot?.entities.career ?? null);

    /** The track record, null when no `self` is set or it holds nothing to draw. */
    const record = $derived(trackRecord(snapshot, config, vocabOf));

    /** The days left to the milestone's day, the empty text when it has none. */
    const left = $derived(
        career?.milestoneDate === undefined ? '' : daysLeft(career.milestoneDate, now)
    );

    /** The career file as the editor sees it, null while the file has no schema. */
    const page = $derived(pageNamed(CAREER));
    const file = $derived(page === null ? null : pageFile(client, page));

    /** Whether the editor is asked for, and whether the question before closing it is open. */
    let editing = $state(false);
    let discarding = $state(false);
    const unsaved = $derived(Object.keys(draftEdits(instance, 'page', CAREER)).length > 0);
    const open = $derived(editing || unsaved);

    /** Open the editor, or close it; closing over unsaved edits asks first. */
    function toggle(): void {
        if (!open) editing = true;
        else if (unsaved) discarding = true;
        else editing = false;
    }

    /** Drop the unsaved edits and close the editor. */
    function discard(): void {
        discarding = false;
        revertDraft(instance);
        editing = false;
    }

    /** Whether the banner is unfolded; it starts folded. */
    let unfolded = $state(false);
</script>

{#snippet section(label: string)}
    <p class="seclbl">{label}</p>
{/snippet}

{#if career !== null}
    <section class="career" data-surface>
        <FoldHead
            glyph={t('focus.career_glyph')}
            title={foldedLine(career)}
            name={t('focus.career_heading')}
            open={unfolded}
            ontoggle={() => (unfolded = !unfolded)}
        />
        <div
            class="body"
            hidden={unfolded ? false : 'until-found'}
            onbeforematch={() => (unfolded = true)}
        >
            {#if page !== null}
                <ToolButton
                    small
                    label={open ? t('entry_form.edit_done') : t('entry_form.edit')}
                    glyph={t('entry_form.edit_glyph')}
                    active={open}
                    onclick={toggle}
                />
            {/if}
            {#if open && page !== null}
                <EntryEditor {page} {instance} {file} />
            {:else}
                {#if career.situation.length > 0}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render section(t('focus.career_situation'))}
                    <div class="facts">
                        {#each career.situation as fact (fact.label)}
                            <b>{fact.label}</b>
                            <span><LinkedText text={fact.value} /></span>
                        {/each}
                    </div>
                {/if}

                {#if career.goal !== undefined}
                    <p class="goal">
                        <b>{t('focus.career_goal')}</b>
                        <LinkedText text={career.goal} />
                    </p>
                {/if}

                {#if career.milestone !== undefined}
                    <p class="milestone">
                        <Glyph name={t('project.card.deadline_glyph')} />
                        <b>{t('focus.next')}</b>
                        <LinkedText text={career.milestone} />
                        {#if career.milestoneDate !== undefined}
                            <span class="when">{career.milestoneDate}</span>
                        {/if}
                        {#if left !== ''}
                            <Tag label={left} />
                        {/if}
                    </p>
                {/if}

                {#if career.order.length > 0}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render section(t('focus.order_of_work'))}
                    <ol class="order">
                        {#each career.order as row, at (`${at}:${row.task}`)}
                            <li>
                                <span class="task"><LinkedText text={row.task} /></span>
                                {#if row.note !== undefined}
                                    <span class="ordernote"><LinkedText text={row.note} /></span>
                                {/if}
                                {#if row.when !== undefined}
                                    <span class="when">{row.when}</span>
                                {/if}
                            </li>
                        {/each}
                    </ol>
                    {#if career.orderNote !== undefined}
                        <p class="note"><LinkedText text={career.orderNote} /></p>
                    {/if}
                {/if}

                {#if record !== null}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render section(t('focus.career_record'))}
                    <div class="facts">
                        {#each record.roles as role (role.key)}
                            <b>{role.label}</b>
                            <span>
                                {#each role.lines as line (line.key)}
                                    <span class="line">
                                        {t('focus.career_record_line', line.label, line.count)}
                                    </span>
                                {/each}
                            </span>
                        {/each}
                    </div>
                    {#if record.funding > 0}
                        <p class="note">{t('focus.career_funding', record.funding)}</p>
                    {/if}
                {/if}
            {/if}
        </div>
    </section>
{/if}

{#if discarding}
    <Confirm
        message={t('entry_form.discard_ask')}
        confirm={t('entry_form.discard')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={discard}
        oncancel={() => (discarding = false)}
    />
{/if}

<style>
    /* Drawn in the command center's box (CommandCenterView.svelte `.week`), its padding and its
       borders, with its own edge colour, which no other Focus section takes. */
    .career {
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-purple);
        border-radius: var(--input-radius);
        background: var(--chip);
    }

    /* Over a wallpaper the banner is the one translucent layer under its words, so it carries
       `data-surface`; drawn inside a surface already (a free float's fill) it paints nothing. */
    :global(body.wall) .career {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .career {
        background: transparent;
        backdrop-filter: none;
    }

    /* The panel under the heading row, inset from the box's edges by the box's own padding, and 4px
       under the row as the command center's first group stands under its heading. */
    /* The gap above the body is drawn only while it is shown, since a body hidden until found
       still draws its padding and would make the folded box taller than the command center's. */
    .body:not([hidden]) {
        padding: 4px 0 0;
    }

    .seclbl {
        margin: 4px 0 2px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--accent-txt, var(--accent));
    }

    .note {
        margin: 4px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
    }

    /* One fact a row: the labels in a column as wide as the widest of them, since a grid column is
       one width for every row, and each value wrapping in its own column. */
    .facts {
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr);
        align-items: baseline;
        gap: 2px 12px;
    }

    .facts b {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    /* A fact, a line of the track record and a task of the order of work are rows of the board,
       drawn at the ticker row's size and line (ui/display/ticker/Ticker.svelte), with every word in
       them. */
    .facts span {
        font-size: var(--fs-xs);
        line-height: calc(14px * var(--text-scale, 1));
        overflow-wrap: anywhere;
    }

    /* Each line of a role's track record stands on its own line in the value column. */
    .facts .line {
        display: block;
    }

    .goal {
        display: flex;
        align-items: baseline;
        gap: 5px;
        margin: 6px 0 0;
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }

    .goal b {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    /* The milestone, its day and the days left wrap onto a further line in a narrow pane. */
    .milestone {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 5px;
        margin: 6px 0 0;
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-orange);
        border-radius: var(--input-radius);
        background: var(--chip);
        font-size: var(--fs-md);
    }

    :global(body.wall) .milestone {
        background: transparent;
    }

    .order {
        margin: 3px 0 0;
        padding-left: 16px;
    }

    .order li {
        margin: 2px 0;
        font-size: var(--fs-xs);
        line-height: calc(14px * var(--text-scale, 1));
    }

    .ordernote {
        color: var(--muted-txt, var(--muted));
    }

    .when {
        margin-left: 6px;
        padding: 1px 7px;
        border-radius: var(--input-radius);
        background: var(--chip);
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--accent-txt, var(--accent));
    }

    :global(body.wall) .when {
        background: transparent;
    }
</style>
