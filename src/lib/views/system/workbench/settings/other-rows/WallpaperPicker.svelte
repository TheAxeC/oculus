<script lang="ts">
    // Layer 3, view partial. The picker under the wallpaper rows of the Settings view: the images
    // of every hub's wallpaper folder as small tiles grouped by hub, with a Random tile (one image
    // of any hub, kept until the server restarts) and a None tile. The chosen tile is the value of
    // `wallpaper.image`, written as `<hub name>/<file name>`, `random` or the empty text into the
    // primary hub's own appearance.yml by the row writer, as every other pick of the view is. The
    // thumbnails are the images themselves, drawn small by the browser from the image route.

    import ThumbGrid, { type ThumbGroup } from '$lib/ui/display/ThumbGrid.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { wallpaperUrl, WALLPAPER_RANDOM } from '$lib/state/life/pictures/wallpapers.svelte';
    import type { ConfigRow } from '$lib/state/system/config/rows';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';

    const {
        wallpapers: { list, reload }
    } = useState();

    let { row, writer }: { row: ConfigRow; writer: RowWriter } = $props();

    // The folders of the workspace and the files in them are read again each time a picker opens.
    $effect(() => {
        reload();
    });

    /** The value in force: the one sent while its write is out, else the file's. */
    const chosen = $derived.by(() => {
        const held = writer.shown(row) ?? row.value;
        return typeof held === 'string' ? held : '';
    });

    const found = $derived(list());

    /** The Random and None tiles, then the images of each hub that holds any. */
    const groups = $derived<ThumbGroup[]>([
        {
            heading: '',
            tiles: [
                { id: '', label: t('workbench.settings_wallpaper_none') },
                { id: WALLPAPER_RANDOM, label: t('workbench.settings_wallpaper_random') }
            ]
        },
        ...found.hubs
            .filter((one) => one.images.length > 0)
            .map((one) => ({
                heading: one.hub,
                tiles: one.images.map((file) => ({
                    id: `${one.hub}/${file}`,
                    label: file,
                    src: wallpaperUrl(one.hub, file)
                }))
            }))
    ]);

    const empty = $derived(!found.loading && found.error === '' && groups.length === 1);
</script>

<div class="picker">
    <ThumbGrid
        {groups}
        {chosen}
        label={t('workbench.settings_wallpaper_label')}
        onpick={(id: string) => void writer.submit(row, id)}
    />
    {#if found.error !== ''}
        <p class="note">{t('workbench.settings_wallpaper_failed', found.error)}</p>
    {:else if empty}
        <p class="note">{t('workbench.settings_wallpaper_empty')}</p>
    {/if}
</div>

<style>
    .picker {
        max-width: 720px;
    }

    .note {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
