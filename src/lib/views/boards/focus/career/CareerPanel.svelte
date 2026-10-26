<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The Career banner at the top of the
    // board, drawn with the command center's parts: its box, its two-column flow and its groups are
    // ui/display/ticker/TickerGroup.svelte's, with a purple left edge where the command center's is
    // red, and its heading is the row the command center and the tasks section draw theirs with
    // (views/shared/card/heads/FoldHead.svelte): the fold control, named "Fold Career" or "Unfold
    // Career", the banner's glyph and the word Career, and at the row's end the Edit control.
    //
    // Its groups are NEXT, GOAL, SITUATION, ORDER OF WORK and TRACK RECORD, in that order, each
    // drawn only when it has a row, and each line is a command-center row (career-rows.ts): a
    // glyph, the words, a tail, and buttons drawn under the pointer or the keyboard. NEXT is the
    // milestone, its tail the milestone's day and the days left to it, toned as the command center
    // tones a deadline; a SITUATION row is a fact, its label the words and its value the tail; an
    // ORDER OF WORK row is a task with its note, its date the tail, and the order's own note under
    // the rows; a TRACK RECORD row is a role, its tail its counts per record row of `categories:`
    // (state/boards/career.ts `trackRecord`), then Funding obtained.
    //
    // A press on a row of the career file (Next, Goal, a fact, a task) opens the file in its source
    // tab, kept, with the caret at that section's line in the tab's text (views/shared/forms/
    // entry-file.ts `openFound`, state/sessions/source/draft-entry.ts `findCareer`); when the text
    // does not hold it, the board's outcome line says so, naming the file. Such a row carries Edit
    // under the pointer, which opens the banner's editor on that section, and one Open link per web
    // address its words or tail hold, which opens the address in a new browser tab. A TRACK RECORD
    // role row opens the track record's board for its role, the projects its tail counts, one tab
    // per role, so a second press activates the open tab (views/boards/projects/Projects.svelte);
    // Funding obtained opens the Funding view; these rows carry no button.
    //
    // The Edit control opens the editor of the career file's sections, built from the file's own
    // `schema:` (views/shared/forms/entry/edit/EntryEditor.svelte), in place of the groups; it
    // reads Close editor while the editor is open, and pressed while the banner is folded it
    // unfolds it and opens the editor. The edits are kept in the Focus view's instance state, so
    // the editor stays open while edits are unsaved, and closing it over them asks first. A career
    // file with no `schema:` has no editor, so neither the heading row nor a row carries Edit. The
    // file has no Add and no Delete: it is one file, not a list of entries.
    //
    // The banner folds as the command center does, by the board's instance state, and starts open.
    // Folded, the panel is hidden until found and stays mounted, so the editor keeps its refusals,
    // its result words and a save in flight across a fold and an unfold, and the browser's
    // find-in-page searches its text while it is folded: a match inside it fires `beforematch`,
    // which unfolds the banner. It draws nothing when the hub holds no career file, which is the
    // ordinary case for a hub that keeps no career plan, and the board then starts at the command
    // center.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TickerGroup, { box } from '$lib/ui/display/ticker/TickerGroup.svelte';
    import FoldHead from '../../../shared/card/heads/FoldHead.svelte';
    import EntryEditor from '../../../shared/forms/entry/edit/EntryEditor.svelte';
    import { pageFile } from '../../../shared/forms/entry/edit/page-file';
    import { openFound } from '../../../shared/forms/entry-file';
    import { careerRows, EDIT, linkOf } from './career-rows';
    import { trackRecord } from '$lib/state/boards/career';
    import { CAREER } from '$lib/state/forms/page-entry';
    import { findCareer } from '$lib/state/sessions/source/draft-entry';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        entities: { portfolio },
        formDraft: { draftEdits, revertDraft },
        fs: { primary },
        layout: { openView },
        pages: { pageNamed },
        selectors: { configMap, registryKey }
    } = client;

    type Props = {
        /** The view instance that keeps the career editor's unsaved edits. */
        instance: string;
        /** The moment the board counts from, which the milestone's days left are counted to. */
        now: number;
        /** Whether the banner is unfolded, and the control on its heading that folds it. */
        open: boolean;
        ontoggle: () => void;
        /** What a press answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let { instance, now, open, ontoggle, onsaid }: Props = $props();

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const career = $derived(snapshot?.entities.career ?? null);

    /** The career file as the editor sees it, null while the file has no schema. */
    const page = $derived(pageNamed(CAREER));
    const file = $derived(page === null ? null : pageFile(client, page));

    /** The career file a press on a row opens, which a file with no schema has too. */
    const careerFile = $derived(viewSourceFile('career', config, primary()));

    /** The groups and what each row opens, nothing when the hub holds no career file. */
    const rows = $derived(
        career === null
            ? null
            : careerRows({
                  career,
                  now,
                  record: trackRecord(snapshot, config, vocabOf),
                  editable: page !== null,
                  funding: registryKey('funding')
              })
    );

    /** Whether the editor is asked for, and whether the question before closing it is open. */
    let editing = $state(false);
    let discarding = $state(false);
    const unsaved = $derived(Object.keys(draftEdits(instance, 'page', CAREER)).length > 0);
    const editorOpen = $derived(editing || unsaved);

    /** The field the editor was opened on by a row's Edit, nothing when it was opened whole. */
    let field = $state<string | undefined>(undefined);

    /** Unfold the banner when it is folded. */
    function unfold(): void {
        if (!open) ontoggle();
    }

    /** Open the editor on one field, or whole; a folded banner unfolds first. */
    function openEditor(on: string | undefined): void {
        unfold();
        field = on;
        editing = true;
    }

    /**
     * The heading row's Edit: on a folded banner it unfolds it and opens the editor; otherwise it
     * opens the editor, or closes it, closing over unsaved edits asking first. It reads Close
     * editor, pressed, only while the banner is open with its editor, the one state a press closes.
     */
    function toggle(): void {
        if (!open) {
            if (editorOpen) unfold();
            else openEditor(undefined);
        } else if (!editorOpen) openEditor(undefined);
        else if (unsaved) discarding = true;
        else editing = false;
    }

    /** Drop the unsaved edits and close the editor. */
    function discard(): void {
        discarding = false;
        revertDraft(instance);
        editing = false;
    }

    /**
     * A press on a row: the career file opened at the row's section, its sentence said when the
     * file does not hold it; the role's track record board or the Funding view for a Track record
     * row.
     */
    async function pick(id: string): Promise<void> {
        const target = rows?.targets[id];
        if (target === undefined) return;
        if (target.kind === 'view') {
            openView(target.view, target.state);
            return;
        }
        if (careerFile === null) return;
        const sentence = await openFound(client, careerFile, (tab) =>
            findCareer(client.source, tab, target.at, target.label)
        );
        if (sentence !== '') onsaid(sentence);
    }

    /** A button of a row: Edit opens the editor on the row's field, Open link its address. */
    function act(id: string, action: string): void {
        const target = rows?.targets[id];
        if (action === EDIT && target?.kind === 'file') openEditor(target.field);
        const address = linkOf(action);
        if (address !== null) window.open(address, '_blank', 'noopener,noreferrer');
    }
</script>

{#snippet edit()}
    <ToolButton
        small
        label={open && editorOpen ? t('entry_form.edit_done') : t('entry_form.edit')}
        glyph={t('entry_form.edit_glyph')}
        active={open && editorOpen}
        onclick={toggle}
    />
{/snippet}

{#snippet content()}
    <FoldHead
        glyph={t('focus.career_glyph')}
        title={t('focus.career_heading')}
        name={t('focus.career_heading')}
        {open}
        {ontoggle}
        end={page === null ? undefined : edit}
    />
    <div
        class="body"
        class:wide={editorOpen && page !== null}
        hidden={open ? false : 'until-found'}
        onbeforematch={unfold}
    >
        {#if editorOpen && page !== null}
            <EntryEditor {page} {instance} {file} openOn={field} />
        {:else if rows !== null}
            {#each rows.groups as group (group.key)}
                <TickerGroup
                    label={group.label}
                    glyph={group.glyph}
                    runs={[{ key: group.key, rows: group.rows }]}
                    note={group.note}
                    onpick={pick}
                    onaction={act}
                    reveal
                />
            {/each}
        {/if}
    </div>
{/snippet}

{#if career !== null}
    <!-- eslint-disable-next-line @typescript-eslint/no-unsafe-call -- svelte-check types the snippet TickerGroup.svelte's module script exports; the lint's parser does not read it -->
    {@render box('purple', content)}
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
    /* The editor, while it is open, spans both columns of the box. */
    .body.wide {
        column-span: all;
    }

    /* The open editor stands 4px under the heading row, as the first group stands under it. The
       gap is drawn only while the body is shown, since a body hidden until found still draws its
       padding and would make the folded box taller than the command center's. */
    .body.wide:not([hidden]) {
        padding-top: 4px;
    }
</style>
