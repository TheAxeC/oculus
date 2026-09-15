<script module lang="ts">
    // Layer 3, view registration. The file browser sits in the rail's Sources section, after the
    // collections the configuration names.
    import type { ViewRegistration } from './registry';

    export const registration: ViewRegistration = {
        id: 'files',
        label: 'views.files',
        glyph: 'views.files_glyph',
        group: 'sources',
        order: 4
    };
</script>

<script lang="ts">
    // Layer 3, view. The roots of the current workspace as one collapsible tree, and the toolbar that
    // changes which roots there are.
    //
    // A folder is read one level at a time, when it is opened: a root is a whole checkout and walking
    // one to draw it would read a hundred thousand names to show twenty. Which folders are open lives
    // in the instance's own state, so a tree left half open is the same tree when the tab comes back,
    // and two file browsers on two pages are open at two different places.
    //
    // Every root the configuration names is in every workspace and cannot be taken out of one, so a
    // workspace can only ever add. The server refuses a removal of a configured root as well; a
    // refusal that lives only in a view is a refusal that disappears with the next caller.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import RootForm from './files/RootForm.svelte';
    import Tree from './files/Tree.svelte';
    import Workspaces from './files/Workspaces.svelte';
    import {
        expandedOf,
        nameOf,
        toggleExpanded,
        treeKey,
        treeRows,
        typeOfFile,
        type TreeRow
    } from '$lib/state/fs';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        fs: { addRoot, entries, listing, removeRoot, saveWorkspace, selectWorkspace, workspaces },
        layout: { openView },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** Which form the toolbar has open, if any. */
    let form: 'root' | 'workspace' | '' = $state('');
    /** What is typed into whichever form is open. */
    let typed = $state('');
    /** What the endpoint refused the last attempt with, in the reader's own words. */
    let note = $state('');

    // Named `saved` rather than `state`: a variable called `state` in a component is read as the
    // store prefix of `$state`, which svelte-check refuses.
    const saved = $derived(workspaces());
    const current = $derived(
        saved.workspaces.find((one) => one.name === saved.current) ?? { name: '', roots: [] }
    );
    const expanded = $derived(expandedOf(instanceState(instance.id)));
    const rows = $derived(treeRows(current.roots, entries, expanded));
    const fixed = $derived(current.roots.filter((one) => one.fixed).map((one) => one.key));

    /**
     * The open folders on screen the server would not list. Without this a root whose directory
     * has moved is drawn as an open folder holding nothing, which is the one thing it is not. Only
     * a drawn row is asked: a folder remembered as open under a closed parent, or under a root the
     * workspace no longer has, is neither fetched nor named.
     */
    const failures = $derived(
        rows
            .filter((row) => row.open)
            .map((row) => ({
                root: row.root,
                path: row.path,
                error: listing(row.root, row.path).error
            }))
            .filter((one) => one.error !== '')
    );

    /** What one refusal code from the endpoint says to the reader. */
    function refusal(code: string): string {
        if (code === 'no-dir') return t('files.refused_no_dir');
        if (code === 'not-absolute') return t('files.refused_not_absolute');
        if (code === 'no-such-dir') return t('files.refused_no_such_dir');
        if (code === 'not-a-directory') return t('files.refused_not_a_directory');
        if (code === 'root-held') return t('files.refused_root_held');
        if (code === 'root-fixed') return t('files.refused_root_fixed');
        if (code === 'no-such-root') return t('files.refused_no_such_root');
        if (code === 'no-name') return t('files.refused_no_name');
        if (code === 'name-held') return t('files.refused_name_held');
        if (code === 'no-such-workspace') return t('files.refused_no_such_workspace');
        return t('files.refused_other', code);
    }

    /** Open or close one folder, which is the one thing this view remembers per instance. */
    function toggle(row: TreeRow): void {
        const held = instanceState(instance.id);
        const kept = typeof held === 'object' && held !== null && !Array.isArray(held) ? held : {};
        setInstanceState(instance.id, {
            ...kept,
            expanded: toggleExpanded(expanded, treeKey(row.root, row.path))
        });
    }

    /**
     * Open one file as its own tab. An HTML file opens in the document view, which gives it a frame
     * of its own so its stylesheets and relative assets resolve; everything else opens in the file
     * view, which draws it by what its name says it is.
     */
    function open(row: TreeRow): void {
        const view = typeOfFile(row.name).kind === 'html' ? 'document' : 'file';
        openView(view, {
            root: row.root,
            path: row.path,
            label: nameOf(row.path),
            size: row.size
        });
    }

    async function remove(key: string): Promise<void> {
        const answer = await removeRoot(key);
        note = answer.ok ? '' : refusal(answer.error ?? '');
    }

    async function confirm(): Promise<void> {
        const answer = form === 'root' ? await addRoot(typed) : await saveWorkspace(typed);
        if (!answer.ok) {
            note = refusal(answer.error ?? '');
            return;
        }
        note = '';
        typed = '';
        form = '';
    }

    async function select(name: string): Promise<void> {
        const answer = await selectWorkspace(name);
        note = answer.ok ? '' : refusal(answer.error ?? '');
    }

    function show(which: 'root' | 'workspace'): void {
        form = form === which ? '' : which;
        typed = '';
        note = '';
    }
</script>

{#snippet tools()}
    <Toolbar label={t('files.toolbar')}>
        <Workspaces
            current={saved.current}
            names={saved.workspaces.map((one) => one.name)}
            onselect={(name: string) => void select(name)}
        />
        <ToolButton
            label={t('files.add_root')}
            title={t('files.add_root_title')}
            expanded={form === 'root'}
            onclick={() => {
                show('root');
            }}
        />
        <ToolButton
            label={t('files.save_as')}
            title={t('files.save_as_title')}
            expanded={form === 'workspace'}
            onclick={() => {
                show('workspace');
            }}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.files')} toolbar={tools} tinted>
    <div class="files" data-instance={instance.id}>
        {#if form !== ''}
            <RootForm
                label={form === 'root' ? t('files.root_dir') : t('files.workspace_name')}
                help={form === 'root' ? t('files.root_dir_help') : ''}
                confirm={form === 'root' ? t('files.add') : t('files.save')}
                value={typed}
                {note}
                oninput={(value: string) => {
                    typed = value;
                }}
                onconfirm={() => void confirm()}
                oncancel={() => {
                    show(form === 'root' ? 'root' : 'workspace');
                }}
            />
        {:else if note !== ''}
            <p class="note" aria-live="polite">{note}</p>
        {/if}
        {#if saved.error !== ''}
            <p class="note" aria-live="polite">{t('files.read_failed', saved.error)}</p>
        {:else if saved.loading}
            <Empty message={t('files.loading')} glyph={t('files.none_glyph')} />
        {:else if rows.length === 0}
            <Empty message={t('files.none')} glyph={t('files.none_glyph')} />
        {:else}
            {#each saved.dropped as key (key)}
                <p class="note">{t('files.reserved', key)}</p>
            {/each}
            {#each failures as failure (treeKey(failure.root, failure.path))}
                <p class="note">
                    {t('files.listing_failed', failure.path || failure.root, failure.error)}
                </p>
            {/each}
            <Tree
                {rows}
                {fixed}
                ontoggle={toggle}
                onopen={open}
                onremove={(key: string) => void remove(key)}
            />
        {/if}
    </div>
</Pane>

<style>
    .files {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .note {
        margin: 0;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
