<script lang="ts">
    // Layer 3, shell. The status bar's LaTeX item, LaTeX Workshop's build status item: the state of
    // the build of the root the reader is in front of. A spinner and the word Build (with the step
    // when it is a clean or a checkcites run) while the build runs, a check after it succeeded, a
    // cross after it failed or was stopped, and a plain hammer before any build ran in this page's
    // session. Its tooltip names the root, the recipe the build ran, when it ended and the words
    // of the last count. A press shows the TeX view (state/sessions/latex/actions.ts `texView`).
    //
    // While a build or clean of any main file of the root's folder waits for the reader to
    // approve the latexmkrc files or the weave tools it would run (state/sessions/latex/builds.ts),
    // the item is in the warning tone, its tooltip names that main file, and a press opens the list
    // to approve (shell/commands/LatexAsk.svelte) in place of the TeX view. Of several waiting
    // main files it is the one that has waited longest.
    //
    // The root is the one of the active tab when that tab is a LaTeX file or the PDF of a build,
    // asked of the server by the file (`rootOfFile`) again when the tab changes, and the root of
    // the last such tab stays while any other tab is active. The item is drawn while the active tab
    // is a LaTeX file that has a root or the PDF of a build, and, whatever tab is active, while a
    // build of that root runs or a main file of its folder waits on an approval: a LaTeX file with
    // no root and a PDF no build wrote draw nothing, and any other tab draws nothing once the build
    // has ended. While no such tab has been active, the item is drawn for the build this page
    // started last while it runs, or for the step that has waited on an approval longest.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { isLatexFile } from '$lib/data/prose/latex';
    import { stamp } from '$lib/state/shared/words/format';
    import type { LatexRoot } from '$lib/state/sessions/latex/latex-state';
    import { fileOfTab } from '$lib/state/workbench/navigation/pages';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { latex, latexActions, layout } = useState();

    /** The root of the active tab, null while it is none or the server has not answered. */
    let root = $state<LatexRoot>(null);

    const active = $derived(layout.activeInstance());
    const file = $derived(active === null ? null : fileOfTab(active));
    const latexTab = $derived(file !== null && isLatexFile(file.path));
    const pdfTab = $derived(file?.path.toLowerCase().endsWith('.pdf') === true);

    $effect(() => {
        if (!latexTab && !pdfTab) return;
        const at = file;
        root = null;
        if (at === null) return;
        let live = true;
        void latexActions.rootOfFile(at.root, at.path).then((found) => {
            if (live && found !== null) root = found;
        });
        return () => {
            live = false;
        };
    });

    /** The build this page runs, read while no tab has given the item a root. */
    const running = $derived(root === null ? latex.running() : null);
    /** The main file of the root's folder, or of any folder, whose step has waited longest. */
    const waiting = $derived(
        latex.waiting(root === null ? undefined : { root: root.root, path: root.path })
    );
    const target = $derived(
        root === null
            ? (running?.target ?? waiting?.target ?? null)
            : { root: root.root, path: root.path }
    );
    const mainFile = $derived(root?.main ?? running?.main ?? waiting?.main ?? null);
    const build = $derived(
        target === null || mainFile === null ? null : latex.buildOf(target, mainFile)
    );
    const main = $derived(
        target === null || mainFile === null
            ? null
            : (latex.state(target).mains.find((one) => one.main === mainFile) ?? null)
    );
    /** This page's build of the root runs, or the server says another page's build of it does. */
    const building = $derived(build?.status === 'building' || main?.build === 'running');
    /** A build or clean waits for the reader to approve what it would run. */
    const unapproved = $derived(waiting !== null);

    /**
     * Drawn while the active tab is a LaTeX file or a PDF and the server found its root, and while
     * a build of that root, or with no root the build this page runs, runs under any other tab.
     */
    const drawn = $derived(
        target !== null && ((root !== null && (latexTab || pdfTab)) || building || unapproved)
    );

    const stepWords = $derived.by(() => {
        if (build === null || build.step === 'build') return t('statusbar.latex_label');
        return build.step === 'clean'
            ? t('statusbar.latex_label_clean')
            : t('statusbar.latex_label_checkcites');
    });

    const glyph = $derived.by(() => {
        if (building) return 'latex_building';
        if (build === null || build.status === 'idle') return 'latex_build';
        return build.status === 'succeeded' ? 'latex_ok' : 'latex_failed';
    });

    const tip = $derived.by(() => {
        if (mainFile === null) return '';
        const named =
            root === null ? mainFile : root.path === '' ? root.main : `${root.path}/${root.main}`;
        if (waiting !== null) {
            const at =
                root === null || root.path === '' ? waiting.main : `${root.path}/${waiting.main}`;
            return t('statusbar.latex_unapproved_tip', at);
        }
        const parts = [t('statusbar.latex_tip_root', named)];
        if (build !== null && build.recipe !== '') {
            parts.push(t('statusbar.latex_tip_recipe', build.recipe));
        }
        if (build !== null && build.at !== null) {
            parts.push(t('statusbar.latex_tip_at', stamp(new Date(build.at).toISOString())));
        }
        if (main !== null && main.words !== null) {
            parts.push(t('statusbar.latex_tip_words', main.words));
        }
        return parts.join('. ');
    });
</script>

{#if drawn}
    <span data-status="latex">
        <ToolButton
            label={stepWords}
            {glyph}
            turning={building}
            title={tip}
            status
            warning={unapproved}
            onclick={() =>
                waiting === null
                    ? latexActions.texView()
                    : latex.askApproval(waiting.target, waiting.main)}
        />
    </span>
{/if}
