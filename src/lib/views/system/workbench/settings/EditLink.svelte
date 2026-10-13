<script lang="ts">
    // Layer 3, view partial. "Edit in <file>": the control that opens a config file in a source
    // tab, at the line of the key when there is one. Settings that are lists, families and keys
    // missing from the file are set there. The file is oculus's own, or the primary hub's settings
    // file for a key of the hub list (`root` and `file` name it), and it is opened through the
    // workspace folder that holds it; with no such folder the control says so instead.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import { openTarget } from '$lib/state/system/config/config-files';
    import { useState } from '$lib/state/client/use';

    const {
        fs: { workspaces },
        layout: { openView }
    } = useState();

    let { root, file, line }: { root: string; file: string; line?: number } = $props();

    const target = $derived(openTarget(root, file, workspaces()));
</script>

{#if target !== null}
    <ToolButton
        label={t('workbench.settings_edit_in', file)}
        glyph="edit"
        title={t('workbench.settings_edit_in_tip', file)}
        onclick={() => openView('source', sourceTabState(target.root, target.path, line))}
    />
{:else}
    <span class="unavailable">{t('workbench.settings_open_unavailable', file)}</span>
{/if}

<style>
    .unavailable {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
