<script lang="ts">
    // Layer 3, view partial. The control of one "This browser" row, which sets the value the ui
    // store keeps for this browser: the theme list, the code theme menu (tokens, the VS Code themes
    // under the words of the theme list, and Shiki's), the text-size steps with the size in force,
    // the terminal text size box, and the toggles for the CRT overlay, the wallpaper and the glyph
    // vocabulary. Each writes the ui store, which saves its values together, so what the page looks
    // like comes back whole after a reload whichever control set it.
    //
    // The terminal text size is a box holding the text being typed. It is applied on Enter and on
    // leaving the box: a decimal the store clamps to 6 to 40, or an empty box, which gives the size
    // back to the config. Any other text is refused with the message a config number row gives
    // and stays in the box. Escape drops the text and shows the size in force again.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import NumberInput from '$lib/ui/forms/NumberInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { themeClassLabel, themes as themeList } from '$lib/state/shared/words/appearance';
    import { terminalSizeOf, type BrowserRow } from '$lib/state/system/config/browser';
    import type { Message } from '$lib/state/system/config/messages';
    import { useState } from '$lib/state/client/use';
    import { codeThemeLabel, codeThemeMenu } from '../code-theme-menu';

    const {
        ui: {
            codeTheme,
            crt,
            icons,
            setCodeTheme,
            setCrt,
            setIcons,
            setTerminalFont,
            setTextScale,
            setTheme,
            setWallpaper,
            stepTextScale,
            terminalFont,
            textScale,
            theme,
            wallpaper
        }
    } = useState();

    let { row, onsaid }: { row: BrowserRow; onsaid: (said: Message | null) => void } = $props();

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
    const codeThemes = $derived(codeThemeMenu(codeTheme(), t, themeClassLabel));

    /** The two text steps say what they cannot do, and the reset is there only once it resets. */
    const canShrink = $derived((textScale() ?? 1) > 0.7);
    const canGrow = $derived((textScale() ?? 1) < 1.6);
    const canReset = $derived(textScale() !== null);

    /** The text size in force as a percentage, 100% while the page follows the browser's size. */
    const sizeNow = $derived(
        t('workbench.settings_text_size_value', Math.round((textScale() ?? 1) * 100))
    );

    /** The terminal text size being typed, or null while the box shows the size in force. */
    let typed: string | null = $state(null);
    const sizeShown = $derived(typed ?? String(terminalFont() ?? ''));

    /** Apply the box's text: a decimal the store clamps, or an empty box for the config's size. */
    function applySize(text: string): void {
        const size = terminalSizeOf(text);
        if (!size.set) {
            onsaid(size.said);
            return;
        }
        typed = null;
        onsaid(null);
        setTerminalFont(size.value);
    }

    function revertSize(event: KeyboardEvent): void {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        typed = null;
        onsaid(null);
    }
</script>

{#if row.name === 'theme'}
    <div class="line">
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
{:else if row.name === 'code_theme'}
    <div class="line">
        <Menu
            label={t('ui.code_theme')}
            glyph="code"
            placement="down"
            items={codeThemes}
            onpick={(id: string) => setCodeTheme(id)}
        />
        <span class="value" data-code-theme>{codeThemeLabel(codeTheme(), t, themeClassLabel)}</span>
    </div>
{:else if row.name === 'text_size'}
    <div class="line" role="group" aria-label={t('app.text')}>
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
        <span class="value" data-text-size>{sizeNow}</span>
    </div>
{:else if row.name === 'terminal_font'}
    <div class="size" role="presentation" onkeydown={revertSize}>
        <NumberInput
            value={sizeShown}
            label={row.title}
            oninput={(text: string) => (typed = text)}
            onenter={applySize}
            onblur={applySize}
        />
    </div>
{:else if row.name === 'crt'}
    <ToolButton
        label={t('ui.crt_on')}
        title={t('ui.crt_title')}
        glyph="crt"
        active={crt()}
        pressed={crt()}
        onclick={() => setCrt(!crt())}
    />
{:else if row.name === 'wallpaper'}
    <ToolButton
        label={t('ui.wallpaper')}
        title={t('ui.wallpaper_title')}
        glyph="wallpaper"
        active={wallpaper()}
        pressed={wallpaper()}
        onclick={() => setWallpaper(!wallpaper())}
    />
{:else}
    <ToolButton
        label={t('ui.icons')}
        title={t('ui.icons_title')}
        glyph="icons"
        active={icons()}
        pressed={icons()}
        onclick={() => setIcons(!icons())}
    />
{/if}

<style>
    .line {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .value {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .size {
        width: 200px;
        max-width: 100%;
    }
</style>
