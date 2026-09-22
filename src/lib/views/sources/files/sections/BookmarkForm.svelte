<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The entry form over the bookmarks file,
    // opened either to add a bookmark or over one bookmark, whose close names the file browser and
    // the opening of the form it was drawn for.
    //
    // Both are taken when the partial mounts, and the view mounts one per instance and per opening
    // through a key block. A save or a delete closes the form only once its request has answered,
    // and by then the reader may have opened another form, opened this one again, or switched the
    // tab away, after which the view's own instance prop reads whichever tab the pane shows now. A
    // close that read either when it ran would name that later form or that other tab; one taken at
    // mount names the form the request was made from, which the view can tell is no longer open.

    import { untrack } from 'svelte';
    import EntryForm from '../../../shared/forms/EntryForm.svelte';
    import type { Entry, SchemaField } from '$lib/state/boards/collection';
    import type { FilesForms } from '$lib/state/sources/fs';
    import { BOOKMARK_COLLECTION } from '$lib/state/sources/fs.svelte';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';

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
        /**
         * The form's own save wrote its bookmark under another id, naming the instance and the id.
         */
        onrenamed: (owner: string, id: string) => void;
        onsaid: (owner: string, said: string) => void;
    };

    let { owner, forms, schema, entry, initial, onadd, onclose, onrenamed, onsaid }: Props =
        $props();

    const opened = untrack(() => ({ owner, forms }));

    /**
     * The bookmark the form edits is the file's under another id. The opening it was drawn for
     * moves with it, so the close this partial asks for later still names the form that is open:
     * what a rename changes is the bookmark's id, not which opening of which file browser this form
     * is.
     */
    function renamed(id: string): void {
        opened.forms = { ...opened.forms, editing: id };
        onrenamed(opened.owner, id);
    }
</script>

<EntryForm
    collection={BOOKMARK_COLLECTION}
    {schema}
    {entry}
    {initial}
    surface={false}
    {onadd}
    onclose={() => onclose(opened.owner, opened.forms)}
    onrenamed={renamed}
    onsaid={(said: string) => onsaid(opened.owner, said)}
/>
