<script lang="ts">
    // A view for tests/shell/workbench.test.ts, registered like a real one. It renders a marker and
    // the id of the instance it was mounted as, which is what the test looks for.

    type Props = { instance: { id: string } };

    let { instance }: Props = $props();
</script>

<div class="alpha" data-alpha={instance.id}>alpha</div>
