<script lang="ts">
    // Layer 3, partial of views/sources/repositories/apps/AppSource.svelte. One resource of a group
    // of an app's source control as an explorer row: its file icon, its name (struck through when
    // the app says so, muted when it is faded), its folder after it in list mode, and the app's
    // tooltip. The `scm/resourceState/context` entries of the group `inline` are buttons on the row
    // and the others are its right-click menu; both run on the selected rows of the group when the
    // row is one of them, else on the row. A press runs the row's own command in the app's host or,
    // when the host says so, opens the file; a resource outside every workspace folder is drawn by
    // its URI and opens nothing.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import ActionStrip from '$lib/ui/tabs/ActionStrip.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import { dirOf } from '$lib/state/sources/repositories/change-tree';
    import { resourceId, resourceName } from '$lib/state/system/apps/tools/source-rows';
    import { scmKey } from '$lib/state/system/apps/tools/scm.svelte';
    import type { AppScmResource, AppScmState } from '$lib/state/system/apps/tools/scm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        control: AppScmState;
        group: string;
        resource: AppScmResource;
        nav: TreeNav;
        level: number;
        depth: number;
        /** Whether the folder is said after the name, which list mode does. */
        showFolder: boolean;
        /** The uris of the rows of this group the reader selected. */
        picked: readonly string[];
        /** A press, told before it runs anything: true when it only changed the selection. */
        onpress: (uri: string, event: MouseEvent) => boolean;
        measure: Attachment<HTMLElement>;
    };

    let {
        control,
        group,
        resource,
        nav,
        level,
        depth,
        showFolder,
        picked,
        onpress,
        measure
    }: Props = $props();

    const { appShell, appTools, repositories } = useState();

    const key = $derived(scmKey(control.app, control.id));
    const id = $derived(resourceId(key, group, resource.uri));
    const parts = $derived({
        keys: {
            scmProvider: control.id,
            scmResourceGroup: group,
            scmResourceState: resource.contextValue
        }
    });
    const inline = $derived(appShell.strip('scm/resourceState/context', parts, 'inline'));
    const menu = $derived(appShell.choices('scm/resourceState/context', parts, '', 'inline'));
    /** The uris a command acts on: the selected rows when this row is one of them, else the row. */
    const acted = $derived(
        picked.length > 1 && picked.includes(resource.uri) ? [...picked] : [resource.uri]
    );
    const name = $derived(resourceName(resource));
    const outside = $derived(resource.root === '');
    const folder = $derived(outside ? '' : dirOf(resource.path));
    const title = $derived(
        [outside ? t('repositories.app_source_outside', resource.uri) : resource.path]
            .concat(resource.tooltip === '' ? [] : [resource.tooltip])
            .join('\n')
    );

    function run(pick: string, alt: boolean): void {
        void appTools.scm.execute(
            control,
            menu.offers,
            pick,
            { scope: 'resource', group, resources: acted },
            alt
        );
    }

    function runInline(pick: string, alt: boolean): void {
        void appTools.scm.execute(
            control,
            inline.offers,
            pick,
            { scope: 'resource', group, resources: acted },
            alt
        );
    }

    async function press(event: MouseEvent): Promise<void> {
        if (onpress(resource.uri, event)) return;
        const answer = await appTools.scm.act(control.app, control.id, {
            kind: 'pressed',
            group,
            uri: resource.uri
        });
        const opens = answer.ok && (answer.value as { open?: unknown } | null)?.open === true;
        if (opens && !outside) repositories.openFile(resource.root, resource.path);
    }
</script>

<li role="none" data-scm-resource={resource.uri} {@attach measure}>
    <ContextMenu label={name} items={menu.items} onpick={(pick: string) => run(pick, false)}>
        <TreeItem
            label={name}
            file={outside ? name : resource.path}
            {id}
            {nav}
            {level}
            {depth}
            {title}
            selected={picked.length > 1 && picked.includes(resource.uri)}
            struck={resource.strikeThrough}
            tone={resource.faded ? 'muted' : undefined}
            onclick={(event: MouseEvent) => void press(event)}
        >
            {#snippet detail()}
                {#if showFolder && folder !== ''}
                    <span class="folder">{folder}</span>
                {/if}
            {/snippet}
            {#snippet actions()}
                <ActionStrip
                    label={t('repositories.app_source_row_actions')}
                    actions={inline.actions}
                    onpick={(pick: string, event: MouseEvent) => runInline(pick, event.altKey)}
                />
            {/snippet}
        </TreeItem>
    </ContextMenu>
</li>

<style>
    .folder {
        margin-left: 0.5em;
        font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9);
        opacity: 0.7;
    }
</style>
