// Layer 3, shell, partial of Palette.svelte. The lists of the colon commands whose rows a partial
// of their own draws, made together over the query: `:language` (language-list.svelte.ts), the
// workspace commands (workspace-list.svelte.ts), `:interpreter` and `:compile-database` over the
// choices the language server of the tab on screen offers (palette-modes.ts `choiceModeOf` and
// `choiceRows`), `:eslint-config` (lint-config.svelte.ts), `:clone` (clone-list.svelte.ts), the
// commands whose argument is picked from a list (argument-list.svelte.ts) and the hubs `:task-add`
// asks after its title (task-hub-list.svelte.ts), and whether the query is one of them, which the
// command list then draws no row for.

import type { ChoicesView } from '$lib/state/system/machine/lsp/lsp.svelte';
import type { ParsedCommand } from '$lib/state/workbench/palette';
import { choiceModeOf, choiceRows, type ChoiceMode, type ChoiceRow } from '../palette-modes';
import {
    createArgumentList,
    type ArgumentList,
    type ArgumentListInput
} from './argument-list.svelte';
import { createCloneList, type CloneList, type CloneListInput } from './clone-list.svelte';
import {
    createLanguageList,
    type LanguageList,
    type LanguageListInput
} from './language-list.svelte';
import {
    createLintConfigList,
    type LintConfigList,
    type LintConfigListInput
} from './lint-config.svelte';
import { createTaskHubList, type TaskHubList, type TaskHubListInput } from './task-hub-list.svelte';
import {
    createWorkspaceList,
    type WorkspaceList,
    type WorkspaceListInput
} from './workspace-list.svelte';

/** What the lists are made over: the query they share and each list's own input. */
type ModeListsInput = {
    parsed: () => ParsedCommand | null;
    /** The source tab on screen and what it last said, or null when the tab on screen is none. */
    source: LanguageListInput['source'];
    apps: LanguageListInput['apps'];
    saved: WorkspaceListInput['saved'];
    roots: WorkspaceListInput['roots'];
    linters: LintConfigListInput['linters'];
    lintConfig: LintConfigListInput['config'];
    repos: CloneListInput['repos'];
    /** The root and language a server serves the tab on screen by, or null when none does. */
    served: () => { root: string; language: string } | null;
    /** What the server of a root and language offers to choose, or null while it is asked. */
    choices: (root: string, language: string) => ChoicesView | null;
    arguments: ArgumentListInput['choices'];
    hint: ArgumentListInput['hint'];
    /** The hubs that hold the tasks collection, the primary first. */
    taskHubs: TaskHubListInput['hubs'];
};

/** The lists, each read live. */
type ModeLists = {
    readonly language: LanguageList;
    readonly workspace: WorkspaceList;
    readonly lintConfig: LintConfigList;
    readonly clone: CloneList;
    readonly argument: ArgumentList;
    readonly taskHub: TaskHubList;
    /**
     * The rows of `:eslint-config`, `:clone`, an argument list or the hubs of `:task-add` while
     * the query is one of them, else null.
     */
    readonly modeRows: { value: string }[] | null;
    /** The interpreter or compile database list the query is, or null for another query. */
    readonly choiceMode: ChoiceMode | null;
    /** What the server of the tab on screen offers to choose, or null. */
    readonly choiceView: ChoicesView | null;
    readonly choiceRows: ChoiceRow[];
    /** Whether the query is one of the lists. */
    readonly active: boolean;
};

export function createModeLists(input: ModeListsInput): ModeLists {
    const language = createLanguageList({
        parsed: input.parsed,
        source: input.source,
        apps: input.apps
    });
    const workspace = createWorkspaceList({
        parsed: input.parsed,
        saved: input.saved,
        roots: input.roots
    });
    const lintConfig = createLintConfigList({
        parsed: input.parsed,
        linters: input.linters,
        config: input.lintConfig
    });
    const clone = createCloneList({ parsed: input.parsed, repos: input.repos });
    const argument = createArgumentList({
        parsed: input.parsed,
        choices: input.arguments,
        hint: input.hint
    });
    const taskHub = createTaskHubList({ parsed: input.parsed, hubs: input.taskHubs });
    const modeRows = $derived(
        [lintConfig, clone, argument, taskHub].find((one) => one.active)?.rows ?? null
    );
    const choiceMode = $derived(choiceModeOf(input.parsed(), input.served()?.language ?? ''));
    const choiceView = $derived.by(() => {
        const served = input.served();
        return served === null ? null : input.choices(served.root, served.language);
    });
    const rows = $derived(
        choiceMode === null
            ? []
            : choiceRows(choiceMode, choiceView, input.parsed()?.argument ?? '')
    );
    const active = $derived(
        language.active ||
            workspace.active ||
            choiceMode !== null ||
            lintConfig.active ||
            clone.active ||
            argument.active ||
            taskHub.active
    );
    return {
        language,
        workspace,
        lintConfig,
        clone,
        argument,
        taskHub,
        get modeRows() {
            return modeRows;
        },
        get choiceMode() {
            return choiceMode;
        },
        get choiceView() {
            return choiceView;
        },
        get choiceRows() {
            return rows;
        },
        get active() {
            return active;
        }
    };
}
