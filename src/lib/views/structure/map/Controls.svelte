<script lang="ts">
    // Layer 3, Map partial. The filter row over the graph, the relationship legend, link and tuning
    // tools, and the independent collaborator and archived-status visibility controls.
    //
    // A filter carries how many projects of it the graph holds now, so a reader sees what a press
    // costs before pressing it. A project type keeps the chip capsule its tone belongs to; a
    // pillar and the connected toggle are toolbar controls, since the capsule stands for a
    // status word and a project type and for nothing else.
    //
    // A line is drawn as the one in force only while it holds a project, so a line another filter
    // has emptied does not read as what the map is showing; whether it is in the filter is what it
    // reports as its pressed state.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { toneOf, typeTone } from '$lib/state/shared/words/tones';

    type Status = { status: string; color?: string };
    type TypeFilter = { type: string; count: number; shown: boolean };
    type LineFilter = { id: string; title: string; count: number; shown: boolean };
    type Props = {
        linkMode: boolean;
        collaborators: boolean;
        statuses: Status[];
        enabled: string[];
        connected: boolean;
        types: TypeFilter[];
        lines: LineFilter[];
        onlink: () => void;
        onretune: () => void;
        oncollaborators: (checked: boolean) => void;
        onarchive: (status: string, checked: boolean) => void;
        ontype: (type: string) => void;
        online: (id: string) => void;
        onalltypes: () => void;
        onalllines: () => void;
        onconnected: () => void;
    };
    let {
        linkMode,
        collaborators,
        statuses,
        enabled,
        connected,
        types,
        lines,
        onlink,
        onretune,
        oncollaborators,
        onarchive,
        ontype,
        online,
        onalltypes,
        onalllines,
        onconnected
    }: Props = $props();
</script>

<div class="filters" data-map-filters>
    <Toolbar label={t('map.filters')}>
        {#if types.length > 0}
            <span class="set" data-map-types>
                <span class="group">{t('map.types')}</span>
                {#each types as item (item.type)}
                    <Chip
                        label={t('map.count', item.type, item.count)}
                        tone={typeTone(item.type)}
                        filled={item.shown}
                        pressed={item.shown}
                        onclick={() => ontype(item.type)}
                    />
                {/each}
                <ToolButton
                    label={t('map.all')}
                    title={t('map.all_types_tip')}
                    onclick={onalltypes}
                />
            </span>
        {/if}
        {#if lines.length > 0}
            <span class="set" data-map-lines>
                <span class="group">{t('map.lines')}</span>
                {#each lines as item (item.id)}
                    <ToolButton
                        label={t('map.count', item.id, item.count)}
                        glyph={t('map.line_glyph')}
                        title={item.title}
                        active={item.shown && item.count > 0}
                        pressed={item.shown}
                        onclick={() => online(item.id)}
                    />
                {/each}
                <ToolButton
                    label={t('map.all')}
                    title={t('map.all_lines_tip')}
                    onclick={onalllines}
                />
            </span>
        {/if}
        <span class="set" data-map-connected>
            <ToolButton
                label={t('map.connected')}
                title={t('map.connected_tip')}
                active={connected}
                pressed={connected}
                onclick={onconnected}
            />
        </span>
    </Toolbar>
</div>

<div class="controls">
    <div class="legend">
        <Chip label={t('map.legend_active')} tone={typeTone('active')} filled />
        <Chip label={t('map.legend_manuscript')} tone={typeTone('manuscript')} filled />
        <Chip label={t('map.legend_idea')} tone={typeTone('idea')} filled />
        <span class="line-dot"></span>
        <span>{t('map.legend_line')}</span>
        <ToolButton
            label={t('map.link')}
            glyph={t('map.link_glyph')}
            title={t('map.link_tip')}
            active={linkMode}
            onclick={onlink}
        />
        <ToolButton
            label={t('map.retune')}
            glyph={t('map.retune_glyph')}
            title={t('map.retune_tip')}
            onclick={onretune}
        />
    </div>
    <div class="toggles">
        <Checkbox
            checked={collaborators}
            label={t('map.collaborators')}
            onchange={oncollaborators}
        />
        {#if statuses.length > 0}
            <span>{t('map.archived')}</span>
            {#each statuses as item (item.status)}
                <span class="archive">
                    <span
                        class="archive-dot"
                        style={`--archive-tone: var(--c-${item.color === undefined ? 'grey' : toneOf(item.color)})`}
                    ></span>
                    <Checkbox
                        checked={enabled.includes(item.status)}
                        label={item.status}
                        onchange={(checked: boolean) => onarchive(item.status, checked)}
                    />
                </span>
            {/each}
        {/if}
    </div>
</div>

<style>
    .controls,
    .legend,
    .toggles,
    .archive {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 7px;
    }

    .controls {
        justify-content: space-between;
        margin: 8px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* The row wraps rather than widening the pane, so a narrow map keeps every filter reachable. */
    .filters {
        margin: 8px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .group {
        white-space: nowrap;
    }

    /* A group of filters is named so it can be addressed, and the toolbar's own row is what its
       controls sit in, so the box around them lays nothing out of its own. */
    .set {
        display: contents;
    }

    .line-dot,
    .archive-dot {
        width: 9px;
        height: 9px;
        display: inline-block;
    }

    .line-dot {
        width: 0;
        height: 0;
        border: 5px solid var(--map-line);
    }

    .archive-dot {
        border-radius: var(--radius-pill);
        background: var(--archive-tone);
    }
</style>
