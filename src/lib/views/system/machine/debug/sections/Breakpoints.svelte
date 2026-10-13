<script lang="ts">
    // Layer 3, partial of the Debug view. The Breakpoints section: every line breakpoint by file
    // and line, each with an enable box and a remove, the function breakpoints by name, and the
    // exception filters the adapter of the session declared. A breakpoint the adapter does not hold
    // yet is drawn as a warning and its tooltip is the adapter's own message; a breakpoint turned
    // off is muted. A press on a line breakpoint opens its file at its line. The head adds a
    // function breakpoint (typed in a row of its own), enables, disables and removes every
    // breakpoint. The list is flat: there is no tree by folder.
    //
    // Edit Breakpoint on a row is drawn only when the adapter that handles the row's file declared
    // a condition, a hit condition or log messages, and it asks for exactly those fields, one after
    // the other, each in a row of its own: Enter keeps the text and goes on to the next field,
    // leaving the box keeps it and stops, Escape stops, and an empty text clears the field. A
    // function breakpoint takes a condition and a hit condition when the adapter declared them,
    // and an exception filter that takes a condition has its own Edit Condition.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import NameField from '$lib/ui/tree/row/NameField.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { BreakpointRow } from '$lib/state/system/machine/debug/debug-lists';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    /**
     * The fields an edit asks for, in order: where the text is kept, its label and the name the
     * box is read out by.
     */
    type Field = { name: 'condition' | 'hitCondition' | 'logMessage'; label: string; hint: string };

    /** What is being edited: the row's key, the fields asked for and the one now asked. */
    type Editing = { key: string; fields: Field[]; at: number };

    type Props = {
        open: boolean;
        ontoggle: () => void;
    };

    let { open, ontoggle }: Props = $props();

    const { debug } = useState();

    const lines = $derived(debug.rows());
    const functions = $derived(debug.functionRows());
    const count = $derived(lines.length + functions.length);

    /** Whether the name of a new function breakpoint is being typed. */
    let adding = $state(false);

    let editing: Editing | null = $state(null);

    const exceptions = $derived(debug.active() ? debug.payload().exceptions : []);

    const functionKey = (name: string): string => `function:${name}`;
    const exceptionKey = (filter: string): string => `exception:${filter}`;

    /** The fields the adapter that handles a file declared for a line breakpoint. */
    function lineFields(path: string): Field[] {
        const caps = debug.capsOfFile(path);
        return [
            ...(caps.conditions
                ? [
                      {
                          name: 'condition' as const,
                          label: t('debug.breakpoint_condition'),
                          hint: t('debug.breakpoint_condition_field')
                      }
                  ]
                : []),
            ...(caps.hitConditions
                ? [
                      {
                          name: 'hitCondition' as const,
                          label: t('debug.breakpoint_hit'),
                          hint: t('debug.breakpoint_hit_field')
                      }
                  ]
                : []),
            ...(caps.logpoints
                ? [
                      {
                          name: 'logMessage' as const,
                          label: t('debug.breakpoint_log'),
                          hint: t('debug.breakpoint_log_field')
                      }
                  ]
                : [])
        ];
    }

    /** The fields the adapter of the session declared for a function breakpoint. */
    function functionFields(): Field[] {
        const caps = debug.capabilities();
        return [
            ...(caps.functionConditions
                ? [
                      {
                          name: 'condition' as const,
                          label: t('debug.breakpoint_condition'),
                          hint: t('debug.breakpoint_condition_field')
                      }
                  ]
                : []),
            ...(caps.functionConditions && caps.hitConditions
                ? [
                      {
                          name: 'hitCondition' as const,
                          label: t('debug.breakpoint_hit'),
                          hint: t('debug.breakpoint_hit_field')
                      }
                  ]
                : [])
        ];
    }

    function edit(key: string, fields: Field[]): void {
        if (fields.length > 0) editing = { key, fields, at: 0 };
    }

    /** The text a field holds now. */
    function valueOf(key: string, name: Field['name']): string {
        const line = lines.find((row) => keyOf(row) === key);
        if (line !== undefined) return line[name];
        const one = functions.find((row) => functionKey(row.name) === key);
        if (one !== undefined) return name === 'logMessage' ? '' : one[name];
        const filter = exceptions.find((row) => exceptionKey(row.filter) === key);
        return filter !== undefined && name === 'condition' ? filter.condition : '';
    }

    /** Keep the text of the field now asked and go on to the next, or stop at the last. */
    function keepField(text: string, goOn: boolean, at: number): void {
        const now = editing;
        if (now?.at !== at) return;
        const field = now.fields[now.at];
        const line = lines.find((row) => keyOf(row) === now.key);
        if (line !== undefined) debug.editPoint(line.path, line.line, { [field.name]: text });
        const one = functions.find((row) => functionKey(row.name) === now.key);
        if (one !== undefined && field.name !== 'logMessage') {
            debug.editFunction(one.name, { [field.name]: text });
        }
        const filter = exceptions.find((row) => exceptionKey(row.filter) === now.key);
        if (filter !== undefined) debug.setExceptionCondition(filter.filter, text);
        editing = goOn && now.at + 1 < now.fields.length ? { ...now, at: now.at + 1 } : null;
    }

    /** The words after a row's name: the condition, hit count and log message it is set with. */
    function setWith(row: {
        condition: string;
        hitCondition: string;
        logMessage?: string;
    }): string {
        return [row.condition, row.hitCondition, row.logMessage ?? '']
            .filter((one) => one !== '')
            .join(' | ');
    }

    const keyOf = (row: BreakpointRow): string => `line:${row.path}:${row.line}`;

    /** The row of the fields being asked under the row `key`, or none. */
    const askedUnder = (key: string): { id: string; parent: string }[] =>
        editing?.key === key ? [{ id: `edit:${key}`, parent: 'head' }] : [];

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? [
                  ...lines.flatMap((row) => [
                      { id: keyOf(row), parent: 'head' },
                      ...askedUnder(keyOf(row))
                  ]),
                  ...functions.flatMap((row) => [
                      { id: functionKey(row.name), parent: 'head' },
                      ...askedUnder(functionKey(row.name))
                  ]),
                  ...(adding ? [{ id: 'function:new', parent: 'head' }] : []),
                  ...exceptions.flatMap((row) => [
                      { id: exceptionKey(row.filter), parent: 'head' },
                      ...askedUnder(exceptionKey(row.filter))
                  ])
              ]
            : [])
    ]);

    function add(): void {
        if (!open) ontoggle();
        adding = true;
    }

    function keep(name: string): void {
        if (!adding) return;
        adding = false;
        debug.addFunction(name);
    }

    /** The folder a file sits in, as its last part, and the file's name. */
    function partsOf(path: string): { name: string; folder: string } {
        const parts = path.split('/');
        return { name: parts.at(-1) ?? path, folder: parts.at(-2) ?? '' };
    }

    function titleOf(row: BreakpointRow): string {
        if (row.state === 'unverified' && row.message !== '') return row.message;
        return `${row.path}:${row.line}`;
    }
</script>

{#snippet asked(key: string, nav: TreeNav)}
    {#if editing?.key === key}
        {@const asking = editing.fields[editing.at]}
        {@const step = editing.at}
        <li role="none">
            <TreeItem label="" name={asking.label} id={`edit:${key}`} {nav} level={3} selected>
                {#snippet field()}
                    {#key step}
                        <NameField
                            value={valueOf(key, asking.name)}
                            label={asking.hint}
                            oninput={() => undefined}
                            onsubmit={(text: string) => keepField(text, true, step)}
                            oncancel={() => (editing = null)}
                            onleave={(text: string) => keepField(text, false, step)}
                        />
                    {/key}
                {/snippet}
            </TreeItem>
        </li>
    {/if}
{/snippet}

<div class="breakpoints" data-debug-breakpoints>
    <TreeView label={t('debug.breakpoints')} {rows} ontoggle={() => ontoggle()}>
        {#snippet children(nav: TreeNav)}
            <TreeSection
                label={t('debug.breakpoints')}
                id="head"
                {nav}
                {count}
                {open}
                {ontoggle}
                showActions
            >
                {#snippet actions(reach: number)}
                    <ToolButton
                        label={t('debug.function_add')}
                        glyph="add"
                        compact
                        tabindex={reach}
                        onclick={add}
                    />
                    <ToolButton
                        label={t('debug.enable_all')}
                        glyph="checkbox_on"
                        compact
                        tabindex={reach}
                        disabled={lines.length === 0}
                        onclick={() => debug.setAll(true)}
                    />
                    <ToolButton
                        label={t('debug.disable_all')}
                        glyph="checkbox_off"
                        compact
                        tabindex={reach}
                        disabled={lines.length === 0}
                        onclick={() => debug.setAll(false)}
                    />
                    <ToolButton
                        label={t('debug.remove_all')}
                        glyph="clear_all"
                        compact
                        tabindex={reach}
                        disabled={count === 0}
                        onclick={() => {
                            debug.removeAll();
                            for (const one of functions) debug.removeFunction(one.name);
                        }}
                    />
                {/snippet}
                {#if count === 0 && !adding && exceptions.length === 0}
                    <li role="none">
                        <TreeItem label={t('debug.no_breakpoints')} tone="muted" />
                    </li>
                {/if}
                {#each lines as row (keyOf(row))}
                    {@const place = partsOf(row.path)}
                    <li role="none">
                        <TreeItem
                            label={`${place.name}:${row.line}`}
                            id={keyOf(row)}
                            {nav}
                            level={2}
                            tone={row.state === 'unverified'
                                ? 'warn'
                                : row.state === 'disabled'
                                  ? 'muted'
                                  : undefined}
                            title={titleOf(row)}
                            showActions
                            onclick={() => debug.openAt(row.path, row.line)}
                        >
                            {#snippet detail()}{setWith(row) === ''
                                    ? place.folder
                                    : `${place.folder} ${setWith(row)}`}{/snippet}
                            {#snippet actions(reach: number)}
                                {#if lineFields(row.path).length > 0}
                                    <ToolButton
                                        label={t('debug.breakpoint_edit')}
                                        glyph="edit"
                                        compact
                                        tabindex={reach}
                                        onclick={() => edit(keyOf(row), lineFields(row.path))}
                                    />
                                {/if}
                                <ToolButton
                                    label={t('debug.enable_box')}
                                    glyph={row.enabled ? 'checkbox_on' : 'checkbox_off'}
                                    compact
                                    pressed={row.enabled}
                                    tabindex={reach}
                                    onclick={() => debug.enable(row.path, row.line, !row.enabled)}
                                />
                                <ToolButton
                                    label={t('debug.remove')}
                                    glyph="trash"
                                    compact
                                    tabindex={reach}
                                    onclick={() => debug.remove(row.path, row.line)}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render asked(keyOf(row), nav)}
                {/each}
                {#each functions as row (row.name)}
                    <li role="none">
                        <TreeItem
                            label={row.name}
                            id={functionKey(row.name)}
                            {nav}
                            level={2}
                            glyph="debug_breakpoint"
                            tone={row.state === 'unverified' ? 'warn' : undefined}
                            title={row.message === '' ? row.name : row.message}
                            showActions
                        >
                            {#snippet detail()}{setWith(row)}{/snippet}
                            {#snippet actions(reach: number)}
                                {#if functionFields().length > 0}
                                    <ToolButton
                                        label={t('debug.breakpoint_edit')}
                                        glyph="edit"
                                        compact
                                        tabindex={reach}
                                        onclick={() =>
                                            edit(functionKey(row.name), functionFields())}
                                    />
                                {/if}
                                <ToolButton
                                    label={t('debug.remove')}
                                    glyph="trash"
                                    compact
                                    tabindex={reach}
                                    onclick={() => debug.removeFunction(row.name)}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render asked(functionKey(row.name), nav)}
                {/each}
                {#if adding}
                    <li role="none">
                        <TreeItem
                            label=""
                            name={t('debug.function_field')}
                            id="function:new"
                            {nav}
                            level={2}
                            selected
                        >
                            {#snippet field()}
                                <NameField
                                    value=""
                                    label={t('debug.function_field')}
                                    oninput={() => undefined}
                                    onsubmit={keep}
                                    oncancel={() => (adding = false)}
                                    onleave={keep}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                {/if}
                {#each exceptions as row (row.filter)}
                    <li role="none">
                        <TreeItem
                            label={row.label}
                            id={exceptionKey(row.filter)}
                            {nav}
                            level={2}
                            tone={row.enabled ? undefined : 'muted'}
                            title={row.label}
                            showActions
                        >
                            {#snippet detail()}{row.condition}{/snippet}
                            {#snippet actions(reach: number)}
                                <ToolButton
                                    label={t('debug.enable_box')}
                                    glyph={row.enabled ? 'checkbox_on' : 'checkbox_off'}
                                    compact
                                    pressed={row.enabled}
                                    tabindex={reach}
                                    onclick={() => debug.setException(row.filter, !row.enabled)}
                                />
                                {#if row.supportsCondition && row.enabled}
                                    <ToolButton
                                        label={t('debug.exception_condition', row.label)}
                                        glyph="edit"
                                        compact
                                        tabindex={reach}
                                        onclick={() =>
                                            edit(exceptionKey(row.filter), [
                                                {
                                                    name: 'condition',
                                                    label: t(
                                                        'debug.exception_condition',
                                                        row.label
                                                    ),
                                                    hint: t('debug.breakpoint_condition_field')
                                                }
                                            ])}
                                    />
                                {/if}
                            {/snippet}
                        </TreeItem>
                    </li>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render asked(exceptionKey(row.filter), nav)}
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
