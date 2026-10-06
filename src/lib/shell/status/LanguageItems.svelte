<script lang="ts">
    // Layer 3, shell. The status bar's three items of a language server, drawn for the source tab
    // on screen while a server serves its file (the tab says so in `status.served`): the server's
    // state for any served language, the Python interpreter for a Python file, and the compile
    // database for a C or C++ file. Each is one fact, as VS Code's status bar draws them.
    //
    // The server item reads starting, indexing with its count, ready, not found or failed, and its
    // press opens a menu of Restart Language Server and Show Language Server Output, which the tab
    // performs as its own actions. The interpreter item reads the interpreter's version and the
    // folder name of its environment, as `3.13.4 (.venv)`, and the compile database item the
    // configuration's name or the database's folder, as `build/debug`, or `No compile database`;
    // a press on either opens the palette on that choice's list. While the repository's
    // `.oculus/cpp.yml` has findings the compile database item is in the warning tone and its
    // tooltip lists them. The choices of the tab's root are
    // asked of the relay once its server has said anything, and arrive again after each choice.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import type { ItemsProps } from './status-items';
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
    const python = $derived(served?.language === 'python');
    const name = $derived(python ? t('statusbar.server_pyright') : t('statusbar.server_clangd'));
    const where = $derived(served?.root ?? '');

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
                return t('statusbar.ls_tip_not_found', name, where);
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

{#if served !== null}
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
    {#if python && shown('interpreter')}
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
    {#if !python && shown('compile_database')}
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
{/if}
