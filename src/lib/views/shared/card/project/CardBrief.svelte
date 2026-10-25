<script lang="ts">
    // Layer 3, shared view. What a project card says the project is and does next: its ELI5 under
    // its label, cut to views/shared/card/Clamp.svelte when the caller keeps an open state for it,
    // and the first sentence of its next action under the label NEXT, drawn as the ELI5 is: the
    // label in the ELI5 label's style and the sentence at the ELI5's size and colour. A web address
    // written in either is a link (ui/display/text/LinkedText.svelte).
    // views/shared/card/project/ProjectCard.svelte draws it; on the project page it draws the ELI5
    // alone (`next` off), since the page's NEXT block holds the whole next action.

    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Clamp from '../Clamp.svelte';
    import { firstSentence } from '$lib/state/boards/board';
    import type { Project } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        project: Project;
        /** Whether the ELI5 is drawn whole rather than cut to its clamp. */
        more: boolean;
        /** Open or cut the ELI5; a card given none draws the ELI5 whole with no control. */
        onmore?: () => void;
        /** Whether the first sentence of the next action is drawn under the ELI5. */
        next?: boolean;
    };

    const { project, more, onmore, next = true }: Props = $props();

    /** The most characters of the next action shown on a closed card. */
    const CARD_NEXT = 130;
</script>

{#if project.eli5}
    <div class="said">
        <span class="label">{t('project.card.eli5')}</span>
        {#if onmore === undefined}
            <p><LinkedText text={project.eli5} /></p>
        {:else}
            <Clamp open={more} ontoggle={onmore}>
                <LinkedText text={project.eli5} />
            </Clamp>
        {/if}
    </div>
{/if}
{#if next && project.next}
    <div class="said">
        <span class="label">{t('project.card.next')}</span>
        <p><CodeText text={firstSentence(project.next, CARD_NEXT)} linked /></p>
    </div>
{/if}

<style>
    .said {
        margin-top: 8px;
    }

    .said p,
    .said :global(.clamp) {
        margin: 2px 0 0;
        font-size: var(--fs-md);
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }
</style>
