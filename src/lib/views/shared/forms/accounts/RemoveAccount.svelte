<script lang="ts">
    // Layer 3, view partial. The question a Remove on an account row asks before the account's file
    // is deleted. It names the account, and says so when that file carries the account's own client
    // id, since the id is deleted with the file and the account's provider is then not set up for
    // it any more. A published calendar link's file keeps its link, which is deleted with it.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The account's label, which the question names. */
        label: string;
        /** Whether the account's own file carries its client id. */
        ownHalf: boolean;
        /** Whether the account is a published calendar link, whose file keeps the link. */
        published?: boolean;
        /** The provider's name in the words of the view the row is in, drawn under the question. */
        provider: string;
        onconfirm: () => void;
        oncancel: () => void;
    };

    let { label, ownHalf, published = false, provider, onconfirm, oncancel }: Props = $props();

    /** The question, naming what the account's file holds. */
    function question(): string {
        if (published) return t('accounts.remove_confirm_link', label);
        return ownHalf
            ? t('accounts.remove_confirm_own', label)
            : t('accounts.remove_confirm', label);
    }
</script>

<Confirm
    message={question()}
    detail={provider}
    confirm={t('accounts.remove')}
    cancel={t('accounts.cancel')}
    {onconfirm}
    {oncancel}
/>
