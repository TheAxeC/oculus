<script module lang="ts">
    // Layer 3, view registration. The slide catalog is opened from the deck's toolbar, never from
    // the view catalogue: it is about one deck and says nothing on its own.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'slides',
        label: 'views.slides',
        glyph: 'views.slides_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One deck's order and groups. The order is the deck's `order:` as one list of
    // entries, each dragged or stepped to another place. For each group, the decks it holds in the
    // order it shows them and the decks it found and does not hold, each with a tick saying whether
    // the group holds it and the controls that move it: a deck is dragged within its group or onto
    // another group, where it leaves the group it came from. Save writes every list the reader
    // changed into the deck's `present.yml` as one edit, and the deck is live at the next push.
    //
    // The groups are the deck route's, so a deck added on disk is in this list at the next push.
    // What is the pane's own is the reader's unsaved work: the list they have dragged a group into
    // and the line the status region shows, all in the instance state, so the pane is where it was
    // when its page comes back. The work is held against the lists it was made over, so a push that
    // changes a group's `slides:` draws the file again and says that the unsaved work was dropped,
    // rather than saving a list over a deck that has moved underneath it. The pane's own save is
    // not such a push: a saved group's work is cleared with the write, so the file answers.
    //
    // A name the group's `slides:` holds that matches no deck is drawn as missing and a deck two
    // discovering groups both find is drawn as a conflict; neither is skipped in silence. A deck
    // whose `present.yml` cannot be read is not written to: the file is shown as unreadable.
    //
    // The order and each group is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), a group headed by its name and the number of its decks.
    // Each folds by its control, a group by its name after `group:` and the order by `order`, under
    // `folded` of the pane's state, read from the parsed state and written with the rest of it
    // through the folds of state/shared/page/folds.ts (`stateFolds`); every write of the state
    // keeps it. A folded group stays a drop target, so a deck dropped on its heading joins it.
    //
    // It is a tab and not a dialog: oculus has no modal for content, and Escape does nothing here.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Order from './Order.svelte';
    import Steps from './Steps.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        changedGroups,
        groupRows,
        listOf,
        listsSignature,
        orderChanged,
        orderRows,
        orderTokens,
        parseSlidesState,
        saveMessage,
        withCross,
        withMove,
        withTick,
        type GroupRow,
        type RowKind,
        type SlideWork
    } from '$lib/state/life/slides';
    import { deckFile, deckLabel, deckRefOf } from '$lib/state/life/present';
    import { stateFolds } from '$lib/state/shared/page/folds';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const {
        present: { deck: deckOf, shown: shownDeck },
        ui: { instanceState, setInstanceState },
        writes: { writeDeckSlides }
    } = useState();

    let { instance }: ViewProps = $props();

    const held = $derived(parseSlidesState(instanceState(instance.id)));
    const ref = $derived(shownDeck(deckRefOf(instance.state)));
    const answer = $derived(ref === null ? null : deckOf(ref));
    const deck = $derived(answer?.deck ?? null);
    const groups = $derived(deck?.groups ?? []);
    const entries = $derived(deck?.order ?? []);

    /** The lists the reader's unsaved work was made over; a different set drops it. */
    const signature = $derived(listsSignature(groups, entries));

    /** Whether the work the pane is holding was made over the lists now on screen. */
    const current = $derived(held.at !== '' && held.at === signature);

    /** Whether a push dropped work the reader had not saved, which the status region says. */
    const dropped = $derived(held.at !== '' && held.at !== signature);

    /** What is on screen: the reader's work over these groups, or what the file says. */
    const work = $derived<SlideWork>(current ? held.work : {});
    const changes = $derived(changedGroups(groups, work));

    /** The order's tokens as the reader arranged them, and whether that differs from the file. */
    const arranged = $derived(current ? held.order : []);
    const tokens = $derived(orderTokens(entries, arranged));
    const reordered = $derived(orderChanged(entries, arranged));

    /** What the status region shows: the last line, or the note that a push dropped the work. */
    const said = $derived(dropped ? t('slides.dropped') : held.said);

    /** What stops a save: a file that cannot be read says so instead of being written over. */
    const blocked = $derived(deck?.state === 'unreadable');

    /** True while a save is in flight, so a second press sends no second write. */
    let busy = $state(false);

    function keep(next: SlideWork, words: string, order: string[] = arranged): void {
        setInstanceState(instance.id, { ...held, work: next, order, at: signature, said: words });
    }

    /**
     * The key the order folds by, and the key a group folds by: its name after `group:`, so a group
     * whose name is `order` folds apart from the order.
     */
    const ORDER_FOLD = 'order';
    function groupFold(name: string): string {
        return `group:${name}`;
    }

    /** The presses that fold and unfold the order or a group, by its key. */
    const folds = stateFolds(
        () => held.folded,
        (folded) => setInstanceState(instance.id, { ...held, folded })
    );

    /** Put one deck on the group or take it off, which is what a row's box says. */
    function pick(group: string, list: string[], name: string, on: boolean): void {
        keep({ ...work, [group]: withTick(list, name, on) }, '');
    }

    /** Move one deck to another place in its group, and say where it landed. */
    function move(group: string, list: string[], name: string, to: number): void {
        const next = withMove(list, name, to);
        if (next === null) return;
        keep(
            { ...work, [group]: next },
            t('slides.moved', name, String(to + 1), String(next.length))
        );
    }

    /** Move one entry of the order to another place, and say where it landed. */
    function moveEntry(token: string, to: number): void {
        const next = withMove(tokens, token, to);
        const entry = entries.find((one) => one.token === token);
        if (next === null || entry === undefined) return;
        keep(work, t('slides.entry_moved', entry.title, String(to + 1), String(next.length)), next);
    }

    /** The row the reader is dragging, by its group and name, and the row that armed its grip. */
    let dragged = $state({ group: '', name: '' });
    let armed = $state('');

    /**
     * Drop the dragged deck on a row of a group, or on the group itself when `onto` is empty. In
     * its own group the deck takes the place of the row; on another group it leaves its own list,
     * joins this one at that place or at the end, and the save names both lists.
     */
    function drop(group: string, list: string[], onto: string): void {
        const from = dragged;
        dragged = { group: '', name: '' };
        armed = '';
        if (from.name === '') return;
        if (from.group === group) {
            if (from.name !== onto && list.includes(onto)) {
                move(group, list, from.name, list.indexOf(onto));
            }
            return;
        }
        const lists: SlideWork = Object.fromEntries(
            groups.map((one) => [one.name, listOf(one, work)])
        );
        const at = list.includes(onto) ? list.indexOf(onto) : list.length;
        const next = withCross(lists, from.group, group, from.name, at);
        if (next === null) {
            keep(work, t('slides.already_in', from.name, group));
            return;
        }
        keep({ ...work, ...next }, t('slides.moved_across', from.name, group, String(at + 1)));
    }

    /** What a kind of row is called beside its title. */
    function kindWords(kind: RowKind, row: GroupRow): string {
        switch (kind) {
            case 'found':
                return t('slides.kind_found');
            case 'candidate':
                return t('slides.kind_candidate');
            case 'missing':
                return t('slides.kind_missing');
            case 'conflict':
                return t('slides.kind_conflict', row.others.join(', '));
            default:
                return '';
        }
    }

    /**
     * Write every list the reader changed as one edit, the order included. A refusal is told in the
     * server's own sentence and writes nothing: the work stays as the reader left it.
     */
    async function save(): Promise<void> {
        if (busy || ref === null || (changes.length === 0 && !reordered)) return;
        busy = true;
        keep(work, t('slides.saving'));
        const lists = changes.map(({ group, slides }) => ({
            group: group.name,
            base: group.slides,
            slides
        }));
        const order = reordered
            ? { base: entries.map((one) => one.token), entries: tokens }
            : undefined;
        const reply = await writeDeckSlides({ root: ref.root, path: deckFile(ref) }, lists, order);
        busy = false;
        const written = reply.ok && reply.refused.length === 0;
        setInstanceState(instance.id, {
            ...held,
            work: written ? {} : work,
            order: written ? [] : arranged,
            at: written ? '' : signature,
            said: saveMessage(reply)
        });
    }
</script>

{#snippet bar()}
    <Toolbar label={t('slides.toolbar')}>
        <ToolButton
            label={t('slides.save')}
            onclick={() => void save()}
            disabled={busy || blocked || (changes.length === 0 && !reordered)}
        />
        <span class="said" role="status">{said}</span>
    </Toolbar>
{/snippet}

<Pane
    title={deck === null ? t('slides.title') : t('slides.title_of', deckLabel(deck))}
    {bar}
    tinted
>
    <div class="slides" data-instance={instance.id} data-slides>
        {#if ref === null}
            <Empty message={t('slides.empty_unnamed')} glyph={t('slides.empty_glyph')} />
        {:else if deck === null}
            <Empty
                message={answer?.loading === true
                    ? t('slides.loading')
                    : t('slides.failed_read', answer?.error ?? '')}
                error={answer?.loading !== true}
                glyph={t('slides.empty_glyph')}
            />
        {:else if blocked}
            <Empty
                message={t('slides.unreadable', deck.path)}
                error
                glyph={t('slides.empty_glyph')}
            />
        {:else if groups.length === 0 && entries.length === 0}
            <Empty message={t('slides.empty', deck.path)} glyph={t('slides.empty_glyph')} />
        {:else}
            {#if entries.length > 0}
                <Order
                    rows={orderRows(entries, tokens)}
                    {busy}
                    onmove={moveEntry}
                    open={!held.folded.includes(ORDER_FOLD)}
                    ontoggle={() => folds.toggle(ORDER_FOLD)}
                />
            {/if}
            {#each groups as group (group.name)}
                {@const list = listOf(group, work)}
                {@const rows = groupRows(group, list)}
                <GroupHead
                    data-group={group.name}
                    aria-label={group.name}
                    label={group.name}
                    count={group.count}
                    open={!held.folded.includes(groupFold(group.name))}
                    ontoggle={() => folds.toggle(groupFold(group.name))}
                    ondragover={(event: DragEvent) => event.preventDefault()}
                    ondrop={(event: DragEvent) => {
                        event.preventDefault();
                        drop(group.name, list, '');
                    }}
                >
                    <div class="rows" role="list" inert={busy}>
                        {#each rows as row (row.name)}
                            {@const at = list.indexOf(row.name)}
                            {@const words = kindWords(row.kind, row)}
                            <div
                                class="row"
                                class:dragging={dragged.group === group.name &&
                                    dragged.name === row.name}
                                class:off={!row.ticked}
                                data-slide-row={row.name}
                                data-row-kind={row.kind}
                                draggable={armed === `${group.name}/${row.name}`}
                                ondragstart={() =>
                                    (dragged = { group: group.name, name: row.name })}
                                ondragover={(event: DragEvent) => event.preventDefault()}
                                ondrop={(event: DragEvent) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    drop(group.name, list, row.name);
                                }}
                                ondragend={() => {
                                    dragged = { group: '', name: '' };
                                    armed = '';
                                }}
                                role="listitem"
                            >
                                {#if at >= 0}
                                    <span
                                        class="grip"
                                        title={t('slides.drag_tip', row.title)}
                                        onmousedown={() => (armed = `${group.name}/${row.name}`)}
                                        role="presentation"
                                    >
                                        <Glyph name={t('slides.drag_glyph')} />
                                    </span>
                                    <span class="at">{t('slides.position', String(at + 1))}</span>
                                {:else}
                                    <span class="grip"></span>
                                    <span class="at"></span>
                                {/if}
                                <span class="pick">
                                    <Checkbox
                                        checked={row.ticked}
                                        label={row.title}
                                        onchange={(on: boolean) => {
                                            if (row.kind !== 'found')
                                                pick(group.name, list, row.name, on);
                                        }}
                                    />
                                </span>
                                {#if words !== ''}
                                    <Tag label={words} />
                                {/if}
                                {#if at >= 0}
                                    <Steps
                                        {at}
                                        count={list.length}
                                        title={row.title}
                                        onstep={(to: number) =>
                                            move(group.name, list, row.name, to)}
                                    />
                                {/if}
                            </div>
                        {/each}
                    </div>
                </GroupHead>
            {/each}
        {/if}
    </div>
</Pane>

<style>
    .slides {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
        max-width: 100%;
    }

    /* A row is one line of the tree's height, and fits the pane it is in: the title gives way
       before any control does. */
    .rows {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 6px;
        box-sizing: border-box;
        min-width: 0;
        max-width: 100%;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        border-radius: var(--radius-sm);
        padding: 0 6px;
    }

    .row.off {
        color: var(--muted-txt, var(--muted));
    }

    .row:hover {
        background: var(--chip);
    }

    .row.dragging {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    .grip {
        flex: none;
        color: var(--muted-txt, var(--muted));
        cursor: grab;
    }

    .at {
        flex: none;
        min-width: 2ch;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
        text-align: right;
    }

    .pick {
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* The status words close the bar. */
    .said {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    /* The terminal shape: the catalog follows the card's folder name, as every list does. */
    :global(body.rice:where(:not(.rice-sans))) .slides {
        font-family: var(--font-mono);
    }
</style>
