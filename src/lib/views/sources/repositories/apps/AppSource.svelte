<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. An app's source control
    // in place of a repository: its input box with the accept button the app's command names, then
    // its groups of resources (apps/AppSourceGroup.svelte). The box starts with the app's value and
    // follows each later write the app makes; what the reader types goes to the app's host about
    // 150 ms after the last key, and Ctrl or Cmd with Enter runs the accept command after the box's
    // text has been sent. The head is the control's section, with its count; the entries of
    // `scm/title` in the group `navigation` are buttons on it and the others its More Actions list.
    // A Cmd or Ctrl press on a row adds it to the selection of its group and Shift selects from the
    // last row; the commands of the rows act on the selection. The control stays selected in the
    // view's control for as long as the app offers it, and its status bar commands show in the
    // status bar's left group while it is.

    import { onDestroy, untrack } from 'svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import ActionStrip from '$lib/ui/tabs/ActionStrip.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import AppSourceGroup from './AppSourceGroup.svelte';
    import {
        drawnGroups,
        sectionId,
        sourceKeyRows
    } from '$lib/state/system/apps/tools/source-rows';
    import { scmKey, scmReason } from '$lib/state/system/apps/tools/scm.svelte';
    import type { AppScmState } from '$lib/state/system/apps/tools/scm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        control: AppScmState;
        collapsed: string[];
        ontoggle: (id: string) => void;
        mode: 'list' | 'tree';
    };

    let { control, collapsed, ontoggle, mode }: Props = $props();

    const { appShell, appTools, notices } = useState();

    /** How long after the last key the box's text goes to the app. */
    const SEND_AFTER_MS = 150;

    const key = $derived(scmKey(control.app, control.id));
    const section = $derived(sectionId(key));
    const groups = $derived(drawnGroups(control));
    const rows = $derived(sourceKeyRows(key, control, mode, collapsed));
    const keys = $derived({ scmProvider: control.id });
    const owner = $derived(
        appShell.acting().find((one) => one.id === control.app)?.row.title ?? ''
    );
    const title = $derived(appShell.strip('scm/title', { keys }));

    let typed = $state('');
    let heard = -1;
    let sent = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    /** The uris selected in the view, by group; a selection never spans two groups. */
    let picked = $state<{ group: string; uris: string[]; anchor: string }>({
        group: '',
        uris: [],
        anchor: ''
    });

    // The app writes the box's value (after an accept, or a template): the last write wins over
    // what is typed.
    $effect(() => {
        const writes = control.input.writes;
        const value = control.input.value;
        untrack(() => {
            if (writes === heard) return;
            heard = writes;
            typed = value;
            sent = value;
        });
    });

    $effect(() => {
        const mine = key;
        appTools.scm.select(mine);
        return () => appTools.scm.deselect(mine);
    });

    onDestroy(() => {
        if (timer !== undefined) clearTimeout(timer);
    });

    async function send(): Promise<void> {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
        if (typed === sent) return;
        sent = typed;
        await appTools.scm.act(control.app, control.id, { kind: 'input', value: typed });
    }

    function typedIn(next: string): void {
        typed = next;
        if (timer !== undefined) clearTimeout(timer);
        timer = setTimeout(() => void send(), SEND_AFTER_MS);
    }

    async function accept(): Promise<void> {
        if (control.acceptCommand === null) return;
        await send();
        const answer = await appTools.scm.act(control.app, control.id, { kind: 'accept' });
        if (!answer.ok) {
            notices.post(
                t(
                    'repositories.app_source_refused',
                    control.acceptCommand.title,
                    scmReason(answer.word)
                )
            );
        }
    }

    function keyed(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        void accept();
    }

    /** A press on a resource row: true when it only changed the selection. */
    function pressed(group: string, uri: string, event: MouseEvent): boolean {
        const same = picked.group === group;
        if (event.metaKey || event.ctrlKey) {
            const held = same ? picked.uris : [];
            picked = {
                group,
                anchor: uri,
                uris: held.includes(uri) ? held.filter((one) => one !== uri) : [...held, uri]
            };
            return true;
        }
        if (event.shiftKey && same && picked.anchor !== '') {
            const uris = groups.find((one) => one.id === group)?.resources.map((one) => one.uri);
            const from = uris?.indexOf(picked.anchor) ?? -1;
            const to = uris?.indexOf(uri) ?? -1;
            if (uris !== undefined && from >= 0 && to >= 0) {
                picked = {
                    group,
                    anchor: picked.anchor,
                    uris: uris.slice(Math.min(from, to), Math.max(from, to) + 1)
                };
                return true;
            }
        }
        picked = { group, anchor: uri, uris: [] };
        return false;
    }

    function runTitle(pick: string, alt: boolean): void {
        void appTools.scm.execute(control, title.offers, pick, { scope: 'sourceControl' }, alt);
    }
</script>

<section class="source" data-app-source={key}>
    {#if control.input.visible}
        <div class="box">
            <TextArea
                value={typed}
                label={t('repositories.app_source_input')}
                placeholder={control.input.placeholder}
                rows={1}
                size="tree"
                grow={{ min: 1, max: 10 }}
                bare
                readOnly={!control.input.enabled}
                oninput={typedIn}
                onkeydown={keyed}
            />
        </div>
        {#if control.acceptCommand !== null}
            <div class="acts">
                <ToolButton
                    label={control.acceptCommand.title === ''
                        ? t('repositories.app_source_accept')
                        : control.acceptCommand.title}
                    title={control.acceptCommand.tooltip === ''
                        ? undefined
                        : control.acceptCommand.tooltip}
                    primary
                    onclick={() => void accept()}
                />
            </div>
        {/if}
    {/if}
    <TreeView label={control.label} {rows} {ontoggle}>
        {#snippet children(nav: TreeNav)}
            <TreeSection
                label={control.label}
                id={section}
                {nav}
                count={control.count ?? undefined}
                badge
                open={!collapsed.includes(section)}
                ontoggle={() => ontoggle(section)}
                title={t('repositories.app_source_title', control.label, owner)}
            >
                {#snippet actions()}
                    <ActionStrip
                        label={t('repositories.app_source_actions')}
                        actions={title.actions}
                        onpick={(pick: string, event: MouseEvent) => runTitle(pick, event.altKey)}
                    />
                {/snippet}
                {#each groups as group (group.id)}
                    <AppSourceGroup
                        {control}
                        {group}
                        {nav}
                        {collapsed}
                        {ontoggle}
                        {mode}
                        picked={picked.group === group.id ? picked.uris : []}
                        onpress={(uri: string, event: MouseEvent) => pressed(group.id, uri, event)}
                    />
                {/each}
                {#if groups.length === 0}
                    <li role="none">
                        <TreeItem
                            label={t('repositories.app_source_empty')}
                            tone="muted"
                            depth={1}
                        />
                    </li>
                {/if}
            </TreeSection>
        {/snippet}
    </TreeView>
</section>

<style>
    .source {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .box,
    .acts {
        padding: 0 12px 0 11px;
    }
</style>
