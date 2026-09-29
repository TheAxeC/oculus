<script lang="ts">
    // Layer 3, view partial of the project tab. The manuscript's main files: one row each, with
    // what the last build left, the two controls that build and clean it, and the errors that build
    // reported.
    //
    // A main file is content rather than configuration, so the rows are whatever the folder holds:
    // server/content/latex.ts answers with every `.tex` directly under `manuscript/` that declares
    // a document class, and a project whose folder holds none draws no panel at all.
    //
    // Both controls are terminals, started through state/sessions/terminals.svelte.ts the way the
    // recovery and update-task controls are: the command and the folder it runs in are the
    // server's, the page sends the project and the file. The terminal the press opened is selected
    // and shown in the Terminal tab of the page on screen, or a new one (the terminals store's
    // `showTerminal`), as every start is, so the output is in front of the reader while it runs.
    //
    // The end of a build is the terminal leaving the list, which state/sessions/latex.svelte.ts
    // watches: it asks for the state again, and the row redraws with the new PDF time and the new
    // error count.

    import Disclosure from '$lib/ui/tree/Disclosure.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { HUB_ROOT, nameOf } from '$lib/state/sources/fs';
    import { stamp } from '$lib/state/shared/words/format';
    import type { LatexIssue, LatexMain } from '$lib/state/sessions/latex.svelte';
    import type { LatexStep } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The project this panel is for, which is the tab's own id. */
        id: string;
    };

    let { id }: Props = $props();

    const {
        latex: { state: latexOf, watch },
        layout: { openView },
        selection: { select },
        terminals: { latex: startLatex, showTerminal }
    } = useState();

    const held = $derived(latexOf(id));
    const shown = $derived(held.mains);

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    /** Which main file's errors are open. One at a time: the list is a detail, not the panel. */
    let opened = $state('');

    /** What the last press answered, which is the one outcome line this panel holds. */
    let said = $state('');

    /** When the PDF was last written, or that there is none. */
    function pdfLabel(row: LatexMain): string {
        return row.pdf === null
            ? t('project.latex.no_pdf')
            : t('project.latex.pdf_at', stamp(new Date(row.pdf).toISOString(), now));
    }

    /**
     * Where one error is, as far as the log said: the file and the line, one of them, or neither.
     */
    function where(issue: LatexIssue): string {
        if (issue.file !== '' && issue.line !== null) {
            return t('project.latex.at', issue.file, issue.line);
        }
        if (issue.file !== '') return issue.file;
        return issue.line === null ? '' : t('project.latex.at_line', issue.line);
    }

    function toggle(main: string): void {
        opened = opened === main ? '' : main;
    }

    /**
     * Start one step on one file. The terminal it opened is watched, so the panel reads the state
     * again when it ends, and it is selected and shown, so the reader watches latexmk run.
     */
    async function run(row: LatexMain, step: LatexStep): Promise<void> {
        said = '';
        const answer = await startLatex(id, row.main, step);
        if (!answer.ok) {
            said = t('project.latex.refused', answer.error);
            return;
        }
        watch(id, answer.id);
        select(answer.id);
        showTerminal(answer.id);
    }

    /** Open the built PDF as a file tab, which is where every PDF of the hub is read. */
    function openPdf(row: LatexMain): void {
        if (held.folder === '' || row.pdfPath === '') return;
        const path = `${held.folder}/${row.pdfPath}`;
        openView('file', { root: HUB_ROOT, path, label: nameOf(path) });
    }
</script>

{#if shown.length > 0 || held.error !== ''}
    <section class="block" data-latex={id}>
        <h3 class="heading">{t('project.latex.heading')}</h3>
        {#if held.error !== ''}
            <p class="failed">{t('project.latex.read_failed', held.error)}</p>
        {/if}
        {#if said !== ''}
            <p class="failed">{said}</p>
        {/if}
        {#each shown as row (row.main)}
            <div class="main" data-main={row.main}>
                <div class="top">
                    <span class="nm">{row.main}</span>
                    <span class="ts">{pdfLabel(row)}</span>
                    <ToolButton
                        label={t('project.latex.build')}
                        title={t('project.latex.build_tip')}
                        onclick={() => void run(row, 'build')}
                    />
                    <ToolButton
                        label={t('project.latex.clean')}
                        title={t('project.latex.clean_tip')}
                        onclick={() => void run(row, 'clean')}
                    />
                    {#if row.pdf !== null}
                        <ToolButton
                            label={t('project.latex.open_pdf')}
                            title={t('project.latex.open_pdf_tip')}
                            onclick={() => openPdf(row)}
                        />
                    {/if}
                </div>
                <div class="counts">
                    {#if row.errors.length > 0}
                        <Disclosure
                            count={row.errors.length}
                            label={t('project.latex.errors')}
                            expanded={opened === row.main}
                            onclick={() => toggle(row.main)}
                        />
                    {:else if row.log !== null}
                        <span class="clean">{t('project.latex.no_errors')}</span>
                    {/if}
                    {#if row.warnings.length > 0}
                        <span class="warns">
                            {t('project.latex.warnings', row.warnings.length)}
                        </span>
                    {/if}
                </div>
                {#if opened === row.main}
                    <ul class="issues">
                        {#each row.errors as issue, at (at)}
                            <li>
                                <span class="at">{where(issue)}</span>
                                <span class="msg">{issue.message}</span>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/each}
    </section>
{/if}

<style>
    .block {
        min-width: 0;
    }

    .heading {
        margin: 0 0 6px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .failed {
        margin: 0 0 4px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

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
    }

    .nm {
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
    }

    .ts,
    .clean,
    .warns {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .counts {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 4px;
    }

    .issues {
        margin: 4px 0 0;
        padding: 0;
        list-style: none;
    }

    .issues li {
        display: flex;
        gap: 6px;
        font-size: var(--fs-sm);
        overflow-wrap: anywhere;
    }

    .at {
        font-family: var(--font-mono);
        color: var(--muted-txt, var(--muted));
    }

    .msg {
        color: var(--ink-txt, var(--ink));
    }
</style>
