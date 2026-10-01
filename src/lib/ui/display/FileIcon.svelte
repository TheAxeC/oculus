<script lang="ts">
    // Layer 3, primitive. The Seti icon of a file, drawn before its name as VS Code's default file
    // icon theme draws it: the glyph of seti-ui's font for the file's name (file-icons.ts says
    // which), in the colour seti-ui gives it, at 150% of the size of the text it sits in, in a box
    // 16 px wide. The colours are the theme tokens --seti-<name> (themes/tokens.css), which
    // hold seti-ui's own values in every theme. The glyph is decoration beside the name, so it is
    // hidden from a screen reader; the folder rows of a tree draw none, as the Seti theme draws
    // none.

    import { fileIcon } from './file-icons';

    type Props = {
        /** The file's name or path. */
        name: string;
    };

    let { name }: Props = $props();

    const icon = $derived(fileIcon(name));
    /** The theme token that holds the glyph's colour. */
    const token = $derived(`--seti-${icon.colour}`);
</script>

<span
    class="file-icon"
    data-file-icon={icon.name}
    data-colour={icon.colour}
    style={`color: var(${token})`}
    aria-hidden="true">{icon.char}</span
>

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
</style>
