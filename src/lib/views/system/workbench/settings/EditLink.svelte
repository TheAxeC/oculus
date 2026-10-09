<script lang="ts">
    // Layer 3, view partial. "Edit in <file>": the control that opens a config file in a source
    // tab, at the line of the key when there is one. Settings that are lists, families and keys
    // missing from the file are set there. The file is the engine's, or the hub layer's file for a
    // key of the hub list (`root` and `file` name it).

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView }
    } = useState();

    let { root, file, line }: { root: string; file: string; line?: number } = $props();
</script>

<ToolButton
    label={t('workbench.settings_edit_in', file)}
    glyph="edit"
    title={t('workbench.settings_edit_in_tip', file)}
    onclick={() => openView('source', sourceTabState(root, file, line))}
/>
