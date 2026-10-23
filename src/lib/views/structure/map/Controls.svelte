<script lang="ts">
    // Layer 3, Map partial. The bar under the pane header: the filters over the graph and the
    // independent collaborator and archived-status visibility controls. The link and re-tune
    // actions are icons in the header (Map.svelte), and the relationship legend is Legend.svelte.
    //
    // A filter carries how many projects of it the graph holds now, so a reader sees what a press
    // costs before pressing it. A project stage is a pressable chip in its tone, and the connected
    // toggle is a pressable chip without one; a pillar is a text button, since its words carry the
    // count and the glyph of a line.
    //
    // A line is drawn as the one in force only while it holds a project, so a line another filter
    // has emptied does not read as what the map is showing; whether it is in the filter is what it
    // reports as its pressed state.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { stageTone } from '$lib/state/shared/words/tones';

    type Status = { status: string; tone: string };
    type StageFilter = { stage: string; count: number; shown: boolean };
    type LineFilter = { id: string; title: string; count: number; shown: boolean };
    type Props = {
        collaborators: boolean;
        statuses: Status[];
        enabled: string[];
        connected: boolean;
        stages: StageFilter[];
        lines: LineFilter[];
        oncollaborators: (checked: boolean) => void;
        onarchive: (status: string, checked: boolean) => void;
        onstage: (stage: string) => void;
        online: (id: string) => void;
        onallstages: () => void;
        onalllines: () => void;
        onconnected: () => void;
    };
    let {
        collaborators,
        statuses,
        enabled,
        connected,
        stages,
        lines,
        oncollaborators,
        onarchive,
        onstage,
        online,
        onallstages,
        onalllines,
        onconnected
    }: Props = $props();
</script>

<div class="filters" data-map-filters>
    <Toolbar label={t('map.filters')}>
        {#if stages.length > 0}
            <span class="set" data-map-stages>
                <span class="group">{t('map.stages')}</span>
                {#each stages as item (item.stage)}
                    <Chip
                        label={t('map.count', item.stage, item.count)}
                        tone={stageTone(item.stage)}
                        filled={item.shown}
                        pressed={item.shown}
                        onclick={() => onstage(item.stage)}
                    />
                {/each}
                <ToolButton
                    label={t('map.all')}
                    title={t('map.all_stages_tip')}
                    onclick={onallstages}
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
            <Chip
                label={t('map.connected')}
                title={t('map.connected_tip')}
                pressed={connected}
                onclick={onconnected}
            />
        </span>
        <span class="set" data-map-toggles>
            <Checkbox
                checked={collaborators}
                label={t('map.collaborators')}
                onchange={oncollaborators}
            />
            {#if statuses.length > 0}
                <span class="group">{t('map.archived')}</span>
                {#each statuses as item (item.status)}
                    <span class="archive">
                        <span class="archive-dot" style={`--archive-tone: var(--c-${item.tone})`}
                        ></span>
                        <Checkbox
                            checked={enabled.includes(item.status)}
                            label={item.status}
                            onchange={(checked: boolean) => onarchive(item.status, checked)}
                        />
                    </span>
                {/each}
            {/if}
        </span>
    </Toolbar>
</div>

<style>
    /* The bar's strip wraps rather than widening the pane, so a narrow map keeps every filter
       reachable. The wrapper only carries the addressable name; the strip is the bar's. */
    .filters {
        display: contents;
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

    .archive {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .archive-dot {
        width: 9px;
        height: 9px;
        display: inline-block;
        border-radius: var(--radius-pill);
        background: var(--archive-tone);
    }
</style>
