<script lang="ts">
    // Layer 3, view partial of Composer.svelte. The agent pickers in the composer's foot: the
    // agent, the account when the agent has more than one, and one menu for each of the agent's own
    // lists out of config/catalogs/agents.yml, each showing the value picked. A pick is handed to
    // the composer, which keeps it in the tab's instance state.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { ComposerAgent } from '$lib/state/sessions/terminal/composer/composer';
    import { markGlyph } from '$lib/state/sessions/terminal/terminal-marks';
    import type { AgentAccount, AgentChoices } from '$lib/state/sessions/agents.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { profileWords } from '$lib/state/sessions/terminals.svelte';

    type Props = {
        /** The agent chosen, and the agents the composer offers. */
        agent: ComposerAgent;
        agents: ComposerAgent[];
        /** The chosen agent's accounts, and the label of the one a start names. */
        accounts: AgentAccount[];
        account: string;
        /** The chosen agent's lists, null for a Shell, and the value picked in each list. */
        choices: AgentChoices | null;
        picks: Record<string, string>;
        onagent: (agent: ComposerAgent) => void;
        onaccount: (label: string) => void;
        onlist: (key: string, id: string) => void;
    };

    let { agent, agents, accounts, account, choices, picks, onagent, onaccount, onlist }: Props =
        $props();

    /** The words of the value a list has picked. */
    function pickedLabel(key: string): string {
        const list = choices?.lists.find((one) => one.key === key);
        return list?.values.find((one) => one.id === picks[key])?.label ?? '';
    }
</script>

<span class="picker" data-picker="agent">
    <Menu
        label={profileWords(agent, t)}
        glyph={markGlyph(agent, '')}
        placement="down"
        items={agents.map((one) => ({
            id: one,
            label: profileWords(one, t),
            glyph: markGlyph(one, ''),
            active: one === agent
        }))}
        onpick={(id) => onagent(id as ComposerAgent)}
    />
</span>
{#if accounts.length > 1}
    <span class="picker" data-picker="account">
        <Menu
            label={account}
            placement="down"
            items={accounts.map((one) => ({
                id: one.label,
                label: one.label,
                title: one.dir,
                active: one.label === account
            }))}
            onpick={onaccount}
        />
    </span>
{/if}
{#each choices?.lists ?? [] as list (list.key)}
    <span class="picker" data-picker={list.key}>
        <Menu
            label={pickedLabel(list.key)}
            placement="down"
            groups={[
                {
                    id: list.key,
                    heading: list.label,
                    items: list.values.map((one) => ({
                        id: one.id,
                        label: one.label,
                        active: one.id === picks[list.key]
                    }))
                }
            ]}
            items={[]}
            onpick={(id: string) => onlist(list.key, id)}
        />
    </span>
{/each}

<style>
    .picker {
        display: inline-flex;
        min-width: 0;
    }
</style>
