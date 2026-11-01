<script lang="ts">
    // Layer 3, view partial. The rail list in force (oculus's `rail:` with the open workspace
    // file's entries laid over it by page) as the Settings view edits it: one row per button with
    // its label, icon and page, the chord and heading glyph of its group in the view catalogue,
    // whose heading is the label, the tick that makes the group the one taking the collection views
    // whose entry names no group, the tick that makes it the one taking the project boards, and the
    // controls that move a row and take it away. A list that differs from the file's is held as an
    // unsaved change of the Workspace scope (settings/scopes/scopes.svelte.ts), and the scope's
    // Save writes it into the workspace file's `settings:` through the rail's own write
    // (server/edit/writes/config/lists/rail.ts). The watcher pushes the file back within a second,
    // and the rail redraws from that push, so the rail always shows the list in force.
    //
    // The rows are drawn under a disclosure line (editors/Fold.svelte) with the row's title and
    // their number, folded at first past five rows; the problems and the actions stay drawn under a
    // folded line. An edit keeps the line unfolded, and one under a query keeps the fold kept for
    // an empty search as it was. A query found in the rows drawn, the list being typed if one is,
    // opens the line of a row the search keeps. A search does not filter the rows.
    //
    // A sentence under the heading says what a row is, and each field has its word before it on the
    // same line. The word is decoration beside a field whose accessible name already holds it, so
    // it is hidden from a screen reader, and it wraps with its field at a narrow width. The icon
    // field is ui/forms/choice/GlyphSelect.svelte, whose trigger draws the row's icon beside its
    // name, so the row draws the icon nowhere else.
    //
    // What is being typed is the tab's own state, so it is there again after the tab is switched
    // away from and after a reload, when it is held as the scope's change again; once the file
    // holds it the list being typed is dropped. A row the shared rule refuses is named under the
    // list, and the scope's Save is refused for it with the rail named. A row whose glyph the
    // vocabulary does not hold (a new row has none yet) draws its icon field with no icon, and the
    // rule's line names what the row lacks. Revert drops the list being typed and its change.
    //
    // Until the configuration is read, the file's list is not known: no row is drawn from it, the
    // sentence that the rail has no button waits for the read, and nothing is held.
    //
    // The partial has no heading: it is drawn inside the `rail` row of the Settings view
    // (settings/Item.svelte), whose title is the heading. The rail's Settings choice opens that row
    // (Settings.svelte).

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import GlyphSelect from '$lib/ui/forms/choice/GlyphSelect.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { untrack } from 'svelte';
    import {
        arrangementKeys,
        glyphNames,
        configRail,
        moveRailEntry,
        railDraft,
        readRail,
        sameRail,
        withRailDraft,
        type RailEntry,
        type RailProblem
    } from '$lib/state/workbench/navigation/rail';
    import { t } from '$lib/state/shared/words/text';
    import { RAIL_ROW } from '$lib/state/system/config/groups';
    import type { ConfigRow } from '$lib/state/system/config/rows';
    import { settingsQuery } from '$lib/state/system/config/typed';
    import { entryTexts, foundInside, keptOpen } from '$lib/state/system/config/view/fold';
    import { useState } from '$lib/state/client/use';
    import Fold from './editors/Fold.svelte';
    import { scopesHere } from './settings/scopes/context';

    const {
        entities: { config },
        ui: { instanceState, setInstanceState }
    } = useState();

    const scopes = scopesHere();

    type Props = {
        /** The Settings tab's instance id. */
        id: string;
        /** The rail row, whose change the list being typed is held as. */
        row: ConfigRow;
        /** Whether the search keeps the row. */
        kept: boolean;
    };

    let { id, row, kept }: Props = $props();

    const title = $derived(row.title);

    const merged = $derived(config()?.config);
    /** Whether the configuration has been read, before which the file's list is not known. */
    const read = $derived(merged !== undefined);
    const saved = $derived(configRail(merged));
    const draft = $derived(railDraft(instanceState(id)));
    const rows = $derived(draft ?? saved);
    const pages = $derived(arrangementKeys(merged?.arrangements));
    const glyphs = $derived(glyphNames(merged) ?? []);
    const problems = $derived(readRail(rows, pages, glyphs).problems);

    /** Whether a plain word of the query is found in the rows drawn, on a row the search keeps. */
    const searched = $derived(
        kept && foundInside(settingsQuery(instanceState(id)), entryTexts(rows))
    );

    /** Hold the list as the scope's change, or drop the change for the list in force. */
    function hold(next: RailEntry[] | null): void {
        if (scopes === null) return;
        if (next === null || sameRail(next, saved)) {
            if (scopes.stage.held(row) !== undefined) scopes.stage.drop(row);
        } else {
            scopes.stage.set(row, next);
        }
    }

    /**
     * Put the list being typed in the tab's state, hold it as the scope's change, and keep the line
     * unfolded. A list equal to the one in force is no draft.
     */
    function edit(next: RailEntry[]): void {
        const held = keptOpen(instanceState(id), RAIL_ROW);
        const same = sameRail(next, saved);
        setInstanceState(id, withRailDraft(held, same ? null : next));
        hold(same ? null : next);
    }

    // A list kept in the tab's state from before a reload is held as the change again; one the
    // file now holds, with no change left, is dropped.
    $effect(() => {
        if (!read || draft === null) return;
        const typed = draft;
        untrack(() => {
            const staged = scopes?.stage.held(row);
            if (sameRail(typed, saved)) {
                if (staged === undefined)
                    setInstanceState(id, withRailDraft(instanceState(id), null));
            } else if (staged === undefined) {
                hold(typed);
            }
        });
    });

    /** One field of one row changed. */
    function change(at: number, field: keyof RailEntry, value: string | boolean): void {
        edit(rows.map((row, index) => (index === at ? { ...row, [field]: value } : row)));
    }

    /** The sentence for one refused row, numbered from one as the reader counts. */
    function why(problem: RailProblem): string {
        const place = problem.index + 1;
        if (problem.why === 'shape') return t('workbench.rail_why_shape', place);
        if (problem.why === 'label') return t('workbench.rail_why_label', place);
        if (problem.why === 'glyph') return t('workbench.rail_why_glyph', place);
        if (problem.why === 'glyph_unknown') return t('workbench.rail_why_glyph_unknown', place);
        if (problem.why === 'page') return t('workbench.rail_why_page', place);
        if (problem.why === 'page_unknown') return t('workbench.rail_why_page_unknown', place);
        if (problem.why === 'chord') return t('workbench.rail_why_chord', place);
        if (problem.why === 'group_glyph_unknown') {
            return t('workbench.rail_why_group_glyph_unknown', place);
        }
        if (problem.why === 'unplaced') return t('workbench.rail_why_unplaced', place);
        if (problem.why === 'boards') return t('workbench.rail_why_boards', place);
        return t('workbench.rail_why_repeated', place);
    }

    /** The letters a group's chord may be, one lowercase letter each. */
    const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

    /** Forget the list being typed and its change; the file's list is shown again. */
    function revert(): void {
        setInstanceState(id, withRailDraft(instanceState(id), null));
        hold(null);
    }
</script>

<div class="rail" data-settings="rail">
    <p class="about">{t('workbench.rail_about')}</p>
    <Fold {id} row={RAIL_ROW} part="entries" {title} count={rows.length} {searched}>
        {#if read && rows.length === 0}
            <p class="empty">{t('workbench.rail_empty')}</p>
        {/if}
        <!-- Keyed by position: a row being typed may carry the same page as another until it is
         mended, and the rule names that row rather than the markup refusing it. -->
        {#each rows as row, at (at)}
            <div class="row" data-rail-row={at}>
                <span class="field">
                    <span class="word" aria-hidden="true">{t('workbench.rail_word_label')}</span>
                    <TextInput
                        value={row.label}
                        label={t('workbench.rail_label', at + 1)}
                        oninput={(value: string) => change(at, 'label', value)}
                    />
                </span>
                <span class="field">
                    <span class="word" aria-hidden="true">{t('workbench.rail_word_icon')}</span>
                    <GlyphSelect
                        value={row.glyph}
                        label={t('workbench.rail_glyph', at + 1)}
                        empty={t('workbench.rail_glyph_empty')}
                        choices={glyphs}
                        onchange={(value: string) => change(at, 'glyph', value)}
                    />
                </span>
                <span class="field">
                    <span class="word" aria-hidden="true">{t('workbench.rail_word_page')}</span>
                    <Select
                        value={row.page}
                        label={t('workbench.rail_page', at + 1)}
                        empty={t('workbench.rail_page_empty')}
                        choices={pages.map((key) => ({ id: key, label: key }))}
                        onchange={(value: string) => change(at, 'page', value)}
                    />
                </span>
                <span class="field">
                    <span class="word" aria-hidden="true">{t('workbench.rail_word_chord')}</span>
                    <Select
                        value={row.chord}
                        label={t('workbench.rail_chord', at + 1)}
                        empty={t('workbench.rail_chord_empty')}
                        choices={LETTERS.map((letter) => ({ id: letter, label: letter }))}
                        onchange={(value: string) => change(at, 'chord', value)}
                    />
                </span>
                <span class="field">
                    <span class="word" aria-hidden="true"
                        >{t('workbench.rail_word_group_glyph')}</span
                    >
                    <GlyphSelect
                        value={row.group_glyph}
                        label={t('workbench.rail_group_glyph', at + 1)}
                        empty={t('workbench.rail_group_glyph_empty')}
                        choices={glyphs}
                        onchange={(value: string) => change(at, 'group_glyph', value)}
                    />
                </span>
                <span class="field">
                    <span class="word" aria-hidden="true">{t('workbench.rail_unplaced')}</span>
                    <Checkbox
                        checked={row.unplaced_collections}
                        label={t('workbench.rail_unplaced_of', at + 1)}
                        bare
                        onchange={(value: boolean) => change(at, 'unplaced_collections', value)}
                    />
                </span>
                <span class="field">
                    <span class="word" aria-hidden="true">{t('workbench.rail_boards')}</span>
                    <Checkbox
                        checked={row.project_boards}
                        label={t('workbench.rail_boards_of', at + 1)}
                        bare
                        onchange={(value: boolean) => change(at, 'project_boards', value)}
                    />
                </span>
                <ToolButton
                    label={t('workbench.rail_up', at + 1)}
                    glyph="collapse"
                    compact
                    disabled={at === 0}
                    onclick={() => edit(moveRailEntry(rows, at, -1))}
                />
                <ToolButton
                    label={t('workbench.rail_down', at + 1)}
                    glyph="expand"
                    compact
                    disabled={at === rows.length - 1}
                    onclick={() => edit(moveRailEntry(rows, at, 1))}
                />
                <ToolButton
                    label={t('workbench.rail_remove', at + 1)}
                    glyph="trash"
                    compact
                    onclick={() => edit(rows.filter((_, index) => index !== at))}
                />
            </div>
        {/each}
    </Fold>
    {#if problems.length > 0}
        <ul class="problems">
            {#each problems as problem (problem.index)}
                <li>{why(problem)}</li>
            {/each}
        </ul>
    {/if}
    <div class="actions">
        <ToolButton
            label={t('workbench.rail_add')}
            glyph="add"
            onclick={() =>
                edit([
                    ...rows,
                    {
                        label: '',
                        glyph: '',
                        page: '',
                        chord: '',
                        group_glyph: '',
                        unplaced_collections: false,
                        project_boards: false
                    }
                ])}
        />
        <ToolButton
            label={t('workbench.rail_revert')}
            glyph="note_back"
            disabled={draft === null}
            onclick={revert}
        />
    </div>
</div>

<style>
    .rail {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .row,
    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    /* A field and its word stay on one line, so the row wraps between fields and never between a
       word and the field it names. */
    .field {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }

    .word {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .about {
        margin: 0;
    }

    .about {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .empty {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .problems {
        margin: 0;
        padding-left: 18px;
        color: var(--c-red-txt);
        font-size: var(--fs-md);
    }
</style>
