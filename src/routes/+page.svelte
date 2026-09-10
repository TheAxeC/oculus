<script lang="ts">
    // The page renders the workbench and nothing else. What it does on mount is the wiring the
    // workbench cannot do for itself: fill the view registry, open the socket, and read the two
    // saved stores. The rail's groups come from the merged config the socket delivers, since the
    // shell may not read entities itself.

    import { onMount } from 'svelte';
    import Workbench from '$lib/shell/Workbench.svelte';
    import type { Bookmark, NavGroup } from '$lib/shell/ActivityRail.svelte';
    import { config } from '$lib/state/entities.svelte';
    import { loadLayout } from '$lib/state/layout.svelte';
    import { loadUi } from '$lib/state/ui.svelte';
    import { connect, disconnect } from '$lib/state/socket.svelte';
    import './views.ts';

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
                const group = entry as { label?: unknown; keys?: unknown };
                if (typeof group.label !== 'string' || !Array.isArray(group.keys)) continue;
                found.push({
                    label: group.label,
                    keys: group.keys.filter((key): key is string => typeof key === 'string')
                });
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

<Workbench {groups} {bookmarks} {arrangement} />
