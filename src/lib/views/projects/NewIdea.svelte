<script lang="ts">
    // Layer 3, view partial of views/Projects.svelte. The board's new-idea form delegates to the
    // shared form that Lit Watch also opens, so both paths scaffold an idea through one component.

    import NewIdeaForm from '$lib/views/shared/NewIdeaForm.svelte';

    type Props = {
        onclose: () => void;
        onsaid: (said: string) => void;
        seed?: { id: string; eli5: string; title?: string };
        oncreated?: () => void | Promise<void>;
    };

    let { onclose, onsaid, seed, oncreated }: Props = $props();
</script>

<NewIdeaForm {onclose} {onsaid} {seed} {oncreated} />
