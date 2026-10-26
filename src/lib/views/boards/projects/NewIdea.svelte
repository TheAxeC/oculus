<script lang="ts">
    // Layer 3, view partial of views/boards/projects/Projects.svelte. The board's new-project form
    // delegates to the shared form that Lit Watch also opens, so both paths scaffold a project
    // through one component.

    import NewIdeaForm from '$lib/views/shared/forms/NewIdeaForm.svelte';

    type Props = {
        onclose: () => void;
        onsaid: (said: string) => void;
        /**
         * The tier the board writes in the hub given: its one tier, else the default tier of
         * `tiers` when the board names none or names it among several.
         */
        tierOf?: (hub: string) => string | undefined;
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

    let { onclose, onsaid, tierOf, roles, takes, seed, oncreated }: Props = $props();
</script>

<NewIdeaForm {onclose} {onsaid} {tierOf} {roles} {takes} {seed} {oncreated} />
