<script lang="ts">
    // Layer 3, shell. The status bar's items of a language server, drawn for the source tab on
    // screen while a server serves its file (the tab says so in `status.served`), and the items of
    // the linters that take its file (`status.linters`), drawn whether or not a server serves it.
    // The server's state for any served language, and an item for each kind of choice its entry in
    // data/prose/lsp-servers.ts asks for: the Python interpreter, the compile database of a C or
    // C++ file, and the approval of a Svelte repository's configuration. Each is one fact, as VS
    // Code's status bar draws them.
    //
    // The server item reads starting, indexing with its count, ready, not found or failed, and its
    // press opens a menu of Restart Language Server and Show Language Server Output, which the tab
    // performs as its own actions. The interpreter item reads the interpreter's version and the
    // folder name of its environment, as `3.13.4 (.venv)`, and the compile database item the
    // configuration's name or the database's folder, as `build/debug`, or `No compile database`;
    // a press on either opens the palette on that choice's list. While the repository's
    // `.oculus/cpp.yml` has findings the compile database item is in the warning tone and its
    // tooltip lists them. The Svelte item reads reduced mode while the repository's configuration
    // is not approved, in the warning tone, and trusted once it is; a press on it opens the list
    // that approves or takes the approval back. The choices of the tab's root are asked of the
    // relay once its server has said anything, and arrive again after each choice.
    //
    // A linter's item reads the linter's name when it ran, and `not found`, `failed`, `timed out`
    // or `not approved` in the warning tone otherwise; its tooltip says why and, for a program that
    // is not found, how to install it and which setting names its path. A linter that has not
    // answered for the file, that is switched off or that has no configuration for the file draws
    // nothing. A press runs the tab's linters again, and on `not approved` opens the list that
    // approves the repository's ESLint configuration. The linters share the one status item
    // `linter`, which hides them all.
    //
    // The items are written from the right end of the bar to its left, the linters first, because
    // the bar's right group lays its items out in reverse (StatusBar.svelte); the order on screen
    // is the one above, the server first.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import type { ItemsProps } from './status-items';
    import { factsForLanguage } from '$lib/data/prose/lsp-servers';
    import { lintName } from '$lib/state/system/machine/lint/lint-words';
    import {
        databaseInForce,
        findingLine,
        interpreterInForce,
        interpreterLabel
    } from '$lib/state/system/machine/lsp/lsp.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        editorStatus: { ask },
        lsp
    } = useState();

    let { instance, status, shown, onpalette }: ItemsProps = $props();

    const served = $derived(status.served);
    const server = $derived(served === null ? null : lsp.server(served.root, served.language));
    const choices = $derived(served === null ? null : lsp.choices(served.root, served.language));
    const facts = $derived(served === null ? undefined : factsForLanguage(served.language));
    const asks = $derived(facts?.choices ?? []);
    const name = $derived(facts === undefined ? '' : t(facts.words.name));
    const where = $derived(served?.root ?? '');
    /** The command that installs the server's program, empty for a server that has none named. */
    const install = $derived(facts?.words.install === undefined ? '' : t(facts.words.install));

    // The relay answers a root's choices on request, and only for a root it holds a server of.
    $effect(() => {
        if (served !== null && server !== null && choices === null) {
            lsp.askChoices(served.root, served.language);
        }
    });

    /** The server's state in words. */
    const words = $derived.by(() => {
        if (server === null) return t('statusbar.ls_waiting', name);
        switch (server.state) {
            case 'starting':
                return t('statusbar.ls_starting', name);
            case 'indexing':
                return t('statusbar.ls_indexing', name, server.done, server.total);
            case 'ready':
                return t('statusbar.ls_ready', name);
            case 'not_found':
                return t('statusbar.ls_not_found', name);
            case 'failed':
                return server.code === 'root_gone'
                    ? t('statusbar.ls_root_gone', name)
                    : t('statusbar.ls_failed', name);
        }
    });

    /** What the server item's tooltip says: the state, and for a failure why. */
    const tip = $derived.by(() => {
        if (server === null) return t('statusbar.ls_tip_waiting', name, where);
        switch (server.state) {
            case 'starting':
                return t('statusbar.ls_tip_starting', name, where);
            case 'indexing':
                return t('statusbar.ls_tip_indexing', name, where, server.done, server.total);
            case 'ready':
                return t('statusbar.ls_tip_ready', name, where);
            case 'not_found':
                return install === ''
                    ? t('statusbar.ls_tip_not_found', name, where)
                    : t('statusbar.ls_tip_not_found_install', name, where, install);
            case 'failed':
                switch (server.code) {
                    case 'refused':
                        return t('statusbar.ls_tip_refused', name, where);
                    case 'no_answer':
                        return t('statusbar.ls_tip_no_answer', name, where);
                    case 'lsp_folder':
                        return t('statusbar.ls_tip_lsp_folder', name, where);
                    case 'root_gone':
                        return t('statusbar.ls_tip_root_gone', name, where);
                    default:
                        return t('statusbar.ls_tip_exited', name, where);
                }
        }
    });

    const menu: MenuItem[] = $derived([
        { id: 'oculus.lsp.restart', label: t('statusbar.ls_restart') },
        { id: 'oculus.lsp.output', label: t('statusbar.ls_output') }
    ]);

    /** The interpreter in force, as `3.13.4 (.venv)`. */
    const interpreter = $derived(interpreterInForce(choices));
    const interpreterWords = $derived.by(() => {
        if (choices === null || interpreter === null) return t('statusbar.interpreter_none');
        const base = interpreterLabel(interpreter);
        return interpreter.approved ? base : t('statusbar.interpreter_unapproved', base);
    });
    const interpreterTip = $derived.by(() => {
        if (interpreter === null) return t('statusbar.interpreter_none_tip');
        return interpreter.approved
            ? t('statusbar.interpreter_tip', interpreter.path)
            : t('statusbar.interpreter_unapproved_tip', interpreter.path);
    });

    /** Whether the repository's Svelte and Vite configuration is approved on this machine. */
    const approved = $derived(choices?.config?.approved === true);
    const configTip = $derived.by(() => {
        if (!approved) return t('statusbar.svelte_config_reduced_tip');
        return choices?.config?.svelte === true
            ? t('statusbar.svelte_config_trusted_tip')
            : t('statusbar.svelte_config_trusted_own_tip');
    });

    /**
     * One linter's item: the words it reads, its tooltip, and whether it is in the warning tone.
     */
    function lintItem(one: NonNullable<typeof status.linters>['items'][number]): {
        words: string;
        tip: string;
        warning: boolean;
    } | null {
        const name = lintName(one.id);
        switch (one.state) {
            case 'off':
            case 'no_config':
                return null;
            case 'ok':
                return { words: name, tip: t('statusbar.lint_tip_ran', name), warning: false };
            case 'not_found':
                return {
                    words: t('statusbar.lint_not_found', name),
                    tip: t(`statusbar.lint_tip_not_found_${one.id}`),
                    warning: true
                };
            case 'timeout':
                return {
                    words: t('statusbar.lint_timeout', name),
                    tip: t('statusbar.lint_tip_timeout', name),
                    warning: true
                };
            case 'not_approved':
                return {
                    words: t('statusbar.lint_not_approved'),
                    tip: t('statusbar.lint_tip_not_approved'),
                    warning: true
                };
            case 'failed':
                return {
                    words: t('statusbar.lint_failed', name),
                    tip: failedTip(name, one.reason),
                    warning: true
                };
        }
    }

    /** What a linter's failure says: its own line, or the sentence for a failure of oculus's. */
    function failedTip(name: string, reason: string | undefined): string {
        if (reason === undefined) return t('statusbar.lint_tip_no_answer', name);
        if (reason === 'too_large') return t('statusbar.lint_tip_too_large', name);
        if (reason === 'unreadable') return t('statusbar.lint_tip_unreadable', name);
        if (reason === 'stopped') return t('statusbar.lint_tip_stopped', name);
        return t('statusbar.lint_tip_failed', name, reason);
    }

    /** The linters that take the tab's file and have something to say. */
    const linters = $derived(
        (status.linters?.items ?? []).flatMap((one) => {
            const item = lintItem(one);
            return item === null ? [] : [{ id: one.id, state: one.state, ...item }];
        })
    );

    /** A press: run the linters again, or approve the repository's ESLint configuration. */
    function pressedLinter(state: string): void {
        if (state === 'not_approved') onpalette(':eslint-config ');
        else ask(instance, { kind: 'action', id: 'oculus.lint.rerun' });
    }

    /** The compile database in force, by its name. */
    const database = $derived(databaseInForce(choices));
    /** The findings of the repository's `.oculus/cpp.yml`, which the item's tone and tip say. */
    const findings = $derived(choices?.findings ?? []);
    const databaseTip = $derived.by(() => {
        const base =
            database === null
                ? t('statusbar.database_none_tip')
                : t('statusbar.database_tip', database.name);
        if (findings.length === 0) return base;
        return [base, t('statusbar.database_findings_tip'), ...findings.map(findingLine)].join(
            '\n'
        );
    });
</script>

{#if shown('linter') && linters.length > 0}
    <span data-status="linter">
        {#each linters as one (one.id)}
            <ToolButton
                label={one.words}
                glyph="linter"
                title={one.tip}
                status
                warning={one.warning}
                onclick={() => pressedLinter(one.state)}
            />
        {/each}
    </span>
{/if}

{#if served !== null}
    {#if asks.includes('config') && shown('svelte_config')}
        <span data-status="svelte_config">
            <ToolButton
                label={approved
                    ? t('statusbar.svelte_config_trusted')
                    : t('statusbar.svelte_config_reduced')}
                glyph="svelte_config"
                title={configTip}
                status
                warning={!approved && choices !== null}
                onclick={() => onpalette(':svelte-config ')}
            />
        </span>
    {/if}
    {#if asks.includes('database') && shown('compile_database')}
        <span data-status="compile_database">
            <ToolButton
                label={database === null ? t('statusbar.database_none') : database.name}
                glyph="compile_database"
                title={databaseTip}
                status
                warning={findings.length > 0}
                onclick={() => onpalette(':compile-database ')}
            />
        </span>
    {/if}
    {#if asks.includes('interpreter') && shown('interpreter')}
        <span data-status="interpreter">
            <ToolButton
                label={interpreterWords}
                glyph="interpreter"
                title={interpreterTip}
                status
                onclick={() => onpalette(':interpreter ')}
            />
        </span>
    {/if}
    {#if shown('language_server')}
        <span data-status="language_server">
            <Menu
                status
                placement="above"
                label={t('statusbar.item_language_server')}
                {words}
                glyph="language_server"
                title={tip}
                items={menu}
                onpick={(id: string) => ask(instance, { kind: 'action', id })}
            />
        </span>
    {/if}
{/if}
