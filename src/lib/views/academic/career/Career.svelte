<script module lang="ts">
    // Layer 3, view registration. The Career view is the last tab of the Academic Life page and the
    // last view of its group, after the photo wall.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'career',
        label: 'views.career',
        glyph: 'views.career_glyph',
        group: 'academic',
        order: 7
    };
</script>

<script lang="ts">
    // Layer 3, view. The career file of the primary hub: the strategy (the goal, the next milestone
    // and its day, the order of work with its note) and the career record the website's CV is
    // written from (the positions, the degrees, the awards, the references and the employer CVs'
    // profiles). What it draws is state/forms/career-view.ts `careerShown`: every section is a
    // field of the editor built from the file's own `schema:` (EntryEditor.svelte), so each list is
    // drawn as the record cards a collection's entry form draws, a row added, edited and removed
    // there, and Save writes the file. A hub with no career file, or a career file with no schema,
    // draws the line saying so.
    //
    // The header holds Write the website (state/sessions/source/website.svelte.ts): its tip names
    // the three files it writes and the command it runs after them. It is off while the user is not
    // known or `website.folder` is empty, its tip and the line under the header saying which. That
    // line says what the last press came to: the files written and the command's run, running or
    // ended with its status, or why the press was refused. A command text not yet approved is asked
    // about first, naming its line, and runs once approved.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import EntryEditor from '../../shared/forms/entry/edit/EntryEditor.svelte';
    import { pageFile } from '../../shared/forms/entry/edit/page-file';
    import { careerShown } from '$lib/state/forms/career-view';
    import { CAREER } from '$lib/state/forms/page-entry';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    let { instance }: ViewProps = $props();

    const client = useState();
    const {
        entities: { portfolio },
        pages: { pageNamed },
        selectors: { configMap },
        website
    } = client;

    /** The career file as the editor sees it, null while the file has no schema. */
    const page = $derived(pageNamed(CAREER));
    const file = $derived(page === null ? null : pageFile(client, page));
    const career = $derived(portfolio()?.entities.career ?? null);
    const shown = $derived(careerShown(career, page));

    /** The command Write the website runs after the files, the empty text for none. */
    const command = $derived.by(() => {
        const held = configMap().website;
        if (typeof held !== 'object' || held === null || !('cv' in held)) return '';
        return typeof held.cv === 'string' ? held.cv.trim() : '';
    });

    const off = $derived(website.off());
    const said = $derived(off === null ? website.said() : { text: off, error: false });
    const asking = $derived(website.asking());
    const tip = $derived(
        off ?? (command === '' ? t('career.website_tip') : t('career.website_tip_run', command))
    );
</script>

{#snippet tools()}
    <Toolbar label={t('career.toolbar')} overflow>
        <ToolButton
            label={t('career.website')}
            glyph={t('career.website_glyph')}
            title={tip}
            disabled={off !== null || website.busy()}
            onclick={() => void website.write()}
        />
    </Toolbar>
{/snippet}

<Pane title={t('career.title')} toolbar={tools} tinted>
    <div class="career" data-career>
        {#if said !== null}
            <p class="said" class:error={said.error} data-website-said>{said.text}</p>
        {/if}
        {#if shown.state === 'none'}
            <Empty message={t('career.none')} glyph={t('career.none_glyph')} />
        {:else if shown.state === 'no_schema'}
            <Empty message={t('career.no_schema')} glyph={t('career.none_glyph')} />
        {:else}
            <EntryEditor page={shown.page} instance={instance.id} {file} />
        {/if}
    </div>
</Pane>

{#if asking !== null}
    <Confirm
        message={t('career.website_approve', asking.lines.map((line) => line.run).join('; '))}
        confirm={t('career.website_approve_yes')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void website.approve()}
        oncancel={website.drop}
    />
{/if}

<style>
    .career {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .said {
        margin: 0;
        color: var(--muted);
    }

    .said.error {
        color: var(--danger);
    }
</style>
