<script lang="ts">
    // Layer 3, partial of views/sources/source/Source.svelte. The button a tab that could not open
    // its file offers, which reads the file again (read-again.ts).
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { readAgain, type ReadAgain } from './read-again';

    let { tab }: { tab: ReadAgain } = $props();

    const client = useState();
</script>

<ToolButton small label={t('source.retry')} onclick={() => void readAgain(client, tab)} />
