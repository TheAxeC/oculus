<script lang="ts">
    // Layer 3, partial of views/sources/repositories/RepoList.svelte. The row of an app's source
    // control in the Repositories section, beside the rows of the repositories: its label, the
    // title of the app it belongs to as the row's muted detail and in the hover words, and the
    // count its host gave as a badge. Pressing it shows the control in place of a repository. The
    // entries of `scm/repository` in the group `inline` are buttons on the row and the others its
    // More Actions list; the entries of `scm/sourceControl` are its right-click menu. Both run on
    // the control.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import ActionStrip from '$lib/ui/tabs/ActionStrip.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { scmKey } from '$lib/state/system/apps/tools/scm.svelte';
    import type { AppScmState } from '$lib/state/system/apps/tools/scm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        control: AppScmState;
        nav: TreeNav;
        /** Whether the view shows this control. */
        current: boolean;
        onpick: () => void;
    };

    let { control, nav, current, onpick }: Props = $props();

    const { appShell, appTools } = useState();

    const key = $derived(scmKey(control.app, control.id));
    const keys = $derived({ scmProvider: control.id });
    const inline = $derived(appShell.strip('scm/repository', { keys }, 'inline'));
    const menu = $derived(appShell.choices('scm/sourceControl', { keys }));
    const owner = $derived(
        appShell.acting().find((one) => one.id === control.app)?.row.title ?? ''
    );

    function run(offers: typeof menu.offers, pick: string, alt: boolean): void {
        void appTools.scm.execute(control, offers, pick, { scope: 'sourceControl' }, alt);
    }
</script>

<li role="none" data-source-row={key}>
    <ContextMenu
        label={control.label}
        items={menu.items}
        onpick={(pick: string) => run(menu.offers, pick, false)}
    >
        <TreeItem
            label={control.label}
            id={`source:${key}`}
            {nav}
            level={2}
            depth={1}
            glyph="repositories"
            title={t('repositories.app_source_title', control.label, owner)}
            {current}
            count={control.count !== null && control.count > 0 ? control.count : undefined}
            badge
            countTitle={control.count === 1
                ? t('repositories.list_changes_one')
                : t('repositories.list_changes', control.count ?? 0)}
            nameStyle="font-weight: 400"
            onclick={onpick}
        >
            {#snippet detail()}{owner}{/snippet}
            {#snippet actions()}
                <ActionStrip
                    label={t('repositories.app_source_actions')}
                    actions={inline.actions}
                    onpick={(pick: string, event: MouseEvent) =>
                        run(inline.offers, pick, event.altKey)}
                />
            {/snippet}
        </TreeItem>
    </ContextMenu>
</li>
