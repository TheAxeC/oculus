<script lang="ts">
    // Layer 3, view partial of EntryFields.svelte. One `link` or `url` field of an entry as a line
    // of its own. A link is one of three things: a local HTML file opens in the document view, a
    // path inside the hub whose extension `open.program_ext` of config/defaults/behavior.yml names
    // an application for (a `.docx`, an `.xlsx`) is `shared/links/ProgramButton.svelte`, which
    // hands the file to that application, since a link to it would only download it, and
    // everything else is a link. A refused or failed open is said through `onsaid`, the line the
    // card's view shows every write's answer on.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ProgramButton from '../../../links/ProgramButton.svelte';
    import { hrefOf, hubPathsOf, isHubPath } from '$lib/state/boards/collection';
    import { opensInProgram } from '$lib/state/sources/fs';
    import { openPage } from '$lib/views/shared/explorer/opening';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        selectors: { programApps }
    } = client;

    type Props = {
        /** The field the value is from: `url` is drawn with the link glyph, any other as a path. */
        field: string;
        value: string;
        /** The root of the hub the entry is of, which a path of the value is under. */
        root: string;
        onsaid: (said: string) => void;
    };

    let { field, value, root, onsaid }: Props = $props();

    /** Whether the link names an HTML file of the hub, which the document view holds as a tab. */
    const document = $derived(
        // The same rule the Show in Files control is drawn from, so one value is one answer: an
        // address is not a document, and neither is a path climbing out of the hub.
        hubPathsOf({ link: value }).length > 0 && /^[^:]*\.html?$/i.test(value)
    );

    /** Whether the link is a file of the hub the map names an application for. */
    const program = $derived(isHubPath(value) && opensInProgram(value, programApps()));

    /** The local HTML file of the hub as its own tab, the way a bookmark of the rail opens one. */
    function openDocument(): void {
        const parts = value.split('/').filter((one) => one !== '');
        openPage(client, { root, path: value, label: parts[parts.length - 1] ?? value });
    }
</script>

{#if document}
    <p class="body">
        <ToolButton label={value} glyph={t('collection.folder_glyph')} onclick={openDocument} />
    </p>
{:else if program}
    <p class="body">
        <ProgramButton {root} path={value} label={value} {onsaid} />
    </p>
{:else}
    <p class="body">
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
        <a href={hrefOf(value, root)} target="_blank" rel="noreferrer">
            <Glyph
                name={field === 'url' ? t('collection.link_glyph') : t('collection.folder_glyph')}
            />
            {value}
        </a>
    </p>
{/if}

<style>
    .body {
        margin: 6px 0 0;
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }

    a {
        color: var(--accent-txt, var(--accent));
    }
</style>
