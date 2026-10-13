<script lang="ts">
    // Layer 3, partial of the Debug view. The Variables section: the scopes of the selected frame,
    // `Locals` then `Module`, each variable as `name = value` as the adapter answers it. The
    // adapter answers flat lists, so no row opens, and it sends no type, so none is shown. While
    // the program is not paused there is nothing to read, and the section says so. Set Value on a
    // row is drawn only when the adapter of the session declared `setVariable`: it asks for the new
    // value in a row of its own, Enter sends it, and the section shows what the adapter read back.
    // A right-click on a variable lists the entries apps contribute to `debug/variables/context`; a
    // command takes `{ sessionId, container, variable }` as VS Code's does, the container being the
    // scope and the variable carrying `variablesReference` 0 since the lists are flat.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import NameField from '$lib/ui/tree/row/NameField.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { appMenu } from '$lib/views/shared/explorer/control/app-menu';

    type Props = {
        open: boolean;
        ontoggle: () => void;
    };

    let { open, ontoggle }: Props = $props();

    const { appShell, debug } = useState();
    const menu = appMenu(appShell);

    const scopes = $derived(debug.paused() ? debug.payload().scopes : []);

    /** The variable being given a value: its scope and its place in the scope. */
    let setting: { scope: number; index: number } | null = $state(null);

    const settable = $derived(debug.capabilities().setVariable);
    const keys = $derived(debug.contextKeys());

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? scopes.flatMap((scope, at) =>
                  scope.variables.flatMap((_, index) => [
                      { id: `variable:${at}:${index}`, parent: 'head' },
                      ...(setting?.scope === at && setting.index === index
                          ? [{ id: `value:${at}:${index}`, parent: 'head' }]
                          : [])
                  ])
              )
            : [])
    ]);

    /** Run an entry apps contribute to the menu of a variable. */
    function run(pick: string, scope: number, index: number, event: MouseEvent): void {
        const one = scopes.at(scope);
        const variable = one?.variables.at(index);
        if (one === undefined || variable === undefined) return;
        const session = debug.sessionArg();
        menu.run(
            pick,
            [
                {
                    sessionId: session === null ? '' : session.$debugSession,
                    container: { name: one.name, variablesReference: one.reference },
                    variable: { name: variable.name, value: variable.value, variablesReference: 0 }
                }
            ],
            event
        );
    }

    function send(scope: number, index: number, text: string): void {
        setting = null;
        const one = scopes.at(scope);
        const variable = one?.variables.at(index);
        if (one === undefined || variable === undefined) return;
        void debug.setVariable(one.reference, variable.name, text);
    }
</script>

<div class="variables" data-debug-variables>
    <TreeView label={t('debug.variables')} {rows} ontoggle={() => ontoggle()}>
        {#snippet children(nav: TreeNav)}
            <TreeSection label={t('debug.variables')} id="head" {nav} {open} {ontoggle}>
                {#if scopes.length === 0}
                    <li role="none">
                        <TreeItem label={t('debug.nothing_paused')} tone="muted" />
                    </li>
                {/if}
                {#each scopes as scope, at (scope.name)}
                    <li role="none">
                        <TreeItem label={scope.name} tone="muted" strong />
                    </li>
                    {#each scope.variables as variable, index (variable.name)}
                        <li role="none">
                            <ContextMenu
                                label={variable.name}
                                read={() => menu.items('debug/variables/context', { keys })}
                                onpick={(pick: string, event: MouseEvent) =>
                                    run(pick, at, index, event)}
                            >
                                <TreeItem
                                    label={t('debug.variable', variable.name, variable.value)}
                                    id={`variable:${at}:${index}`}
                                    {nav}
                                    level={2}
                                    title={t('debug.variable', variable.name, variable.value)}
                                    showActions={settable}
                                >
                                    {#snippet actions(reach: number)}
                                        {#if settable}
                                            <ToolButton
                                                label={t('debug.set_value')}
                                                glyph="edit"
                                                compact
                                                tabindex={reach}
                                                onclick={() => (setting = { scope: at, index })}
                                            />
                                        {/if}
                                    {/snippet}
                                </TreeItem>
                            </ContextMenu>
                        </li>
                        {#if setting?.scope === at && setting.index === index}
                            <li role="none">
                                <TreeItem
                                    label=""
                                    name={t('debug.variable_field', variable.name)}
                                    id={`value:${at}:${index}`}
                                    {nav}
                                    level={3}
                                    selected
                                >
                                    {#snippet field()}
                                        <NameField
                                            value={variable.value}
                                            label={t('debug.variable_field', variable.name)}
                                            oninput={() => undefined}
                                            onsubmit={(text: string) => send(at, index, text)}
                                            oncancel={() => (setting = null)}
                                            onleave={() => (setting = null)}
                                        />
                                    {/snippet}
                                </TreeItem>
                            </li>
                        {/if}
                    {/each}
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
