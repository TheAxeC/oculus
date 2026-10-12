// Layer 3, shell, partial of Palette.svelte. The list of `:eslint-config`: the ESLint configuration
// file of the source tab's file and the row that approves it or takes the approval back. The file
// is the nearest `eslint.config.*` above the tab's file, and the approval and the running ESLint
// belong to that configuration folder and its one file, so a nested configuration is approved on
// its own. The configuration is asked of the lint store while the query is that command, and again
// after each approval, so the list shows the file as it is now.

import type { LintConfig } from '$lib/state/system/machine/lint/lint-model';
import { lintConfigOf, lintConfigRows, type LintConfigRow } from '$lib/shell/keys/palette-modes';
import type { EditorStatus } from '$lib/state/workbench/navigation/editor-status.svelte';
import type { ParsedCommand } from '$lib/state/workbench/palette';

/** What the list is made over. */
export type LintConfigListInput = {
    parsed: () => ParsedCommand | null;
    linters: () => EditorStatus['linters'];
    config: (root: string, path: string) => Promise<LintConfig | null>;
};

/** The list of `:eslint-config`. */
export type LintConfigList = {
    /** Whether the query is `:eslint-config`. */
    readonly active: boolean;
    /**
     * The file the list is of, null when the query is another or the tab's file takes no ESLint.
     */
    readonly at: { root: string; path: string } | null;
    /** Its rows; none while the configuration is asked for or when the file has none. */
    readonly rows: LintConfigRow[];
    /** Whether the configuration has not arrived. */
    readonly loading: boolean;
    /** Read the configuration again. */
    refresh: () => void;
};

export function createLintConfigList(input: LintConfigListInput): LintConfigList {
    const active = $derived(input.parsed()?.name === 'eslint-config');
    const at = $derived(lintConfigOf(input.parsed(), input.linters()));
    let held: { key: string; config: LintConfig | null } | null = $state(null);
    const key = $derived(at === null ? '' : `${at.root}\n${at.path}`);
    let turn = 0;

    function refresh(): void {
        if (at === null) return;
        const mine = ++turn;
        const asked = key;
        void input.config(at.root, at.path).then((config) => {
            if (mine === turn) held = { key: asked, config };
        });
    }

    $effect(() => {
        if (at === null) {
            held = null;
            return;
        }
        refresh();
    });

    return {
        get active() {
            return active;
        },
        get at() {
            return at;
        },
        get rows() {
            return held?.key === key ? lintConfigRows(held.config) : [];
        },
        get loading() {
            return at !== null && held?.key !== key;
        },
        refresh
    };
}
