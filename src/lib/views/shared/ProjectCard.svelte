<script lang="ts">
    // Layer 3, shared view. The project-card frame, header and status chips live here because card
    // framing changes independently of its documents, links, sessions and expanded details.
    import Chip from '$lib/ui/Chip.svelte';
    import Card from '$lib/ui/Card.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import CardDetails from './CardDetails.svelte';
    import CardLinks from './CardLinks.svelte';
    import CardSessions from './CardSessions.svelte';
    import { codeLabel, deadline, openDocument } from './card';
    import { firstSentence, isStale, waitingLine, type BoardItem } from '$lib/state/board';
    import { contextText } from '$lib/state/project-context';
    import { findView } from '$lib/state/layout';
    import { t } from '$lib/state/text';
    import { chipGlyphName, chipLabel, statusTone } from '$lib/state/tones';
    import { useState } from '$lib/state/use';

    const client = useState();

    const {
        entities: { portfolio },
        layout: { openView, workbench },
        selectors: { collectionOf },
        selection: { select },
        terminals: { startChat },
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
        onsaid
    }: Props = $props();
    /** The most characters of the next action shown on a collapsed card. */
    const CARD_NEXT = 130;
    let copied = $state(false);
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
                  collaboratorNames(),
                  snapshot.entities.projects
              )
    );
    type CardAction = {
        label: string;
        title?: string;
        glyph: string;
        active?: boolean;
        toggle?: boolean;
        onclick: () => void | Promise<void>;
    };
    const actions = $derived.by(() => {
        const rows: CardAction[] = [];
        if (!item.project.ghost) {
            rows.push({
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
            label: copied ? t('project.card.copied') : t('project.helper.copy_context'),
            title: t('project.helper.copy_context_tip'),
            glyph: 'copy',
            onclick: copyContext
        });
        if (!item.project.ghost) {
            rows.push({
                label: t('project.helper.ask'),
                title: t('project.helper.ask_tip'),
                glyph: 'chat',
                onclick: ask
            });
        }
        rows.push({
            label: t('project.helper.folder'),
            title: t('project.helper.folder_tip'),
            glyph: 'folder',
            onclick: showFolder
        });
        if (ontoggle !== undefined) {
            rows.push({
                label: t('project.card.toggle_tip'),
                glyph: open ? t('project.card.collapse_glyph') : t('project.card.expand_glyph'),
                active: open,
                toggle: true,
                onclick: ontoggle
            });
        }
        if (!item.project.ghost) {
            rows.push({
                label: t('project.card.edit_manifest'),
                glyph: t('project.card.edit_glyph'),
                onclick: () => {
                    openView('editor', 'panel', { id: item.id });
                }
            });
            if (deposit) {
                rows.push({
                    label: t('project.card.deposit'),
                    glyph: t('project.card.deposit_glyph'),
                    onclick: () => {
                        openView('deposit', 'panel', { id: item.id });
                    }
                });
            }
        }
        return rows;
    });
    /** Resolve collaboration ids to the names used by the waiting line. */
    function collaboratorNames(): Record<string, string> {
        const names: Record<string, string> = {};
        for (const entry of collectionOf('collaborations')?.entries ?? []) {
            names[entry.id] = entry.title;
        }
        return names;
    }
    /** The newest document date used in the stale warning tooltip. */
    function newestDoc(): string {
        const newest = item.project.docs.reduce(
            (top: number, doc) => Math.max(top, doc.mtime ?? 0),
            0
        );
        return newest === 0 ? '' : new Date(newest).toISOString().slice(0, 10);
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
            if (item.project.docs.some((doc) => doc.name === 'README.md' && doc.present)) {
                openDocument(client, item.project.folder, 'README.md');
            }
            return;
        }
        openView('project', 'main', { id: item.id, label: tab });
    }
    /** The title opener, omitted only when a ghost has no readable README. */
    function titleOpener(): (() => void) | undefined {
        if (!item.project.ghost) return openTitle;
        return item.project.docs.some((doc) => doc.name === 'README.md' && doc.present)
            ? openTitle
            : undefined;
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
        if (!answer.ok) onsaid(t('editor.failed', answer.error ?? ''));
    }
    /** Start a project chat, select it and ensure a terminal view is available. */
    async function ask(): Promise<void> {
        const answer = await startChat(item.id);
        if (!answer.ok) {
            onsaid(t('editor.failed', answer.error));
            return;
        }
        select(answer.id);
        const trees = [workbench().main, workbench().panel];
        if (!trees.some((tree) => findView(tree, 'terminal', null) !== null)) {
            openView('terminal', 'main');
        }
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
                <Chip label={item.domain.label} tone={item.domain.tone} />
            {/if}
            {#if due}
                <Chip label={due.label} tone={due.tone} glyph={t('project.card.deadline_glyph')} />
            {/if}
            {#if stale}
                <span title={t('project.card.stale_tip', newestDoc(), item.project.staleDays ?? 0)}>
                    <Chip
                        label={t('project.card.stale_behind', item.project.staleDays ?? 0)}
                        glyph={t('board.stale_glyph')}
                        tone="amber"
                    />
                </span>
            {/if}
            {#if item.project.ghost}
                <span title={t('project.card.ghost_badge_tip')}>
                    <Chip
                        label={t('project.card.no_manifest')}
                        glyph={t('board.warn_glyph')}
                        tone="amber"
                    />
                </span>
            {/if}
            {#each actions as action, at (at)}
                {#if action.toggle}
                    <ToolButton
                        label={action.label}
                        title={action.title}
                        glyph={action.glyph}
                        active={action.active}
                        compact
                        dataCardToggle
                        onclick={action.onclick}
                    />
                {:else}
                    <ToolButton
                        label={action.label}
                        title={action.title}
                        glyph={action.glyph}
                        active={action.active}
                        compact
                        onclick={action.onclick}
                    />
                {/if}
            {/each}
        {/snippet}

        <div class="folder">{item.project.folder}</div>
        <div class="row">
            {#if item.project.focus}
                <Chip label={item.project.focus} />
            {/if}
            {#each item.chips as chip (chip)}
                <Chip label={chipLabel(chip)} glyph={chipGlyphName(chip)} tone={statusTone(chip)} />
            {/each}
            {#if item.code !== ''}
                <Chip label={codeLabel(item.code, t)} glyph={t('project.card.code_glyph')} />
            {/if}
            {#if item.reproduced}
                <Chip label={t('board.repro_yes')} glyph={t('project.card.repro_glyph')} />
            {/if}
            {#if item.compute === 'hpc'}
                <Chip label={t('project.card.hpc_label')} glyph={t('project.card.hpc_glyph')} />
            {:else if item.compute === 'local'}
                <Chip label={t('project.card.local_label')} />
            {/if}
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
        <CardLinks {item} />
        <CardSessions {item} />
        {#if item.project.ghost}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
            <p class="ghostmsg">{@html t('project.card.ghostmsg')}</p>
        {:else if item.project.eli5}
            <div class="eli5">
                <span class="label">{t('project.card.eli5')}</span>
                <p>{item.project.eli5}</p>
            </div>
        {/if}
        {#if item.project.next}
            <p class="next">{firstSentence(item.project.next, CARD_NEXT)}</p>
        {/if}
        {#if open && !item.project.ghost}
            <CardDetails {item} {onsaid} />
        {/if}
    </Card>
</div>

<style>
    .folder {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
        word-break: break-all;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
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

    .eli5 {
        margin-top: 8px;
    }

    .eli5 p {
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
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }
</style>
