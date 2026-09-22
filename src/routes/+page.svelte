<script lang="ts">
    // The page renders the workbench and nothing else. What it does on mount is the wiring the
    // workbench cannot do for itself: fill the view registry, open the socket, and read the two
    // saved stores. The rail's groups come from the merged config the socket delivers, since the
    // shell may not read entities itself.

    import { onMount, untrack } from 'svelte';
    import Workbench from '$lib/shell/Workbench.svelte';
    import type { Bookmark, DocEntry, NavGroup } from '$lib/shell/rail/rail';
    import type { Arrangement } from '$lib/shell/panes/page-strip';
    import { configGeneration } from '$lib/state/client/generation.svelte';
    import { collectionKeys } from '$lib/data/snapshot/normalise';
    import { typeOfFile } from '$lib/state/sources/fs';
    import { t } from '$lib/state/words/text';
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
        entities: { config },
        fs: { bookmarks: savedBookmarks },
        layout: { loadLayout },
        selectors: { waitingCount },
        socket: { connect, disconnect },
        ui: { loadUi },
        writes: { setToken }
    } = client;

    // The views, and the collection views one per key of config/sources.yml's `collections:`, which
    // the load function shipped with the catalog. It runs here in the script body rather than on
    // mount: the rail draws what the registry holds on the first render, and a collection
    // registered after it would be missing from that frame. The write token goes in with them, so
    // the first write and the socket's first subscription both carry it. The page data is read once
    // and not tracked; untrack says so, and is what keeps the read out of any effect.
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

    /** The `nav_groups` map of config/layout.yml in order. Registrations name each group by id. */
    const groups = $derived<NavGroup[]>(readGroups(config()?.config.nav_groups));

    /**
     * The `direct_chord` of config/layout.yml: the one letter a digit after it counts into the
     * rail's directly drawn views. Anything but a single lowercase letter leaves the chord unset.
     */
    const directChord = $derived(readChord(config()?.config.direct_chord));

    function readChord(raw: unknown): string | undefined {
        return typeof raw === 'string' && /^[a-z]$/.test(raw) ? raw : undefined;
    }

    /**
     * The `bookmarks` list of config/layout.yml, in order. Each entry is a local file under one of
     * the `roots:` of config/sources.yml; the rail draws one button per entry and the `document`
     * view opens it. An entry that is not three strings is dropped rather than drawn half-formed.
     */
    const bookmarks = $derived<Bookmark[]>(readBookmarks(config()?.config.bookmarks));

    /**
     * The reader's own bookmarks, from ~/.oculus/bookmarks.yml through the fs store. They are read
     * here rather than in the rail because the shell's row of the boundary table does not name that
     * store; the rail is handed what to draw, as it is handed the configured ones. Which view opens
     * one is a question about a file name, which state/sources/fs.ts answers.
     */
    const saved = $derived<Bookmark[]>(
        savedBookmarks().entries.flatMap((entry) => {
            // An entry with no root or no path names no file, so it is dropped rather than drawn as
            // a button on nothing, as a configured bookmark of that shape is.
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

    function readBookmarks(raw: unknown): Bookmark[] {
        if (!Array.isArray(raw)) return [];
        const found: Bookmark[] = [];
        for (const entry of raw) {
            if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue;
            const mark = entry as { label?: unknown; root?: unknown; path?: unknown };
            if (typeof mark.label !== 'string') continue;
            if (typeof mark.root !== 'string' || typeof mark.path !== 'string') continue;
            found.push({ label: mark.label, root: mark.root, path: mark.path });
        }
        return found;
    }

    /**
     * The `docs` list of config/layout.yml, in order: one Markdown document of the hub per entry,
     * drawn in the group it names. An entry that is not three strings, or whose label, path or
     * group is empty, is dropped rather than drawn half-formed, exactly as a bookmark is; the
     * server reports it as a finding.
     */
    const docs = $derived<DocEntry[]>(readDocs(config()?.config.docs));

    function readDocs(raw: unknown): DocEntry[] {
        if (!Array.isArray(raw)) return [];
        const found: DocEntry[] = [];
        for (const entry of raw) {
            if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue;
            const doc = entry as { label?: unknown; path?: unknown; group?: unknown };
            if (typeof doc.label !== 'string' || doc.label === '') continue;
            if (typeof doc.path !== 'string' || doc.path === '') continue;
            if (typeof doc.group !== 'string' || doc.group === '') continue;
            found.push({ label: doc.label, path: doc.path, group: doc.group });
        }
        return found;
    }

    /**
     * The `arrangements:` of config/layout.yml, each with the words a page opened from it carries.
     * The node itself is handed on untouched: state/workbench/layout/ reads its shape and refuses
     * one that does not add up, so nothing here knows what is in it.
     */
    const arrangements = $derived(readArrangements(config()?.config.arrangements));

    /** The one arrangement the tool ships, which is the one the catalog has words for. */
    const SESSIONS = 'sessions';

    function readArrangements(raw: unknown): Arrangement[] {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return [];
        return Object.entries(raw as Record<string, unknown>).map(([name, node]) => ({
            name,
            label: name === SESSIONS ? t('ui.page_sessions') : name,
            node
        }));
    }

    function readGroups(raw: unknown): NavGroup[] {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return [];
        const found: NavGroup[] = [];
        for (const [id, entry] of Object.entries(raw as Record<string, unknown>)) {
            if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue;
            const group = entry as { label?: unknown; glyph?: unknown; chord?: unknown };
            if (typeof group.label !== 'string') continue;
            const read: NavGroup = { id, label: group.label };
            if (typeof group.glyph === 'string') read.glyph = group.glyph;
            if (typeof group.chord === 'string' && /^[a-z]$/.test(group.chord)) {
                read.chord = group.chord;
            }
            found.push(read);
        }
        return found;
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
            'audit'
        ]);
        loadUi();
        loadLayout();
        return () => disconnect();
    });
</script>

<Workbench
    {groups}
    {bookmarks}
    {docs}
    {saved}
    {arrangements}
    {directChord}
    waiting={waitingCount()}
/>
