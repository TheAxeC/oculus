<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The Career banner at the top of the
    // board. Its heading is the row the command center and the tasks section draw theirs with
    // (FoldHead.svelte): the fold control, named "Fold Career" or "Unfold Career", then the
    // banner's glyph and the word Career, and nothing else. Unfolded, its sections stand side by
    // side across the width, in the order Goal, Next, Situation, Order of work and Track record,
    // each a column headed in the Focus board's section look (the command center's group heading:
    // a glyph and the label in extra-small bold capitals in the accent colour). The columns wrap
    // under one another only where the pane is too narrow to hold them side by side. Next is one
    // plain line, the milestone, its day and the days left to it (state/boards/career.ts
    // `nextLine`); Situation one fact a row; Order of work the tasks with their notes and the
    // order's note; Track record a table (ui/display/table/Table.svelte), a row per role and a
    // column per record row of `categories:` any role has a project in, each cell the count of the
    // user's projects, and a last row Funding obtained, the funding the user leads that was
    // obtained (`trackRecord`, `recordTable`). Each section is drawn only when it has something. A
    // web address written in a fact, the goal, the milestone, a task or a note is a link
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

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import { type Column, cellText } from '$lib/ui/display/table/table-rows';
    import FoldHead from '../FoldHead.svelte';
    import EntryEditor from '../../../shared/forms/entry/edit/EntryEditor.svelte';
    import { pageFile } from '../../../shared/forms/entry/edit/page-file';
    import { nextLine, recordTable, trackRecord } from '$lib/state/boards/career';
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

    /** The track record's table, null when no `self` is set or it holds nothing to draw. */
    const record = $derived.by(() => {
        const held = trackRecord(snapshot, config, vocabOf);
        return held === null ? null : recordTable(held);
    });

    /** The Next line, the empty text when the file names no milestone. */
    const next = $derived(career === null ? '' : nextLine(career, now));

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

{#snippet heading(label: string, glyph: string)}
    <p class="lbl"><Glyph name={glyph} />{label}</p>
{/snippet}

{#if career !== null}
    <section class="career" data-surface>
        <FoldHead
            glyph={t('focus.career_glyph')}
            title={t('focus.career_heading')}
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
                <div class="sections">
                    {#if career.goal !== undefined}
                        <div class="sec">
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render heading(t('focus.career_goal'), t('focus.career_goal_glyph'))}
                            <p class="goal"><LinkedText text={career.goal} /></p>
                        </div>
                    {/if}

                    {#if next !== ''}
                        <div class="sec">
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render heading(t('focus.next'), t('focus.career_next_glyph'))}
                            <p class="next"><LinkedText text={next} /></p>
                        </div>
                    {/if}

                    {#if career.situation.length > 0}
                        <div class="sec">
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render heading(
                                t('focus.career_situation'),
                                t('focus.career_situation_glyph')
                            )}
                            <div class="facts">
                                {#each career.situation as fact (fact.label)}
                                    <b>{fact.label}</b>
                                    <span><LinkedText text={fact.value} /></span>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if career.order.length > 0}
                        <div class="sec">
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render heading(
                                t('focus.order_of_work'),
                                t('focus.career_order_glyph')
                            )}
                            <ol class="order">
                                {#each career.order as row, at (`${at}:${row.task}`)}
                                    <li>
                                        <span class="task"><LinkedText text={row.task} /></span>
                                        {#if row.note !== undefined}
                                            <span class="ordernote">
                                                <LinkedText text={row.note} />
                                            </span>
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
                        </div>
                    {/if}

                    {#if record !== null}
                        <div class="sec wide">
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render heading(
                                t('focus.career_record'),
                                t('focus.career_record_glyph')
                            )}
                            <div class="record">
                                <Table
                                    columns={record.columns}
                                    rows={record.rows}
                                    rowKey={record.rowKey}
                                >
                                    {#snippet cell(row: Record<string, unknown>, column: Column)}
                                        {#if column.numeric === true}
                                            <span class="count">{cellText(row[column.key])}</span>
                                        {:else}
                                            <b class="role">{cellText(row[column.key])}</b>
                                        {/if}
                                    {/snippet}
                                </Table>
                            </div>
                        </div>
                    {/if}
                </div>
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

    /* The sections side by side: each column at least 240px at the text scale wide, or the whole
       width where the pane is narrower, as many in a row as the width holds, and the row's width
       shared out among them. A section with nothing to draw is no column, so the ones drawn fill
       the width, and the columns wrap under one another only where the width cannot hold them side
       by side. The track record's table needs about two columns to hold its words whole, so where
       the band has two columns or more it spans two, wrapping under the others when the row cannot
       hold it beside them. */
    .sections {
        container: career / inline-size;
        display: grid;
        grid-template-columns: repeat(
            auto-fit,
            minmax(min(calc(240px * var(--text-scale, 1)), 100%), 1fr)
        );
        align-items: start;
        gap: 4px 16px;
    }

    /* One section, as the command center's group stands under its heading. */
    .sec {
        min-width: 0;
        margin-top: 4px;
    }

    @container career (width >= 32rem) {
        .wide {
            grid-column: span 2;
        }
    }

    /* The section's heading in the command center's look (CommandCenterView.svelte `.lbl`). */
    .lbl {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 2px;
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

    /* A fact and a task of the order of work are rows of the board, drawn at the ticker row's size
       and line (ui/display/ticker/Ticker.svelte), with every word in them. */
    .facts span {
        font-size: var(--fs-xs);
        line-height: calc(14px * var(--text-scale, 1));
        overflow-wrap: anywhere;
    }

    /* The goal and the Next line are one plain line each, wrapping in their column. */
    .goal,
    .next {
        margin: 0;
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }

    /* The track record's table keeps to its column: a heading's and a cell's words wrap between
       words and never inside one, and a table still wider than the column scrolls sideways inside
       it. Its cells are drawn at the board's row size, the role's words in the labels' look of the
       facts, and its headings in the section look on the banner's own ground rather than the
       table's header strip. */
    .record {
        min-width: 0;
        overflow-x: auto;
    }

    .record :global(th) {
        background: transparent;
        color: var(--accent-txt, var(--accent));
        white-space: normal;
    }

    .record .count {
        font-size: var(--fs-xs);
    }

    .record .role {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .order {
        margin: 0;
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
