<script lang="ts">
    // Layer 3, shared view. The project-card frame and header live here because card framing
    // changes independently of its facts, links, sessions and the project page's blocks. The row of
    // facts (the Lead badge, the Focus lane, the form and chips, the code status, reproduced, the
    // compute resources and the folder, each with its glyph and a hover title naming its kind) is
    // CardFacts.svelte; WAITING ON, BLOCKED and the cross-links down to the venue are the labelled
    // lines of CardLinks.svelte.
    //
    // A board draws every card closed. The card's title, its Open project page action and Enter on
    // the keyboard cursor open the project page beside the board as the preview tab of the pane it
    // lands in (state/workbench/layout/open/opening.ts, `openBeside`), so the next project opened
    // from the board takes that tab's place, and a page the reader keeps or types in stays. On the
    // project page (`page`) the card has no Open project page action, its title opens the project
    // as a tab of the page's own, and its blocks are CardDetails.svelte's two columns, the subtasks
    // and the follow-up notes at the foot of the right one.
    //
    // Under the pointer the card shows three icons, Ask, Open Workbench (while the hub is served)
    // and Open project page (on a board), through views/shared/card/CardActions.svelte, then a
    // "..." opener whose menu lists every action in runs (card-menu.ts); a right-click anywhere on
    // the card, the context menu key and Shift+F10 on a control of the card open the same menu. Add
    // Subtask and Add Follow-up open their forms on the card, on a board the form alone under its
    // other lines (`formOnly`). A project whose folder is a repository also has its project commands, drawn
    // below the facts by the commands bar the Repositories view uses
    // (views/shared/sessions/CommandBar.svelte). The card's ELI5 and the first sentence of its next
    // action are CardBrief.svelte's. The card is a positioned box whose content may reach past its
    // edge, so a menu of its controls is not cut off at the foot of a short card.
    //
    // Every project is drawn by this card, whatever its tier: its folder is the one `placeOf`
    // names, a repository's own Files root for a project read from a repository. The project view
    // passes `deposit` for every project, a project read from a repository included. The team is
    // the TEAM row of tags (CardLinks.svelte) alone, and a project whose `lead:` names the person
    // the workspace setting `self` names carries the Lead badge.
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Card from '$lib/ui/frame/Card.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import CardActions from '../CardActions.svelte';
    import CardBrief from './CardBrief.svelte';
    import { answerWords } from '../../forms/answer-words';
    import CardDetails from './CardDetails.svelte';
    import RootChip from '../RootChip.svelte';
    import CardAddresses from './CardAddresses.svelte';
    import CardLinks from './CardLinks.svelte';
    import CardFacts from './CardFacts.svelte';
    import CardSessions from './CardSessions.svelte';
    import CommandBar from '../../sessions/CommandBar.svelte';
    import Followups from '../../forms/dated/Followups.svelte';
    import Subtasks from '../../forms/dated/Subtasks.svelte';
    import { deadline, deckOf, openWorkbench } from '../card';
    import { menuRuns, pickAction, stripActions, type ProjectAction } from './card-menu';
    import { placeOf, rootOf } from '$lib/state/shared/page/hubs';
    import { isStale, newestDocDate, type BoardItem } from '$lib/state/boards/board';
    import { isBlocked } from '$lib/state/boards/focus';
    import { contextText } from '$lib/state/boards/project-context';
    import { personNames } from '$lib/state/boards/person';
    import { waitedOn } from '$lib/state/boards/waiting';
    import { chipGlyphName, chipLabel, vocabOf } from '$lib/state/shared/words/tones';
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
        selectors: { gitRoots, hubDirOf },
        terminals: { showTerminal, startChat },
        writes: { openFolder, writeManifest }
    } = client;
    type Props = {
        /** The joined board item the card presents. */
        item: BoardItem;
        /**
         * Whether the card is the project page's: its blocks drawn in two columns, and no Open
         * project page action. A card on a board is drawn closed.
         */
        page?: boolean;
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
        /** Whether the deposit action belongs in this card's controls. */
        deposit?: boolean;
        /** Show the outcome of a write or action in the board. */
        onsaid: (said: string) => void;
        /** Whether the project page's blocks list the project's documents. */
        documents?: boolean;
        /** Whether the ELI5 is drawn whole rather than cut to its clamp. */
        more?: boolean;
        /** Open or cut the ELI5; a card given none draws the ELI5 whole with no control. */
        onmore?: () => void;
    };
    let {
        item,
        page = false,
        cursor,
        label,
        tab,
        now,
        staleLag,
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
    /** The words of the project's own hub, which its deadline and its BLOCKED line are read in. */
    const words = $derived(vocabOf(rootOf(item.project)));
    const due = $derived(deadline(item.project, now, t, words));
    /** The values of the project's `waiting-on:`, each named and with what it names. */
    const waiting = $derived(
        snapshot === null
            ? []
            : waitedOn(item.project.waitingOn, personNames(snapshot), snapshot.entities.projects)
    );
    const blocked = $derived(isBlocked(item.project, words));
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
    /** Every action of the card, in no order: card-menu.ts orders the strip and the menu's runs. */
    const actions = $derived.by((): ProjectAction[] => {
        const pinned = item.project.pin === true;
        const rows: ProjectAction[] = [
            {
                id: 'ask',
                label: t('project.helper.ask'),
                title: t('project.helper.ask_tip'),
                glyph: t('project.card.ask_glyph'),
                onclick: ask
            },
            {
                id: 'folder',
                label: t('project.helper.folder'),
                title: t('project.helper.folder_tip'),
                glyph: t('project.card.folder_glyph'),
                onclick: showFolder
            },
            {
                id: 'files',
                label: t('project.helper.show_in_files'),
                title: t('project.helper.show_in_files_tip'),
                glyph: t('project.card.files_glyph'),
                onclick: () => {
                    showFolderInFiles(place.path, hub);
                }
            },
            {
                id: 'subtask',
                label: t('project.menu.subtask'),
                title: t('project.action.add_subtask_tip'),
                glyph: t('project.action.add_subtask_glyph'),
                onclick: () => {
                    addingSubtask = !addingSubtask;
                }
            },
            {
                id: 'followup',
                label: t('project.menu.followup'),
                title: t('project.action.add_followup_tip'),
                glyph: t('project.action.add_followup_glyph'),
                onclick: () => {
                    addingFollowup = !addingFollowup;
                }
            },
            {
                id: 'edit',
                label: t('project.card.edit_manifest'),
                glyph: t('project.card.edit_glyph'),
                onclick: () => {
                    openBeside('editor', recordField(item.id));
                }
            },
            {
                id: 'pin',
                label: pinned ? t('project.card.unpin') : t('project.card.pin_to_top'),
                glyph: t('project.card.pin_glyph'),
                onclick: pin
            },
            {
                id: 'copy',
                label: copied ? t('project.card.copied') : t('project.helper.copy_context'),
                title: t('project.helper.copy_context_tip'),
                glyph: t('project.card.copy_glyph'),
                onclick: copyContext
            }
        ];
        if (!page) {
            rows.push({
                id: 'page',
                label: t('project.card.open_page'),
                row: t('project.menu.page'),
                title: t('project.card.open_page_tip'),
                glyph: t('project.card.page_glyph'),
                onclick: openPage
            });
        }
        if (folders.served(hub)) {
            rows.push({
                id: 'workbench',
                label: t('project.helper.open_workbench'),
                row: t('project.menu.workbench'),
                title: t('project.helper.open_workbench_tip'),
                glyph: t('project.card.workbench_glyph'),
                onclick: () => openWorkbench(client, item, tab)
            });
        }
        const deck = deckOf(item.project);
        if (deck !== null) {
            rows.push({
                id: 'present',
                label: t('project.menu.presentation'),
                title: t('project.card.present_tip'),
                glyph: t('project.card.present_glyph'),
                onclick: () => {
                    // The project's deck is the identity of its tab: one tab per deck, activated
                    // when it is open already.
                    showDeck({ root: hub, path: deck }, '', true);
                }
            });
        }
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
    const runs = $derived(menuRuns(actions));
    /** The newest document date used in the stale warning tooltip. */
    function newestDoc(): string {
        return newestDocDate(item.project);
    }
    /** Toggle the manifest's pinned state and report the write outcome. */
    async function pin(): Promise<void> {
        onsaid(answerWords(await writeManifest(item.id, { pin: item.project.pin !== true })));
    }
    /** Open the project page beside the board, as the preview tab of the pane it lands in. */
    function openPage(): void {
        openBeside('project', recordState(item.id, tab), undefined, undefined, { preview: true });
    }
    /** The title's press: the page beside the board on a board, the project's tab on its page. */
    function openTitle(): void {
        if (page) openView('project', recordState(item.id, tab));
        else openPage();
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

{#snippet subtasks()}
    <Subtasks
        target={{ id: item.id }}
        subtasks={item.project.subtasks}
        {onsaid}
        adding={addingSubtask}
        onadding={(next: boolean) => (addingSubtask = next)}
        formOnly={!page}
    />
{/snippet}

{#snippet followups()}
    <Followups
        target={{ id: item.id }}
        notes={item.project.followups}
        {onsaid}
        adding={addingFollowup}
        onadding={(next: boolean) => (addingFollowup = next)}
        formOnly={!page}
    />
{/snippet}

<ContextMenu
    label={t('project.menu.label')}
    groups={runs}
    own
    onpick={(id: string) => pickAction(actions, id)}
>
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
                        label={chipLabel(item.project.stage, rootOf(item.project))}
                        glyph={chipGlyphName(item.project.stage, rootOf(item.project))}
                        tone={item.tone}
                        filled
                    />
                {/if}
                {#if item.domain}
                    <Tag label={item.domain.label} tone={item.domain.tone} />
                {/if}
                {#if due}
                    <Tag
                        label={due.label}
                        glyph={t('project.card.deadline_glyph')}
                        tone={due.tone}
                    />
                {/if}
                {#if stale}
                    <span
                        title={t(
                            'project.card.stale_tip',
                            newestDoc(),
                            item.project.staleDays ?? 0
                        )}
                    >
                        <Tag
                            label={t('project.card.stale_behind', item.project.staleDays ?? 0)}
                            glyph={t('board.stale_glyph')}
                            tone="amber"
                        />
                    </span>
                {/if}
                <CardActions actions={stripActions(actions)} />
                <span class="menu">
                    <Menu
                        label={t('project.card.more_actions')}
                        glyph={t('project.card.menu_glyph')}
                        compact
                        placement="down"
                        align="right"
                        items={[]}
                        groups={runs}
                        onpick={(id: string) => pickAction(actions, id)}
                    />
                </span>
            {/snippet}

            <div class="row">
                <CardFacts {item} onfolder={showFolder} />
            </div>
            {#if repo !== ''}
                <div class="commands"><CommandBar {repo} /></div>
            {/if}
            <CardLinks {item} {waiting} {blocked} />
            <CardSessions {item} />
            <CardBrief project={item.project} {more} {onmore} next={!page} />
            <CardAddresses {item} />
            {#if page}
                <CardDetails {item} {onsaid} {documents}>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render subtasks()}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render followups()}
                </CardDetails>
            {:else}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render subtasks()}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render followups()}
            {/if}
        </Card>
    </div>
</ContextMenu>

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

    /* The "..." opener is drawn when the card's icons are (ui/frame/Card.svelte, `--card-at-rest`),
       right after them. */
    .menu {
        display: var(--card-at-rest, flex);
        flex: 0 0 auto;
        align-items: center;
        margin-block: min(0px, calc((1lh - 22px) / 2));
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        margin-top: 6px;
    }

    .commands {
        margin-top: 6px;
    }
</style>
