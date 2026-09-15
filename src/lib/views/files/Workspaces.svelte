<script lang="ts">
    // Layer 3, partial of views/Files.svelte. The workspace picker: one choice per saved workspace,
    // with the configured roots as the empty choice. The empty choice is the default workspace
    // because that workspace has no name: it is the configured roots and whatever the reader added
    // without saving, which is exactly what a cleared field means everywhere else in this tree.

    import Select from '$lib/ui/Select.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        current: string;
        names: string[];
        onselect: (name: string) => void;
    };

    let { current, names, onselect }: Props = $props();

    const choices = $derived(
        names.filter((name) => name !== '').map((name) => ({ id: name, label: name }))
    );
</script>

<Select
    value={current}
    label={t('files.workspace')}
    empty={t('files.workspace_default')}
    {choices}
    onchange={onselect}
/>
