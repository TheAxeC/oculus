<script lang="ts">
    // Layer 3, shared view. One main file of a LaTeX target: its name, when its PDF was written,
    // the controls that build, clean, open and count it, what the last build reported, and the two
    // lists that open under it, its outline and its problems.
    //
    // Build and clean are terminals, started through the LaTeX store
    // (state/sessions/latex.svelte.ts) over state/sessions/terminals.svelte.ts: the command and the
    // folder it runs in are the server's, the page sends the target and the file. The store watches
    // the terminal a press opened, so the row reads the state again when it ends, and the row
    // selects and shows it, so the reader watches latexmk run. The row says `building` beside the
    // PDF time while the store holds a build of the main file, whoever asked for it. The words of a
    // count are held in the state until the main is built again.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Disclosure from '$lib/ui/tree/Disclosure.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import { stamp } from '$lib/state/shared/words/format';
    import type { LatexMain, LatexTarget } from '$lib/state/sessions/latex.svelte';
    import type { LatexStep } from '$lib/state/sessions/terminals.svelte';
    import { nameOf } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { openSourceFile } from '../links/source-file';
    import Outline from './Outline.svelte';
    import Problems from './Problems.svelte';
    import { inFolder, logFile } from './places';

    type Props = {
        target: LatexTarget;
        row: LatexMain;
        /** The root the paths of the row are against. */
        root: string;
        /** The folder of the main files, against the root. */
        dir: string;
    };

    let { target, row, root, dir }: Props = $props();

    const client = useState();
    const {
        latex: { count, run: startLatex },
        layout: { openView },
        selection: { select },
        terminals: { showTerminal }
    } = client;

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    /** Which of the two lists under the row is open; one at a time, since they are details. */
    let opened = $state<'' | 'outline' | 'problems'>('');

    /** What the last press answered, which is the one outcome line this row holds. */
    let said = $state('');

    /** The main file's path against the root. */
    const mainPath = $derived(inFolder(dir, row.main));

    const total = $derived(row.errors.length + row.warnings.length);

    const pdfLabel = $derived(
        row.pdf === null
            ? t('latex.no_pdf')
            : t('latex.pdf_at', stamp(new Date(row.pdf).toISOString(), now))
    );

    function toggle(list: 'outline' | 'problems'): void {
        opened = opened === list ? '' : list;
    }

    async function run(step: LatexStep): Promise<void> {
        said = '';
        const answer = await startLatex(target, row.main, step);
        if (!answer.ok) {
            said = t('latex.refused', answer.error);
            return;
        }
        select(answer.id);
        showTerminal(answer.id);
    }

    async function countWords(): Promise<void> {
        said = '';
        const counted = await count(target, row.main);
        if (counted.words === null) said = t('latex.count_refused', counted.error);
    }

    /** Open the built PDF as a file tab, which is where every PDF of the hub is read. */
    function openPdf(): void {
        if (row.pdfPath === '') return;
        openView('file', { root, path: row.pdfPath, label: nameOf(row.pdfPath) });
    }

    function openLog(): void {
        openSourceFile(client, logFile(root, dir, row.main));
    }
</script>

<div class="main" data-main={row.main}>
    <div class="top">
        <span class="nm" title={t('latex.program', row.program)}>{row.main}</span>
        <span class="ts">{pdfLabel}</span>
        {#if row.building}
            <span class="ts" data-building>{t('latex.building')}</span>
        {/if}
        <ToolButton
            small
            label={t('latex.build')}
            title={t('latex.build_tip')}
            onclick={() => void run('build')}
        />
        <ToolButton
            small
            label={t('latex.clean')}
            title={t('latex.clean_tip')}
            onclick={() => void run('clean')}
        />
        {#if row.pdf !== null}
            <ToolButton
                small
                label={t('latex.open_pdf')}
                title={t('latex.open_pdf_tip')}
                onclick={openPdf}
            />
        {/if}
        {#if row.log !== null}
            <ToolButton small label={t('latex.log')} title={t('latex.log_tip')} onclick={openLog} />
        {/if}
        <ToolButton
            small
            label={t('latex.count')}
            title={t('latex.count_tip')}
            onclick={() => void countWords()}
        />
        <ToolButton
            small
            label={t('latex.outline')}
            title={t('latex.outline_tip')}
            expanded={opened === 'outline'}
            onclick={() => toggle('outline')}
        />
    </div>
    <div class="counts">
        {#if total > 0}
            <Disclosure
                count={total}
                label={t('latex.problems')}
                expanded={opened === 'problems'}
                onclick={() => toggle('problems')}
            />
            <span class="note"
                >{t('latex.problem_counts', row.errors.length, row.warnings.length)}</span
            >
        {:else if row.log !== null}
            <span class="note">{t('latex.no_errors')}</span>
        {/if}
        {#if row.words !== null}
            <span class="note">{t('latex.words', row.words)}</span>
        {/if}
    </div>
    {#if said !== ''}
        <Empty error message={said} />
    {/if}
    {#if opened === 'outline'}
        <Outline {target} {root} main={row.main} />
    {/if}
    {#if opened === 'problems'}
        <Problems {root} {mainPath} errors={row.errors} warnings={row.warnings} />
    {/if}
</div>

<style>
    .main {
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 5px 8px;
        margin-bottom: 4px;
    }

    .top {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .nm {
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
    }

    .ts,
    .note {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .counts {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }
</style>
