<script lang="ts">
    // Layer 3, primitive. A heading inside a group (GroupHead.svelte beside it heads the group): a
    // plain label in one style, with no fold, no pin and no strip, so every sub-heading of a view
    // reads alike and none of them is taken for a group of its own. It draws Settings' section
    // titles (views/system/workbench/settings/List.svelte), the Gallery's sub-headings
    // (views/system/gallery/Gallery.svelte) and the Catalogue's (views/system/workbench/
    // Catalogue.svelte). It takes any other attribute it is given, so Settings' section title keeps
    // the `data-toc-target` its table of contents scrolls to.

    import type { HTMLAttributes } from 'svelte/elements';

    type Props = Omit<HTMLAttributes<HTMLHeadingElement>, 'class' | 'style' | 'children'> & {
        /** The words of the heading. */
        label: string;
    };

    let { label, ...attributes }: Props = $props();
</script>

<h4 {...attributes} class="sub">
    {label}
</h4>

<style>
    .sub {
        margin: 0 0 4px;
        padding: 0 8px;
        font-size: var(--fs-sm);
        font-weight: 600;
        color: var(--muted-txt, var(--muted));
    }
</style>
