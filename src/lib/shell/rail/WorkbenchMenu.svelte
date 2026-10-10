<script lang="ts">
    // Layer 3, shell. The Workbenches button of the rail's foot: a menu of the workbenches that are
    // open, a page that belongs to one folder, listed by their words with the one on screen marked.
    // A row shows its workbench, and the button at the row's end closes it, asking first about
    // unsaved text and running terminals as closing a page asks (state/workbench/navigation/
    // pages.ts, `createPageFlows`). A second group lists the same workbenches under Reset layout,
    // which asks first, makes the workbench again from the `workbench:` arrangement of
    // config/layout.yml and drops the layout kept for its folder. With no workbench open the menu
    // says so.
    //
    // The keyboard ring is the rail's, so the button is handed its place in the focus order and its
    // key handler.

    import CloseQuestions from '$lib/ui/tabs/CloseQuestions.svelte';
    import { useWorkbenchReset } from './workbench-reset';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
    import {
        createPageFlows,
        pageName,
        questionFor,
        type Question
    } from '$lib/state/workbench/navigation/pages';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { closePage, currentPage, pages, switchPage },
        registry: { viewFor },
        ui: { unsaved, busyTerminals, saveBeforeClose }
    } = useState();

    type Props = {
        stopIndex: (id: string) => number;
        ringKeys: (id: string) => (event: KeyboardEvent) => void;
    };

    let { stopIndex, ringKeys }: Props = $props();

    /** Make a workbench again from its arrangement, which the page reads from the config. */
    const resetWorkbench = useWorkbenchReset();

    /** The close that waits on its dialog, and the reset question that waits on its own. */
    let confirming: { message: string; id: string } | null = $state(null);
    let question: Question | null = $state(null);

    const flows = createPageFlows({
        pages,
        unsaved,
        saveBeforeClose,
        busyTerminals,
        viewFor,
        closePage,
        holdClose: (held) => (confirming = held),
        ask: questionFor((held) => (question = held))
    });

    /** Every workbench that is open with the name its page is called by. */
    const open = $derived(
        pages().flatMap((page, at) =>
            page.folder === undefined ? [] : [{ id: page.id, name: pageName(page, at) }]
        )
    );
    const current = $derived(currentPage().id);

    const none: MenuItem[] = [{ id: 'none', label: t('ui.workbenches_none'), disabled: true }];

    const groups = $derived<MenuGroup[]>([
        {
            id: 'open',
            heading: t('ui.workbenches'),
            items: open.map((one) => ({
                id: one.id,
                label: one.name,
                active: one.id === current,
                action: {
                    glyph: t('ui.close_glyph'),
                    label: t('ui.workbenches_close', one.name),
                    run: () => flows.close(one.id)
                }
            }))
        },
        {
            id: 'reset',
            heading: t('ui.workbenches_reset_heading'),
            items: open.map((one) => ({ id: one.id, label: one.name }))
        }
    ]);

    function pick(id: string, _event: MouseEvent, group?: string): void {
        if (group === 'open') switchPage(id);
        else if (group === 'reset') flows.reset(id, () => resetWorkbench(id));
    }
</script>

<Menu
    label={t('ui.workbenches')}
    glyph={t('ui.workbenches_glyph')}
    rail
    placement="beside"
    items={open.length === 0 ? none : []}
    groups={open.length === 0 ? undefined : groups}
    onpick={pick}
    stop="workbenches"
    tabindex={stopIndex('workbenches')}
    onkeydown={ringKeys('workbenches')}
/>

<CloseQuestions
    closing={confirming}
    {question}
    onclose={closePage}
    onclear={() => (confirming = null)}
/>
