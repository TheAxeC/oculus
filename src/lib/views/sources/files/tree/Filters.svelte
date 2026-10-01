<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The view's bar: the filter box that
    // narrows the folders already read by name, and the two toggles that list hidden files and the
    // files git ignores. The toggles are the tab's own state, so two file browsers list the same
    // folder each their own way.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import type { ListingShown } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The filter text typed so far. */
        value: string;
        /** What the tab's listings show beside the default, which the two toggles flip. */
        shown: ListingShown;
        onfilter: (value: string) => void;
        /** Flip one of the two toggles. */
        onshow: (which: keyof ListingShown) => void;
    };

    let { value, shown, onfilter, onshow }: Props = $props();
</script>

<Toolbar label={t('files.filters')}>
    <Search fill {value} placeholder={t('files.filter')} oninput={onfilter} />
    <Chip
        label={t('files.show_hidden')}
        title={t('files.show_hidden_title')}
        pressed={shown.hidden}
        onclick={() => onshow('hidden')}
    />
    <Chip
        label={t('files.show_ignored')}
        title={t('files.show_ignored_title')}
        pressed={shown.ignored}
        onclick={() => onshow('ignored')}
    />
</Toolbar>
