<script lang="ts">
    // Layer 3, view partial. The rail list of config/layout.yml as the Settings view edits it: one
    // row per button with its label, icon and page, the controls that move a row and take it away,
    // and Save, which writes the list through the `rail` write of api/write. The watcher pushes the
    // file back within a second, and the rail redraws from that push, so the rail always shows what
    // the file says.
    //
    // A sentence under the heading says what a row is, and each field has its word before it on
    // the same line. The word is decoration beside a field whose accessible name already holds it,
    // so it is hidden from a screen reader, and it wraps with its field at a narrow width. The icon
    // field is ui/forms/choice/GlyphSelect.svelte, whose trigger draws the row's icon beside its
    // name, so the row draws the icon nowhere else.
    //
    // What is being typed is the tab's own state, so it is there again after the tab is switched
    // away from and after a reload, and a tab holding a list that differs from the file's is one
    // holding unsaved text. A row the shared rule refuses is named under the list and Save waits
    // for it, so the server's own refusal is the answer to a race and never to a typo. A row whose
    // glyph the vocabulary does not hold (a new row has none yet) draws its icon field with no
    // icon, and the rule's line names what the row lacks.
    //
    // The save key on the tab (Cmd+S, Ctrl+S off macOS) saves a list that differs from the file's,
    // as Save does (ui.svelte.ts's registerTabSave).
    //
    // Until the configuration is read, the file's list is not known: no row is drawn from it, the
    // sentence that the rail has no button waits for the read, and Save waits with it.
    //
    // The partial has no heading: it is drawn inside the `rail` row of the Settings view
    // (settings/Item.svelte), whose title is the heading. The rail's Settings choice opens that row
    // (Settings.svelte).

    import GlyphSelect from '$lib/ui/forms/choice/GlyphSelect.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        arrangementKeys,
        glyphNames,
        configRail,
        moveRailEntry,
        railDraft,
        railRefusal,
        readRail,
        sameRail,
        withRailDraft,
        type RailEntry,
        type RailProblem
    } from '$lib/state/workbench/navigation/rail';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { config },
        layout: { instanceView },
        ui: { instanceState, setInstanceState, registerTabSave },
        writes: { writeRail }
    } = useState();

    let { id }: { id: string } = $props();

    const merged = $derived(config()?.config);
    /** Whether the configuration has been read, before which the file's list is not known. */
    const read = $derived(merged !== undefined);
    const saved = $derived(configRail(merged));
    const draft = $derived(railDraft(instanceState(id)));
    const rows = $derived(draft ?? saved);
    const pages = $derived(arrangementKeys(merged?.arrangements));
    const glyphs = $derived(glyphNames(merged) ?? []);
    const problems = $derived(readRail(rows, pages, glyphs).problems);
    const dirty = $derived(read && draft !== null && !sameRail(draft, saved));

    /** Whether a save is on its way, which is what keeps Save from being pressed twice. */
    let sending = $state(false);

    /** The line under the list after a save: what it did, or why it did not. */
    let outcome = $state('');

    /** Put the list being typed in the tab's state. A list equal to the file's is no draft. */
    function edit(next: RailEntry[]): void {
        outcome = '';
        const held = instanceState(id);
        setInstanceState(id, withRailDraft(held, sameRail(next, saved) ? null : next));
    }

    /** One field of one row changed. */
    function change(at: number, field: keyof RailEntry, value: string): void {
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
        return t('workbench.rail_why_repeated', place);
    }

    /**
     * Write the list. The answer lands on the tab it was sent from only while that tab is still
     * open and still holds the list that was sent: a tab closed while the write was out keeps no
     * state, and a list typed on while it was out is the reader's newer word and is kept.
     */
    async function save(): Promise<void> {
        if (sending || problems.length > 0 || draft === null) return;
        const sent = draft;
        sending = true;
        const answer = await writeRail(sent);
        sending = false;
        if (instanceView(id) === undefined) return;
        if (!answer.ok) {
            outcome = railRefusal(answer.error);
            return;
        }
        const now = railDraft(instanceState(id));
        if (now !== null && sameRail(now, sent)) {
            setInstanceState(id, withRailDraft(instanceState(id), null));
        }
        outcome = t('workbench.rail_saved');
    }

    $effect(() =>
        registerTabSave(id, () => {
            if (dirty) void save();
        })
    );

    /** Forget the list being typed; the file's list is shown again. */
    function revert(): void {
        outcome = '';
        setInstanceState(id, withRailDraft(instanceState(id), null));
    }
</script>

<div class="rail" data-settings="rail">
    <p class="about">{t('workbench.rail_about')}</p>
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
            onclick={() => edit([...rows, { label: '', glyph: '', page: '' }])}
        />
        <ToolButton
            label={t('workbench.rail_save')}
            glyph="save"
            disabled={!dirty || sending || problems.length > 0}
            onclick={save}
        />
        <ToolButton
            label={t('workbench.rail_revert')}
            glyph="note_back"
            disabled={draft === null || sending}
            onclick={revert}
        />
        {#if sending}
            <span class="outcome" role="status">{t('workbench.rail_saving')}</span>
        {:else if outcome !== ''}
            <span class="outcome" role="status">{outcome}</span>
        {/if}
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

    .about,
    .outcome {
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
