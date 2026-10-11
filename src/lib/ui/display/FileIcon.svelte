<script lang="ts">
    // Layer 3, primitive. The icon of a file or a folder, drawn before its name. With `file_icons:
    // seti` it is the Seti icon of VS Code's default file icon theme: the glyph of seti-ui's font
    // for the file's name (file-icons.ts says which), in the colour seti-ui gives it, at 150% of
    // the size of the text it sits in, in a box 16 px wide. The colours are the theme tokens
    // --seti-<name> (themes/tokens.css), which hold seti-ui's own values in every theme. With an
    // app's icon theme in force (icon-theme/held.svelte.ts) it is the picture or the font character
    // that theme gives the name, in the same box, and a file the theme names no icon for draws an
    // empty box. A folder draws only a theme's icon: Seti has none. The icon is decoration beside
    // the name, so it is hidden from a screen reader.

    import { fileIcon } from './file-icons';
    import { iconThemeHeld, themedFile, themedFolder } from './icon-theme/held.svelte';

    type Props = {
        /** The file's name or path, or the folder's name. */
        name: string;
        /** Draw the icon of a folder, closed or open, instead of a file's. */
        folder?: 'closed' | 'open';
    };

    let { name, folder }: Props = $props();

    /** What the app's icon theme gives the name, null with no theme or no icon. */
    const themed = $derived(
        folder === undefined ? themedFile(name) : themedFolder(name, folder === 'open')
    );
    /** Whether an app's icon theme decides the icon. */
    const own = $derived(iconThemeHeld() || folder !== undefined);
    const icon = $derived(own ? null : fileIcon(name));
    /** The theme token that holds the glyph's colour. */
    const token = $derived(icon === null ? '' : `--seti-${icon.colour}`);
    /** The declarations that draw a font character of the theme. */
    const fontStyle = $derived(
        themed?.kind !== 'font'
            ? ''
            : [
                  `font-family: "${themed.family}"`,
                  `font-size: ${themed.size === '' ? '100%' : themed.size}`,
                  themed.colour === '' ? '' : `color: ${themed.colour}`
              ]
                  .filter((one) => one !== '')
                  .join('; ')
    );
</script>

{#if themed !== null && themed.kind === 'image'}
    <img class="file-icon picture" src={themed.src} alt="" aria-hidden="true" />
{:else if themed !== null}
    <span class="file-icon" style={fontStyle} aria-hidden="true">{themed.char}</span>
{:else if icon !== null}
    <span
        class="file-icon"
        data-file-icon={icon.name}
        data-colour={icon.colour}
        style={`color: var(${token})`}
        aria-hidden="true">{icon.char}</span
    >
{:else}
    <span class="file-icon" aria-hidden="true"></span>
{/if}

<style>
    @font-face {
        font-family: 'seti';
        src: url('seti-ui/styles/_fonts/seti/seti.woff') format('woff');
        font-weight: normal;
        font-style: normal;
    }

    .file-icon {
        display: inline-block;
        flex: none;
        margin-right: calc(2px * var(--text-scale, 1));
        width: calc(var(--icon-box) * var(--text-scale, 1));
        font-family: 'seti';
        font-size: 150%;
        font-style: normal;
        font-weight: normal;
        line-height: 1;
        text-align: left;
        text-transform: none;
        -webkit-font-smoothing: antialiased;
    }

    .picture {
        height: calc(var(--icon-box) * var(--text-scale, 1));
        object-fit: contain;
        vertical-align: middle;
    }
</style>
