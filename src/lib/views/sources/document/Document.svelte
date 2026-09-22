<script module lang="ts">
    // Layer 3, view registration. Documents open from bookmarks and are not listed.
    import type { ViewRegistration } from '../../registry';

    export const registration: ViewRegistration = {
        id: 'document',
        label: 'views.document',
        glyph: 'views.document_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. A local HTML file under a configured root opens as a tab. The file is the manuals of cathedra
    // and game-engine today, and the bookmarks in config/layout.yml are what the rail offers.
    //
    // The document is an iframe rather than markup pulled into the page: the manuals are whole
    // documents with their own stylesheets, scripts and relative assets, and an iframe is the one
    // thing that gives them their own document to be. `allow-same-origin allow-scripts` is what they
    // need to work at all: same-origin so the browser lets their own stylesheets, images and storage
    // load from api/file, scripts so their own navigation and search run. Same-origin means the frame
    // is not walled off from this page's origin, so it could reach the page through window.parent;
    // the file it holds is the owner's own document from the owner's own disk, which is the same
    // ground api/docs renders a README on.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import { t } from '$lib/state/words/text';
    import { fileUrl } from '../../shared/links/file-url';
    import type { ViewProps } from '../../registry';

    let { instance }: ViewProps = $props();

    const root = $derived(read(instance.state, 'root'));
    const path = $derived(read(instance.state, 'path'));
    const label = $derived(read(instance.state, 'label'));

    /** The title the pane draws: the bookmark's own words, or the view's name when it has none. */
    const title = $derived(label === '' ? t('views.document') : label);
    const src = $derived(root === '' || path === '' ? '' : fileUrl(root, path));

    function read(state: unknown, key: string): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const held = (state as Record<string, unknown>)[key];
        return typeof held === 'string' ? held : '';
    }

    /** The same address in a browser tab of its own, for printing it or reading it full width. */
    function outside(): void {
        if (src === '') return;
        window.open(src, '_blank', 'noopener');
    }
</script>

{#snippet tools()}
    <Toolbar label={t('document.toolbar')}>
        <ToolButton label={t('document.open_outside')} onclick={outside} />
    </Toolbar>
{/snippet}

<Pane {title} toolbar={tools}>
    <div class="document" data-instance={instance.id} data-root={root} data-path={path}>
        {#if src === ''}
            <Empty message={t('document.none')} glyph={t('document.none_glyph')} />
        {:else}
            <iframe class="frame" {title} {src} sandbox="allow-same-origin allow-scripts"></iframe>
        {/if}
    </div>
</Pane>

<style>
    .document {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
    }

    /* The frame is the body: the document inside it scrolls, so the pane does not scroll around it. */
    .frame {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: var(--panel);
    }

    :global(body.wall) .frame {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
