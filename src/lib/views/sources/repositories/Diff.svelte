<script module lang="ts">
    // Layer 3, view registration. A diff opens from the Repositories view and is not listed: opened
    // bare it could only report that it was opened for nothing.
    import { DIFF_VIEW } from '$lib/state/sources/repositories.svelte';
    import type { ViewRegistration } from '../../registry';

    export const registration: ViewRegistration = {
        id: DIFF_VIEW,
        label: 'views.repositories_diff',
        glyph: 'views.repositories_diff_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One diff as its own tab: a file of a repository, staged or as the worktree has
    // it, or everything a worktree holds that its repository's branch does not.
    //
    // The text is read when the pane opens and again when the instance is pointed at something else,
    // rather than carried on the `git` channel, since a diff is text and the channel carries state.
    // A press that changes the repository is a new read: the pane's own control asks again.
    //
    // The painting is the page's highlighter with the `diff` grammar, which escapes the text before
    // it emits a span, so what a repository holds cannot reach the document as markup.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import { codeHtml } from '$lib/state/words/languages';
    import { diffUrl, type DiffState } from '$lib/state/sources/repositories';
    import { t } from '$lib/state/words/text';
    import type { ViewProps } from '../../registry';

    let { instance }: ViewProps = $props();

    /** The instance state, with every field defaulted: a pane opened with nothing draws its empty. */
    const held = $derived(read(instance.state));

    let text = $state('');
    let failure = $state('');
    let reading = $state(false);
    /** What the last read was over, so a new subject is read once and a redraw is not. */
    let taken = $state('');

    const painted = $derived(text === '' ? '' : codeHtml(text, 'diff'));
    const title = $derived(held.label === '' ? t('views.repositories_diff') : held.label);

    function read(state: unknown): DiffState {
        const map = (state ?? {}) as Partial<DiffState>;
        return {
            id: typeof map.id === 'string' ? map.id : '',
            label: typeof map.label === 'string' ? map.label : '',
            root: typeof map.root === 'string' ? map.root : '',
            path: typeof map.path === 'string' ? map.path : '',
            staged: map.staged === true,
            worktree: map.worktree === true
        };
    }

    async function load(state: DiffState): Promise<void> {
        reading = true;
        failure = '';
        try {
            const response = await fetch(diffUrl(state));
            const body = (await response.json()) as { output?: string; error?: string };
            if (!response.ok) {
                failure =
                    typeof body.error === 'string' ? body.error : t('repositories.diff_failed');
                text = '';
            } else {
                text = typeof body.output === 'string' ? body.output : '';
            }
        } catch {
            failure = t('repositories.diff_failed');
            text = '';
        }
        reading = false;
    }

    function again(): void {
        if (held.path === '') return;
        void load(held);
    }

    $effect(() => {
        const state = held;
        if (state.path === '' || state.id === taken) return;
        taken = state.id;
        void load(state);
    });
</script>

{#snippet tools()}
    <Toolbar label={t('views.repositories_diff')}>
        <ToolButton
            label={t('repositories.diff')}
            title={t('repositories.diff_title')}
            disabled={reading || held.path === ''}
            onclick={again}
        />
    </Toolbar>
{/snippet}

<Pane {title} toolbar={tools}>
    <div class="diff" data-instance={instance.id} data-view="repositories-diff">
        {#if held.path === ''}
            <Empty message={t('repositories.diff_empty')} glyph={t('repositories.empty_glyph')} />
        {:else if failure !== ''}
            <p class="failed">{failure}</p>
        {:else if reading && text === ''}
            <p class="note">{t('repositories.diff_pending')}</p>
        {:else if text === ''}
            <p class="note">{t('repositories.diff_empty')}</p>
        {:else}
            <!-- Keep pre and code on one line: a line break inside pre would enter the drawn text. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlight.js escapes the text before it emits its own span classes -->
            <pre class="text" role="region" aria-label={title}><code>{@html painted}</code></pre>
        {/if}
    </div>
</Pane>

<style>
    .diff {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
    }
    .text {
        margin: 0;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
        white-space: pre;
        overflow: auto;
    }
    :global(body.wall) .text {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
    .note,
    .failed {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
    .failed {
        color: var(--c-red-txt, var(--muted));
    }
</style>
