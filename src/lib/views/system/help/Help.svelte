<script module lang="ts">
    // Layer 3, view registration. Help opens the Help page's group, and is the first tab of that
    // page's one pane, followed by the hub's documents (the `docs:` entries whose group is `help`)
    // and the Apps guide, the Templates and the Palette pages, documents of oculus's own folder.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'help',
        label: 'views.help',
        glyph: 'views.help_glyph',
        group: 'help',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. Oculus's own manual: the HELP.md of its folder, drawn as prose.
    //
    // The manual is a file beside DESIGN.md rather than text in the catalog, because it is pages of
    // prose about the whole tool and a catalog is words a surface draws. It is read through
    // api/docs, the one route that turns Markdown into HTML, by its `manual` read, which answers it
    // in the engine folder's space whatever hub the page is on: its path is HELP.md and a relative
    // link in it is resolved from there.
    //
    // The manual holds no diagram. The doc view draws a diagram of docs/diagrams/ over a document
    // of oculus's own folder, which the Apps guide tab of this page is (`engine: true` in the tab's
    // state, so it draws on any hub); the Apps guide holds none. A press on a relative link to
    // another Markdown file opens that document in a doc tab (shared/prose/jump.ts), and a press on
    // a link into the manual from another document opens this view with the heading the link names
    // in its state, which the view scrolls to once the manual is drawn and then removes from the
    // state. The prose is drawn straight into the box, so over a wallpaper the box asks for the
    // tint and is the one surface the manual is read off.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import { withoutFragment } from '../../shared/prose/doc-link';
    import Markdown from '../../shared/prose/Markdown.svelte';
    import { scrollToFragment } from '../../shared/prose/jump';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { instanceMap, instanceText } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';

    const {
        docs: { manual },
        layout: { restateInstance }
    } = useState();

    let { instance }: ViewProps = $props();

    const shown = $derived(manual());
    const fragment = $derived(instanceText(instance.state, 'fragment'));
    let box: HTMLDivElement | undefined = $state();

    // The heading a link into the manual named: scrolled to once the manual is drawn and then
    // taken out of the view's state, so a change of the file or a restored layout does not scroll
    // to it again, and a second press on the same link, which sets it again, scrolls once more.
    $effect(() => {
        if (instance.state === undefined || fragment === '' || box === undefined) return;
        if (shown.loading || shown.error !== '') return;
        scrollToFragment(box, fragment);
        restateInstance(instance.id, withoutFragment(instanceMap(instance.state)));
    });
</script>

<Pane title={t('views.help')} tinted>
    <div class="view" data-instance={instance.id} bind:this={box}>
        <Markdown
            doc={shown}
            loading={t('help.loading')}
            failed={t('help.failed', shown.error)}
            surface={false}
            follow
        />
    </div>
</Pane>

<style>
    .view {
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        box-sizing: border-box;
    }

    /* The manual's table of contents: each entry is one line of the tree's row height, with the
       entries' own margins gone, and a link takes the application's link rule (no underline at
       rest, underlined under the pointer, the one ring on focus). The selector names the document
       the Markdown partial draws, since its HTML reaches the page without this component's
       scope. */
    .view :global(.doc ul.toc li) {
        margin: 0;
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    :global(body.rice) .view {
        font-family: var(--font-mono);
    }
</style>
