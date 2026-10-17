<script lang="ts">
    // Layer 3, shell. The view of one tab inside a pane body, kept mounted while the tab is open
    // and hidden while another tab of the pane is shown, so a switch back finds the view as it was
    // left: nothing is built again, and nothing is fetched again that was not marked meanwhile.
    //
    // A hidden view keeps what it holds and its state, takes no re-read and follows nothing while
    // it is hidden, and catches up once when it is shown. It reads the client's stores through the
    // copy this provides (state/client/use.ts), in which a read asks nothing while the tab is
    // hidden. A Terminal's stream is unaffected: it flows to the tab whether or not it is shown.
    //
    // It is what tells the view which instance it is drawn in, through
    // state/client/instance-context.ts, so a partial deep inside a view keys what it keeps by the
    // instance without a prop through every level. Each kept view provides its own, since several
    // are mounted in one pane at once.
    //
    // A hidden view is `display: none` and out of the accessibility tree, so no control of it takes
    // a press, the focus or a screen reader's attention. The keyboard's pane actions read the view
    // a pane shows through `data-tab-view` and `hidden` (shell/keys/key-dom.ts).
    //
    // A view that throws while it is drawn is caught here and its tab says so, with the view's
    // name, the error and a control that draws it again, as VS Code says an editor could not be
    // opened; the throw then stops at the tab, so the pane still switches tabs and the other views
    // go on.

    import Failed from './leaf/Failed.svelte';
    import { provideInstance } from '$lib/state/client/instance-context';
    import { t } from '$lib/state/shared/words/text';
    import { provideTabState } from '$lib/state/client/use';
    import type { Instance } from '$lib/state/workbench/layout';
    import { registrationLabel, type Registration } from '$lib/state/workbench/navigation/registry';

    type Props = {
        instance: Instance;
        /** The registration the instance's view resolved to. */
        registration: Registration;
        /** Whether this is the tab the pane shows. */
        shown: boolean;
    };

    let { instance, registration, shown }: Props = $props();

    provideInstance(() => instance.id);
    provideTabState(() => shown);

    const View = $derived(registration.component);
</script>

<div class="tab-view" data-tab-view={instance.id} hidden={!shown}>
    <svelte:boundary onerror={(error: unknown) => console.error(error)}>
        <View {instance} />
        {#snippet failed(error: unknown, reset: () => void)}
            <Failed
                {error}
                {reset}
                wording={(words: string) =>
                    t('app.view_failed', registrationLabel(registration), words)}
            />
        {/snippet}
    </svelte:boundary>
</div>

<style>
    .tab-view {
        height: 100%;
        min-width: 0;
        min-height: 0;
    }

    .tab-view[hidden] {
        display: none;
    }

    .tab-view > :global(*) {
        height: 100%;
    }
</style>
