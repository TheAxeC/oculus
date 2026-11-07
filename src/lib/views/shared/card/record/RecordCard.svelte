<script lang="ts">
    // Layer 3, shared view. The one card every record of the portfolio is drawn by: a project, an
    // entry of a collection, a venue, a dataset, a domain, a pillar line, a lead, a Lit Watch
    // paper, a LinkedIn post, an inbox thread, a Literature search hit, a card of the career page,
    // and the Archival, Orphans and No funding cards. Each kind's card file hands it its words, its
    // actions and its slots; the head, the menu, the order of the body and the add forms are this
    // card's.
    //
    // The head is the title (the page opener where the kind hands `ontitle`, words where it hands
    // none), then the meta row: the mark of the record's hub (RootChip.svelte), the kind's chips
    // and tags (`meta`), then one element CardActions.svelte draws under the pointer, as
    // `--card-at-rest` says (ui/frame/Card.svelte): the strip of at most three icons the kind names
    // (`strip`) and, last in it, the "..." opener of the menu this card hands in. The element stays
    // beside the chips when every icon and the opener fit there, and otherwise lies over the card's
    // top right corner, as it does on a row that holds nothing else, so drawing it moves nothing.
    // The opener, a right-click anywhere on the card, and the context menu key and Shift+F10 on a
    // control of the card open the same menu, which lists every action in runs (record-menu.ts). A
    // card with no action has no opener and no right-click menu of its own, so a right-click on it
    // opens what a right-click there opens around it.
    //
    // The body draws, each only when the kind fills it: the facts row (`facts`), the labelled lines
    // (`lines`), the text (`text`), the kind's own blocks (`blocks`), the dated lines (Subtasks,
    // then Follow-ups, then the deadline form), and the foot: the strip of the projects the record
    // lists (views/shared/links/CrossLinks.svelte), from `projects` grouped by the rows of
    // `categories:` (state/boards/structure/cross-links.ts `groupProjects`) or from the `groups` a
    // kind makes itself, or in its place one labelled strip per row of `rows` (a person's card,
    // one per role), then the kind's own `foot`. Drawn on the record's own page (`page`), the card
    // draws neither strip, since the row under the page's card counts those projects, and draws
    // the page's body: a kind that hands the fields of the page's two columns (`left`, `right`)
    // has them drawn in RecordDetails.svelte, the dated lines after the right one, in place of its
    // lines, its text and its blocks, and a kind whose page holds more hands `details`, given the
    // dated lines, in place of its blocks. A kind that hands `deleting` has the question before a
    // delete (views/shared/forms/entry/DeleteAsk.svelte) asked under the card for that entry.
    //
    // The Add run of the menu is this card's, from `dated`: Follow-up and Subtask where a line can
    // hang under the record (`target`), or where the line goes to a record picked on the card
    // (`pick`, the inbox thread's, views/shared/forms/dated/RecordPick.svelte), and Deadline where
    // the record has a deadline to write. Each opens its form on the card, and one form is open at
    // a time: a second pick closes the first. On a card handed `blocked` words every row of the run
    // is disabled with them as its title, and so is Save of every form. The deadline form writes
    // through `dated.deadline.write`, an emptied box clearing the field, and its answer is said on
    // the card's outcome line (`onsaid`); the form closes on an answer the server took.
    //
    // The card fills the box it is laid out in and draws past its own edge, so the cards of one row
    // of a grid are one height and a menu of its controls is not cut off at the foot of a short
    // card.

    import type { Snippet } from 'svelte';
    import Card from '$lib/ui/frame/Card.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import CardActions from './CardActions.svelte';
    import RecordDetails from './RecordDetails.svelte';
    import RootChip from '../RootChip.svelte';
    import DatedForm from '../../forms/dated/DatedForm.svelte';
    import Followups from '../../forms/dated/Followups.svelte';
    import Subtasks from '../../forms/dated/Subtasks.svelte';
    import RecordPick from '../../forms/dated/RecordPick.svelte';
    import DeleteAsk from '../../forms/entry/DeleteAsk.svelte';
    import CrossLinks from '../../links/CrossLinks.svelte';
    import { answerWords } from '../../forms/answer-words';
    import {
        menuRuns,
        pickAction,
        stripActions,
        type DatedKind,
        type RecordAction,
        type RecordDated
    } from './record-menu';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';
    import type { Project } from '$lib/state/boards/collection';
    import {
        groupProjects,
        type CrossGroup,
        type StripRow
    } from '$lib/state/boards/structure/cross-links';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const {
        entities: { reads },
        selectors: { configMap }
    } = useState();

    type Props = {
        /** The stable item id used by keyboard navigation. */
        id: string;
        cursor: boolean;
        /** The card's own words, already translated by the view. */
        title: string;
        titleHtml?: string;
        /** The title drawn by the kind, for a title that is more than its words. */
        heading?: Snippet;
        tone?: string;
        pinned?: boolean;
        ring?: string;
        /** Open the record's page from its title; none draws the title as words. */
        ontitle?: () => void;
        /** The record whose hub the meta row names. */
        record?: { root?: string };
        /** The hover words of the whole card, where its title is cut from a longer one. */
        tip?: string;
        /** The menu's accessible name. */
        label?: string;
        /** Every action of the card, in no order: record-menu.ts orders the strip and the menu. */
        actions?: RecordAction[];
        /** The ids of the actions the strip draws, in its order. */
        strip?: string[];
        dated?: RecordDated;
        /** Say the outcome of a write on the line the view holds. */
        onsaid?: (said: string) => void;
        meta?: Snippet;
        facts?: Snippet;
        lines?: Snippet;
        text?: Snippet;
        blocks?: Snippet;
        /**
         * Drawn on the record's own page, where the row under the card counts its projects: the
         * foot draws no strip of projects and no labelled strip, and the page's body is drawn.
         */
        page?: boolean;
        /** The fields of the left column of the record's page, drawn on it alone. */
        left?: Snippet;
        /** The fields of the right column of the record's page, drawn on it alone. */
        right?: Snippet;
        /**
         * Draw the kind's own body of the record's page, given the dated lines, for a kind whose
         * page holds more than the two columns; drawn on the page alone.
         */
        details?: Snippet<[Snippet]>;
        /** The projects the record lists, drawn as the strip at the foot, grouped by category. */
        projects?: Project[];
        /**
         * Whether the strip keeps a row carrying `archival` as a group of its own, as the row of
         * count buttons on the record's page does, so a pillar, a domain and a venue count their
         * dead-end projects on their card as on their page.
         */
        archival?: boolean;
        /** The strip's groups, for a kind that groups its projects itself. */
        groups?: CrossGroup[];
        /**
         * Labelled strips drawn in place of the one strip, each headed by its label; none drawn
         * for an empty list.
         */
        rows?: StripRow[];
        /** Keep one group of the strip open at a time. */
        oneOpen?: boolean;
        /** What the foot draws after the strip. */
        foot?: Snippet;
        /** The entry the question before a delete is open for, which the card asks under itself. */
        deleting?: { collection: string; id: string; onclose: () => void };
    };

    let {
        id,
        cursor,
        title,
        titleHtml,
        heading,
        tone,
        pinned = false,
        ring,
        ontitle,
        record,
        tip,
        label = t('project.menu.record_label'),
        actions = [],
        strip = [],
        dated,
        onsaid = () => undefined,
        meta: kindMeta,
        facts,
        lines,
        text,
        blocks,
        page = false,
        left,
        right,
        details,
        projects,
        archival = false,
        groups,
        rows,
        oneOpen = false,
        foot,
        deleting
    }: Props = $props();

    /**
     * The groups of the strip at the foot: none on the record's page, nor for a record that lists
     * no project, the rows of `categories:` read through the client's memo.
     */
    const linked = $derived.by(() => {
        if (page) return [];
        if (groups !== undefined) return groups;
        if (projects === undefined) return [];
        return groupProjects(projects, configMap(), vocabOf, archival, reads);
    });

    /** Whether the card draws its page's two columns in place of its lines, text and blocks. */
    const columns = $derived(page && (left !== undefined || right !== undefined));

    /** The add form open on the card, and nothing while none is. */
    let adding = $state<DatedKind | null>(null);

    const blocked = $derived(dated?.blocked ?? '');

    /** Open the form of `kind`, or close it when it is the one open. */
    function toggle(kind: DatedKind): void {
        adding = adding === kind ? null : kind;
    }

    /** The rows of the Add run: the lines where one can hang, the deadline where there is one. */
    const added = $derived.by((): RecordAction[] => {
        const rows: RecordAction[] = [];
        const titled = (own: string): string => (blocked === '' ? own : blocked);
        if (dated?.target !== undefined || dated?.pick !== undefined) {
            rows.push(
                {
                    id: 'followup',
                    label: t('project.menu.followup'),
                    title: titled(t('project.action.add_followup_tip')),
                    glyph: t('project.action.add_followup_glyph'),
                    active: adding === 'followup',
                    disabled: blocked !== '',
                    onclick: () => toggle('followup')
                },
                {
                    id: 'subtask',
                    label: t('project.menu.subtask'),
                    title: titled(t('project.action.add_subtask_tip')),
                    glyph: t('project.action.add_subtask_glyph'),
                    active: adding === 'subtask',
                    disabled: blocked !== '',
                    onclick: () => toggle('subtask')
                }
            );
        }
        if (dated?.deadline !== undefined) {
            rows.push({
                id: 'deadline',
                label: t('project.menu.deadline'),
                title: titled(t('project.action.deadline_tip')),
                glyph: t('project.card.deadline_glyph'),
                active: adding === 'deadline',
                disabled: blocked !== '',
                onclick: () => toggle('deadline')
            });
        }
        return rows;
    });

    const every = $derived([...actions, ...added]);
    const runs = $derived(menuRuns(every));

    /** Open or close one list's add form, from the list's own control. */
    function listAdding(kind: 'followup' | 'subtask', next: boolean): void {
        if (next) adding = kind;
        else if (adding === kind) adding = null;
    }

    /** The deadline form's answer: said, and the form closed when the server took it. */
    function deadlineAnswer(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
        if (answer.ok) adding = null;
    }
</script>

<!-- The dated lines, Subtasks then Follow-ups, then the deadline form. -->
{#snippet datedLines()}
    {#if dated?.pick !== undefined}
        {#if adding === 'followup' || adding === 'subtask'}
            <RecordPick
                kind={adding}
                text={dated.pick}
                projects={dated.projects ?? []}
                {onsaid}
                onclose={() => (adding = null)}
            />
        {/if}
    {:else if dated?.target !== undefined}
        <Subtasks
            target={dated.target}
            subtasks={dated.subtasks ?? []}
            {onsaid}
            adding={adding === 'subtask'}
            onadding={(next: boolean) => listAdding('subtask', next)}
            {blocked}
            formOnly={dated.subtasks === undefined}
        />
        <Followups
            target={dated.target}
            notes={dated.followups ?? []}
            {onsaid}
            adding={adding === 'followup'}
            onadding={(next: boolean) => listAdding('followup', next)}
            {blocked}
            formOnly={dated.followups === undefined}
        />
    {/if}
    {#if adding === 'deadline' && dated?.deadline !== undefined}
        {@const deadline = dated.deadline}
        <DatedForm
            kind="deadline"
            record={id}
            held={deadline.held}
            type={deadline.type}
            {blocked}
            save={(_text: string, date: string) => deadline.write(date === '' ? null : date)}
            onanswer={deadlineAnswer}
            oncancel={() => (adding = null)}
        />
    {/if}
{/snippet}

{#snippet face()}
    <div class="slot" title={tip}>
        <Card {id} {cursor} {title} {titleHtml} {heading} {tone} {pinned} {ring} {ontitle} fill>
            {#snippet meta()}
                <RootChip {record} />
                {@render kindMeta?.()}
                {#if every.length > 0}
                    <CardActions actions={stripActions(every, strip)}>
                        {#snippet opener()}
                            <Menu
                                {label}
                                glyph={t('project.card.menu_glyph')}
                                compact
                                placement="down"
                                align="right"
                                items={[]}
                                groups={runs}
                                onpick={(pick: string) => pickAction(every, pick)}
                            />
                        {/snippet}
                    </CardActions>
                {/if}
            {/snippet}

            {@render facts?.()}
            {#if columns}
                <RecordDetails {left} {right}>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render datedLines()}
                </RecordDetails>
            {:else}
                {@render lines?.()}
                {@render text?.()}
                {#if page && details !== undefined}
                    {@render details(datedLines)}
                {:else}
                    {@render blocks?.()}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render datedLines()}
                {/if}
            {/if}
            {#if rows !== undefined && !page}
                {#each rows as row (row.key)}
                    <CrossLinks groups={row.groups} label={row.label} {oneOpen} />
                {/each}
            {:else if linked.length > 0}
                <CrossLinks groups={linked} {oneOpen} />
            {/if}
            {@render foot?.()}
        </Card>
    </div>
{/snippet}

{#if every.length > 0}
    <ContextMenu {label} groups={runs} own onpick={(pick: string) => pickAction(every, pick)}>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render face()}
    </ContextMenu>
{:else}
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
    {@render face()}
{/if}

{#if deleting !== undefined}
    <DeleteAsk
        collection={deleting.collection}
        id={deleting.id}
        {onsaid}
        onclose={deleting.onclose}
    />
{/if}

<style>
    /* The slot fills the box it is laid out in, and the card fills the slot (ui/frame/Card.svelte,
       `fill`), so the cards of one row of a board are one height and no empty cell is left under a
       short one. */
    .slot {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-width: 0;
    }
</style>
