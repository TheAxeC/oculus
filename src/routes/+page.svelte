<script lang="ts">
    // The page renders the workbench and nothing else. What it does on mount is the wiring the
    // workbench cannot do for itself: fill the view registry, open the socket, and read the two
    // saved stores. The rail's groups come from the merged config the socket delivers, since the
    // shell may not read entities itself.

    import { onMount, untrack } from 'svelte';
    import Workbench from '$lib/shell/Workbench.svelte';
    import type { Bookmark, NavGroup } from '$lib/shell/ActivityRail.svelte';
    import { config } from '$lib/state/entities.svelte';
    import { waitingCount } from '$lib/state/selectors.svelte';
    import { loadLayout } from '$lib/state/layout.svelte';
    import { loadUi } from '$lib/state/ui.svelte';
    import { connect, disconnect } from '$lib/state/socket.svelte';
    // Importing this module is what fills the registry with every view that is registered by name.
    import { registerCollections } from './views.ts';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    // The collection views, one per key of config/sources.yml's `collections:`, which the load
    // function shipped with the catalog. It runs here in the script body rather than on mount: the
    // rail draws what the registry holds on the first render, and a collection registered after it
    // would be missing from that frame. The registry is a module map rather than state, so the keys
    // are read once and not tracked; untrack says so, and is what keeps the read out of any effect.
    untrack(() => registerCollections(data.collections));

    /**
     * The `nav_groups` map of config/layout.yml, both of its lists in order. Its entries are the
     * cockpit's tab keys, so a group names a view only once that view exists; a group naming none is
     * not drawn.
     */
    const groups = $derived<NavGroup[]>(readGroups(config()?.config.nav_groups));

    /**
     * The `bookmarks` list of config/layout.yml, in order. Each entry is a local file under one of
     * the `roots:` of config/sources.yml; the rail draws one button per entry and the `document`
     * view opens it. An entry that is not three strings is dropped rather than drawn half-formed.
     */
    const bookmarks = $derived<Bookmark[]>(readBookmarks(config()?.config.bookmarks));

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
     * The `arrangements.sessions` node of config/layout.yml, handed on untouched. state/layout.ts
     * reads its shape and refuses one that does not add up, so nothing here knows what is in it.
     */
    const arrangement = $derived(readArrangement(config()?.config.arrangements));

    function readArrangement(raw: unknown): unknown {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
        return (raw as Record<string, unknown>).sessions ?? null;
    }

    function readGroups(raw: unknown): NavGroup[] {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return [];
        const found: NavGroup[] = [];
        for (const list of Object.values(raw as Record<string, unknown>)) {
            if (!Array.isArray(list)) continue;
            for (const entry of list) {
                if (typeof entry !== 'object' || entry === null) continue;
                const group = entry as { label?: unknown; keys?: unknown; glyph?: unknown };
                if (typeof group.label !== 'string' || !Array.isArray(group.keys)) continue;
                const read: NavGroup = {
                    label: group.label,
                    keys: group.keys.filter((key): key is string => typeof key === 'string')
                };
                // The glyph a large group's one button carries. A value that is not a name is left
                // off rather than drawn, and the rail then falls back to the first view's glyph.
                if (typeof group.glyph === 'string') read.glyph = group.glyph;
                found.push(read);
            }
        }
        return found;
    }

    onMount(() => {
        connect(['portfolio', 'config', 'sessions', 'git']);
        loadUi();
        loadLayout();
        return () => disconnect();
    });
</script>

<Workbench {groups} {bookmarks} {arrangement} waiting={waitingCount()} />
