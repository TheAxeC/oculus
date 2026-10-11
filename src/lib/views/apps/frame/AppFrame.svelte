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
    //
    // A disabled app draws a line with an Enable button in place of its frame. An app whose host
    // ended, or waits, draws a line above its frame: the exit code or signal with Restart, the
    // approval of changed files with Approve (which shows the approval panel and never approves),
    // the dependency the host waits for, or the dependency whose revoke stopped it. The approval
    // panel is also where Disable, Enable and Remove are offered beside the Disable and Enable of
    // the line.

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
    import { typeOfFile } from '$lib/state/sources/fs';
    import { tabForKind } from '$lib/state/workbench/layout';
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
    const host = $derived(apps.hostOf(id));
    const reviewing = $derived(apps.reviewing(id));
    let asked: Ask | null = $state(null);
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
            tabFor: (root: string, path: string) =>
                tabForKind(typeOfFile(path).kind, root, path, undefined, apps.holds),
            forwardKey: (init: KeyInit) =>
                (frames?.slotOf(mine) ?? node).dispatchEvent(
                    new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true })
                )
        });
        return () => link.destroy();
    }

    /** The frame the tab holds: one while the app is approved, drawn and loaded without failing. */
    const frame = $derived<FrameSpec | null>(
        row !== undefined &&
            draws &&
            row.approved &&
            !row.disabled &&
            !reviewing &&
            !run.failed &&
            apps.ready()
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
        if (outcome.ok) {
            apps.endReview(id);
            return;
        }
        error =
            outcome.error === 'changed'
                ? t('apps.changed_meanwhile')
                : t('apps.approve_failed', outcome.error);
    }

    /** Enable the app where it is disabled: in the workspace when that is what disables it. */
    function enable(): void {
        if (row === undefined) return;
        const choice = row.workspaceState === 'disabled' ? 'enable-workspace' : 'enable';
        void apps.pick(id, choice, (question) => (asked = question));
    }

    /** The sentence of why the host of the app is not running, or the empty string. */
    function hostLine(): string {
        if (host === undefined) return '';
        if (host.state === 'ended') {
            return host.code === null
                ? t('apps.host_ended_signal', host.signal)
                : t('apps.host_ended_code', host.code.toString());
        }
        if (host.state !== 'waiting') return host.stoppedBy === '' ? '' : stopped(host.stoppedBy);
        if (host.waiting === 'approval') return t('apps.host_wait_approval');
        if (host.waiting === 'cycle') return t('apps.host_wait_cycle');
        if (host.stoppedBy !== '') return stopped(host.stoppedBy);
        return host.waiting === 'missing'
            ? t('apps.host_wait_missing', host.dependency)
            : t('apps.host_wait_dependency', host.dependency);
    }

    const stopped = (name: string): string => t('apps.host_stopped_by', name);

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
        {:else if row.disabled}
            <Empty message={t('apps.disabled_line')}>
                {#snippet action()}
                    <ToolButton label={t('apps.enable')} onclick={enable} />
                {/snippet}
            </Empty>
        {:else if !row.approved || reviewing}
            <ApprovalPanel
                {row}
                changed={(tab.seen !== '' && tab.seen !== row.hash) ||
                    (row.approved && !row.hashApproved)}
                {error}
                {pending}
                onapprove={approve}
                onfolder={() => apps.showFolder(id)}
                choices={apps.choices(row)}
                onchoice={(choice: string) =>
                    void apps.pick(id, choice, (question) => (asked = question))}
                onback={row.approved ? () => apps.endReview(id) : undefined}
            />
        {:else if run.failed}
            <Empty message={t('apps.load_failed')} error>
                {#snippet action()}
                    <ToolButton label={t('apps.reload')} onclick={() => apps.reload(instance.id)} />
                {/snippet}
            </Empty>
        {:else if apps.ready()}
            {#if hostLine() !== ''}
                <div class="host" role="status" data-host-line>
                    <span>{hostLine()}</span>
                    {#if host?.state === 'ended'}
                        <ToolButton
                            label={t('apps.restart')}
                            onclick={() => apps.restartHost(id)}
                        />
                    {:else if host?.waiting === 'approval'}
                        <ToolButton label={t('apps.review')} onclick={() => apps.review(id)} />
                    {/if}
                </div>
            {/if}
            <FrameSlot id={instance.id} />
        {/if}
    </div>
    <AskConfirm {asking} onclose={closed} />
    <AskConfirm asking={asked} onclose={() => (asked = null)} />
</Pane>

{#snippet toolbar()}
    {#if row?.approved}
        <ToolButton label={t('apps.revoke')} glyph="lock" compact onclick={revoke} />
    {/if}
{/snippet}

<style>
    .host {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        color: var(--c-amber-txt, var(--c-amber));
    }

    .app {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: auto;
    }
</style>
