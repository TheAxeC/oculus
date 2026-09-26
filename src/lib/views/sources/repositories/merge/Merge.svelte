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
    // state/sources/repositories/merge-regions.ts: what the two sides agree on is taken as it is,
    // and each stretch both changed differently is a conflict. Each conflict offers Accept
    // Incoming, Accept Current, Accept Both in either order, and Ignore, which leaves the common
    // ancestor's lines; an open conflict shows the ancestor's lines in the Result until then.
    //
    // The Result is text the reader may also edit, and typing into a conflict's lines settles it
    // by hand. The count of conflicts still open is in the bar. Complete Merge writes the Result
    // over the file and stages it, which is what tells git the conflict is resolved; with conflicts
    // still open it asks first. Where a side deleted the file, the pane says which, Accept Deletion
    // takes the deletion (the file leaves the index and the worktree) after a confirm, and Complete
    // Merge over an empty Result does the same, since an empty Result is the deleted side.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import MergeSide, { type SideConflict } from './MergeSide.svelte';
    import {
        initialPieces,
        openCount,
        regionsOf,
        settlePiece,
        takesDeletion,
        typedPieces,
        type Choice,
        type Region
    } from '$lib/state/sources/repositories/merge-regions';
    import { sidesUrl, type GitMergeSides } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const { repositories } = useState();

    let { instance }: ViewProps = $props();

    const root = $derived(read(instance.state, 'root'));
    const path = $derived(read(instance.state, 'path'));

    let sides: GitMergeSides | null = $state(null);
    let failure = $state('');
    let regions: Region[] = $state([]);
    let choices: Choice[] = $state([]);
    let pieces: string[] = $state([]);
    let done = $state(false);
    let asking = $state(false);
    let deleting = $state(false);
    /** What the last read was over, so a redraw does not read again. */
    let taken = '';

    const result = $derived(pieces.join(''));
    const left = $derived(openCount(regions, choices));
    const busy = $derived(repositories.busy(root));

    function read(state: unknown, key: string): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const value = (state as Record<string, unknown>)[key];
        return typeof value === 'string' ? value : '';
    }

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
            const body = (await response.json()) as { sides?: GitMergeSides; error?: string };
            if (!response.ok || body.sides === undefined) {
                failure = body.error ?? t('repositories.merge_failed');
                return;
            }
            sides = body.sides;
            regions = regionsOf(body.sides.base, body.sides.ours, body.sides.theirs);
            choices = regions.map(() => 'open');
            pieces = initialPieces(regions);
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
        pieces = settlePiece(pieces, regions, region, choice);
        choices = choices.map((held, at) => (at === region ? choice : held));
    }

    function typed(next: string): void {
        const edit = typedPieces(pieces, next);
        pieces = edit.pieces;
        choices = choices.map((held, at) =>
            edit.touched.includes(at) && regions[at].kind === 'conflict' ? 'edited' : held
        );
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
    <Toolbar label={t('views.repositories_merge')}>
        <span class="left" data-conflicts-left={left}>{t('repositories.merge_left', left)}</span>
        <ToolButton
            label={t('repositories.merge_complete')}
            glyph="check"
            disabled={busy || sides === null || done}
            onclick={() => (left > 0 ? (asking = true) : void complete())}
        />
        {#if sides !== null && sides.deleted !== ''}
            <ToolButton
                label={t('repositories.merge_delete')}
                title={t('repositories.merge_delete_title')}
                glyph="trash"
                disabled={busy || done}
                onclick={() => (deleting = true)}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('repositories.merge_editor_title', path)} toolbar={tools} tinted>
    <div class="merge" data-instance={instance.id} data-view="repositories-merge" data-path={path}>
        {#if root === '' || path === ''}
            <Empty message={t('repositories.merge_empty')} glyph="merge" />
        {:else if failure !== ''}
            <p class="failed">{failure}</p>
        {:else if sides === null}
            <p class="note">{t('repositories.merge_pending')}</p>
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
                    onchoose={choose}
                />
                <MergeSide
                    side="current"
                    text={sides.ours}
                    conflicts={conflictsOf('ours')}
                    onchoose={choose}
                />
            </div>
            <div class="result" data-merge-result>
                <p class="head">{t('repositories.merge_result')}</p>
                <TextArea
                    value={result}
                    label={t('repositories.merge_result')}
                    rows={12}
                    spellcheck={false}
                    code
                    oninput={typed}
                />
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

    .head {
        margin: 0 0 2px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        text-transform: uppercase;
    }

    .left {
        color: var(--c-scm-conflict-txt);
        font-size: var(--fs-sm);
    }

    .note,
    .failed {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .failed {
        color: var(--c-red-txt, var(--muted));
    }
</style>
