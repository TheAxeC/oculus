<script lang="ts">
    // Layer 3, view partial. "Edit in <file>": the control that opens a config file in a source
    // tab, at the line of the key when there is one. Settings that are lists, families and keys
    // missing from the file are set there.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { ENGINE_ROOT } from '$lib/state/sources/fs';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView }
    } = useState();

    let { file, line }: { file: string; line?: number } = $props();
</script>

<ToolButton
    label={t('workbench.settings_edit_in', file)}
    glyph="edit"
    title={t('workbench.settings_edit_in_tip', file)}
    onclick={() => openView('source', sourceTabState(ENGINE_ROOT, file, line))}
/>
