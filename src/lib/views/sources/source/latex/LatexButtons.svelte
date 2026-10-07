<script lang="ts">
    // Layer 3, partial of Source.svelte. The LaTeX controls at the right end of the breadcrumb bar
    // of a LaTeX source tab, LaTeX Workshop's title actions: Build, with the running state and Kill
    // Build while the root builds, View PDF (not on a `.bib` file) and Build Log. Each tooltip
    // names the key it has. The tab hands them up with the bar's other actions
    // (actions/BarActions.svelte).

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { chordHint } from '$lib/ui/controls/editor/chords';
    import { onMac } from '$lib/ui/controls/editor/kit/load';
    import { t } from '$lib/state/shared/words/text';
    import type { LatexTab } from './latex-tab.svelte';

    type Props = { tab: LatexTab };

    let { tab }: Props = $props();

    const mac = onMac();
    const hint = (code: 'KeyB' | 'KeyV'): string =>
        chordHint([{ code, cmd: true, alt: true }], mac);
</script>

{#if tab.building}
    <ToolButton
        bare
        label={t('latex.bar_kill')}
        title={t('latex.bar_kill_title', tab.build.recipe)}
        glyph="latex_kill"
        onclick={tab.press.kill}
    />
    <ToolButton
        bare
        label={t('latex.bar_building')}
        title={t('latex.bar_building_title', tab.build.recipe)}
        glyph="latex_building"
        turning
        disabled
        onclick={() => undefined}
    />
{:else}
    <ToolButton
        bare
        label={t('latex.bar_build')}
        title={t('latex.bar_build_title', hint('KeyB'))}
        glyph="latex_build"
        onclick={tab.press.build}
    />
{/if}
{#if !tab.bib}
    <ToolButton
        bare
        label={t('latex.bar_view')}
        title={t('latex.bar_view_title', hint('KeyV'))}
        glyph="latex_view"
        onclick={tab.press.view}
    />
{/if}
<ToolButton
    bare
    label={t('latex.bar_log')}
    title={t('latex.bar_log_title')}
    glyph="latex_log"
    onclick={tab.press.log}
/>
