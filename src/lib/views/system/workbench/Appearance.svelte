<script lang="ts">
    // Layer 3, view partial. The appearance controls of the Settings view: the theme list, the
    // text-size steps, and the toggles for the CRT overlay, the wallpaper and the glyph vocabulary.
    // Each writes the ui store, which saves the six values together, so what the page looks like
    // comes back whole after a reload whichever control set it.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/words/text';
    import { themes as themeList, wallpaperOnTheme } from '$lib/state/words/appearance';
    import { useState } from '$lib/state/client/use';

    const {
        ui: {
            crt,
            setCrt,
            setTextScale,
            setTheme,
            setUnicode,
            setWallpaper,
            stepTextScale,
            textScale,
            theme,
            unicode,
            wallpaper
        }
    } = useState();

    const themes = $derived(
        themeList().map((entry) => ({
            id: entry.name,
            label: entry.label,
            active: entry.name === theme()
        }))
    );

    /** The theme in force, by the words its list gives it. */
    const current = $derived(themes.find((entry) => entry.active)?.label ?? theme());

    /**
     * The wallpaper toggle is drawn only where there is one to switch: it is config and a theme.
     */
    const offersWallpaper = $derived(wallpaperOnTheme(theme()));

    /** The two text steps say what they cannot do, and the reset is there only once it resets. */
    const canShrink = $derived((textScale() ?? 1) > 0.7);
    const canGrow = $derived((textScale() ?? 1) < 1.6);
    const canReset = $derived(textScale() !== null);
</script>

<section class="appearance" data-settings="appearance">
    <h3>{t('workbench.settings_appearance')}</h3>
    <div class="row">
        <Menu
            label={t('ui.theme')}
            glyph={t('ui.theme_glyph')}
            placement="down"
            items={themes}
            onpick={(name: string) => setTheme(name)}
        />
        <span class="value" data-theme-name>{current}</span>
    </div>
    <div class="row" role="group" aria-label={t('app.text')}>
        <span class="caption">{t('app.text')}</span>
        <ToolButton
            label={t('app.text_smaller')}
            glyph="collapse"
            compact
            disabled={!canShrink}
            onclick={() => stepTextScale(-1)}
        />
        <ToolButton
            label={t('app.text_reset')}
            glyph="note_back"
            compact
            disabled={!canReset}
            onclick={() => setTextScale(null)}
        />
        <ToolButton
            label={t('app.text_larger')}
            glyph="expand"
            compact
            disabled={!canGrow}
            onclick={() => stepTextScale(1)}
        />
    </div>
    <div class="row">
        <ToolButton
            label={t('ui.crt_on')}
            title={t('ui.crt_title')}
            glyph="crt"
            active={crt()}
            pressed={crt()}
            onclick={() => setCrt(!crt())}
        />
        {#if offersWallpaper}
            <ToolButton
                label={t('ui.wallpaper')}
                title={t('ui.wallpaper_title')}
                glyph="wallpaper"
                active={wallpaper()}
                pressed={wallpaper()}
                onclick={() => setWallpaper(!wallpaper())}
            />
        {/if}
        <ToolButton
            label={t('ui.unicode')}
            title={t('ui.unicode_title')}
            glyph="unicode"
            active={unicode()}
            pressed={unicode()}
            onclick={() => setUnicode(!unicode())}
        />
    </div>
</section>

<style>
    .appearance {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    h3 {
        margin: 0;
        font-size: var(--fs-sm);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .caption,
    .value {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
