<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the `:interpreter`,
    // `:compile-database` and `:svelte-config` lists, as LanguageRows.svelte draws the language
    // list: each choice of the source tab's root, the one in force marked, and for an interpreter a
    // typed path offered as a new one. A finding of the repository's `.oculus/cpp.yml` is a row of
    // its own at the head of the compile database list, drawn as a row that cannot be pressed, as
    // are the Svelte and Vite configuration files at the head of the Svelte list. A press sends the
    // choice to the language server's relay and waits for its answer: the choices in force close
    // the palette, and a refusal is said in it, which stays open. An interpreter of the repository
    // that is not approved, and the Svelte and Vite configuration of the repository, are asked
    // about first, in a confirm naming the path or the files, and approved on the reader's yes
    // before anything runs; taking the configuration's approval back asks nothing. The approval
    // names the key of the files the list showed, so one made after they changed approves nothing
    // and leaves the list open with the files as they are now.

    import { onMount } from 'svelte';
    import ApprovalAsk from '$lib/shell/keys/rows/approve/ApprovalAsk.svelte';
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

    /** The row the reader pressed that asks for an approval first, while the confirm asks. */
    let asking = $state<ChoiceRow | null>(null);
    const askedDetail = $derived.by(() => {
        const pick = asking?.pick;
        if (pick?.kind === 'interpreter') return pick.path;
        if (pick?.kind === 'config')
            return rows.flatMap((one) => (one.pick === null ? one.label : [])).join('\n');
        return null;
    });

    /** The word a row is of: a file the configuration is read from or a finding, or the choice. */
    function kindOf(row: ChoiceRow): string {
        if (row.pick === null) {
            return mode === 'config'
                ? t('app.palette.kind_config_file')
                : t('app.palette.kind_finding');
        }
        if (mode === 'interpreter') return t('app.palette.kind_interpreter');
        return mode === 'config' ? t('app.palette.kind_config') : t('app.palette.kind_database');
    }

    /** Whether the list still offers to approve the configuration. */
    function stillAsks(): boolean {
        return rows.some((one) => one.pick?.kind === 'config' && one.pick.approve);
    }

    /** Make the choice of a row and close the palette on the relay's answer. */
    async function press(row: ChoiceRow, approved = false): Promise<void> {
        if (row.pick === null) return;
        const { root, language } = served;
        let answer: LspAnswer = 'chosen';
        if (row.pick.kind === 'database') {
            answer = await lsp.choose(root, language, { database: row.pick.key });
        } else if (row.pick.kind === 'config') {
            if (row.pick.approve && !approved) {
                asking = row;
                return;
            }
            answer = row.pick.approve
                ? await lsp.approve(root, language, { kind: 'config', key: row.pick.key })
                : await lsp.revoke(root, language);
        } else {
            if (row.pick.approve && !approved) {
                asking = row;
                return;
            }
            if (row.pick.approve) {
                answer = await lsp.approve(root, language, {
                    kind: 'interpreter',
                    path: row.pick.path
                });
            }
            if (answer === 'chosen') {
                answer = await lsp.choose(root, language, { interpreter: row.pick.path });
            }
        }
        // An approval of files that changed since the list showed them approves nothing: the list
        // stays open, showing the files as they are now.
        const pending = row.pick.kind === 'config' && row.pick.approve && stillAsks();
        if (answer === 'chosen' && !pending) onclose();
        else if (answer !== 'chosen') onsaid(refusal(answer));
    }
</script>

{#if asking !== null && askedDetail !== null}
    <ApprovalAsk
        message={asking.pick?.kind === 'config'
            ? t('app.palette.config_ask')
            : t('app.palette.approve_ask')}
        detail={askedDetail}
        yes={asking.pick?.kind === 'config'
            ? t('app.palette.config_yes')
            : t('app.palette.approve_yes')}
        onyes={() => {
            const row = asking;
            asking = null;
            if (row !== null) void press(row, true);
        }}
        onno={() => (asking = null)}
    />
{/if}
{#each rows as row (row.value)}
    <PaletteRow
        row={{
            value: row.value,
            kind: kindOf(row),
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
              : mode === 'config'
                ? t('app.palette.config_none')
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
