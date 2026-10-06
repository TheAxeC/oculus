<script lang="ts">
    // The page renders the workbench and nothing else. What it does on mount is the wiring the
    // workbench cannot do for itself: fill the view registry, open the socket, and read the two
    // saved stores. The rail's pages and the chords' groups come from the merged config the socket
    // delivers, and so do the words of the status bar's items, which the page makes from stores the
    // shell may not read itself; the rail's own rewrite of its list and the git writes of the
    // status bar's branch and sync items are the page's for the same reason.

    import { onMount, untrack } from 'svelte';
    import Workbench from '$lib/shell/Workbench.svelte';
    import { shouldCancel } from '$lib/shell/context-guard';
    import type { Bookmark } from '$lib/shell/rail/rail';
    import { parseFloats } from '$lib/state/workbench/navigation/arrangement';
    import { readChord, readDocs, readGroups } from '$lib/state/workbench/navigation/catalogue';
    import {
        configRail,
        railPages,
        railRefusal,
        type RailEntry
    } from '$lib/state/workbench/navigation/rail';
    import {
        findingsCount,
        repoStatus,
        statusWords,
        tabFile,
        type StatusGit
    } from '$lib/state/workbench/navigation/status';
    import { repositoriesViewOf } from '$lib/state/sources/repositories/repositories';
    import { configGeneration } from '$lib/state/shared/words/generation.svelte';
    import { bookmarkRows, HUB_ROOT } from '$lib/state/sources/fs';
    import { takeCarried } from '$lib/state/workbench/layout/saved/carry';
    import { createClientState } from '$lib/state/client/context';
    import { useDesktopWindows } from '$lib/shell/desktop-windows.svelte';
    import { desktopOf } from '$lib/state/shared/stores/desktop';
    import { provideState } from '$lib/state/client/use';
    import { provideSpelling } from '$lib/ui/controls/text/spelling';
    import { createTipIds, provideTipIds } from '$lib/ui/menu/tip-ids';
    import { pushedCollections, registerAll, registerCollections } from './views.ts';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    // The one client the page holds: every store, built here and provided to everything below, so
    // nothing under this component reaches a store through a module. The tooltip counter the
    // primitives number their bubbles with is made here beside it, since it is `ui/`'s own and the
    // state layer imports nothing of `ui/`.
    // In the desktop app the page holds the bridge its host gave it, read here once, and a window
    // of a popped-out float carries the float's id in its address; in a browser there is neither.
    const desktop =
        typeof window === 'undefined' ? undefined : desktopOf(window, window.location.search);
    const client = createClientState(desktop);
    provideState(client);
    useDesktopWindows(client);
    provideTipIds(createTipIds());
    provideSpelling(desktop?.bridge.spelling);
    const {
        entities: { config, git: gitPayload, hpc, portfolio, sessions, usage },
        fs: { bookmarks: savedBookmarks, workspaces },
        layout: { activeInstance, loadLayout, openView, stopFollowing },
        repositories,
        selectors: { waitingCount },
        socket: { connect, disconnect, seedConfig, status: socketStatus },
        ui: { instanceState, loadUi, setInstanceState, stopFollowing: stopFollowingUi },
        writes: { setToken, writeRail }
    } = client;

    // The views, and the collection views one per key of config/sources.yml's `collections:`, which
    // the load function shipped with the catalog. It runs here in the script body rather than on
    // mount: the pane tabs and the catalogue draw what the registry holds on the first render, and
    // a collection registered after it would be missing from that frame. The write token goes in
    // with them, so the first write and the socket's first subscription both carry it, and so does
    // the configuration this page was built from, which the socket keeps until a newer push. The
    // page data is read once and not tracked; untrack says so, and is what keeps the read out of
    // any effect.
    untrack(() => {
        registerAll(client.registry);
        registerCollections(client.registry, data.collections);
        setToken(data.token);
        seedConfig(data.seed.payload, data.seed.through);
    });

    // A load that ran again with a token a restarted server minted replaces the one this client
    // holds, without the page being reloaded by hand.
    $effect(() => {
        setToken(data.token);
    });

    /*
     * A push may name a different set of collections, so the registry follows the pushed config:
     * the effect reads the configuration's generation and the config the push carries, and
     * registers the collection views the push names, which drops the views of the keys it no
     * longer names. The first frame is the untracked call above; this runs after it, and returns
     * until the first push has landed.
     */
    $effect(() => {
        configGeneration();
        const pushed = config()?.config;
        // A push whose `collections:` is missing or malformed names no keys, and registering none
        // would close every collection tab on every page; the registry follows a real list only.
        const keys = pushedCollections(pushed);
        if (keys !== null) registerCollections(client.registry, keys);
    });

    /**
     * What the shell is handed out of the merged config: the groups, the direct chord and the
     * documents the chords count into, the rail's pages with their arrangements, and the floats a
     * first load starts with. Each reader is
     * state/workbench/navigation's, which the Views catalogue reads the same keys through.
     */
    const merged = $derived(config()?.config);
    const groups = $derived(readGroups(merged?.nav_groups));
    const directChord = $derived(readChord(merged?.direct_chord));
    const docs = $derived(readDocs(merged?.docs));
    const pages = $derived(railPages(merged));
    const floats = $derived(parseFloats(merged?.floats));

    /**
     * The roots the file routes serve, the current workspace's first and then every other's, which
     * is what a tab's root key is read against to find the folder its file is in.
     */
    const served = $derived.by(() => {
        const held = workspaces();
        const current = held.workspaces.filter((workspace) => workspace.name === held.current);
        const others = held.workspaces.filter((workspace) => workspace.name !== held.current);
        return [...current, ...others].flatMap((workspace) => workspace.roots);
    });

    /**
     * The words of the status bar's items whose stores the shell may not read, the repository
     * being the one holding the file of the tab on screen.
     */
    const status = $derived(
        statusWords(socketStatus(), usage(), hpc(), sessions(), {
            host: config()?.host ?? null,
            findings: findingsCount(portfolio(), config()),
            repo: repoStatus(tabFile(activeInstance()?.state), served, gitPayload(), HUB_ROOT)
        })
    );

    /** Show one repository in the Repositories view, where a refused git write says why. */
    function showRepository(root: string): void {
        const id = openView('repositories');
        setInstanceState(id, { ...repositoriesViewOf(instanceState(id)), root });
    }

    /**
     * The git writes of the status bar's branch, sync and publish items, through the Repositories
     * view's own store. A write git refuses shows the repository, whose line says why.
     */
    const git: StatusGit = {
        switchBranch: async (root, name) => {
            if (!(await repositories.switchBranch(root, name))) showRepository(root);
        },
        push: async (root) => {
            if (!(await repositories.push(root))) showRepository(root);
        },
        sync: async (root) => {
            if (!(await repositories.sync(root))) showRepository(root);
        },
        publish: async (root, remote) => {
            if (!(await repositories.publish(root, remote))) showRepository(root);
        },
        show: showRepository
    };

    /**
     * The reader's own bookmarks, from ~/.oculus/bookmarks.yml through the fs store. They are read
     * here rather than in the rail because the shell's row of the boundary table does not name that
     * store; the rail is handed what to draw. Which view opens one is a question about a file name,
     * which state/sources/fs.ts answers.
     */
    const saved = $derived<Bookmark[]>(bookmarkRows(savedBookmarks().entries));

    /**
     * Rewrite the rail's `rail:` list as the rail asks, a page button moved or hidden, through the
     * rail write the Settings view saves with. The edit is made to the list the file holds, every
     * entry whether or not the rail draws it. It answers the sentence saying why the server refused
     * the write, or the empty string when it was written; the shell may not reach the write itself.
     */
    async function editRail(edit: (rail: RailEntry[]) => RailEntry[]): Promise<string> {
        const answer = await writeRail(edit(configRail(merged)), true);
        return answer.ok ? '' : railRefusal(answer.error);
    }

    onMount(() => {
        connect([
            'portfolio',
            'config',
            'sessions',
            'git',
            'files',
            'hpc',
            'calendar',
            'inbox',
            'usage',
            'feeds',
            'audit',
            'processes',
            'schedule'
        ]);
        takeCarried(localStorage, window, location.origin);
        loadUi(localStorage, window);
        loadLayout(localStorage, window);
        // The browser's own menu stays only where a control owns the right-click
        // (context-guard.ts).
        const guard = (event: MouseEvent): void => {
            if (shouldCancel(event)) event.preventDefault();
        };
        document.addEventListener('contextmenu', guard);
        return () => {
            document.removeEventListener('contextmenu', guard);
            disconnect();
            stopFollowing();
            stopFollowingUi();
        };
    });
</script>

<Workbench
    {groups}
    {docs}
    {pages}
    {floats}
    configured={merged !== undefined}
    {saved}
    {editRail}
    {directChord}
    {status}
    {git}
    waiting={waitingCount()}
/>
