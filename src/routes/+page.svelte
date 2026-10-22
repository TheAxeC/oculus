<script lang="ts">
    // The page renders the workbench and nothing else. What it does on mount is the wiring the
    // workbench cannot do for itself: fill the view registry, hand the client the page state the
    // load read, open the socket and start the saved arrangement. The rail's pages and the chords'
    // groups come from the merged config the socket delivers, and so do the words of the status
    // bar's items, which the page makes from stores the shell may not read itself; the rail's own
    // rewrite of its list, the git writes of the status bar's branch and sync items and the
    // window's navigation history, which the title bar strip walks, are the page's to hand in for
    // the same reason.

    import { onMount, untrack } from 'svelte';
    import Workbench from '$lib/shell/Workbench.svelte';
    import { shouldCancel } from '$lib/shell/context-guard';
    import { provideFileProblems } from '$lib/shell/panes/strip/file-problems';
    import { parseFloats } from '$lib/state/workbench/navigation/arrangement';
    import { readChord, readDocs, readGroups } from '$lib/state/workbench/navigation/catalogue';
    import {
        configRail,
        railPages,
        railRefusal,
        type RailEntry
    } from '$lib/state/workbench/navigation/rail';
    import {
        chosenState,
        findingsCount,
        repoStatus,
        repositoryChoices,
        statusWords,
        tabFile,
        type StatusGit
    } from '$lib/state/workbench/navigation/status';
    import { repositoriesViewOf } from '$lib/state/sources/repositories/repositories';
    import { configGeneration } from '$lib/state/shared/words/generation.svelte';
    import { problemMarkOf, problemWords } from '$lib/state/sources/fs';
    import { allRoots, readRoots } from '$lib/state/sources/fs-transport';
    import { createClientState } from '$lib/state/client/context';
    import { useBrowserWindows } from '$lib/shell/window/browser-windows.svelte';
    import { useDesktopWindows } from '$lib/shell/window/desktop-windows.svelte';
    import { desktopOf } from '$lib/state/shared/stores/desktop';
    import { floatOf, ownerOf } from '$lib/state/workbench/layout/open/float/browser';
    import { browserTabId, holdBrowserTabId } from '$lib/state/workbench/layout/saved/storage';
    import { provideState } from '$lib/state/client/use';
    import { provideSpelling } from '$lib/ui/controls/text/spelling';
    import { createTipIds, provideTipIds } from '$lib/ui/menu/tip-ids';
    import { pushedCollections, registerAll, registerApps, registerCollections } from './views.ts';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    // The one client the page holds: every store, built here and provided to everything below, so
    // nothing under this component reaches a store through a module. The tooltip counter the
    // primitives number their bubbles with is made here beside it, since it is `ui/`'s own and the
    // state layer imports nothing of `ui/`.
    // In the desktop app the page holds the bridge its host gave it, read here once, and a window
    // of a popped-out float carries the float's id in its address; a browser has no bridge, and a
    // browser tab opened for a float carries the id in its address the same way.
    const desktop =
        typeof window === 'undefined' ? undefined : desktopOf(window, window.location.search);
    const client = createClientState(
        desktop,
        typeof window === 'undefined' ? null : (desktop?.float ?? floatOf(window.location.search)),
        typeof window === 'undefined'
            ? 'server'
            : (browserTabId() ?? Math.random().toString(36).slice(2, 8)),
        typeof window === 'undefined' ? null : (desktop?.owner ?? ownerOf(window.location.search))
    );
    provideState(client);
    useDesktopWindows(client);
    useBrowserWindows(client);
    $effect(() => (client.float === null ? holdBrowserTabId(client.pageId) : undefined));
    provideTipIds(createTipIds());
    provideSpelling(desktop?.bridge.spelling);
    const {
        apps: { findings: appFindings, rows: appRows },
        entities: { config, git: gitPayload, hpc, portfolio, sessions, usage },
        fs: { primary, workspaces },
        layout: {
            activeInstance,
            currentPage,
            loadLayout,
            openView,
            stopFollowing,
            workspaceAnswered
        },
        notices,
        pageState,
        problems,
        repositories,
        selectors: { waitingCount, rootsOfRepository },
        socket: { connect, disconnect, seedApps, seedConfig, status: socketStatus },
        ui: { instanceState, setInstanceState, statusRepository },
        writes: { setToken, writeRail }
    } = client;

    // The errors and warnings a file tab's face draws come from the problems store, which the shell
    // may not read, so the panes get this function in its place.
    provideFileProblems((file) => {
        const mark = problemMarkOf(problems.fileCounts(file.root, file.path), 'file');
        return mark === null ? null : { ...problemWords(mark), tone: mark.tone };
    });

    // The views, and the collection views one per key of the `collections:` option, which
    // the load function shipped with the catalog. It runs here in the script body rather than on
    // mount: the pane tabs and the catalogue draw what the registry holds on the first render, and
    // a collection registered after it would be missing from that frame. The write token goes in
    // with them, so the first write and the socket's first subscription both carry it, and so does
    // the configuration this page was built from, which the socket keeps until a newer push, and
    // the page state the load read, which the first frame's arrangement and view states come from.
    // The page data is read once and not tracked; untrack says so, and is what keeps the read out
    // of any effect.
    untrack(() => {
        registerAll(client.registry);
        registerCollections(client.registry, data.collections);
        setToken(data.token);
        pageState.install(data.pageState);
        seedConfig(data.seed.payload, data.seed.through);
        const { rows, findings, folders, version } = data.apps;
        seedApps({ rows, findings, folders }, version);
        registerApps(client.registry, rows);
    });

    // A load that ran again with a token a restarted server minted replaces the one this client
    // holds, without the page being reloaded by hand.
    $effect(() => {
        setToken(data.token);
    });

    // The same load hands the apps the server held when it ran. They are seeded again, untracked,
    // and a seed older than the rows already held is ignored; the registry then takes the rows the
    // page holds after the seed, so an ignored seed never registers its older rows.
    $effect(() => {
        const { rows, findings, folders, version } = data.apps;
        untrack(() => {
            seedApps({ rows, findings, folders }, version);
            registerApps(client.registry, appRows());
        });
    });

    /*
     * A push may name a different set of collections, so the registry follows the pushed config:
     * the effect reads the configuration's generation and the config and hubs the push carries,
     * and registers the collection views they name, which drops the views of the keys they no
     * longer name. The first frame is the untracked call above; this runs after it, and returns
     * until the first push has landed.
     */
    $effect(() => {
        configGeneration();
        const pushed = config();
        // A push whose `collections:` is missing or malformed names no keys, and registering none
        // would close every collection tab on every page; the registry follows a real list only.
        const keys = pushedCollections(pushed?.config, pushed?.hubs ?? null);
        if (keys !== null) untrack(() => registerCollections(client.registry, keys));
    });

    // The apps' views follow the rows of the `apps` channel: a push moves a badge, a title, an app
    // added or taken away, and the registry is the one place the pane tabs and the catalogue read.
    // The registry is a reactive map, so the call runs untracked: it reads the registrations to
    // drop the stale ones and writes the current ones, and tracked it would run again on its own
    // writes.
    $effect(() => {
        const rows = appRows();
        untrack(() => registerApps(client.registry, rows));
    });

    /**
     * What the shell is handed out of the merged config: the groups, the direct chord and the
     * documents the chords count into, the rail's pages with their arrangements, and the floats a
     * first load starts with. Each reader is
     * state/workbench/navigation's, which the Views catalogue reads the same keys through.
     */
    const merged = $derived(config()?.config);
    const groups = $derived(readGroups(merged));
    const directChord = $derived(readChord(merged?.direct_chord));
    const docs = $derived(readDocs(merged?.docs));
    const pages = $derived(railPages(merged));
    const floats = $derived(parseFloats(merged?.floats));

    /**
     * The roots the file routes serve, the current workspace's first and then every other's, which
     * is what a tab's root key is read against to find the folder its file is in.
     */
    const served = $derived(allRoots(workspaces()));

    /**
     * The current workspace's roots, which are the roots the `git` channel and the Files view
     * serve, or null while the workspaces are being read.
     */
    const workspaceRoots = $derived(readRoots(workspaces()));

    /**
     * What the repository last chosen in the status bar comes to against the `git` channel and the
     * current workspace's roots. A choice that names a repository no root of the workspace holds
     * is not used; the `status_bar.repository` option keeps it, so nothing is written for it.
     */
    const chosen = $derived(chosenState(statusRepository(), gitPayload(), workspaceRoots));

    /**
     * The words of the status bar's items whose stores the shell may not read, the repository being
     * the one its rule follows (state/workbench/navigation/status.ts): the file of the tab on
     * screen, else the folder of the workbench on screen, else the repository last chosen, else the
     * hub's.
     */
    const status = $derived(
        statusWords(socketStatus(), usage(), hpc(), sessions(), {
            host: config()?.host ?? null,
            findings: findingsCount(portfolio(), config(), { findings: appFindings() }),
            problems: problems.total(),
            repo: repoStatus(
                {
                    file: tabFile(activeInstance()?.state),
                    folder: currentPage().folder ?? null,
                    chosen: chosen === 'use' ? statusRepository() : null
                },
                served,
                gitPayload(),
                primary()
            ),
            choices: repositoryChoices(gitPayload(), workspaceRoots)
        })
    );

    /** Show one repository in the Repositories view, where a refused git write says why. */
    function showRepository(root: string): void {
        const id = openView('repositories');
        setInstanceState(id, { ...repositoriesViewOf(instanceState(id)), root });
    }

    /**
     * The git writes of the status bar's branch, sync and publish items, through the Repositories
     * view's own store, and the action that store has in flight on the item's repository. A write
     * git refuses shows the repository, whose line says why.
     */
    const git: StatusGit = {
        running: (root, among) => repositories.running(rootsOfRepository(root), among),
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
            'recover',
            'calendar',
            'inbox',
            'usage',
            'feeds',
            'audit',
            'processes',
            'schedule',
            'apps',
            'debug',
            'debug-console',
            'jump',
            'changes',
            'state'
        ]);
        loadLayout();
        // A record file of the state folder that does not read is said once, as the page opens.
        for (const finding of pageState.findings()) {
            notices.post(finding.message, { tone: 'warning' });
        }
        // The browser's own menu stays only where a control owns the right-click
        // (context-guard.ts).
        const guard = (event: MouseEvent): void => {
            if (shouldCancel(event)) event.preventDefault();
        };
        // A page going away sends the saves that wait with requests that outlive it.
        const leave = (): void => pageState.flush();
        document.addEventListener('contextmenu', guard);
        window.addEventListener('pagehide', leave);
        return () => {
            document.removeEventListener('contextmenu', guard);
            window.removeEventListener('pagehide', leave);
            disconnect();
            stopFollowing();
        };
    });

    // The arrangement belongs to the open workspace, so it is read once the workspace answer has
    // named the workspace and read again whenever a later answer names another: Switch, Save As,
    // New and Close here, or a move made by another window.
    $effect(() => {
        const { loading, error, open } = workspaces();
        untrack(() => workspaceAnswered({ loading, error, open }));
    });
</script>

<Workbench
    {groups}
    {docs}
    {pages}
    {floats}
    configured={merged !== undefined}
    {editRail}
    {directChord}
    {status}
    {git}
    waiting={waitingCount()}
    walkProblem={problems.walk}
    history={client.history}
    saveAll={() => void client.autosave.saveEvery()}
    appThemes={data.appThemes}
/>
