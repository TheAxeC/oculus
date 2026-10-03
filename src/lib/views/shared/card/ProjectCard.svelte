<script lang="ts">
    // Layer 3, shared view. The project-card frame, header and status chips live here because card
    // framing changes independently of its documents, links, sessions and expanded details.
    //
    // The card's controls are views/shared/card/CardActions.svelte, shown under the pointer and
    // kept on one line; the project's folder is offered twice among them, shown in Finder through
    // the host and selected in the Files view of this page. A project whose folder is a repository
    // also has its project commands, drawn below the chips by the commands bar the Repositories
    // view uses (views/shared/sessions/CommandBar.svelte): five buttons, an overflow menu for the
    // rest, the control that adds a command and the mark of a file that was not read. The card's
    // ELI5 is views/shared/card/Clamp.svelte wherever the caller keeps an open state for it; its
    // subtasks block is drawn only for a project that has subtasks, adding the first being one of
    // the controls. The card is a positioned box whose content may reach past its edge, so the More
    // menu of its controls is not cut off at the foot of a short card.
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Card from '$lib/ui/frame/Card.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import CardActions, { type CardAction } from './CardActions.svelte';
    import CardDetails from './CardDetails.svelte';
    import CardLinks from './CardLinks.svelte';
    import CardSessions from './CardSessions.svelte';
    import CommandBar from '../sessions/CommandBar.svelte';
    import CodeText from '$lib/ui/display/CodeText.svelte';
    import Clamp from './Clamp.svelte';
    import Subtasks from '../forms/Subtasks.svelte';
    import { codeLabel, deadline, deckSlideOf, openDocument } from './card';
    import {
        firstSentence,
        hasReadme,
        isStale,
        newestDocDate,
        waitingLine,
        type BoardItem
    } from '$lib/state/boards/board';
    import { contextText } from '$lib/state/boards/project-context';
    import { resourceGlyph } from '$lib/state/forms/schema';
    import { personNames } from '$lib/state/boards/person';
    import { t } from '$lib/state/shared/words/text';
    import { chipGlyphName, chipLabel, statusTone } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';
    import { absoluteOf } from '$lib/state/sources/explorer/view/place';

    const client = useState();

    const {
        entities: { portfolio },
        layout: { openBeside, openView, showFolderInFiles },
        selection: { select },
        selectors: { gitRoots, hubRoot },
        terminals: { showTerminal, startChat },
        ui: { setInstanceState },
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
    /** The most characters of the next action shown on a collapsed card. */
    const CARD_NEXT = 130;
    let copied = $state(false);
    /** True while the add-subtask form is open, from the block's own control or the card's. */
    let addingSubtask = $state(false);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;
    const snapshot = $derived(portfolio());
    const stale = $derived(isStale(item, staleLag));
    const due = $derived(deadline(item.project, item.chips, now, t));
    const wait = $derived(
        snapshot === null
            ? null
            : waitingLine(
                  item.project,
                  snapshot.entities.venues,
                  personNames(snapshot),
                  snapshot.entities.projects
              )
    );
    /** The project's folder when the `git` channel carries it as a repository, else ''. */
    const repo = $derived.by((): string => {
        const folder = item.project.folder;
        const whole = folder.startsWith('/') ? folder : absoluteOf(hubRoot(), folder);
        return whole !== '' && gitRoots().includes(whole) ? whole : '';
    });
    const actions = $derived.by((): CardAction[] => {
        const rows: CardAction[] = [];
        if (!item.project.ghost) {
            rows.push({
                id: 'pin',
                label:
                    item.project.pin === true
                        ? t('project.card.unpin')
                        : t('project.card.pin_to_top'),
                glyph: t('project.card.pin_glyph'),
                active: item.project.pin === true,
                onclick: pin
            });
        }
        rows.push({
            id: 'copy',
            label: copied ? t('project.card.copied') : t('project.helper.copy_context'),
            title: t('project.helper.copy_context_tip'),
            glyph: 'copy',
            onclick: copyContext
        });
        if (!item.project.ghost) {
            rows.push({
                id: 'ask',
                label: t('project.helper.ask'),
                title: t('project.helper.ask_tip'),
                glyph: 'chat',
                onclick: ask
            });
        }
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
                showFolderInFiles(item.project.folder);
            }
        });
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
        const slide = deckSlideOf(item.project);
        if (slide !== null) {
            rows.push({
                id: 'present',
                label: t('project.card.present'),
                title: t('project.card.present_tip'),
                glyph: t('project.card.present_glyph'),
                onclick: () => {
                    // The deck's position is the pane's own state, so the pane is opened and then
                    // put on the slide: a pane already on the deck moves to it rather than staying
                    // where its reader left it.
                    setInstanceState(openBeside('present', { slide }), { slide });
                }
            });
        }
        if (!item.project.ghost) {
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
            rows.push({
                id: 'edit',
                label: t('project.card.edit_manifest'),
                glyph: t('project.card.edit_glyph'),
                onclick: () => {
                    openBeside('editor', { id: item.id });
                }
            });
            if (deposit) {
                rows.push({
                    id: 'deposit',
                    label: t('project.card.deposit'),
                    glyph: t('project.card.deposit_glyph'),
                    onclick: () => {
                        openBeside('deposit', { id: item.id });
                    }
                });
            }
        }
        return rows;
    });
    /** The newest document date used in the stale warning tooltip. */
    function newestDoc(): string {
        return newestDocDate(item.project);
    }
    /** Toggle the manifest's pinned state and report the write outcome. */
    async function pin(): Promise<void> {
        const answer = await writeManifest(item.id, { pin: item.project.pin !== true });
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }
    /** Open the project, or the readable README carried by a ghost project. */
    function openTitle(): void {
        if (item.project.ghost) {
            if (hasReadme(item.project)) {
                openDocument(client, item.project.folder, 'README.md');
            }
            return;
        }
        openView('project', { id: item.id, label: tab });
    }
    /** The title opener, omitted only when a ghost has no readable README. */
    function titleOpener(): (() => void) | undefined {
        if (!item.project.ghost) return openTitle;
        return hasReadme(item.project) ? openTitle : undefined;
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
        const answer = await openFolder(item.project.folder);
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
        ontitle={titleOpener()}
    >
        {#snippet meta()}
            {#if item.project.type}
                <Chip label={item.project.type} tone={item.tone} filled />
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
            {#if item.project.ghost}
                <span title={t('project.card.ghost_badge_tip')}>
                    <Tag
                        label={t('project.card.no_manifest')}
                        glyph={t('board.warn_glyph')}
                        tone="amber"
                    />
                </span>
            {/if}
            <CardActions {actions} />
        {/snippet}

        <div class="folder">{item.project.folder}</div>
        <div class="row">
            {#if item.project.focus}
                <Tag label={item.project.focus} />
            {/if}
            {#each item.chips as chip (chip)}
                <Chip label={chipLabel(chip)} glyph={chipGlyphName(chip)} tone={statusTone(chip)} />
            {/each}
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
            {#if item.authors !== ''}
                <span class="authors">
                    <Glyph name={t('project.card.author_glyph')} />
                    {item.authors}
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
        {#if item.project.ghost}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
            <p class="ghostmsg">{@html t('project.card.ghostmsg')}</p>
        {:else if item.project.eli5}
            <div class="eli5">
                <span class="label">{t('project.card.eli5')}</span>
                {#if onmore === undefined}
                    <p>{item.project.eli5}</p>
                {:else}
                    <Clamp open={more} ontoggle={onmore}>
                        {item.project.eli5}
                    </Clamp>
                {/if}
            </div>
        {/if}
        {#if item.project.next}
            <p class="next"><CodeText text={firstSentence(item.project.next, CARD_NEXT)} /></p>
        {/if}
        {#if open && !item.project.ghost}
            <CardDetails {item} {onsaid} {documents} {now} />
        {/if}
        {#if !item.project.ghost && (open || addingSubtask)}
            <Subtasks
                target={{ id: item.id }}
                subtasks={item.project.subtasks}
                {onsaid}
                adding={addingSubtask}
                onadding={(next: boolean) => (addingSubtask = next)}
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
    .authors {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .commands {
        margin-top: 6px;
    }

    .eli5 {
        margin-top: 8px;
    }

    .eli5 p,
    .eli5 :global(.clamp) {
        margin: 2px 0 0;
        font-size: var(--fs-md);
    }

    .next,
    .waiting,
    .ghostmsg {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .next {
        margin: 2px 0 0;
    }

    .waiting {
        margin: 3px 0 0;
    }

    .waiting.blocked {
        color: var(--c-red-txt);
    }

    .waiting.review {
        color: var(--c-violet-txt);
    }

    .ghostmsg {
        margin: 6px 0 0;
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }
</style>
