<script lang="ts">
    // Layer 3, view partial. The header actions the Calendar and the Inbox share: the control that
    // opens the form adding an account (bound to the view's `adding`), a bare icon on the `add`
    // glyph with its words as the tooltip and the accessible name, pressed while the form is open,
    // and the `...` menu whose Set up provider opens the account setup page. The connector's state
    // words and its refresh are in the pane's bar (ConnectorHead.svelte).

    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        accounts: { openSetup }
    } = useState();
    let { adding = $bindable(false) }: { adding?: boolean } = $props();
</script>

<Toolbar label={t('accounts.toolbar')} overflow>
    <ToolButton
        bare
        glyph="add"
        label={t('accounts.add')}
        active={adding}
        pressed={adding}
        onclick={() => (adding = !adding)}
    />
    <Menu
        label={t('accounts.menu')}
        items={[{ id: 'setup', label: t('accounts.set_up_provider') }]}
        glyph={t('accounts.menu_glyph')}
        compact
        bare
        placement="down"
        align="right"
        onpick={openSetup}
    />
</Toolbar>
