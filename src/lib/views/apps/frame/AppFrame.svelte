<script module lang="ts">
    // Layer 3, view registration. One component draws every app. Its registrations are built from
    // the rows of the `apps` channel in routes/views.ts (registerApps), one per app, so this export
    // only marks the module as the one that draws apps.
    export const appRegistration = true;
</script>

<script lang="ts">
    // Layer 3, view. One app: the approval panel while the app is not approved, and its frame once
    // it is. The frame is an iframe on the app's own address with `sandbox="allow-scripts
    // allow-downloads"`, which gives the document an opaque origin, and the policy the server sends
    // with each file keeps it to its own files and the origins its manifest declares. The page
    // never reads into the frame; everything crosses on penpal, through the methods
    // state/system/apps/methods.ts judges one call at a time.
    //
    // The view draws the frame's slot and describes the frame to the workbench's tab frames
    // (ui/tabs/tab-frames.svelte.ts), which the frame layer draws over the slot
    // (shell/frames/FrameLayer.svelte). A layout change draws this view again; the frame, its
    // document and what the app holds in memory stay. Whether the load failed, how often the reader
    // loaded the app again and the question a write is waiting on are the tab's run in the apps
    // store (state/system/apps/apps.svelte.ts), which this view only reads.
    //
    // A key with a modifier, or Escape, pressed while the frame has the keyboard is forwarded by
    // the app's bridge and raised again on the slot, which is inside the pane, where the
    // workbench's keys hear it.
    //
    // A root app is drawn only while the registered app of its view id has the folder this tab
    // recorded: a root key is per workspace, so after a switch the same key can name another
    // folder.

    import { untrack } from 'svelte';
    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FrameSlot from '$lib/ui/tabs/FrameSlot.svelte';
    import { drawFrame, useTabFrames, type FrameSpec } from '$lib/ui/tabs/tab-frames.svelte';
    import { WALL_CLASS, tokenNames } from '$lib/ui/theme';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { appTab, appTabState, drawsFolder } from '$lib/state/system/apps/instance';
    import type { KeyInit, Theme } from '$lib/state/system/apps/methods';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import ApprovalPanel from './ApprovalPanel.svelte';

    const { apps, ui } = useState();
    const frames = useTabFrames();

    let { instance }: ViewProps = $props();

    const id = $derived(instance.view);
    const row = $derived(apps.rowOf(id));
    const tab = $derived(appTab(ui.instanceState(instance.id)));
    const run = $derived(apps.run(instance.id));
    const title = $derived(row === undefined ? id : row.title);

    /** The app's entry as an address, empty while the app is not approved. */
    const src = $derived(row === undefined ? '' : apps.srcOf(row));
    const draws = $derived(row !== undefined && drawsFolder(tab, row.root, row.folder));
    const running = $derived(draws && src !== '' && apps.ready());

    let pending = $state(false);
    let error = $state('');

    /** The tab remembers the hash and the folder it ran, which is how a change is told from a first
     * run. */
    $effect(() => {
        if (!running || row === undefined) return;
        const hash = row.hash;
        const folder = row.folder;
        untrack(() => {
            const held = appTab(ui.instanceState(instance.id));
            if (held.seen === hash && held.folder === (row.root === '' ? '' : folder)) return;
            ui.setInstanceState(
                instance.id,
                appTabState({ ...held, seen: hash, folder: row.root === '' ? '' : folder })
            );
        });
    });

    /** The page's tokens as the frame is told them: every declared custom property, as drawn on the
     * body. */
    function theme(): Theme {
        const drawn = getComputedStyle(document.body);
        const tokens: Record<string, string> = {};
        for (const name of tokenNames()) {
            const value = drawn.getPropertyValue(name).trim();
            if (value !== '') tokens[name] = value;
        }
        return {
            name: ui.theme(),
            tokens,
            wall: document.body.classList.contains(WALL_CLASS)
        };
    }

    /** The color scheme the page draws, which the frame takes so its controls and scrollbars
     * match. */
    let scheme = $state('');

    /** A change of theme, wallpaper, overlay or text size reaches the frame one frame later, once
     * the page has repainted, and the frame's color scheme with it. */
    $effect(() => {
        ui.theme();
        ui.wallpaper();
        ui.crt();
        ui.textScale();
        const wait = requestAnimationFrame(() => {
            scheme = getComputedStyle(document.body).colorScheme;
            apps.themeChanged(instance.id);
        });
        return () => cancelAnimationFrame(wait);
    });

    /**
     * Connect the frame to the page for as long as the element is drawn. It holds the tab's id and
     * the stores, which outlive this view, and nothing of this view's own.
     */
    function framed(node: HTMLIFrameElement): () => void {
        const mine = untrack(() => instance.id);
        const app = untrack(() => id);
        const link = apps.mount({
            instance: mine,
            id: app,
            frame: node,
            theme,
            focused: () => document.activeElement === node,
            forwardKey: (init: KeyInit) =>
                (frames?.slotOf(mine) ?? node).dispatchEvent(
                    new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true })
                )
        });
        return () => link.destroy();
    }

    /** The frame the tab holds: one while the app is approved, drawn and loaded without failing. */
    const frame = $derived<FrameSpec | null>(
        row !== undefined && draws && row.approved && !run.failed && apps.ready()
            ? {
                  kind: 'app',
                  view: instance.view,
                  src,
                  title,
                  key: `${src}:${run.reloads}`,
                  colorScheme: scheme,
                  attach: framed
              }
            : null
    );
    drawFrame(
        frames,
        () => instance.id,
        () => frame
    );

    /** The question a write of the app asks, as the confirm draws it. */
    const asking = $derived.by((): Ask | null => {
        const question = run.question;
        if (question === null) return null;
        return {
            message: question.message,
            detail: question.detail,
            act: () => question.answer(true),
            focus: 'cancel'
        };
    });

    /** The question is let go. A yes has answered it by now, and only a cancel is left to answer
     * no. */
    function closed(): void {
        const question = run.question;
        queueMicrotask(() => question?.answer(false));
    }

    async function approve(keep: boolean): Promise<void> {
        if (row === undefined || pending) return;
        pending = true;
        error = '';
        const outcome = await apps.approve(id, row.hash, keep);
        pending = false;
        if (outcome.ok) return;
        error =
            outcome.error === 'changed'
                ? t('apps.changed_meanwhile')
                : t('apps.approve_failed', outcome.error);
    }

    async function revoke(): Promise<void> {
        error = '';
        const outcome = await apps.revoke(id);
        if (!outcome.ok) error = t('apps.approve_failed', outcome.error);
    }
</script>

<Pane {title} titled={false} {toolbar}>
    <div class="app" data-instance={instance.id} data-app={id}>
        {#if row === undefined || !draws}
            <Empty message={t('ui.unknown_view', id)} />
        {:else if !row.approved}
            <ApprovalPanel
                {row}
                changed={tab.seen !== '' && tab.seen !== row.hash}
                {error}
                {pending}
                onapprove={approve}
                onfolder={() => apps.showFolder(id)}
            />
        {:else if run.failed}
            <Empty message={t('apps.load_failed')} error>
                {#snippet action()}
                    <ToolButton label={t('apps.reload')} onclick={() => apps.reload(instance.id)} />
                {/snippet}
            </Empty>
        {:else if apps.ready()}
            <FrameSlot id={instance.id} />
        {/if}
    </div>
    <AskConfirm {asking} onclose={closed} />
</Pane>

{#snippet toolbar()}
    {#if row?.approved}
        <ToolButton label={t('apps.revoke')} glyph="lock" compact onclick={revoke} />
    {/if}
{/snippet}

<style>
    .app {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: auto;
    }
</style>
