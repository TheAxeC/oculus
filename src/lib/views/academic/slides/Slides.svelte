<script module lang="ts">
    // Layer 3, view registration. The slide catalog is opened from the deck's toolbar, never from
    // the view catalogue: it is about one deck and says nothing on its own.
    import type { ViewRegistration } from '../../registry';

    export const registration: ViewRegistration = {
        id: 'slides',
        label: 'views.slides',
        glyph: 'views.slides_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. The public deck's catalog: every slide the deck could hold, in the order it
    // would hold them, each with a tick saying whether the deck shows it, and the controls that
    // move it. Save writes the two lists into config/present.yml and the deck is live at the next
    // push.
    //
    // The catalog is the store's, so a slide added on disk is in this list at the next push. What
    // is the pane's own is the reader's unsaved work: the order they have dragged the rows into,
    // the ticks they have made and the line the status region shows, all in the instance state, so
    // the pane is where it was when its page comes back. The work is held against the catalog it
    // was made over, so a push that adds, removes or moves a slide draws the file again and says
    // that the unsaved work was dropped, rather than saving an order over a deck that has moved
    // underneath it. The pane's own save is not such a push: it writes the order it is holding, so
    // the catalog that comes back is the one the work already names.
    //
    // It is a tab and not a dialog: oculus has no modal for content, and Escape does nothing here.

    import { tick } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        catalogSignature,
        fileState,
        parseSlidesState,
        savedState,
        withMove,
        withTick,
        type SlidePicks
    } from '$lib/state/life/slides';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '../../registry';

    const {
        present: { catalog, deck, defaults },
        ui: { instanceState, setInstanceState },
        writes: { writeDeck }
    } = useState();

    let { instance }: ViewProps = $props();

    const rows = $derived(catalog());
    const byKey = $derived(new Map(rows.map((row) => [row.key, row])));

    /** The catalog the reader's unsaved work was made over; a different one drops it. */
    const signature = $derived(catalogSignature(rows.map((row) => row.key)));

    const held = $derived(parseSlidesState(instanceState(instance.id)));

    /** Whether the work the pane is holding was made over the catalog now on screen. */
    const current = $derived(held.at !== '' && held.at === signature);

    /** Whether a push dropped work the reader had not saved, which the status region says. */
    const dropped = $derived(held.at !== '' && held.at !== signature);

    /** What is on screen: the reader's work over this catalog, or what the file says. */
    const picks = $derived(
        current
            ? { order: held.order, picked: held.picked }
            : fileState(
                  rows.map((row) => row.key),
                  deck().selection,
                  defaults()
              )
    );
    const shown = $derived(
        picks.order.flatMap((key) => {
            const row = byKey.get(key);
            return row === undefined ? [] : [row];
        })
    );

    /** What the status region shows: the last line, or the note that a push dropped the work. */
    const said = $derived(dropped ? t('slides.dropped') : held.said);

    /** True while a save is in flight, so a second press sends no second write. */
    let busy = $state(false);

    function write(next: SlidePicks, words: string): void {
        setInstanceState(instance.id, { at: signature, ...next, said: words });
    }

    /** Keep the line and leave the work as it is, for a save that changed neither. */
    function say(words: string): void {
        write(picks, words);
    }

    /** The words a slide is named by, for the line that says where a move left it. */
    function titleOf(key: string): string {
        const row = byKey.get(key);
        return row === undefined || row.title === '' ? key : row.title;
    }

    /** Put one slide on the deck or take it off, which is what a row's box says. */
    function pick(key: string, on: boolean): void {
        write(withTick(picks, key, on), '');
    }

    /** Move one slide to another place in the deck, and say where it landed. */
    function move(key: string, to: number): void {
        const next = withMove(picks, key, to);
        if (next === null) return;
        write(next, t('slides.moved', titleOf(key), String(to + 1), String(next.order.length)));
    }

    /**
     * Keep the keyboard on the row after a move that took the pressed control out of reach: a slide
     * moved to either end disables the control that moved it, and the focus would otherwise fall to
     * the page. The other direction's control is where the reader is. A move that leaves the
     * pressed control pressable leaves the focus where the browser put it, on that control.
     *
     * The focus is set after the update has been drawn, since the row is moved in the DOM and the
     * two controls take their new disabled state then.
     */
    async function moveFrom(
        event: MouseEvent,
        key: string,
        to: number,
        other: 'up' | 'down'
    ): Promise<void> {
        const ends = other === 'down' ? to === 0 : to === picks.order.length - 1;
        const pressed = event.currentTarget;
        move(key, to);
        if (!ends || !(pressed instanceof HTMLElement)) return;
        await tick();
        const row = pressed.closest('[data-slide-row]');
        const next = row?.querySelector(`[data-step="${other}"] button`);
        if (next instanceof HTMLElement) next.focus();
    }

    /** The key the reader is dragging, and the row that armed its own grip. */
    let dragged = $state('');
    let armed = $state('');

    function drop(onto: string): void {
        const from = dragged;
        dragged = '';
        armed = '';
        if (from === '' || from === onto) return;
        move(from, picks.order.indexOf(onto));
    }

    /**
     * Write both lists. An empty selection is refused here rather than sent: a deck of no slides is
     * not something the reader can then get back to from the deck itself. What the pane holds
     * afterwards is savedState's: the work under the catalog it now belongs to, and the sentence.
     */
    async function save(): Promise<void> {
        if (busy) return;
        if (picks.picked.length === 0) {
            say(t('slides.keep_one'));
            return;
        }
        busy = true;
        say(t('slides.saving'));
        const answer = await writeDeck(picks.picked, picks.order);
        busy = false;
        setInstanceState(instance.id, savedState(answer, picks, signature));
    }
</script>

{#snippet tools()}
    <Toolbar label={t('slides.toolbar')}>
        <ToolButton
            label={t('slides.save')}
            onclick={() => void save()}
            disabled={busy || rows.length === 0}
        />
        <span class="said" role="status">{said}</span>
    </Toolbar>
{/snippet}

<Pane title={t('slides.title')} toolbar={tools} tinted>
    <div class="slides" data-instance={instance.id} data-slides>
        {#if rows.length === 0}
            <Empty message={t('slides.empty')} glyph={t('slides.empty_glyph')} />
        {:else}
            <p class="intro">{t('slides.intro')}</p>
            <div class="rows" role="list" inert={busy}>
                {#each shown as row, at (row.key)}
                    <div
                        class="row"
                        class:dragging={dragged === row.key}
                        data-slide-row={row.key}
                        draggable={armed === row.key}
                        ondragstart={() => (dragged = row.key)}
                        ondragover={(event: DragEvent) => event.preventDefault()}
                        ondrop={(event: DragEvent) => {
                            event.preventDefault();
                            drop(row.key);
                        }}
                        ondragend={() => {
                            dragged = '';
                            armed = '';
                        }}
                        role="listitem"
                    >
                        <span
                            class="grip"
                            title={t('slides.drag_tip', titleOf(row.key))}
                            onmousedown={() => (armed = row.key)}
                            role="presentation"
                        >
                            <Glyph name={t('slides.drag_glyph')} />
                        </span>
                        <span class="at">{t('slides.position', String(at + 1))}</span>
                        <span class="pick">
                            <Checkbox
                                checked={picks.picked.includes(row.key)}
                                label={titleOf(row.key)}
                                onchange={(on: boolean) => pick(row.key, on)}
                            />
                        </span>
                        <Tag label={t('slides.kind', row.kind)} />
                        <span class="steps">
                            <span data-step="up">
                                <ToolButton
                                    label={t('slides.up')}
                                    title={t('slides.up_tip', titleOf(row.key))}
                                    disabled={at === 0}
                                    onclick={(event: MouseEvent) =>
                                        void moveFrom(event, row.key, at - 1, 'down')}
                                />
                            </span>
                            <span data-step="down">
                                <ToolButton
                                    label={t('slides.down')}
                                    title={t('slides.down_tip', titleOf(row.key))}
                                    disabled={at === shown.length - 1}
                                    onclick={(event: MouseEvent) =>
                                        void moveFrom(event, row.key, at + 1, 'up')}
                                />
                            </span>
                        </span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</Pane>

<style>
    .slides {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .intro {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .rows {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 3px 6px;
    }

    .row.dragging {
        border-color: var(--accent);
    }

    .grip {
        color: var(--muted-txt, var(--muted));
        cursor: grab;
    }

    .at {
        min-width: 2ch;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
        text-align: right;
    }

    .pick {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .steps {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    /* The terminal shape: the catalog follows the folder line, as every list does. */
    :global(body.rice) .slides {
        font-family: var(--font-mono);
    }
</style>
