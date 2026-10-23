<script lang="ts">
    // Layer 3, shared view. The project-card frame, header and status chips live here because card
    // framing changes independently of its documents, links, sessions and expanded details.
    //
    // The card's controls are views/shared/card/CardActions.svelte, shown under the pointer and
    // kept on one line; the project's folder is offered three times among them, shown in the file
    // manager through the host, selected in the Files view of this page, and opened as a workbench
    // (a page that belongs to the folder, with the project view in its documents pane). A project
    // whose folder is a repository also has its project commands, drawn below the chips by the
    // commands bar the Repositories view uses (views/shared/sessions/CommandBar.svelte): five
    // buttons, an overflow menu for the rest, the control that adds a command and the mark of a
    // file that was not read. The card's ELI5 and next action are drawn by CardBrief.svelte; its
    // subtasks block is drawn only for a project that has subtasks, and its follow-up block only
    // for one that has follow-up notes, adding the first of each being one of the controls. The
    // card is a positioned box whose content may reach past its edge, so the More menu of its
    // controls is not cut off at the foot of a short card.
    //
    // Every project is drawn by this card, whatever its tier: its `links:` are listed under the
    // next action, and its folder is the one `placeOf` names, a repository's own Files root for a
    // project read from a repository. The project view passes `deposit` for every project, a
    // project read from a repository included. The folder, the venue and the team line are names
    // and stay words; the team line is the names of the project's lead and collaborators without
    // the person the workspace setting `self` names (state/boards/board/team.ts).
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Card from '$lib/ui/frame/Card.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import CardActions, { type CardAction } from '../CardActions.svelte';
    import CardBrief from './CardBrief.svelte';
    import { answerWords } from '../../forms/answer-words';
    import CardDetails from './CardDetails.svelte';
    import RootChip from '../RootChip.svelte';
    import CardAddresses from './CardAddresses.svelte';
    import CardLinks from './CardLinks.svelte';
    import CardSessions from './CardSessions.svelte';
    import CardStatus from './CardStatus.svelte';
    import CommandBar from '../../sessions/CommandBar.svelte';
    import Followups from '../../forms/dated/Followups.svelte';
    import Subtasks from '../../forms/dated/Subtasks.svelte';
    import { codeLabel, deadline, deckOf, openWorkbench } from '../card';
    import { placeOf } from '$lib/state/shared/page/hubs';
    import { isStale, newestDocDate, waitingLine, type BoardItem } from '$lib/state/boards/board';
    import { contextText } from '$lib/state/boards/project-context';
    import { resourceGlyph } from '$lib/state/forms/schema';
    import { personNames } from '$lib/state/boards/person';
    import { chipGlyphName, chipLabel } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { absoluteOf } from '$lib/state/workbench/navigation/pages';
    import { recordField, recordState } from '$lib/state/shared/page/records';

    const client = useState();

    const {
        clone: { cloneProject, cloning },
        entities: { portfolio },
        folders,
        layout: { openBeside, openView, showDeck, showFolderInFiles },
        selection: { select },
        selectors: { configMap, gitRoots, hubDirOf },
        terminals: { showTerminal, startChat },
        writes: { openFolder, writeManifest }
    } = client;
    type Props = {
        /** The joined board item the card presents. */
        item: BoardItem;
        /** Whether the expanded details are visible. */
        open: boolean;
        /** Whether keyboard navigation has selected this project. */
        cursor: boolean;
        /** The title shown on the card. */
        label: string;
        /** The title used when the project opens as a tab. */
        tab: string;
        /** The moment deadline chips are measured from. */
        now: number;
        /** How many stale days make the manifest warning visible. */
        staleLag: number;
        /** Toggle the expanded details when the board allows expansion. */
        ontoggle?: () => void;
        /** Whether the deposit action belongs in this card's controls. */
        deposit?: boolean;
        /** Show the outcome of a write or action in the board. */
        onsaid: (said: string) => void;
        /**
         * Whether the open card lists the project's documents; a view that draws them itself says
         * no.
         */
        documents?: boolean;
        /** Whether the ELI5 is drawn whole rather than cut to its clamp. */
        more?: boolean;
        /** Open or cut the ELI5; a card given none draws the ELI5 whole with no control. */
        onmore?: () => void;
    };
    let {
        item,
        open,
        cursor,
        label,
        tab,
        now,
        staleLag,
        ontoggle,
        deposit = false,
        onsaid,
        documents = true,
        more = false,
        onmore
    }: Props = $props();
    let copied = $state(false);
    /** True while the add-subtask form is open, from the block's own control or the card's. */
    let addingSubtask = $state(false);
    /** True while the add-follow-up form is open, from the block's own control or the card's. */
    let addingFollowup = $state(false);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;
    const snapshot = $derived(portfolio());
    const stale = $derived(isStale(item, staleLag));
    const due = $derived(deadline(item.project, now, t, configMap()));
    const wait = $derived(
        snapshot === null
            ? null
            : waitingLine(
                  item.project,
                  configMap(),
                  snapshot.entities.venues,
                  personNames(snapshot),
                  snapshot.entities.projects
              )
    );
    /** Where the project's folder is: the Files root that holds it and its path in that root. */
    const place = $derived(placeOf(item.project));
    const hub = $derived(place.root);
    /** The project's folder when the `git` channel carries it as a repository, else ''. */
    const repo = $derived.by((): string => {
        const folder = item.project.folder;
        const whole = folder.startsWith('/') ? folder : absoluteOf(hubDirOf(item.id), folder);
        return whole !== '' && gitRoots().includes(whole) ? whole : '';
    });
    /** The repository the project names that is not cloned anywhere yet: its address. */
    const toClone = $derived.by(() => {
        const block = item.project.repository;
        return block?.url !== undefined && block.clones.length === 0 ? block.url : null;
    });
    /**
     * Where the project is cloned: the first folder of the workspace whose origin is its address.
     */
    const clonedIn = $derived(item.project.repository?.clones.at(0) ?? null);
    const actions = $derived.by((): CardAction[] => {
        const rows: CardAction[] = [];
        rows.push({
            id: 'pin',
            label:
                item.project.pin === true ? t('project.card.unpin') : t('project.card.pin_to_top'),
            glyph: t('project.card.pin_glyph'),
            active: item.project.pin === true,
            onclick: pin
        });
        rows.push({
            id: 'copy',
            label: copied ? t('project.card.copied') : t('project.helper.copy_context'),
            title: t('project.helper.copy_context_tip'),
            glyph: 'copy',
            onclick: copyContext
        });
        rows.push({
            id: 'ask',
            label: t('project.helper.ask'),
            title: t('project.helper.ask_tip'),
            glyph: 'chat',
            onclick: ask
        });
        rows.push({
            id: 'folder',
            label: t('project.helper.folder'),
            title: t('project.helper.folder_tip'),
            glyph: 'folder',
            onclick: showFolder
        });
        rows.push({
            id: 'files',
            label: t('project.helper.show_in_files'),
            title: t('project.helper.show_in_files_tip'),
            glyph: 'show_in_files',
            onclick: () => {
                showFolderInFiles(place.path, hub);
            }
        });
        if (folders.served(hub)) {
            rows.push({
                id: 'workbench',
                label: t('project.helper.open_workbench'),
                title: t('project.helper.open_workbench_tip'),
                glyph: 'app_view',
                onclick: () => openWorkbench(client, item, tab)
            });
        }
        if (ontoggle !== undefined) {
            rows.push({
                id: 'toggle',
                label: t('project.card.toggle_tip'),
                glyph: open ? t('project.card.collapse_glyph') : t('project.card.expand_glyph'),
                active: open,
                toggle: true,
                onclick: ontoggle
            });
        }
        const deck = deckOf(item.project);
        if (deck !== null) {
            rows.push({
                id: 'present',
                label: t('project.card.present'),
                title: t('project.card.present_tip'),
                glyph: t('project.card.present_glyph'),
                onclick: () => {
                    // The project's deck is the identity of its tab: one tab per deck, activated
                    // when it is open already.
                    showDeck({ root: hub, path: deck }, '', true);
                }
            });
        }
        if (item.project.subtasks.length === 0) {
            rows.push({
                id: 'subtask',
                label: t('project.action.add_subtask'),
                title: t('project.action.add_subtask_tip'),
                glyph: t('project.action.add_subtask_glyph'),
                active: addingSubtask,
                onclick: () => {
                    addingSubtask = !addingSubtask;
                }
            });
        }
        if (item.project.followups.length === 0) {
            rows.push({
                id: 'followup',
                label: t('project.action.add_followup'),
                title: t('project.action.add_followup_tip'),
                glyph: t('project.action.add_followup_glyph'),
                active: addingFollowup,
                onclick: () => {
                    addingFollowup = !addingFollowup;
                }
            });
        }
        rows.push({
            id: 'edit',
            label: t('project.card.edit_manifest'),
            glyph: t('project.card.edit_glyph'),
            onclick: () => {
                openBeside('editor', recordField(item.id));
            }
        });
        if (deposit) {
            rows.push({
                id: 'deposit',
                label: t('project.card.deposit'),
                glyph: t('project.card.deposit_glyph'),
                onclick: () => {
                    openBeside('deposit', recordField(item.id));
                }
            });
        }
        if (toClone !== null) {
            rows.push({
                id: 'clone',
                label: cloning(item.id) ? t('project.card.clone_running') : t('project.card.clone'),
                title: t('project.card.clone_tip', toClone),
                glyph: t('project.card.clone_glyph'),
                turning: cloning(item.id),
                disabled: cloning(item.id),
                onclick: async () => {
                    await cloneProject(item.id, label, place.dir);
                }
            });
        }
        if (clonedIn !== null) {
            rows.push({
                id: 'cloned',
                label: t('project.card.cloned_in', clonedIn.split('/').at(-1) ?? clonedIn),
                title: t('project.card.cloned_in_tip', clonedIn),
                glyph: t('project.card.clone_glyph'),
                onclick: async () => {
                    const answer = await openFolder(clonedIn);
                    if (!answer.ok) onsaid(t('project.card.folder_failed', answer.error ?? ''));
                }
            });
        }
        return rows;
    });
    /** The newest document date used in the stale warning tooltip. */
    function newestDoc(): string {
        return newestDocDate(item.project);
    }
    /** Toggle the manifest's pinned state and report the write outcome. */
    async function pin(): Promise<void> {
        onsaid(answerWords(await writeManifest(item.id, { pin: item.project.pin !== true })));
    }
    /** Open the project. */
    function openTitle(): void {
        openView('project', recordState(item.id, tab));
    }
    /** Copy the project's generated context to the clipboard and expose failures. */
    async function copyContext(): Promise<void> {
        if (snapshot === null || typeof navigator === 'undefined' || !('clipboard' in navigator)) {
            onsaid(t('project.card.clipboard_blocked'));
            return;
        }
        try {
            await navigator.clipboard.writeText(contextText(item.project, snapshot));
            copied = true;
            if (copyTimer !== undefined) clearTimeout(copyTimer);
            copyTimer = setTimeout(() => (copied = false), 1300);
        } catch {
            onsaid(t('project.card.copy_failed'));
        }
    }
    /** Ask the host to reveal the project's folder. */
    async function showFolder(): Promise<void> {
        const answer =
            item.project.workspaceFolder === undefined
                ? await openFolder(item.project.folder, hub)
                : await openFolder(place.dir);
        if (!answer.ok) onsaid(t('project.card.folder_failed', answer.error ?? ''));
    }
    /** Start a project chat, select it and show it in the page's Terminal tab, or a new one. */
    async function ask(): Promise<void> {
        const answer = await startChat(item.id);
        if (!answer.ok) {
            onsaid(t('editor.failed', answer.error));
            return;
        }
        select(answer.id);
        showTerminal(answer.id);
    }
</script>

<div class="slot" title={label === item.project.title ? undefined : item.project.title}>
    <Card
        id={item.id}
        {cursor}
        title={label}
        tone={item.tone}
        pinned={item.project.pin === true}
        ontitle={openTitle}
    >
        {#snippet meta()}
            <RootChip record={item.project} />
            {#if item.project.stage}
                <Chip
                    label={chipLabel(item.project.stage)}
                    glyph={chipGlyphName(item.project.stage)}
                    tone={item.tone}
                    filled
                />
            {/if}
            {#if item.domain}
                <Tag label={item.domain.label} tone={item.domain.tone} />
            {/if}
            {#if due}
                <Tag label={due.label} glyph={t('project.card.deadline_glyph')} tone={due.tone} />
            {/if}
            {#if stale}
                <span title={t('project.card.stale_tip', newestDoc(), item.project.staleDays ?? 0)}>
                    <Tag
                        label={t('project.card.stale_behind', item.project.staleDays ?? 0)}
                        glyph={t('board.stale_glyph')}
                        tone="amber"
                    />
                </span>
            {/if}
            <CardActions {actions} />
        {/snippet}

        <div class="folder">{item.project.workspaceFolder?.root ?? item.project.folder}</div>
        <div class="row">
            {#if item.project.focus}
                <Tag label={item.project.focus} />
            {/if}
            <CardStatus {item} />
            {#if item.code !== ''}
                <Tag label={codeLabel(item.code, t)} glyph={t('project.card.code_glyph')} />
            {/if}
            {#if item.reproduced}
                <Tag label={t('board.repro_yes')} glyph={t('project.card.repro_glyph')} />
            {/if}
            {#each item.compute as resource (resource.id)}
                <Tag label={resource.label} glyph={resourceGlyph(resource.kind)} />
            {/each}
            {#if item.venue}
                <span class="venue">{item.venue.text}</span>
            {/if}
            {#if item.teamLine !== ''}
                <span class="team">
                    <Glyph name={t('project.card.author_glyph')} />
                    {item.teamLine}
                </span>
            {/if}
        </div>
        {#if wait !== null}
            <p class="waiting {wait.kind}">{wait.text}</p>
        {/if}
        {#if repo !== ''}
            <div class="commands"><CommandBar {repo} /></div>
        {/if}
        <CardLinks {item} />
        <CardSessions {item} />
        <CardBrief project={item.project} {more} {onmore} />
        <CardAddresses {item} />
        {#if open}
            <CardDetails {item} {onsaid} {documents} />
        {/if}
        {#if open || addingSubtask}
            <Subtasks
                target={{ id: item.id }}
                subtasks={item.project.subtasks}
                {onsaid}
                adding={addingSubtask}
                onadding={(next: boolean) => (addingSubtask = next)}
            />
        {/if}
        {#if open || addingFollowup}
            <Followups
                target={{ id: item.id }}
                notes={item.project.followups}
                {onsaid}
                adding={addingFollowup}
                onadding={(next: boolean) => (addingFollowup = next)}
            />
        {/if}
    </Card>
</div>

<style>
    /* The slot fills its grid cell, and the card fills the slot, so the cards of one row of a board
       are one height and no empty cell is left under a short one. */
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .slot > :global(.card) {
        flex: 1 1 auto;
        overflow: visible;
    }

    /* The card draws past its own edge, so its colour bar carries the card's rounded corners itself
       and a long unbroken title breaks inside the card's width. */
    .slot > :global(.card > .bar) {
        border-radius: var(--input-radius) 0 0 var(--input-radius);
    }

    .slot > :global(.card .title) {
        overflow-wrap: anywhere;
    }

    .folder {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        margin-top: 6px;
    }

    .venue,
    .team {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .commands {
        margin-top: 6px;
    }

    .waiting {
        margin: 3px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .waiting.blocked {
        color: var(--c-red-txt);
    }

    .waiting.review {
        color: var(--c-violet-txt);
    }
</style>
