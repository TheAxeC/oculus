<script lang="ts">
    // Layer 3, Map partial. The relationship legend, link and tuning tools, and the independent
    // collaborator and archived-status visibility controls.

    import Checkbox from '$lib/ui/Checkbox.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import { toneOf, typeTone } from '$lib/state/tones';

    type Status = { status: string; color?: string };
    type Props = {
        linkMode: boolean;
        collaborators: boolean;
        statuses: Status[];
        enabled: string[];
        onlink: () => void;
        onretune: () => void;
        oncollaborators: (checked: boolean) => void;
        onarchive: (status: string, checked: boolean) => void;
    };
    let {
        linkMode,
        collaborators,
        statuses,
        enabled,
        onlink,
        onretune,
        oncollaborators,
        onarchive
    }: Props = $props();
</script>

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
