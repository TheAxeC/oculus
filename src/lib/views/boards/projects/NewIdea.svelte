<script lang="ts">
    // Layer 3, view partial of views/boards/projects/Projects.svelte. The board's new-project form
    // delegates to the shared form that Lit Watch also opens, so both paths scaffold a project
    // through one component.

    import NewIdeaForm from '$lib/views/shared/forms/NewIdeaForm.svelte';

    type Props = {
        onclose: () => void;
        onsaid: (said: string) => void;
        tier: string;
        seed?: { id: string; eli5: string; title?: string };
        oncreated?: () => void | Promise<void>;
    };

    let { onclose, onsaid, tier, seed, oncreated }: Props = $props();
</script>

<NewIdeaForm {onclose} {onsaid} {tier} {seed} {oncreated} />
