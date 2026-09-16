<script lang="ts">
    // Layer 3, shell. The appearance controls at the foot of the rail: the two openers the page
    // owns, the theme list, the text-size steps, and the toggles for the CRT overlay, the wallpaper
    // and the glyph vocabulary. They are the rail's own concern and none of the pane tree's, which
    // is why they live apart from the view buttons above them.
    //
    // The rail is one stop of the browser's focus order and these controls are part of its ring, so
    // their place in it and the keys that move along it are handed down rather than decided here:
    // the ring spans the view buttons and these together, and one list of it cannot live in two
    // components. The same holds for what each step can do, which decides both whether a control is
    // pressable and whether it is in the ring at all.

    import Menu from '$lib/ui/Menu.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import { themes as themeList } from '$lib/state/appearance';
    import { useState } from '$lib/state/use';

    const {
        ui: {
            crt,
            setCrt,
            setTextScale,
            setTheme,
            setUnicode,
            setWallpaper,
            theme,
            unicode,
            wallpaper,
            stepTextScale
        }
    } = useState();

    type Props = {
        /** One control's place in the browser's focus order, from the rail that owns the ring. */
        stopIndex: (id: string) => number;
        /** The keyboard for one control of the ring, from the rail that owns it. */
        ringKeys: (id: string) => (event: KeyboardEvent) => void;
        /** Whether the text size can still step down, up, and back to what it was. */
        canShrink: boolean;
        canGrow: boolean;
        canReset: boolean;
        /** Whether the theme in force has a wallpaper to switch. */
        offersWallpaper: boolean;
        /** Open the workbench search overlay. */
        onsearch: () => void;
        /** Open the update-task tray. */
        onupdate: () => void;
    };

    let {
        stopIndex,
        ringKeys,
        canShrink,
        canGrow,
        canReset,
        offersWallpaper,
        onsearch,
        onupdate
    }: Props = $props();

    const themes = $derived(
        themeList().map((entry) => ({
            id: entry.name,
            label: entry.label,
            active: entry.name === theme()
        }))
    );
</script>

<div class="controls">
    <div data-action="search">
        <ToolButton
            label={t('app.search')}
            title={t('app.search_tip')}
            glyph="cmd"
            compact
            rail
            stop="search"
            tabindex={stopIndex('search')}
            onkeydown={ringKeys('search')}
            onclick={onsearch}
        />
    </div>
    <div data-action="update">
        <ToolButton
            label={t('app.tasks.update_tasks')}
            title={t('app.update_tip')}
            glyph="refresh"
            compact
            rail
            stop="update"
            tabindex={stopIndex('update')}
            onkeydown={ringKeys('update')}
            onclick={onupdate}
        />
    </div>
    <Menu
        label={t('ui.theme')}
        glyph={t('ui.theme_glyph')}
        compact
        rail
        stop="theme"
        tabindex={stopIndex('theme')}
        onkeydown={ringKeys('theme')}
        items={themes}
        onpick={(name: string) => setTheme(name)}
    />
    <ToolButton
        label={t('app.text_smaller')}
        glyph="collapse"
        compact
        rail
        stop="text-smaller"
        tabindex={stopIndex('text-smaller')}
        onkeydown={ringKeys('text-smaller')}
        disabled={!canShrink}
        onclick={() => stepTextScale(-1)}
    />
    <ToolButton
        label={t('app.text_larger')}
        glyph="expand"
        compact
        rail
        stop="text-larger"
        tabindex={stopIndex('text-larger')}
        onkeydown={ringKeys('text-larger')}
        disabled={!canGrow}
        onclick={() => stepTextScale(1)}
    />
    <ToolButton
        label={t('app.text_reset')}
        glyph="refresh"
        compact
        rail
        stop="text-reset"
        tabindex={stopIndex('text-reset')}
        onkeydown={ringKeys('text-reset')}
        disabled={!canReset}
        onclick={() => setTextScale(null)}
    />
    <ToolButton
        label={t('ui.crt_on')}
        title={t('ui.crt_title')}
        glyph="crt"
        active={crt()}
        pressed={crt()}
        compact
        rail
        stop="crt"
        tabindex={stopIndex('crt')}
        onkeydown={ringKeys('crt')}
        onclick={() => setCrt(!crt())}
    />
    {#if offersWallpaper}
        <ToolButton
            label={t('ui.wallpaper')}
            title={t('ui.wallpaper_title')}
            glyph="wallpaper"
            active={wallpaper()}
            pressed={wallpaper()}
            compact
            rail
            stop="wall"
            tabindex={stopIndex('wall')}
            onkeydown={ringKeys('wall')}
            onclick={() => setWallpaper(!wallpaper())}
        />
    {/if}
    <ToolButton
        label={t('ui.unicode')}
        title={t('ui.unicode_title')}
        glyph="unicode"
        active={unicode()}
        pressed={unicode()}
        compact
        rail
        stop="unicode"
        tabindex={stopIndex('unicode')}
        onkeydown={ringKeys('unicode')}
        onclick={() => setUnicode(!unicode())}
    />
</div>

<style>
    /* On a short window the view list is what gives way, and it scrolls. Without the flex-shrink
       the foot shrinks with it, its buttons pile over each other and the last ones fall below the
       window, which leaves the theme menu unreachable. */
    .controls {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
        flex-shrink: 0;
    }
</style>
