<script lang="ts">
    // Layer 3, view partial. The appearance controls of the Settings view: the theme list, the
    // code theme menu, the text-size steps, and the toggles for the CRT overlay, the wallpaper and
    // the glyph vocabulary. Each writes the ui store, which saves the seven values together, so
    // what the page looks like comes back whole after a reload whichever control set it.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { themes as themeList, wallpaperOnTheme } from '$lib/state/shared/words/appearance';
    import { useState } from '$lib/state/client/use';
    import { codeThemeLabel, codeThemeMenu } from './code-theme-menu';

    const {
        ui: {
            codeTheme,
            crt,
            icons,
            setCodeTheme,
            setCrt,
            setIcons,
            setTextScale,
            setTheme,
            setWallpaper,
            stepTextScale,
            textScale,
            theme,
            wallpaper
        }
    } = useState();

    /** Each theme, with the glyph its row names drawn before its words where it names one. */
    const themes = $derived(
        themeList().map((entry) => ({
            id: entry.name,
            label: entry.label,
            glyph: entry.glyph === '' ? undefined : entry.glyph,
            active: entry.name === theme()
        }))
    );

    /** The theme in force, by the glyph and the words its list gives it. */
    const current = $derived(
        themes.find((entry) => entry.active) ?? { label: theme(), glyph: undefined }
    );

    /** The code theme menu's choices, the one in force marked. */
    const codeThemes = $derived(codeThemeMenu(codeTheme(), t));

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
        <span class="value" data-theme-name>
            {#if current.glyph !== undefined}
                <Glyph name={current.glyph} />
            {/if}
            {current.label}
        </span>
    </div>
    <div class="row">
        <Menu
            label={t('ui.code_theme')}
            glyph="code"
            placement="down"
            items={codeThemes}
            onpick={(id: string) => setCodeTheme(id)}
        />
        <span class="value" data-code-theme>{codeThemeLabel(codeTheme(), t)}</span>
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
            label={t('ui.icons')}
            title={t('ui.icons_title')}
            glyph="icons"
            active={icons()}
            pressed={icons()}
            onclick={() => setIcons(!icons())}
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
