<script module lang="ts">
    // Layer 3, view registration. A hub document opens from its group in the view catalogue and is
    // a tab of the page its group names, a document of oculus's own folder opens from a link or is
    // a tab of the Help page, and the view is not listed as a view of its own.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'doc',
        label: 'views.doc',
        glyph: 'views.doc_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One Markdown document as its own tab: a document of the research hub, which
    // the `docs:` list of config/layout.yml names, one instance per path and the entry's label on
    // the tab, or a document of oculus's own folder (the Apps guide and the other guides), which
    // no list needs to name.
    //
    // The document is fetched rather than selected, as a project's README is: the wire model keeps
    // documents out of the snapshot, so state/system/docs.svelte.ts asks api/docs for this path and
    // the shared Markdown partial draws what comes back. A figure beside the document is addressed
    // under the hub root by the server, so it is drawn through the file route. A document of
    // oculus's own that holds a diagram comes back with its diagrams cut out as parts of their own,
    // and the view draws each from the diagram route in the page's text colour between the runs of
    // prose. A press on a relative link to another Markdown file opens that document as a tab
    // (shared/prose/jump.ts), and the heading a link names is in the tab's state as `fragment`,
    // scrolled to once the document is drawn and then removed from the state. The prose is drawn
    // straight into the box, so over a wallpaper the box asks for the tint and is the one surface
    // the document is read off.
    //
    // A tab whose state carries `engine: true` is a document of oculus's own folder: its `path` is
    // relative to that folder, its id is `engine:<path>`, and it is read through api/docs'
    // `engine` read, so it draws on any hub, whatever that hub's `docs:` list holds and wherever
    // the engine folder sits. Its words are the state's `label`, or the path's last name when it
    // carries none (a tab opened from a link). The pane bar's file actions apply to the file at
    // the engine folder's place in the hub (the answer's `engineAt`) and none is shown when the
    // folder lies outside the hub.
    //
    // Any other tab holds the hub path it was opened with, and the list can move an entry to
    // another path while a saved layout names the old one. The list is read from the config
    // channel, as the Views catalogue reads it. A tab whose path left it while one entry carries
    // its label shows that entry and is restated to its path and id, so the saved layout holds the
    // new path from then on; when another tab already holds that path, this one is closed and that
    // one made the active tab of its page, so one path stays one tab. A tab matching no entry says
    // which path it asked for. Before the config's first push the list is unknown and the tab's own
    // path is read.
    //
    // A tab of the hub whose path lies inside the engine folder, whether a saved layout holds it or
    // an entry of a hub's list opened it, is the engine's document: it is restated to
    // `engine: true` with the path relative to the folder, keeping its words, and closes in favour
    // of an engine tab that already shows the same document, so a guide is one tab on any hub.
    // Where the folder lies in the hub comes from the manual's answer, which a hub tab asks for in
    // the same render as its own read; the tab draws the loading line until the manual answers and
    // is restated only then, and when the manual cannot be read the tab is read as a document of
    // the hub.
    //
    // A tab whose state names a `hub` is a document of that hub, which no `docs:` list follows. A
    // hub document is a file of its hub's folder, which the pane's breadcrumb reads it as and the
    // tab's right-click menu acts on (shell/panes/strip/tab-menu.ts): the bookmark and Open in
    // Program items. The star and, for a file whose extension `open.program_ext` maps, Open in
    // Program also stand at the right end of the pane's breadcrumb bar
    // (shared/links/FileBarActions.svelte). An engine tab is the file at the engine folder's place
    // in the hub for the pane's breadcrumb, the tab's menu, its icon and the Files view's sections
    // (navigation/pages.ts, `fileOfTab`, with the place the client state's `docPlaceFor` reads from
    // the manual's answer), and has none where no hub of the workspace holds the folder. The tab
    // hands nothing to the pane's strip. Its scroll box carries `data-tab-focus`, which is where
    // the keyboard goes when a double click keeps the tab (PaneBody.svelte). The headings the
    // server's answer carries are said to the Outline, and a press on an Outline row scrolls the
    // tab to that heading (shared/prose/rendered-headings.svelte.ts).

    import Empty from '$lib/ui/frame/Empty.svelte';
    import FileBarActions from '../../shared/links/FileBarActions.svelte';
    import Diagram from '../../shared/prose/diagram/Diagram.svelte';
    import Markdown from '../../shared/prose/Markdown.svelte';
    import { withoutFragment } from '../../shared/prose/doc-link';
    import { scrollToFragment } from '../../shared/prose/jump';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import { servedFile } from '$lib/views/shared/links/file-bar';
    import { shareHeadings } from '../../shared/prose/rendered-headings.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import {
        docState,
        engineDocState,
        engineHubPath,
        engineRelative,
        followDoc,
        readDocs
    } from '$lib/state/workbench/navigation/catalogue';
    import type { DocPart, DocState } from '$lib/state/system/docs.svelte';
    import { nameOf } from '$lib/state/sources/explorer/file-type';
    import {
        instanceFlag,
        instanceMap,
        instanceText,
        isInstanceOf,
        tabsOf
    } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';

    const {
        docs: { engineDocument, hubDocument, manual },
        entities: { config },
        fs: { primary, roots },
        headings,
        layout: { activateInstance, closeInstance, hosts, restateInstance }
    } = useState();

    let { instance }: ViewProps = $props();

    const path = $derived(instanceText(instance.state, 'path'));
    const label = $derived(instanceText(instance.state, 'label'));
    const fragment = $derived(instanceText(instance.state, 'fragment'));
    const isEngine = $derived(instanceFlag(instance.state, 'engine'));
    /** The hub the tab's path is relative to: the one its state names, else the primary. */
    const ownHub = $derived(instanceText(instance.state, 'hub'));
    const hubName = $derived(ownHub === '' ? primary() : ownHub);
    const pushed = $derived(config());
    const followed = $derived(
        isEngine || pushed === null || path === '' || ownHub !== ''
            ? null
            : followDoc(readDocs(pushed.config.docs), path, label)
    );
    /** The path read: the entry's, or the tab's own while the list is unknown. */
    const reading = $derived(followed === null ? path : (followed.entry?.path ?? ''));

    /**
     * The manual's answer, which a tab of the hub asks for because it names where the engine folder
     * lies in the hub; an engine tab holds that place in its own answer.
     */
    const guide = $derived(isEngine || path === '' ? null : manual());
    const waiting = $derived(guide?.loading === true);
    const engineAt = $derived(
        guide === null || guide.loading || guide.error !== '' || guide.engineHub !== hubName
            ? ''
            : guide.engineAt
    );
    /** The engine path a tab of the hub is the document of, or null for a document of the hub. */
    const engined = $derived(
        isEngine || waiting ? null : engineRelative(followed?.entry?.path ?? path, engineAt)
    );
    /** The path relative to the engine folder that this tab shows, or null for a hub document. */
    const enginePath = $derived(isEngine ? path : engined);

    const title = $derived(
        enginePath === null
            ? (followed?.entry?.label ?? (label === '' ? t('views.doc') : label))
            : label === ''
              ? (followed?.entry?.label ?? nameOf(enginePath))
              : label
    );
    /** The hub's read of the path, which a tab of the hub starts together with the manual's. */
    const hub = $derived(isEngine || reading === '' ? null : hubDocument(reading, ownHub));
    const shown = $derived.by(() => {
        // `hub` is read before the manual's answer is known, so both requests go out together.
        const own = hub;
        if (enginePath !== null) return engineDocument(enginePath);
        return waiting ? guide : own;
    });
    /** The file the bar's actions apply to, under the folder of `barRoot`, or '' for none. */
    const barPath = $derived(
        enginePath === null ? reading : engineHubPath(enginePath, shown?.engineAt ?? '')
    );
    /** The folder the bar's file is in: the tab's hub, or the hub that holds the engine folder. */
    const barRoot = $derived(enginePath === null ? (hubName ?? '') : (shown?.engineHub ?? ''));

    let box: HTMLDivElement | undefined = $state();
    shareHeadings({
        store: headings,
        id: () => instance.id,
        headings: () =>
            shown === null || shown.loading || shown.error !== '' ? null : shown.headings,
        box: () => box
    });

    /** The line drawn when the read failed, naming the path read and the reason. */
    function failed(reason: string): string {
        return enginePath === null
            ? t('doc.failed', reading, reason)
            : t('doc.failed_engine', enginePath, reason);
    }

    /** One run of prose as the document the Markdown partial draws, the answer's state kept. */
    function run(part: DocPart, whole: DocState): DocState {
        return { ...whole, html: part.kind === 'html' ? part.html : '' };
    }

    // The heading a link named: scrolled to once the document is drawn and then taken out of the
    // tab's state, so a change of the file or a restored layout does not scroll to it again, and
    // a second press on the same link, which sets it again, scrolls once more.
    $effect(() => {
        const held = shown;
        if (instance.state === undefined || fragment === '' || box === undefined || held === null)
            return;
        if (held.loading || held.error !== '') return;
        scrollToFragment(box, fragment);
        restateInstance(instance.id, withoutFragment(instanceMap(instance.state)));
    });

    $effect(() => {
        if (engined !== null) {
            becomeEngine(engined);
            return;
        }
        const entry = followed?.entry;
        if (followed?.moved !== true || entry === undefined || entry === null) return;
        const open = openElsewhere(entry.path);
        if (open === null) {
            restateInstance(instance.id, { ...instanceMap(instance.state), ...docState(entry) });
            return;
        }
        // Another tab already shows the entry, so this one goes rather than becoming a second
        // instance of the same path, which a press in the catalogue could never reach.
        activateInstance(open);
        closeInstance(instance.id);
    });

    /**
     * Restate this tab as the engine's document at a path relative to the engine folder, keeping
     * its words, or close it when another tab already shows that document and make that one the
     * active tab of its page.
     */
    function becomeEngine(at: string): void {
        const open = openElsewhere(engineDocState(at).id);
        if (open === null) {
            const words = label === '' ? (followed?.entry?.label ?? '') : label;
            restateInstance(instance.id, {
                ...instanceMap(instance.state),
                ...engineDocState(at, words)
            });
            return;
        }
        activateInstance(open);
        closeInstance(instance.id);
    }

    /**
     * The id of another document tab, on any page or float, that has this id, or null for none.
     */
    function openElsewhere(id: string): string | null {
        for (const host of hosts()) {
            for (const tab of tabsOf(host.workbench.root)) {
                if (tab.id !== instance.id && isInstanceOf(tab, 'doc', id)) return tab.id;
            }
        }
        return null;
    }

    // The bar's actions go up to the pane while the tab is mounted and one of them applies
    // (ui/tabs/tab-actions.svelte.ts).
    handUp(
        useTabActions(),
        () => instance.id,
        barActions,
        () => servedFile(roots(), barRoot, barPath, barPath !== '' && barRoot !== '')
    );
</script>

<!-- The file's actions, handed up to the right end of the pane's breadcrumb bar. -->
{#snippet barActions()}
    <FileBarActions root={barRoot} path={barPath} onDisk={barPath !== '' && barRoot !== ''} />
{/snippet}

<Pane {title} tinted>
    <div
        class="view"
        data-instance={instance.id}
        data-path={enginePath ?? (reading === '' ? path : reading)}
        data-tab-focus
        tabindex="-1"
        bind:this={box}
    >
        {#if path === ''}
            <Empty message={t('doc.none')} glyph={t('doc.none_glyph')} />
        {:else if shown === null}
            <Empty message={t('doc.unlisted', path)} glyph={t('doc.none_glyph')} />
        {:else if shown.parts.length > 0}
            {#each shown.parts as part, at (at)}
                {#if part.kind === 'diagram'}
                    <Diagram name={part.name} alt={part.alt} />
                {:else}
                    <Markdown
                        doc={run(part, shown)}
                        loading={t('doc.loading')}
                        failed={failed(shown.error)}
                        surface={false}
                        follow
                    />
                {/if}
            {/each}
        {:else}
            <Markdown
                doc={shown}
                loading={t('doc.loading')}
                failed={failed(shown.error)}
                surface={false}
                follow
            />
        {/if}
    </div>
</Pane>

<style>
    .view {
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        box-sizing: border-box;
    }

    /* The terminal shape: the whole tab follows the folder line, as the boards do. */
    :global(body.rice) .view {
        font-family: var(--font-mono);
    }
</style>
