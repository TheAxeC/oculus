<script lang="ts">
    // Layer 3, view partial. The editor of a list, a multi, a word block or a family of a config
    // file, drawn in the item of its row: the entries as the draft's form draws them
    // (Cards.svelte), each field with the control its catalog spec gives it (a word block's lists
    // as the multi-picks of FieldControl.svelte), the problems of the draft named under them, the
    // line saying the row holds an unsaved change, and Discard while a draft or a change is held.
    //
    // The draft is the tab's instance state under the row's slot (state/system/config/editors/
    // slots.ts), its file and key and the hub or folder of its scope when that is not the primary,
    // so it is there again after a tab switch or a reload, and a draft made in the scope of one hub
    // is drawn only in that scope. An edit that leaves the draft equal to the file's puts the
    // file's own back, which holds nothing. Each edit whose draft reads back is held as an unsaved
    // change of the scope on screen through the editors' write (state/system/config/editors/
    // writer.ts), which the scope's Save writes; the save key on the tab (Cmd+S, Ctrl+S off macOS)
    // is the scope's. With no draft the editor draws the change held, if any, else the file's
    // value. A draft started over a value the file no longer holds is named, holds nothing more and
    // can only be discarded, since its change would write over the other one. A list or family with
    // no entry says so above its Add, so an empty family reads as one and not as a list that failed
    // to draw.
    //
    // The entries are drawn under a disclosure line (Fold.svelte) with the row's title and their
    // number, folded at first past five entries; the problems, the refusal and Save and Discard
    // stay drawn under a folded line. An edit keeps the line and the line of every nested list on
    // its path unfolded, so an entry added past the fifth does not fold the editor being typed in;
    // an edit under a query keeps the fold kept for an empty search as it was.
    //
    // While a query with plain words stands the entries it is found in are drawn, at most
    // SEARCH_DRAWN of the row (state/system/config/view/matches.ts), read from the draft, so what a
    // part finds is what it draws, and a line under the list says how many more match. An entry
    // edited in a list so filtered stays drawn while the query stands, even when it stops matching;
    // that set is this editor's own state and goes when the query's words change.
    //
    // A row draws its picks only while the search keeps it (`kept`) and it stands at what the list
    // shows or just past it (`near`), since one letter is found in hundreds of entries across the
    // rows. A row out of that reach walks nothing and keeps what it last drew, so a keystroke opens
    // no line and mounts no card in it, and it draws when a scroll brings it near. An empty query
    // ends a row's picks wherever it stands.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        applyEdit,
        draftOf,
        draftValue,
        isEdited,
        movedFrom,
        specsOf,
        type Draft,
        type Edit
    } from '$lib/state/system/config/editors/draft';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import {
        savedBase,
        savedDraft,
        slotOf,
        withSavedDraft
    } from '$lib/state/system/config/editors/slots';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import { message } from '$lib/state/system/config/messages';
    import type { ConfigRow } from '$lib/state/system/config/rows';
    import { queryWords, settingsQuery } from '$lib/state/system/config/typed';
    import { keptOpen, stepsKey } from '$lib/state/system/config/view/fold';
    import {
        editedAfter,
        searchDrawn,
        type Drawn,
        type Entry
    } from '$lib/state/system/config/view/matches';
    import { useState } from '$lib/state/client/use';
    import { said } from '../settings/said';
    import Cards from './Cards.svelte';
    import Fold from './Fold.svelte';

    const {
        ui: { instanceState, setInstanceState }
    } = useState();

    type Props = {
        row: ConfigRow;
        id: string;
        editors: EditorWriter;
        lists: Lists;
        /** Whether the search keeps the row. */
        kept: boolean;
    };

    let { row, id, editors, lists, kept }: Props = $props();

    /** The draft the tab holds, if it holds one. */
    const held = $derived(savedDraft(instanceState(id), row));

    /** The row with the value of the change it holds in place of the file's, while one is held. */
    const current = $derived.by<ConfigRow>(() => {
        const sent = editors.shown(row);
        return sent === undefined ? row : { ...row, value: sent };
    });

    /** The draft drawn: the tab's, or the file's value read into one. */
    const draft = $derived<Draft | null>(held ?? draftOf(current));

    const problems = $derived.by(() => {
        if (draft === null) return [];
        const made = draftValue(draft, row, lists);
        return made.ok ? [] : made.problems;
    });

    /** Whether the file now holds another value than the one the draft was started over. */
    const stale = $derived(
        held !== undefined && movedFrom(savedBase(instanceState(id), slotOf(row)), row)
    );

    const refusal = $derived(editors.said(row));
    const unsaved = $derived(editors.unsaved(row));

    /** Whether the draft holds no entry. */
    const empty = $derived(draft !== null && draft.cards.length === 0);

    /** The specs the draft's fields are drawn by. */
    const specs = $derived(draft === null ? {} : specsOf(row, draft.form));

    const query = $derived(settingsQuery(instanceState(id)));
    const words = $derived(queryWords(query));

    /** The entries edited in a list the query of these words filters. */
    let edited = $state.raw<{ words: string; entries: Entry[] }>({ words: '', entries: [] });

    // The set goes with the query it was made under.
    $effect.pre(() => {
        if (edited.words !== words) edited = { words, entries: [] };
    });

    /** The editor's box, whose distance from the list's view `near` follows. */
    let box: HTMLElement | undefined = $state();

    /** Whether the box stands at what the list shows or just past it; a hidden box does not. */
    let near = $state(false);

    $effect(() => {
        const watched = box;
        if (watched === undefined) return;
        if (typeof IntersectionObserver === 'undefined') {
            near = true;
            return;
        }
        const seen = new IntersectionObserver(
            (entries) => {
                near = entries.at(-1)?.isIntersecting ?? near;
            },
            { root: watched.closest('.list'), rootMargin: '25% 0px' }
        );
        seen.observe(watched);
        return () => seen.disconnect();
    });

    /** What this row last drew of the search, which a row out of reach keeps. */
    let last: Drawn | null = null;

    /** What the search draws of the draft, or null while it filters nothing. */
    const search = $derived.by(() => {
        if (words !== '' && !(kept && near)) return last;
        last = draft === null ? null : searchDrawn(draft.cards, query, edited.entries);
        return last;
    });

    /**
     * Put an edited draft in the tab's state, one equal to the file's being no draft, and hold its
     * value as the row's change while it reads back and the file has not moved under it.
     */
    function edit(next: Edit): void {
        if (draft === null) return;
        editors.clear(row);
        const changed = applyEdit(draft, next);
        if (search?.lists.has(stepsKey(next.path ?? [])) === true) {
            edited = { words, entries: editedAfter(edited.entries, next, draft.cards) };
        }
        const state = keptOpen(instanceState(id), row.id, next.path);
        if (!isEdited(changed, row, lists)) {
            setInstanceState(id, withSavedDraft(state, slotOf(row), null));
            editors.save(row, changed);
            return;
        }
        const base = held === undefined ? row.value : savedBase(state, slotOf(row));
        setInstanceState(id, withSavedDraft(state, slotOf(row), changed, base));
        if (!stale) editors.save(row, changed);
    }

    /** How many Discards this editor has had, which a control's Add person compares. */
    let discards = $state(0);

    function discard(): void {
        discards += 1;
        edited = { words, entries: [] };
        editors.discard(row);
    }
</script>

{#if draft !== null}
    <div class="editor" data-editor={draft.form} bind:this={box}>
        <Fold
            {id}
            row={row.id}
            part="entries"
            title={row.title}
            count={draft.cards.length}
            searched={search !== null}
        >
            {#if empty}
                <p class="empty" data-editor-empty>{t('settings.editor_empty')}</p>
            {/if}
            <Cards
                cards={draft.cards}
                fields={draft.fields}
                {specs}
                form={draft.form}
                {lists}
                instance={id}
                base={`${row.file}:${row.key}`}
                row={row.id}
                {search}
                title={row.title}
                slots={row.entry.slots}
                removeOnly={row.control === 'parked'}
                ordered={row.ordered}
                single={draft.one === true}
                sparse={row.entry.sparse === true}
                {discards}
                onedit={edit}
            />
            {#if search !== null && search.more > 0}
                <p class="more" data-search-more>
                    {search.more === 1
                        ? t('settings.fold_more_one')
                        : t('settings.fold_more', search.more)}
                </p>
            {/if}
        </Fold>
        {#if problems.length > 0}
            <ul class="problems">
                {#each problems as problem, at (at)}
                    <li role="status">
                        {problem.where === undefined ? '' : `${said(problem.where)} `}{said(
                            problem.said
                        )}
                    </li>
                {/each}
            </ul>
        {/if}
        {#if stale}
            <p class="problem" role="status">{said(message('changedSince', row.file))}</p>
        {/if}
        {#if refusal !== null}
            <p class="problem" role="status">{said(refusal)}</p>
        {:else if unsaved}
            <p class="done" role="status">{t('settings.editor_unsaved')}</p>
        {/if}
        {#if held !== undefined || unsaved}
            <div class="actions">
                <ToolButton
                    label={t('settings.editor_discard')}
                    glyph="dismiss"
                    onclick={discard}
                />
            </div>
        {/if}
    </div>
{/if}

<style>
    .editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .problems {
        margin: 0;
        padding-left: 18px;
    }

    .problems,
    .problem {
        color: var(--c-red-txt);
        font-size: var(--fs-md);
    }

    .problem,
    .empty,
    .more,
    .done {
        margin: 0;
    }

    .empty,
    .more,
    .done {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .actions {
        display: flex;
        gap: 6px;
    }
</style>
