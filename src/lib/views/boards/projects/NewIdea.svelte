<script lang="ts">
    // Layer 3, view partial of views/boards/projects/Projects.svelte. The board's new-project form
    // delegates to the shared form that Lit Watch also opens, so both paths scaffold a project
    // through one component.

    import NewIdeaForm from '$lib/views/shared/forms/NewIdeaForm.svelte';

    type Props = {
        onclose: () => void;
        onsaid: (said: string) => void;
        /** The board's tier, the first word of its `tier:`; none for a board naming no tier. */
        tier?: string;
        /**
         * The board's `role:` keys, which the user is named by in the new manifest; null for a
         * board naming no `role:`, which names the user in the field of the first row of `roles:`.
         */
        roles: readonly string[] | null;
        /** Whether the board's rule takes the project the write makes in the hub given. */
        takes?: (hub: string) => boolean;
        seed?: { id: string; eli5: string; title?: string };
        oncreated?: () => void | Promise<void>;
    };

    let { onclose, onsaid, tier, roles, takes, seed, oncreated }: Props = $props();
</script>

<NewIdeaForm {onclose} {onsaid} {tier} {roles} {takes} {seed} {oncreated} />
