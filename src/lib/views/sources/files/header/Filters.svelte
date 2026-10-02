<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The view's bar: the filter box that
    // narrows the folders already read by name, and VS Code's find widget toggle Fuzzy Match. Off,
    // the filter matches a run of the typed text in a name; on, it matches every letter of the text
    // in order (state/shared/words/fuzzy.ts) and the tree marks the letters that matched. The
    // toggle is the tab's own state. The two listing toggles (hidden and ignored files) are items
    // of the workspace header's menu.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The filter text typed so far. */
        value: string;
        /** Whether the filter matches fuzzily. */
        fuzzy: boolean;
        onfilter: (value: string) => void;
        onfuzzy: () => void;
    };

    let { value, fuzzy, onfilter, onfuzzy }: Props = $props();
</script>

<Toolbar label={t('files.filters')}>
    <Search fill {value} placeholder={t('files.filter')} oninput={onfilter} />
    <Chip
        label={t('files.fuzzy')}
        title={t('files.fuzzy_title')}
        pressed={fuzzy}
        onclick={onfuzzy}
    />
</Toolbar>
