<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of `:eslint-config`: the ESLint
    // configuration file of the source tab's file (its nearest `eslint.config.*`, approved on its
    // own apart from any nested or enclosing one), drawn as a row that cannot be pressed, and one
    // row that approves it or, once approved, takes the approval back. Approving asks first, in a
    // confirm that names the file, since ESLint then runs the file and the plugins it imports from
    // the repository; taking the approval back asks nothing. The approval names the key of the file
    // the list showed, so one made after the file changed approves nothing and leaves the list open
    // with the file as it is now; an approval that could not be written is said as such.

    import ApprovalAsk from '$lib/shell/keys/rows/approve/ApprovalAsk.svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import type { LintConfigRow } from '$lib/shell/keys/palette-modes';
    import { t } from '$lib/state/shared/words/text';
    import type { LintConfigList } from '$lib/shell/keys/lists/lint-config.svelte';
    import { useState } from '$lib/state/client/use';

    const { lint } = useState();

    type Props = {
        list: LintConfigList;
        onclose: () => void;
        onsaid: (words: string) => void;
    };

    let { list, onclose, onsaid }: Props = $props();

    /** The row the reader pressed that approves, while the confirm asks. */
    let asking = $state<LintConfigRow | null>(null);

    /** The reader said yes to the confirm: approve the row that asked. */
    function confirmed(): void {
        const row = asking;
        asking = null;
        if (row !== null) void press(row, true);
    }

    /** The reader said no. */
    function dropped(): void {
        asking = null;
    }

    /** Approve or take back the approval of a row, and close the palette once it is made. */
    async function press(row: LintConfigRow, approved = false): Promise<void> {
        const at = list.at;
        if (row.change === null || at === null) return;
        if (row.change.approve && !approved) {
            asking = row;
            return;
        }
        const done = row.change.approve
            ? await lint.approve(at.root, at.path, row.change.key)
            : await lint.revoke(at.root, at.path);
        if (done) {
            onclose();
            return;
        }
        const now = await lint.config(at.root, at.path);
        list.refresh();
        onsaid(
            now !== null && now.key !== row.change.key
                ? t('app.palette.eslint_config_changed')
                : t('app.palette.eslint_config_write')
        );
    }
</script>

{#if asking !== null}
    <ApprovalAsk
        message={t('app.palette.eslint_config_ask')}
        detail={list.rows.flatMap((one) => (one.change === null ? one.label : [])).join('\n')}
        yes={t('app.palette.config_yes')}
        onyes={confirmed}
        onno={dropped}
    />
{/if}
{#each list.rows as row (row.value)}
    <PaletteRow row={{ ...row, disabled: row.change === null, pick: () => void press(row) }} />
{/each}
{#if list.rows.length === 0}
    <p class="empty" data-palette-choices-empty>
        {list.loading ? t('app.palette.choices_loading') : t('app.palette.eslint_config_none')}
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
