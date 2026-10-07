<script lang="ts">
    // Layer 3, partial of Source.svelte. What a LaTeX tab asks the reader: a recipe, a citation and
    // a package name in a quick pick (ui/forms/choice/QuickPick.svelte), and the name texdoc is run
    // with in a prompt (ui/forms/Prompt.svelte). The tab holds the question and what each answer
    // does (latex-tab.svelte.ts); this draws it.

    import QuickPick from '$lib/ui/forms/choice/QuickPick.svelte';
    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { LatexTab } from './latex-tab.svelte';

    type Props = { tab: LatexTab };

    let { tab }: Props = $props();

    const asking = $derived(tab.asking);
</script>

{#if asking !== null && asking.kind !== 'texdoc'}
    <QuickPick
        title={asking.title}
        placeholder={asking.placeholder}
        choices={asking.choices}
        onpick={tab.pick}
        onclose={tab.release}
    />
{:else if asking !== null}
    <Prompt
        request={{
            message: t('latex.texdoc_title'),
            detail: t('latex.texdoc_detail'),
            fields: [
                {
                    label: t('latex.texdoc_field'),
                    value: '',
                    placeholder: t('latex.texdoc_placeholder')
                }
            ],
            verb: t('latex.texdoc_open'),
            act: (values: string[]) => tab.texdoc(values[0] ?? '')
        }}
        cancel={t('ui.confirm_cancel')}
        oncancel={tab.release}
    />
{/if}
