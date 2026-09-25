<script lang="ts">
    // Layer 3, shared view partial. The control that opens the file a view is drawn from in the
    // source tab. It sits last in the view's toolbar, after the view's own controls, because
    // opening the file is the reader's way out of the view rather than one of its actions, and its
    // tooltip names the path so the reader knows which file the view draws before pressing it.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { openSourceFile, type SourceFile } from './source-file';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    let { file }: { file: SourceFile } = $props();
</script>

<span data-source-root={file.root} data-source-path={file.path}>
    <ToolButton
        label={t('views.open_source')}
        glyph="edit"
        title={t('views.open_source_tip', file.path)}
        onclick={() => openSourceFile(client, file)}
    />
</span>
