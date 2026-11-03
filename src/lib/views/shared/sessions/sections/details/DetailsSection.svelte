<script lang="ts">
    // Layer 3, partial of ../SessionSections.svelte. The Details section of a session: what it is,
    // in three folding groups of one-line rows (DetailsBody.svelte, detail-facts.ts), with the
    // controls that act on it on the section's head, drawn as every section head's controls are,
    // under the pointer or the focus. Rename opens the title row's value as the title's field;
    // Pin is a menu of the areas the session may be filed under, "(scored)" first, then the
    // workspace's own areas, then every hub's projects under the hub's name, the one in force
    // marked; Resume runs the agent again on the transcript, which an ended session asks once for
    // and runs on the second press, and a running session cannot; Open the transcript shows the
    // session's turns in a Terminal tab.
    //
    // What Rename, Pin and Resume act on lives in the body (DetailsBody.svelte), which a closed
    // section unmounts: the title typed and not written, the resume asked once, the words the last
    // write answered and the time the started row is measured from. A close drops them all and
    // closes the Details title field, and a reopen reads the time again. The body hands the head
    // what it acts on (`DetailsActions`) while it is drawn; a press on Rename, Pin or Resume of a
    // closed section opens it first, and Rename opens a folded Session group too, so the field is
    // on screen. This section keeps only what holds whether it is open or not: which field the tab
    // keeps open (`fields`, or its own without them) and the folds of the groups.
    //
    // A tab that also draws the list hands in `fields`, the one title field it keeps open, so
    // opening this one closes the list's. The folds of the groups are kept in the tab's folds
    // (views/shared/card/pane-fold.ts), so a reload, a switch of tab and a pick of another session
    // keep them.

    import { tick } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { SectionMove } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import SessionSection from '../SessionSection.svelte';
    import type { TitleField, TitleFields } from '../title-field';
    import DetailsBody from './DetailsBody.svelte';
    import {
        detailRows,
        groupFold,
        groupOfRow,
        pinGroups,
        windowFor,
        SCORED_PIN,
        type DetailGroup,
        type DetailsActions
    } from './detail-facts';

    const {
        selectors: { contextWindow, pinnableAreas },
        terminals: { openSession }
    } = useState();

    type Props = {
        record: GroupedSession;
        /** The title field the tab keeps open, for a tab that also draws the list's. */
        fields?: TitleFields;
        open: boolean;
        ontoggle: () => void;
        move?: SectionMove;
        /** Leave out the line across the head's top edge, for the section right under a divider. */
        noTopLine?: boolean;
    };

    let { record, fields, open, ontoggle, move, noTopLine = false }: Props = $props();

    const fold = usePaneFold();
    const folded = (id: string): boolean => !fold.open(id);

    /** The field this section keeps open when the tab hands in none. */
    let own = $state<TitleField>(null);
    const field = $derived(fields === undefined ? own : fields.open);
    const renaming = $derived(field?.where === 'details' && field.session === record.id);

    /** What the open body acts on for the head's controls, and null while the section is closed. */
    let actions = $state<DetailsActions | null>(null);
    const armed = $derived(actions?.armed ?? false);

    const rows = $derived(
        detailRows(
            { session: record, window: windowFor(record, contextWindow()), renaming },
            folded
        )
    );

    /** The choices of the Pin menu, the area in force marked. */
    const pins = $derived(
        pinGroups(pinnableAreas(record.workspace), record.pinned ? record.area : '')
    );

    function setField(next: TitleField): void {
        if (fields === undefined) own = next;
        else fields.set(next);
    }

    /** Run a head control on the body, opening the section first when it is closed. */
    async function act(run: (body: DetailsActions) => void): Promise<void> {
        if (!open) {
            ontoggle();
            await tick();
        }
        if (actions !== null) run(actions);
    }

    /** Open the title's field, opening the Session group that holds its row. */
    function startRename(): void {
        if (folded(groupFold('session'))) fold.toggle(groupFold('session'));
        void act((body) => body.rename());
    }

    function pin(id: string, group?: string): void {
        void act((body) => body.pin(group === SCORED_PIN ? '' : id));
    }

    /** Show the turns of the session in a Terminal tab, opened or brought forward. */
    function openTranscript(): void {
        openSession({ session: record.id, label: record.title });
    }

    function folding(id: string): void {
        const group = groupOfRow(id);
        if (group !== null) fold.toggle(groupFold(group));
    }

    const resumeWords = $derived.by(() => {
        if (record.live) return t('sessions.resume_live');
        if (armed) return t('sessions.resume_confirm', record.cwd ?? '');
        return t('sessions.resume');
    });
</script>

{#snippet controls(reach: number)}
    <ToolButton
        label={t('sessions.rename')}
        glyph="edit"
        compact
        tabindex={reach}
        expanded={renaming}
        onclick={startRename}
    />
    <Menu
        label={t('sessions.pin_label')}
        title={t('sessions.pin_tip')}
        glyph="pin"
        compact
        bare
        placement="down"
        align="right"
        tabindex={reach}
        items={[]}
        groups={pins}
        onpick={(id: string, _event: MouseEvent, group?: string) => pin(id, group)}
    />
    <ToolButton
        label={t('sessions.resume')}
        title={resumeWords}
        glyph={t('sessions.resume_glyph')}
        compact
        tabindex={reach}
        active={armed}
        disabled={record.live}
        onclick={() => void act((body) => void body.resume())}
    />
    <ToolButton
        label={t('sessions.transcript_open')}
        title={t('sessions.transcript_open_tip')}
        glyph={t('sessions.transcript_glyph')}
        compact
        tabindex={reach}
        onclick={openTranscript}
    />
{/snippet}

<SessionSection
    id="details"
    label={t('sessions.section_details')}
    {rows}
    {open}
    {ontoggle}
    onfold={folding}
    {move}
    more={controls}
    {noTopLine}
>
    {#snippet body(nav: TreeNav)}
        <DetailsBody
            {record}
            {nav}
            {field}
            {setField}
            open={(group: DetailGroup) => !folded(groupFold(group))}
            ontoggle={(group: DetailGroup) => fold.toggle(groupFold(group))}
            onactions={(next: DetailsActions | null) => (actions = next)}
        />
    {/snippet}
</SessionSection>
