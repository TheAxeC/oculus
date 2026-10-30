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
    // Layer 3, view. The career file of the primary hub, in the frame of every record's page
    // (views/shared/card/record/RecordPage.svelte): the strategy card, with the goal, the next
    // milestone and its day, the note and the order of work, then the career record the website's
    // CV is written from, the groups Positions, Degrees, Awards, References and Profiles, each the
    // group every grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), folded by
    // the list's key (views/shared/card/pane-fold.ts), a card per row (CareerCard.svelte). What the
    // groups hold is state/forms/career-view.ts `careerShown`. The page holds no form: Edit, on
    // every card and in the toolbar, opens the editor on the career file beside the page
    // (views/boards/editor/Editor.svelte), where a row is added, changed and removed and Save
    // writes the file. A hub with no career file, or a career file with no schema, draws the line
    // saying so, and has no Edit.
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
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import CareerCard from './CareerCard.svelte';
    import CardGrid from '../../shared/card/record/CardGrid.svelte';
    import RecordPage from '../../shared/card/record/RecordPage.svelte';
    import { usePaneFold } from '../../shared/card/pane-fold';
    import { personNames } from '$lib/state/boards/person';
    import { careerShown, type CareerLine } from '$lib/state/forms/career-view';
    import { CAREER } from '$lib/state/forms/page-entry';
    import { hubId } from '$lib/state/shared/page/hubs';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    let { instance }: ViewProps = $props();

    const {
        entities: { portfolio },
        fs: { primary },
        layout: { openBeside },
        selectors: { configMap },
        website
    } = useState();

    /** Which of the page's groups are open, kept in the tab's state. */
    const fold = usePaneFold();

    const career = $derived(portfolio()?.entities.career ?? null);
    const names = $derived(personNames(portfolio()));
    /** The name of the person of the primary hub a reference names, the key when it names none. */
    const nameOf = (key: string): string => names[hubId(primary() ?? '', key)] ?? key;
    const shown = $derived(careerShown(career, nameOf));
    /** The title of the strategy card, and of the editor's tab. */
    const title = $derived(
        career === null || career.title === '' ? t('career.title') : career.title
    );

    /** The lines of the strategy card: the goal, the milestone and its day, the note, the order. */
    const strategy = $derived.by((): CareerLine[] => {
        if (career === null) return [];
        const lines: CareerLine[] = [];
        if (career.goal !== undefined) {
            lines.push({ label: t('career.goal'), text: career.goal });
        }
        if (career.milestone !== undefined) {
            const day = career.milestoneDate;
            lines.push({
                label: t('career.milestone'),
                text:
                    day === undefined
                        ? career.milestone
                        : t('career.milestone_day', career.milestone, day)
            });
        }
        if (career.orderNote !== undefined) {
            lines.push({ label: t('career.order_note'), text: career.orderNote });
        }
        for (const step of career.order) {
            const when = step.when ?? '';
            const note = step.note ?? '';
            lines.push({
                label: when === '' ? t('career.order') : when,
                text: note === '' ? step.task : t('career.order_line', step.task, note)
            });
        }
        return lines;
    });

    /** Open the editor on the career file beside this page, one tab however often it is pressed. */
    function edit(): void {
        openBeside('editor', { id: CAREER, label: title });
    }

    /** The words of a list of the career file. */
    function groupWord(field: string): string {
        if (field === 'positions') return t('career.positions');
        if (field === 'degrees') return t('career.degrees');
        if (field === 'awards') return t('career.awards');
        if (field === 'references') return t('career.references');
        return t('career.profiles');
    }

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
        {#if shown.state === 'cards'}
            <ToolButton
                label={t('project.card.edit_record')}
                glyph={t('project.card.edit_glyph')}
                onclick={edit}
            />
        {/if}
        <ToolButton
            label={t('career.website')}
            glyph={t('career.website_glyph')}
            title={tip}
            disabled={off !== null || website.busy()}
            onclick={() => void website.write()}
        />
    </Toolbar>
{/snippet}

<RecordPage
    title={t('career.title')}
    {instance}
    toolbar={tools}
    said={said?.text ?? ''}
    saidError={said?.error === true}
    data-career
>
    {#snippet card()}
        {#if shown.state === 'none'}
            <Surface>
                <Empty message={t('career.none')} glyph={t('career.none_glyph')} />
            </Surface>
        {:else if shown.state === 'no_schema'}
            <Surface>
                <Empty message={t('career.no_schema')} glyph={t('career.none_glyph')} />
            </Surface>
        {:else}
            <CareerCard id={CAREER} {title} lines={strategy} onedit={edit} />
        {/if}
    {/snippet}

    {#if shown.state === 'cards'}
        {#each shown.groups as group (group.field)}
            <GroupHead
                data-block={group.field}
                label={groupWord(group.field)}
                count={group.cards.length}
                open={fold.open(group.field)}
                ontoggle={() => fold.toggle(group.field)}
            >
                {#if group.cards.length === 0}
                    <Surface>
                        <Empty message={t('career.group_empty')} />
                    </Surface>
                {:else}
                    <CardGrid>
                        {#each group.cards as row (row.id)}
                            <CareerCard
                                id={row.id}
                                title={row.title}
                                hidden={row.hidden}
                                lines={row.lines}
                                onedit={edit}
                            />
                        {/each}
                    </CardGrid>
                {/if}
            </GroupHead>
        {/each}
    {/if}
</RecordPage>

{#if asking !== null}
    <Confirm
        message={t('career.website_approve', asking.lines.map((line) => line.run).join('; '))}
        confirm={t('career.website_approve_yes')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void website.approve()}
        oncancel={website.drop}
    />
{/if}
