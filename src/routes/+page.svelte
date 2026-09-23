<script lang="ts">
    // The page renders the workbench and nothing else. What it does on mount is the wiring the
    // workbench cannot do for itself: fill the view registry, open the socket, and read the two
    // saved stores. The rail's pages and the chords' groups come from the merged config the socket
    // delivers, and so do the words of the status bar's items, which the page makes from stores the
    // shell may not read itself.

    import { onMount, untrack } from 'svelte';
    import Workbench from '$lib/shell/Workbench.svelte';
    import type { Bookmark } from '$lib/shell/rail/rail';
    import { readChord, readDocs, readGroups } from '$lib/state/workbench/navigation/catalogue';
    import { railPages } from '$lib/state/workbench/navigation/rail';
    import { statusWords } from '$lib/state/workbench/navigation/status';
    import { configGeneration } from '$lib/state/client/generation.svelte';
    import { collectionKeys } from '$lib/data/snapshot/normalise';
    import { typeOfFile } from '$lib/state/sources/fs';
    import { createClientState } from '$lib/state/client/context';
    import { provideState } from '$lib/state/client/use';
    import { provideTipIds } from '$lib/ui/menu/tip-ids';
    import { registerAll, registerCollections } from './views.ts';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    // The one client the page holds: every store, built here and provided to everything below, so
    // nothing under this component reaches a store through a module.
    const client = createClientState();
    provideState(client);
    provideTipIds(client.tipIds);
    const {
        entities: { config, hpc, sessions, usage },
        fs: { bookmarks: savedBookmarks },
        layout: { loadLayout },
        selectors: { waitingCount },
        socket: { connect, disconnect, status: socketStatus },
        ui: { loadUi },
        writes: { setToken }
    } = client;

    // The views, and the collection views one per key of config/sources.yml's `collections:`, which
    // the load function shipped with the catalog. It runs here in the script body rather than on
    // mount: the pane tabs and the catalogue draw what the registry holds on the first render, and
    // a collection registered after it would be missing from that frame. The write token goes in
    // with them, so the first write and the socket's first subscription both carry it. The page
    // data is read once and not tracked; untrack says so, and is what keeps the read out of any
    // effect.
    untrack(() => {
        registerAll(client.registry);
        registerCollections(client.registry, data.collections);
        setToken(data.token);
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
        if (pushed === undefined || !Array.isArray(pushed.collections)) return;
        registerCollections(client.registry, collectionKeys(pushed));
    });

    /**
     * What the shell is handed out of the merged config: the groups, the direct chord and the
     * documents the chords count into, and the rail's pages with their arrangements. Each reader is
     * state/workbench/navigation's, which the Views catalogue reads the same keys through.
     */
    const merged = $derived(config()?.config);
    const groups = $derived(readGroups(merged?.nav_groups));
    const directChord = $derived(readChord(merged?.direct_chord));
    const docs = $derived(readDocs(merged?.docs));
    const pages = $derived(railPages(merged));

    /** The words of the status bar's socket, usage, HPC and live-session items. */
    const status = $derived(statusWords(socketStatus(), usage(), hpc(), sessions()));

    /**
     * The reader's own bookmarks, from ~/.oculus/bookmarks.yml through the fs store. They are read
     * here rather than in the rail because the shell's row of the boundary table does not name that
     * store; the rail is handed what to draw. Which view opens one is a question about a file name,
     * which state/sources/fs.ts answers.
     */
    const saved = $derived<Bookmark[]>(
        savedBookmarks().entries.flatMap((entry) => {
            // An entry with no root or no path names no file, so it is dropped rather than drawn as
            // a button on nothing.
            const root = entry.fields.root;
            const path = entry.fields.path;
            if (
                typeof root !== 'string' ||
                root === '' ||
                typeof path !== 'string' ||
                path === ''
            ) {
                return [];
            }
            return [
                {
                    label: entry.title,
                    root,
                    path,
                    view: typeOfFile(path).kind === 'html' ? 'document' : 'file'
                }
            ];
        })
    );

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
            'audit'
        ]);
        loadUi();
        loadLayout();
        return () => disconnect();
    });
</script>

<Workbench
    {groups}
    {docs}
    {pages}
    configured={merged !== undefined}
    {saved}
    {directChord}
    {status}
    waiting={waitingCount()}
/>
