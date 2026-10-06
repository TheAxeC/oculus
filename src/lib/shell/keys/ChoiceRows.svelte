<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the `:interpreter` and
    // `:compile-database` lists, as LanguageRows.svelte draws the language list: each choice of the
    // source tab's root, the one in force marked, and for an interpreter a typed path offered as a
    // new one. A finding of the repository's `.oculus/cpp.yml` is a row of its own at the head of
    // the compile database list, drawn as a row that cannot be pressed. A press sends the choice
    // to the language server's relay and waits for its answer: the choices in force close the
    // palette, and a refusal is said in it, which stays open. An interpreter of the repository
    // that is not approved is asked about first, in a confirm naming its path, and approved on the
    // reader's yes before it is chosen.

    import { onMount } from 'svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import type { ChoiceMode, ChoiceRow } from '$lib/shell/keys/palette-modes';
    import type { LspAnswer } from '$lib/state/system/machine/lsp/lsp.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { lsp } = useState();

    type Props = {
        mode: ChoiceMode;
        /** The tab's root and the language its server serves. */
        served: { root: string; language: string };
        rows: ChoiceRow[];
        /** Whether the relay has not listed the root's choices yet. */
        loading: boolean;
        onclose: () => void;
        onsaid: (words: string) => void;
    };

    let { mode, served, rows, loading, onclose, onsaid }: Props = $props();

    // A root's choices are asked for each time the list opens, since a configuration or a database
    // may have been added since the last answer, and arrive as a message.
    onMount(() => {
        lsp.askChoices(served.root, served.language);
    });

    /** The words a refusal is said in. */
    function refusal(answer: Exclude<LspAnswer, 'chosen'>): string {
        return answer === 'choices_unread'
            ? t('source.lsp_choices_unread')
            : t('source.lsp_choices_write');
    }

    /** The interpreter row the reader pressed that is not approved yet, while the confirm asks. */
    let asking = $state<ChoiceRow | null>(null);
    const askedPath = $derived(asking?.pick?.kind === 'interpreter' ? asking.pick.path : null);

    /** Make the choice of a row and close the palette on the relay's answer. */
    async function press(row: ChoiceRow, approved = false): Promise<void> {
        if (row.pick === null) return;
        const { root, language } = served;
        let answer: LspAnswer = 'chosen';
        if (row.pick.kind === 'database') {
            answer = await lsp.choose(root, language, { database: row.pick.key });
        } else {
            if (row.pick.approve && !approved) {
                asking = row;
                return;
            }
            if (row.pick.approve) answer = await lsp.approve(root, language, row.pick.path);
            if (answer === 'chosen') {
                answer = await lsp.choose(root, language, { interpreter: row.pick.path });
            }
        }
        if (answer === 'chosen') onclose();
        else onsaid(refusal(answer));
    }
</script>

{#if asking !== null && askedPath !== null}
    <Confirm
        level="sheet"
        message={t('app.palette.approve_ask')}
        detail={askedPath}
        confirm={t('app.palette.approve_yes')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => {
            const row = asking;
            asking = null;
            if (row !== null) void press(row, true);
        }}
        oncancel={() => (asking = null)}
    />
{/if}
{#each rows as row (row.value)}
    <PaletteRow
        row={{
            value: row.value,
            kind:
                row.pick === null
                    ? t('app.palette.kind_finding')
                    : mode === 'interpreter'
                      ? t('app.palette.kind_interpreter')
                      : t('app.palette.kind_database'),
            label: row.label,
            hint: row.hint === '' ? undefined : row.hint,
            active: row.active,
            disabled: row.pick === null,
            pick: () => void press(row)
        }}
    />
{/each}
{#if rows.length === 0}
    <p class="empty" data-palette-choices-empty>
        {loading
            ? t('app.palette.choices_loading')
            : mode === 'interpreter'
              ? t('app.palette.interpreter_none')
              : t('app.palette.database_none')}
    </p>
{/if}

<style>
    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
