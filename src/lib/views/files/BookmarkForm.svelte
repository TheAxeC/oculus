<script lang="ts">
    // Layer 3, partial of views/Files.svelte. The entry form over the bookmarks file, opened either to
    // add a bookmark or over one bookmark, whose close names the file browser and the opening of the
    // form it was drawn for.
    //
    // Both are taken when the partial mounts, and the view mounts one per instance and per opening
    // through a key block. A save or a delete closes the form only once its request has answered,
    // and by then the reader may have opened another form, opened this one again, or switched the tab
    // away, after which the view's own instance prop reads whichever tab the pane shows now. A close
    // that read either when it ran would name that later form or that other tab; one taken at mount
    // names the form the request was made from, which the view can tell is no longer open.

    import { untrack } from 'svelte';
    import EntryForm from '../shared/EntryForm.svelte';
    import type { Entry, SchemaField } from '$lib/state/collection';
    import type { FilesForms } from '$lib/state/fs';
    import { BOOKMARK_COLLECTION } from '$lib/state/fs.svelte';
    import type { WriteAnswer } from '$lib/state/writes.svelte';

    type Props = {
        /** The file browser instance the form is drawn in. */
        owner: string;
        /** The forms of that instance when this form was opened. */
        forms: FilesForms;
        schema: SchemaField[];
        /** The bookmark the form edits, or null when the form adds one. */
        entry: Entry | null;
        /** What the controls of the form that adds a bookmark open holding, by field. */
        initial: Record<string, unknown>;
        onadd: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
        /** The form asks to close, naming the instance and the opening it was drawn for. */
        onclose: (owner: string, forms: FilesForms) => void;
        onsaid: (said: string) => void;
    };

    let { owner, forms, schema, entry, initial, onadd, onclose, onsaid }: Props = $props();

    const opened = untrack(() => ({ owner, forms }));
</script>

<EntryForm
    collection={BOOKMARK_COLLECTION}
    {schema}
    {entry}
    {initial}
    surface={false}
    {onadd}
    onclose={() => onclose(opened.owner, opened.forms)}
    {onsaid}
/>
