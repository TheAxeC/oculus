<script module lang="ts">
    // Layer 3, view registration. Settings follows the Views catalogue in the system group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'settings',
        label: 'views.settings',
        glyph: 'views.settings_glyph',
        group: 'system',
        order: 10
    };
</script>

<script lang="ts">
    // Layer 3, view. What the reader sets about the workbench itself: how it looks, which the ui
    // store keeps in this browser, and the rail's list of pages, which config/layout.yml keeps and
    // the `rail` write rewrites. The two halves are partials of their own, since one saves as it is
    // pressed and the other waits for Save.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Appearance from './Appearance.svelte';
    import RailEditor from './RailEditor.svelte';
    import { t } from '$lib/state/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    let { instance }: ViewProps = $props();
</script>

<!-- The box every view has; this one draws its rows straight into it, so it asks for the tint. -->
<Pane title={t('views.settings')} tinted>
    <div class="view" data-instance={instance.id} data-settings-view>
        <Appearance />
        <RailEditor id={instance.id} />
    </div>
</Pane>

<style>
    .view {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 8px 12px 16px;
        overflow: auto;
        min-height: 0;
    }
</style>
