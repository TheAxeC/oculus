<script module lang="ts">
    // Layer 3, view registration. The merge editor opens from a conflicted path in the Source
    // Control views and is not listed: opened bare it has no file to merge.
    import { MERGE_VIEW } from '$lib/state/sources/repositories/repositories.svelte';
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: MERGE_VIEW,
        label: 'views.repositories_merge',
        glyph: 'views.repositories_merge_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. VS Code's three-way merge editor over one conflicted path: Incoming (theirs)
    // and Current (ours) side by side above the Result. The three versions are read from the index
    // (stages 1, 2 and 3 of the path, through GET /api/git) and cut into regions by
    // state/sources/repositories/diff/merge-regions.ts: what the two sides agree on is taken as it
    // is, and each stretch both changed differently is a conflict. Each conflict offers Accept
    // Incoming, Accept Current, Accept Both in either order, and Ignore, which leaves the common
    // ancestor's lines; an open conflict shows the ancestor's lines in the Result until then.
    //
    // Incoming and Current are read-only Monaco editors, each conflict's lines tinted and its
    // choices on a bar above it; the Result is a writable Monaco editor the reader may also type
    // into, and typing into a conflict's lines settles it by hand. A choice rewrites the Result as
    // one edit of the editor's, so undo takes it back, and the choice goes with it: the conflict
    // reads open again, as it did before; the Result editor says whether an edit was its undo, its
    // redo or typing. The count of conflicts still open is the status at the end of the pane's
    // bar; Complete Merge and Accept Deletion are icon actions on its header. Complete
    // Merge writes the Result over the file and stages it, which is what tells git the conflict is
    // resolved; with conflicts still open it asks first. Where a side deleted the file, the pane
    // says which, Accept Deletion takes the deletion (the file leaves the index and the worktree)
    // after a confirm, and Complete Merge over an empty Result does the same, since an empty Result
    // is the deleted side.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Editor from '$lib/ui/controls/editor/Editor.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import MergeSide, { type SideConflict } from './MergeSide.svelte';
    import {
        chooseIn,
        editIn,
        historyOf,
        initialPieces,
        openCount,
        regionsOf,
        takesDeletion,
        type Choice,
        type EditKind,
        type MergeHistory,
        type Region
    } from '$lib/state/sources/repositories/diff/merge-regions';
    import { readJson } from '$lib/data/shapes/shapes';
    import { mergeSidesOf } from '$lib/state/sources/repositories/answers';
    import { sidesUrl, type GitMergeSides } from '$lib/state/sources/repositories/repositories';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { languageOf } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        repositories,
        selectors: { languages },
        ui: { codeTheme, theme, textScale }
    } = useState();

    let { instance }: ViewProps = $props();

    const root = $derived(instanceText(instance.state, 'root'));
    const path = $derived(instanceText(instance.state, 'path'));

    let sides: GitMergeSides | null = $state(null);
    let failure = $state('');
    let regions: Region[] = $state([]);
    /** The Result's pieces and each region's choice, with the choices undo and redo can move. */
    let history: MergeHistory = $state.raw(historyOf({ pieces: [], choices: [] }));
    let done = $state(false);
    let asking = $state(false);
    let deleting = $state(false);
    /** What the last read was over, so a redraw does not read again. */
    let taken = '';

    const pieces = $derived(history.held.pieces);
    const choices = $derived(history.held.choices);
    const result = $derived(pieces.join(''));
    const left = $derived(openCount(regions, choices));
    const busy = $derived(repositories.busy(root));
    const language = $derived(languageOf(path, languages()));
    const look = $derived(`${theme()} ${String(textScale() ?? 1)}`);

    $effect(() => {
        const wanted = `${root}\n${path}`;
        if (root === '' || path === '' || wanted === taken) return;
        taken = wanted;
        void load(root, path);
    });

    async function load(from: string, file: string): Promise<void> {
        failure = '';
        done = false;
        try {
            const response = await fetch(sidesUrl(from, file));
            const answer = mergeSidesOf(response.ok, await readJson(response));
            if (answer.sides === null) {
                failure = answer.failure;
                return;
            }
            sides = answer.sides;
            regions = regionsOf(answer.sides.base, answer.sides.ours, answer.sides.theirs);
            history = historyOf({
                pieces: initialPieces(regions),
                choices: regions.map((): Choice => 'open')
            });
        } catch {
            failure = t('repositories.merge_failed');
        }
    }

    /** The conflicts as one side draws them, by where their lines are in that side. */
    function conflictsOf(side: 'ours' | 'theirs'): SideConflict[] {
        const found: SideConflict[] = [];
        regions.forEach((region, at) => {
            if (region.kind !== 'conflict') return;
            found.push({ region: at, span: region.at[side], choice: choices[at] });
        });
        return found;
    }

    function choose(region: number, choice: Choice): void {
        history = chooseIn(history, regions, region, choice);
    }

    /** The Result's text after an edit, and whether the editor made it by undo, redo or typing. */
    function typed(next: string, edit: EditKind): void {
        history = editIn(history, regions, next, edit);
    }

    async function complete(): Promise<void> {
        asking = false;
        if (sides !== null && takesDeletion(sides.deleted, result)) {
            deleting = true;
            return;
        }
        if (await repositories.resolve(root, path, result)) done = true;
    }

    async function takeDeletion(): Promise<void> {
        deleting = false;
        if (await repositories.acceptDeletion(root, path)) done = true;
    }
</script>

{#snippet tools()}
    <Toolbar label={t('views.repositories_merge')} overflow>
        <ToolButton
            bare
            label={t('repositories.merge_complete')}
            glyph="check"
            disabled={busy || sides === null || done}
            onclick={() => (left > 0 ? (asking = true) : void complete())}
        />
        {#if sides !== null && sides.deleted !== ''}
            <ToolButton
                bare
                label={t('repositories.merge_delete')}
                title={t('repositories.merge_delete_title')}
                glyph="trash"
                disabled={busy || done}
                onclick={() => (deleting = true)}
            />
        {/if}
    </Toolbar>
{/snippet}

{#snippet bar()}
    <span class="left" data-conflicts-left={left}>{t('repositories.merge_left', left)}</span>
{/snippet}

{#snippet again()}
    <ToolButton small label={t('repositories.merge_retry')} onclick={() => void load(root, path)} />
{/snippet}

<Pane title={t('repositories.merge_editor_title', path)} toolbar={tools} {bar} tinted>
    <div class="merge" data-instance={instance.id} data-view="repositories-merge" data-path={path}>
        {#if root === '' || path === ''}
            <Empty message={t('repositories.merge_empty')} glyph="merge" />
        {:else if failure !== ''}
            <Empty error message={failure} action={again} />
        {:else if sides === null}
            <Empty message={t('repositories.merge_pending')} glyph="merge" />
        {:else}
            {#if done}
                <p class="note" data-merge-done>{t('repositories.merge_done', path)}</p>
            {/if}
            {#if sides.deleted !== ''}
                <p class="note" data-merge-deleted={sides.deleted}>
                    {#if sides.deleted === 'ours'}
                        {t('repositories.merge_deleted_ours')}
                    {:else if sides.deleted === 'theirs'}
                        {t('repositories.merge_deleted_theirs')}
                    {:else}
                        {t('repositories.merge_deleted_both')}
                    {/if}
                </p>
            {/if}
            <div class="inputs">
                <MergeSide
                    side="incoming"
                    text={sides.theirs}
                    conflicts={conflictsOf('theirs')}
                    model={`${instance.id}:incoming`}
                    {path}
                    {language}
                    {look}
                    codeTheme={codeTheme()}
                    onchoose={choose}
                />
                <MergeSide
                    side="current"
                    text={sides.ours}
                    conflicts={conflictsOf('ours')}
                    model={`${instance.id}:current`}
                    {path}
                    {language}
                    {look}
                    codeTheme={codeTheme()}
                    onchoose={choose}
                />
            </div>
            <div class="result" data-merge-result>
                <p class="head">{t('repositories.merge_result')}</p>
                <div class="text">
                    <Editor
                        text={result}
                        {language}
                        model={`${instance.id}:result`}
                        {path}
                        {look}
                        codeTheme={codeTheme()}
                        onchange={typed}
                    />
                </div>
            </div>
        {/if}
    </div>
</Pane>

{#if asking}
    <Confirm
        message={t('repositories.merge_complete_confirm', left)}
        detail={t('repositories.merge_complete_detail')}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void complete()}
        oncancel={() => (asking = false)}
    />
{/if}

{#if deleting}
    <Confirm
        message={t('repositories.merge_delete_confirm', path)}
        detail={t('repositories.merge_delete_detail')}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void takeDeletion()}
        oncancel={() => (deleting = false)}
    />
{/if}

<style>
    .merge {
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) minmax(0, 1fr);
        gap: 6px;
        height: 100%;
        min-height: 0;
    }

    /* The notes above take the first two rows, however many of them are drawn, and the two
       halves keep the rows that share the height. */
    .inputs {
        grid-row: 3;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 6px;
        min-height: 0;
    }

    .result {
        grid-row: 4;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .text {
        flex: 1 1 auto;
        min-height: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        overflow: hidden;
    }

    .head {
        margin: 0 0 2px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
    }

    /* The count of open conflicts: status words at the end of the bar. */
    .left {
        margin-left: auto;
        color: var(--c-scm-conflict-txt);
        font-size: var(--fs-sm);
    }

    .note {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
