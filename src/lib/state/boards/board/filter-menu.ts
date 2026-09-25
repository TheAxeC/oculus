// Layer 2, client state. The board's one filter control as data: a group per facet, headed by the
// facet's name, a choice per value with its count, the values in force ticked, and how many values
// are in force in all, which is what the control's own words carry.
//
// It is apart from the view so the grouping and the count can be read without a DOM: a menu's list
// is drawn only once it is opened, which a server rendering never does. The shape of a group is the
// one ui/menu/Menu.svelte's `groups` takes, written out here because the state layer imports no ui
// file.

import { t } from '../../shared/words/text.ts';
import { toneOf } from '../../shared/words/tones.ts';
import {
    NONE,
    SESSIONS_LIVE,
    SESSIONS_RECENT,
    type BoardPreset,
    type Facet,
    type FacetValue
} from './presets.ts';

/** One value of one facet as a choice: its words with its count, ticked while it is in force. */
export type FilterChoice = {
    id: string;
    label: string;
    active: boolean;
    /** The glyph a ticked choice is drawn with, and nothing for one that is not in force. */
    glyph?: string;
    /** The hue of a lifecycle bucket, which only the category facet's values carry. */
    tone?: string;
};

/** One facet's run of choices under its heading. */
export type FilterGroup = { id: string; heading: string; items: FilterChoice[] };

/**
 * A facet's heading. The keys are literal so tests/checks/source/keys.test.ts can see every one of
 * them.
 */
export function facetHeading(facet: string): string {
    if (facet === 'category') return t('board.facet_category');
    if (facet === 'year') return t('board.facet_year');
    if (facet === 'domain') return t('board.facet_domain');
    if (facet === 'pillar') return t('board.facet_pillar');
    if (facet === 'funding') return t('board.facet_funding');
    if (facet === 'dataset') return t('board.facet_dataset');
    if (facet === 'status') return t('board.facet_status');
    if (facet === 'compute') return t('board.facet_compute');
    if (facet === 'reproduced') return t('board.facet_reproduced');
    if (facet === 'sessions') return t('board.facet_sessions');
    return t('board.facet_code');
}

function sessionsLabel(value: string): string {
    if (value === SESSIONS_LIVE) return t('board.sessions_live');
    if (value === SESSIONS_RECENT) return t('board.sessions_recent');
    return t('board.sessions_none');
}

function computeLabel(value: string): string {
    if (value === 'hpc') return t('board.compute_hpc');
    if (value === 'local') return t('board.compute_local');
    return t('board.compute_none');
}

function codeLabel(value: string): string {
    if (value === 'deposited') return t('board.code_deposited');
    if (value === 'review-anon') return t('board.code_anon');
    if (value === 'none') return t('board.code_pending');
    return t('board.code_none');
}

/** The words of a facet value that is vocabulary rather than data. */
export function valueLabel(facet: string, value: FacetValue): string {
    if (facet === 'year' && value.value === NONE) return t('board.no_year');
    if (facet === 'funding' && value.value === NONE) return t('board.no_funding');
    if (facet === 'compute') return computeLabel(value.value);
    if (facet === 'code') return codeLabel(value.value);
    if (facet === 'reproduced') {
        return value.value === '1' ? t('board.repro_yes') : t('board.repro_no');
    }
    if (facet === 'sessions') return sessionsLabel(value.value);
    return value.label;
}

/** The hue of one lifecycle bucket, through the palette, and nothing when it has none. */
function bucketTone(preset: BoardPreset, id: string): string | undefined {
    const colour = preset.rollup.find((bucket) => bucket.id === id)?.color ?? '';
    return colour === '' ? undefined : toneOf(colour);
}

/**
 * Every facet of the board as a group of the one filter control. The category facet carries its
 * bucket's own hue as a dot, which is the one facet whose values the config gives a colour to
 * (`tab_rollup`), and no other facet is given one. A facet with no values draws no group.
 */
export function filterGroups(
    groups: Facet[],
    filters: Record<string, string[]>,
    preset: BoardPreset
): FilterGroup[] {
    return groups
        .filter((group) => group.values.length > 0)
        .map((group) => {
            const selected = filters[group.key] ?? [];
            return {
                id: group.key,
                heading: facetHeading(group.key),
                items: group.values.map((value) => {
                    const active = selected.includes(value.value);
                    const choice: FilterChoice = {
                        id: value.value,
                        label: `${valueLabel(group.key, value)} ${value.count}`,
                        active
                    };
                    if (active) choice.glyph = t('board.filter_tick_glyph');
                    const tone =
                        group.key === 'category' ? bucketTone(preset, value.value) : undefined;
                    if (tone !== undefined) choice.tone = tone;
                    return choice;
                })
            };
        });
}

/** How many values are in force over every facet, which the control's words count. */
export function filtersInForce(filters: Record<string, string[]>): number {
    return Object.values(filters).reduce((sum, values) => sum + values.length, 0);
}

/** The control's words: the plain name while nothing is in force, else the name with the count. */
export function filterLabel(filters: Record<string, string[]>): string {
    const count = filtersInForce(filters);
    return count === 0 ? t('board.filter') : t('board.filter_count', count);
}
