<script lang="ts">
    // Layer 3, shared view. One main file of a LaTeX target as the project tab draws it: its name,
    // which opens it as a source tab, the state of its build (running, built, failed or stopped,
    // and when its PDF was written), and the controls Build, Clean, View PDF and Count Words, with
    // the count of the problems of the last build, whose press shows them in the Problems view
    // limited to the root. Everything goes through the LaTeX store
    // (state/sessions/latex/latex.svelte.ts) and its actions (state/sessions/latex/actions.ts), the
    // ones the source tab's bar, the keys and the TeX view use, so a main file behaves the same
    // wherever it is drawn. The row says `building` while the store holds a build of the main file,
    // whoever asked for it. The words of a count are held in the state until the main is built
    // again, and a refusal of a press is said as a notice.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { stamp } from '$lib/state/shared/words/format';
    import type { LatexMain } from '$lib/state/sessions/latex/latex-state';
    import type { LatexTarget } from '$lib/state/sessions/terminal/latex-target';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { openSourceFile } from '../links/source-file';
    import { stateGlyph, stateWords } from './state-words';
    import { inFolder } from './places';

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
        latex: { buildOf },
        latexActions,
        problems
    } = client;

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    /** The main file's path against the root. */
    const mainPath = $derived(inFolder(dir, row.main));

    const build = $derived(buildOf(target, row.main));
    const building = $derived(row.building || build.status === 'building');
    const total = $derived(row.errors.length + row.warnings.length);
    const errorsSaid = $derived(
        row.errors.length === 1 ? t('latex.error_one') : t('latex.errors_many', row.errors.length)
    );
    const warningsSaid = $derived(
        row.warnings.length === 1
            ? t('latex.warning_one')
            : t('latex.warnings_many', row.warnings.length)
    );
    const pdfLabel = $derived(
        row.pdf === null
            ? t('latex.no_pdf')
            : t('latex.pdf_at', stamp(new Date(row.pdf).toISOString(), now))
    );
    /** The glyph of the build's state, the empty string before any build ran. */
    const stateGlyphed = $derived(stateGlyph(building ? 'building' : build.status));
</script>

<div class="main" data-main={row.main}>
    <div class="top">
        {#if stateGlyphed !== ''}
            <ToolButton
                bare
                label={stateWords(building ? 'building' : build.status)}
                title={build.reason === '' ? undefined : build.reason}
                glyph={stateGlyphed}
                turning={building}
                disabled
                onclick={() => undefined}
            />
        {/if}
        <ToolButton
            plain
            label={row.main}
            title={t('latex.open_source_tip', row.main)}
            onclick={() => openSourceFile(client, { root, path: mainPath })}
        />
        <span class="ts">{pdfLabel}</span>
        {#if building}
            <ToolButton
                small
                label={t('latex.kill')}
                onclick={() => void latexActions.stop(root, mainPath)}
            />
        {:else}
            <ToolButton
                small
                label={t('latex.build')}
                title={t('latex.build_tip')}
                onclick={() => void latexActions.build(root, mainPath)}
            />
        {/if}
        <ToolButton
            small
            label={t('latex.clean')}
            title={t('latex.clean_tip')}
            onclick={() => void latexActions.clean(root, mainPath)}
        />
        {#if row.pdf !== null}
            <ToolButton
                small
                label={t('latex.open_pdf')}
                title={t('latex.open_pdf_tip')}
                onclick={() => void latexActions.viewPdf(root, mainPath)}
            />
        {/if}
        <ToolButton
            small
            label={t('latex.count')}
            title={t('latex.count_tip')}
            onclick={() => void latexActions.count(root, mainPath)}
        />
    </div>
    <div class="counts">
        {#if total > 0}
            <ToolButton
                small
                label={t(
                    'latex.problem_pill',
                    total,
                    total === 1 ? t('latex.problem') : t('latex.problems')
                )}
                title={t('latex.problems_open_tip')}
                onclick={() => problems.show(root)}
            />
            <span class="note">{t('latex.problem_counts', errorsSaid, warningsSaid)}</span>
        {:else if row.log !== null}
            <span class="note">{t('latex.no_errors')}</span>
        {/if}
        {#if row.words !== null}
            <span class="note"
                >{row.words === 1 ? t('latex.words_one') : t('latex.words', row.words)}</span
            >
        {/if}
    </div>
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
