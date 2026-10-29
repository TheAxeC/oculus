// Layer 1, data. The keys of the hub list (data/helpers/hub-names.ts) that each hub's own
// `.oculus/config.yml` is read for, named once for the server and the page: a Settings write of one
// of them names the hub it writes, and the Settings row shows that hub's value. The other keys of
// the hub list are read from the primary hub's file alone, so a write of one of them goes to the
// primary and names no other hub. The Settings view reads a hub other than the primary through the
// slice these keys make of its merged settings (data/sources/config/settings/hub-slice.ts).

import { hubFileOf } from '../helpers/hub-names.ts';

/** The keys of the hub list each hub's own settings file is read for, in the hub list's order. */
export const OWN_HUB_KEYS: readonly string[] = [
    'scan',
    'collections',
    'chat_context',
    'new_project_dir',
    'linkedin_dir',
    'memories_dir',
    'wallpaper_dir',
    'palette',
    'stages',
    'forms',
    'chips',
    'statuses',
    'lead_statuses',
    'focus_clusters',
    'focus_lanes',
    'fund_stages',
    'position_stages',
    'teaching_stages',
    'focus_lane_tones',
    'facet_tones',
    'tiers',
    'research_audit',
    'roles',
    'categories',
    'rail_color',
    'leads_fit',
    'data_access',
    'venue_categories',
    'pillar_kinds',
    'venue_tiers',
    'radar_buckets',
    'ticker_categories',
    'manifest_fields',
    'audit.required_files',
    'audit.required_sections',
    'audit.stage_folders',
    'audit.website.file',
    'audit.website.list',
    'audit.website.title',
    'audit.website.kinds',
    'recover.sources',
    'venues.browser'
];

/**
 * Whether a key of the hub list is read from the primary hub's file alone: every key of the list
 * this one does not hold. A hub other than the primary that sets one has a finding of its file
 * (data/sources/config/merge/hub-layer.ts).
 */
export function primaryOnly(key: string): boolean {
    return hubFileOf(key) !== undefined && !OWN_HUB_KEYS.includes(key);
}

/** Whether the option `key` of the defaults file `file` is read from each hub's own file. */
export function readPerHub(file: string, key: string): boolean {
    return OWN_HUB_KEYS.includes(key) && hubFileOf(key) === file;
}
