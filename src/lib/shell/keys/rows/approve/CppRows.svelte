<script lang="ts">
    // Layer 3, partial of ChoiceRows.svelte. The rows of the compile database list that edit the
    // repository's `.oculus/cpp.yml`: Edit Configuration and Delete Configuration for each entry of
    // its `configurations`, an entry with a finding included, so the finding is mended here, and
    // Add Configuration. Edit and Add ask for the fields `config/schemas/cpp-schema.yml` gives in a
    // form (ui/forms/Prompt.svelte) raised over the palette
    // (state/system/machine/lsp/clangd/cpp-form.ts); Delete asks first. A write that the server
    // refuses is said in the palette, which stays open and lists the file as it is after the write.
    // When the configuration in force is written, it is chosen again under its name, so clangd
    // restarts on what the file now says.

    import { onMount } from 'svelte';
    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import type { PromptRequest } from '$lib/ui/forms/prompt';
    import {
        PARTS,
        cppChanges,
        cppFields,
        cppName,
        readCppFile,
        writeCppEntry,
        type CppField,
        type CppFile
    } from '$lib/state/system/machine/lsp/clangd/cpp-form';
    import { wordsHold } from '$lib/state/workbench/palette';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { lsp, writes } = useState();

    type Props = {
        /** The tab's root and the language its server serves. */
        served: { root: string; language: string };
        /** What is typed after the command, which narrows the rows. */
        argument: string;
        /** The key of the database in force, null when there is none. */
        inForce: string | null;
        onsaid: (words: string) => void;
    };

    let { served, argument, inForce, onsaid }: Props = $props();

    /** The file as it was last read, null before the first answer. */
    let file = $state<CppFile | null>(null);
    /** The form or the question on screen, or null. */
    let asking = $state<PromptRequest | null>(null);

    async function read(): Promise<void> {
        const answer = await readCppFile(served.root);
        if ('error' in answer) onsaid(answer.error);
        else file = answer;
    }

    onMount(() => {
        void read();
    });

    /** The words an entry is listed by: its name, or its place for an entry with no name. */
    function nameOf(entry: unknown, at: number): string {
        return cppName(entry) ?? t('app.palette.cpp_unnamed', at + 1);
    }

    /** The field of the form a configuration's field is asked by. */
    function promptField(field: CppField): PromptRequest['fields'][number] {
        return {
            label: field.help === '' ? field.label : `${field.label} (${field.help})`,
            value: field.value,
            ...(field.required ? { required: true } : {}),
            ...(field.kind === 'tags' ? { placeholder: t('app.palette.cpp_tags', PARTS) } : {})
        };
    }

    /** Write one configuration, then read the file and the choices again. */
    async function write(
        at: number | null,
        entry: unknown,
        changes: Record<string, unknown> | null
    ): Promise<void> {
        const refused = await writeCppEntry(writes, served.root, at, entry, changes);
        if (refused !== null) {
            onsaid(refused);
            return;
        }
        await read();
        const was = cppName(entry);
        const now = changes === null ? null : (cppName(changes) ?? was);
        if (was !== null && was === inForce && now !== null) {
            await lsp.choose(served.root, served.language, { database: now });
        } else lsp.askChoices(served.root, served.language);
    }

    /** Ask for the fields of the entry at `at`, or of a new configuration when `at` is null. */
    function edit(at: number | null): void {
        if (file === null) return;
        const fields = file.fields;
        const entry = at === null ? null : file.entries[at];
        const form = cppFields(fields, entry);
        asking = {
            message:
                at === null
                    ? t('app.palette.cpp_add_title')
                    : t('app.palette.cpp_edit_title', nameOf(entry, at)),
            detail: t('app.palette.cpp_detail', PARTS),
            fields: form.map(promptField),
            verb: t('app.palette.cpp_save'),
            act: (answers) => {
                asking = null;
                const changes = cppChanges(fields, form, entry, answers);
                if (at !== null && Object.keys(changes).length === 0) return;
                void write(at, entry, changes);
            }
        };
    }

    function remove(at: number): void {
        if (file === null) return;
        const entry = file.entries[at];
        asking = {
            message: t('app.palette.cpp_delete_title', nameOf(entry, at)),
            detail: t('app.palette.cpp_delete_detail'),
            fields: [],
            verb: t('app.palette.cpp_delete_verb'),
            act: () => {
                asking = null;
                void write(at, entry, null);
            }
        };
    }

    /** The rows, narrowed by what is typed. */
    const rows = $derived.by(() => {
        if (file === null) return [];
        const each = file.entries.flatMap((entry, at) => {
            const name = nameOf(entry, at);
            return [
                {
                    value: `cpp:edit:${at}`,
                    label: t('app.palette.cpp_edit', name),
                    pick: () => edit(at)
                },
                {
                    value: `cpp:delete:${at}`,
                    label: t('app.palette.cpp_delete', name),
                    pick: () => remove(at)
                }
            ];
        });
        const add = { value: 'cpp:add', label: t('app.palette.cpp_add'), pick: () => edit(null) };
        return [...each, add].filter((one) => wordsHold(one.label, argument));
    });
</script>

{#if asking !== null}
    <Prompt
        level="sheet"
        request={asking}
        cancel={t('ui.confirm_cancel')}
        oncancel={() => (asking = null)}
    />
{/if}
{#each rows as row (row.value)}
    <PaletteRow
        row={{
            value: row.value,
            kind: t('app.palette.kind_cpp'),
            label: row.label,
            hint: t('app.palette.database_configuration'),
            pick: row.pick
        }}
    />
{/each}
