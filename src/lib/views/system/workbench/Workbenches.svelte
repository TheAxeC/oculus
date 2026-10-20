<script module lang="ts">
    // Layer 3, view registration. Workbenches is the last tab of the float docked at the right edge
    // that config/defaults/layout.yml ships, and the third entry of the catalogue's Float group,
    // which `w` then `3` opens.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'workbenches',
        label: 'views.workbenches',
        glyph: 'views.workbenches_glyph',
        group: 'float',
        order: 2,
        unique: true
    };
</script>

<script lang="ts">
    // Layer 3, view. Every workbench, a page that belongs to one folder, in two sections of
    // explorer rows (ui/tree/TreeItem.svelte in a TreeView). Open lists the workbenches that are
    // open in page order with the folder each one is on and the branch of the repository holding
    // that folder; the one on screen is the row in force, a press shows a workbench, and the row's
    // controls (shown under the pointer and with the focus inside the row) reset its layout, which
    // makes it again from the `workbench:` arrangement after the page flows' question, and close it
    // through the page flows, which ask about unsaved text and running terminals. Closed lists the
    // layouts kept of closed workbenches, the one closed last first. A press, or Reopen, opens the
    // workbench from its kept layout; Forget drops the layout after a question, so the folder's
    // next workbench is made fresh. A kept layout whose root the current workspace does not serve
    // is drawn dimmed with a warning mark at the row's end whose tooltip says so, and cannot be
    // reopened, but can be forgotten; while the workspaces are being read none is drawn so.
    //
    // New workbench, an icon in the pane header, lists the roots of the Files view, each opening
    // the workbench of that root's top, and Open Folder..., which shows the folder panel Add Folder
    // to Workspace shows: a folder in a served root opens the workbench at that root and path, and
    // one outside every root is added to the workspace first (state/sources/explorer/ops.svelte.ts,
    // `pickWorkbenchFolder`). A panel or an add that did not come to a folder says why on the line
    // under the rows.

    import CloseQuestions from '$lib/ui/tabs/CloseQuestions.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { folderName, folderPlace, type FolderRef } from '$lib/state/workbench/layout';
    import {
        createPageFlows,
        pageName,
        questionFor,
        type HeldClose,
        type Question
    } from '$lib/state/workbench/navigation/pages';
    import { repositoryOf } from '$lib/state/workbench/navigation/status';
    import { allRoots, servesRoot } from '$lib/state/sources/fs-transport';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { git },
        explorer: { panelOpen, pickWorkbenchFolder },
        folders,
        fs: { roots, workspaces },
        layout: {
            closeInstance,
            closePage,
            currentPage,
            forgetKept,
            keptWorkbenches,
            pages,
            switchPage
        },
        registry: { viewFor },
        ui: { unsaved, busyTerminals, saveBeforeClose, saveForClose }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The menu item that shows the folder panel; a root's item is `root:` and its key. */
    const PANEL = 'panel';

    /** Whether each section is open. */
    let openSection = $state(true);
    let closedSection = $state(true);

    /** The ids of the two section heads. */
    const OPEN = 'open';
    const CLOSED = 'closed';

    /** Every open workbench with the name its page is called by, in page order. */
    const open = $derived(
        pages().flatMap((page, at) =>
            page.folder === undefined
                ? []
                : [{ id: page.id, name: pageName(page, at), folder: page.folder }]
        )
    );
    const current = $derived(currentPage().id);

    /** The kept layouts, the one closed last first: the store holds the oldest first. */
    const closed = $derived(
        [...keptWorkbenches()].reverse().map((kept) => ({
            key: JSON.stringify([kept.folder.root, kept.folder.path]),
            name: folderName(kept.folder),
            folder: kept.folder
        }))
    );

    const served = $derived(allRoots(workspaces()));

    /** The branch of the repository holding a folder, or the commit on a detached head. */
    function branchOf(folder: FolderRef): string {
        const found = repositoryOf(folder, 'workbench', served, git());
        return found === null ? '' : found.branch === '' ? found.head : found.branch;
    }

    /** The rows as the keyboard walks them: each section head, then its rows. */
    const keyRows = $derived([
        { id: OPEN, parent: null, open: openSection },
        ...(openSection ? open.map((one) => ({ id: `open:${one.id}`, parent: OPEN })) : []),
        { id: CLOSED, parent: null, open: closedSection },
        ...(closedSection ? closed.map((one) => ({ id: `closed:${one.key}`, parent: CLOSED })) : [])
    ]);

    /** What the last action came to when it opened nothing, or the empty text. */
    let note = $state('');

    /** The close that waits on its dialog, and the question a reset, a forget or a tab waits on. */
    let confirming: HeldClose | null = $state(null);
    let question: Question | null = $state(null);
    const ask = questionFor((held) => (question = held));

    const flows = createPageFlows({
        pages,
        unsaved,
        saveBeforeClose,
        saveForClose,
        busyTerminals,
        viewFor,
        closePage,
        closeTab: closeInstance,
        holdClose: (held) => (confirming = held),
        ask
    });

    /** Show the workbench of a folder, and say so on the line when it cannot be shown. */
    function show(folder: FolderRef): void {
        note = '';
        if (folders.open(folder) === '')
            note = t('workbench.workbenches_not_opened', folderPlace(folder));
    }

    /** Ask before the layout kept for a folder is dropped. */
    async function forget(folder: FolderRef): Promise<void> {
        note = '';
        const given = await ask(
            t('workbench.workbenches_forget_question', folderName(folder)),
            t('workbench.workbenches_forget_detail', folderPlace(folder))
        );
        if (given === 'yes') forgetKept(folder);
    }

    /** The folder panel's answer: the workbench of the folder it gave, or why it gave none. */
    async function openFolder(): Promise<void> {
        const answer = await pickWorkbenchFolder();
        if (answer.folder !== null) show(answer.folder);
        else note = answer.line;
    }

    const menu = $derived<MenuItem[]>([
        ...roots().map((root) => ({ id: `root:${root.key}`, label: root.key, glyph: 'folder' })),
        {
            id: PANEL,
            label: t('workbench.workbenches_open_folder'),
            disabled: panelOpen(),
            rule: roots().length > 0
        }
    ]);

    function picked(id: string): void {
        if (id === PANEL) void openFolder();
        else if (id.startsWith('root:')) show({ root: id.slice('root:'.length), path: '' });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('workbench.workbenches_toolbar')} overflow>
        <Menu
            bare
            glyph="add"
            compact
            label={t('workbench.workbenches_new')}
            placement="down"
            align="right"
            items={menu}
            onpick={picked}
        />
    </Toolbar>
{/snippet}

<!-- The box every view has; this one draws its rows straight into it, so it asks for the tint. -->
<Pane title={t('views.workbenches')} toolbar={tools} tinted>
    <div class="view" data-instance={instance.id} data-workbenches>
        <TreeView label={t('views.workbenches')} rows={keyRows}>
            {#snippet children(nav: TreeNav)}
                <TreeSection
                    label={t('workbench.workbenches_open')}
                    id={OPEN}
                    {nav}
                    count={open.length}
                    open={openSection}
                    ontoggle={() => (openSection = !openSection)}
                >
                    {#if open.length === 0}
                        <li role="none">
                            <TreeItem label={t('workbench.workbenches_open_none')} tone="muted" />
                        </li>
                    {/if}
                    {#each open as one (one.id)}
                        {@const branch = branchOf(one.folder)}
                        {#snippet where()}
                            {folderPlace(one.folder)}{branch === '' ? '' : ` ${branch}`}
                        {/snippet}
                        <li role="none" data-workbench-row={one.name}>
                            <TreeItem
                                label={one.name}
                                id={`open:${one.id}`}
                                {nav}
                                level={2}
                                glyph="folder"
                                current={one.id === current}
                                detail={where}
                                onclick={() => switchPage(one.id)}
                            >
                                {#snippet actions(reach: number)}
                                    <span class="controls">
                                        <ToolButton
                                            label={t('workbench.workbenches_reset')}
                                            title={one.name}
                                            glyph="refresh"
                                            compact
                                            tabindex={reach}
                                            onclick={() =>
                                                flows.reset(one.id, () => folders.reset(one.id))}
                                        />
                                        <ToolButton
                                            label={t('workbench.workbenches_close')}
                                            title={one.name}
                                            glyph="dismiss"
                                            compact
                                            tabindex={reach}
                                            onclick={() => flows.close(one.id)}
                                        />
                                    </span>
                                {/snippet}
                            </TreeItem>
                        </li>
                    {/each}
                </TreeSection>
                <TreeSection
                    label={t('workbench.workbenches_closed')}
                    id={CLOSED}
                    {nav}
                    count={closed.length}
                    open={closedSection}
                    ontoggle={() => (closedSection = !closedSection)}
                >
                    {#if closed.length === 0}
                        <li role="none">
                            <TreeItem label={t('workbench.workbenches_closed_none')} tone="muted" />
                        </li>
                    {/if}
                    {#each closed as one (one.key)}
                        {@const reachable = servesRoot(workspaces(), one.folder.root)}
                        {#snippet where()}
                            {folderPlace(one.folder)}
                        {/snippet}
                        {#snippet unserved()}
                            <Tooltip text={t('workbench.workbenches_not_served', one.folder.root)}>
                                <span
                                    class="unserved"
                                    role="img"
                                    aria-label={t(
                                        'workbench.workbenches_not_served',
                                        one.folder.root
                                    )}
                                    data-workbench-unserved
                                >
                                    <Glyph name="warn" />
                                </span>
                            </Tooltip>
                        {/snippet}
                        <li role="none" data-workbench-row={one.name}>
                            <TreeItem
                                label={one.name}
                                id={`closed:${one.key}`}
                                {nav}
                                level={2}
                                glyph="folder"
                                tone={reachable ? undefined : 'muted'}
                                detail={where}
                                end={reachable ? undefined : unserved}
                                onclick={reachable ? () => show(one.folder) : undefined}
                            >
                                {#snippet actions(reach: number)}
                                    <span class="controls">
                                        <ToolButton
                                            label={t('workbench.workbenches_reopen')}
                                            title={one.name}
                                            glyph="folder"
                                            compact
                                            disabled={!reachable}
                                            tabindex={reach}
                                            onclick={() => show(one.folder)}
                                        />
                                        <ToolButton
                                            label={t('workbench.workbenches_forget')}
                                            title={one.name}
                                            glyph="dismiss"
                                            compact
                                            tabindex={reach}
                                            onclick={() => void forget(one.folder)}
                                        />
                                    </span>
                                {/snippet}
                            </TreeItem>
                        </li>
                    {/each}
                </TreeSection>
            {/snippet}
        </TreeView>
        {#if note !== ''}
            <p class="note" role="status" data-workbenches-note>{note}</p>
        {/if}
    </div>
</Pane>

<CloseQuestions
    closing={confirming}
    {question}
    onclose={closePage}
    onclear={() => (confirming = null)}
/>

<style>
    .view {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px 12px 16px;
        overflow: auto;
        min-height: 0;
    }

    .controls {
        display: flex;
        gap: 1px;
    }

    .unserved {
        display: inline-flex;
    }

    .note {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
