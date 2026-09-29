<script lang="ts">
    // An icon list held open for tests/ui/forms/glyph-select.test.ts: the list
    // ui/forms/choice/GlyphSelect.svelte draws, inside an open bits-ui Select drawn in place, since
    // the page's list goes through the portal and a server render draws nothing there.

    import { Select } from 'bits-ui';
    import GlyphList from '../../../src/lib/ui/forms/choice/GlyphList.svelte';
    import { glyphItems } from '../../../src/lib/ui/forms/choice/choices.ts';

    type Props = { value: string; empty: string; choices: string[] };

    let { value, empty, choices }: Props = $props();
</script>

<Select.Root type="single" open {value}>
    <Select.Content>
        {#snippet child({ wrapperProps, props })}
            <div {...wrapperProps}>
                <GlyphList
                    label="Icon of button 1"
                    items={glyphItems(value, empty, choices)}
                    list={props}
                />
            </div>
        {/snippet}
    </Select.Content>
</Select.Root>
