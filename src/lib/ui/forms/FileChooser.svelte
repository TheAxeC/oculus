<script lang="ts">
    // Layer 3, primitive. The browser's file dialog, and nothing drawn: a hidden file input the
    // view opens from a control of its own and whose choice it is handed as a list of files.
    //
    // The input is hidden because the control a reader presses is the view's ToolButton, in the
    // view's own toolbar and look; the browser draws a file input as a box of its own words, and
    // that box cannot take the theme. The view calls `open()`, which is the one way the dialog is
    // reached, and the choice is cleared as soon as it is handed on, so choosing the same file
    // twice is two choices rather than a change the browser does not report.

    type Props = {
        /** The kinds of file the dialog offers, as the input's `accept` list. */
        accept: string;
        /** Whether one choice may hold several files. */
        multiple?: boolean;
        /** Every file of one choice, in the order the dialog gave them; never an empty list. */
        onchoose: (files: File[]) => void;
    };

    let { accept, multiple = false, onchoose }: Props = $props();

    let field: HTMLInputElement | null = $state(null);

    /** Open the browser's file dialog. */
    export function open(): void {
        field?.click();
    }

    function chosen(event: Event): void {
        const input = event.currentTarget;
        if (!(input instanceof HTMLInputElement) || input.files === null) return;
        const files = [...input.files];
        input.value = '';
        if (files.length > 0) onchoose(files);
    }
</script>

<input bind:this={field} type="file" {accept} {multiple} hidden onchange={chosen} />
