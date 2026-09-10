<script lang="ts">
    // The second view for tests/shell/workbench.test.ts. See Alpha.svelte.

    type Props = { instance: { id: string } };

    let { instance }: Props = $props();
</script>

<div class="beta" data-beta={instance.id}>beta</div>
