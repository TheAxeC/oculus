// Layer 1, data. The hub list, the keys a hub's own `.oculus/config.yml` may set with the config
// file of oculus each belongs to, and the keys of it that each hub's own file is read for, named
// once for the server and the page: a Settings write of one of those names the hub it writes, and
// the Settings row shows that hub's value. The other keys of the hub list are read from the primary
// hub's file alone, so a write of one of them goes to the primary and names no other hub. The
// Settings view reads a hub other than the primary through the slice these keys make of its merged
// settings (data/sources/config/settings/hub-slice.ts).

import { CV_FIELD_ROLES } from '../model/index.ts';

/**
 * The keys the hub's settings file may set, each with the name of oculus's config file it belongs
 * to (`sources.yml` for config/defaults/sources.yml, `catalogs/vocab.yml` for a catalog), which is
 * the group the Settings view draws it in and the options file under config/options/ that describes
 * it. Each key is a dotted path into the hub file, and a key outside the list is a finding and is
 * not applied. A key of config/catalogs/vocab.yml is laid over oculus's value by its shape
 * (data/sources/config/merge/in-place.ts): a map by its words in oculus's place, `categories` by
 * its rows' `key`, `focus_clusters`, `focus_lanes`, `fund_stages`, `position_stages`,
 * `teaching_stages`, `roles`, `venue_categories`, `pillar_kinds`, `venue_tiers`,
 * `venue_biennial`, `venue_no_jif`, `radar_buckets` and `deck_order` whole, and `rail_color` as a
 * colour written `#rrggbb`; `manifest_fields`, the fields the hub adds to the project form, is
 * read row by row; the service rows oculus ships (`literature.sources`, `recover.sources`, `links`
 * and `sign_in` by their `key`, `connections.failures` by its `kind`) are laid over oculus's row by
 * row, so a hub adds, changes or removes one row; every other key replaces oculus's value whole,
 * oculus's value standing where the hub sets none. They are the keys that describe this hub rather
 * than the engine: its folders and the files of its records, which of its registries are feeds and
 * the word its leads feed records a scout run by, the update tasks its tray offers, the documents
 * a project card marks, the folders a project keeps its code and its deck in, its LinkedIn folder
 * and the start of the name of an idea in it, its folder of secrets (`secrets_dir`) and its notes
 * folder (`notes_dir`), which of its records a chat's index holds, where the reader's bookmarks,
 * the schedules and the machine's apps are kept, the clusters its jobs run on, the folder a Submit
 * copies a project's code to on a cluster, the files it leaves out, the folders a finished job's
 * log is looked for in and each cluster's scratch folder (`slurm.`), the key Account setup makes
 * for each cluster, the rows that tell a failed connection apart, the providers its readers sign
 * in with, where Recover downloads Node.js from, the folder under the home folder its datasets
 * live in and the partition its jobs ask for on each cluster (`recover.`), the files its writing
 * rules skip or let draw arrows, the conventions its audit holds its projects to (`audit:`: the
 * files and sections it requires, the folders a stage keeps a project in, the open markers it looks
 * for, the mark of a result that is not final, the folders it never reads and its website's feed),
 * the website its files are written into (`website:`, each of the four paths of `website.files` a
 * key of its own, so a hub that sets one keeps oculus's other three, and each of the three words of
 * `website.cv_words` a key of its own the same way, with the schema section of the fields that feed
 * it, `website.schema_section`), the values its apps' settings hold, the counts its tabs draw, its
 * vocabulary (every list of vocab.yml) and the fields it adds to the project form, the reader rows
 * of its literature sources, its Recover sources and its journal browser, the links every page link
 * is built from, the patterns a deposit leaves out of a code folder with no `.depositignore`
 * (`deposit.default_ignore`), and the Zenodo deposit of its projects (`deposit.zenodo`, each of its
 * three fields a key of its own, so a hub that sets one keeps oculus's other two). Its domains and
 * theme words are its own registry files'. Which of them each hub's own file is read for, and which
 * the primary's alone, is `OWN_HUB_KEYS` below.
 */
const HUB_LIST: readonly { key: string; file: string }[] = [
    { key: 'scan', file: 'sources.yml' },
    { key: 'portfolio_deck', file: 'sources.yml' },
    { key: 'collections', file: 'sources.yml' },
    { key: 'chat_context', file: 'sources.yml' },
    { key: 'feed_registries', file: 'sources.yml' },
    { key: 'leads_run_word', file: 'sources.yml' },
    { key: 'update_tasks', file: 'sources.yml' },
    { key: 'project_docs', file: 'sources.yml' },
    { key: 'code_dir', file: 'sources.yml' },
    { key: 'deck_dir', file: 'sources.yml' },
    { key: 'new_project_dir', file: 'sources.yml' },
    { key: 'linkedin_dir', file: 'sources.yml' },
    { key: 'linkedin_idea_prefix', file: 'sources.yml' },
    { key: 'career_file', file: 'sources.yml' },
    { key: 'memories_dir', file: 'sources.yml' },
    { key: 'wallpaper_dir', file: 'sources.yml' },
    { key: 'secrets_dir', file: 'sources.yml' },
    { key: 'notes_dir', file: 'sources.yml' },
    { key: 'bookmarks', file: 'sources.yml' },
    { key: 'schedules', file: 'sources.yml' },
    { key: 'apps_dir', file: 'sources.yml' },
    { key: 'wallpaper.image', file: 'appearance.yml' },
    { key: 'docs', file: 'layout.yml' },
    { key: 'counts', file: 'layout.yml' },
    { key: 'palette', file: 'catalogs/vocab.yml' },
    { key: 'stages', file: 'catalogs/vocab.yml' },
    { key: 'forms', file: 'catalogs/vocab.yml' },
    { key: 'chips', file: 'catalogs/vocab.yml' },
    { key: 'statuses', file: 'catalogs/vocab.yml' },
    { key: 'lead_statuses', file: 'catalogs/vocab.yml' },
    { key: 'focus_clusters', file: 'catalogs/vocab.yml' },
    { key: 'focus_lanes', file: 'catalogs/vocab.yml' },
    { key: 'fund_stages', file: 'catalogs/vocab.yml' },
    { key: 'position_stages', file: 'catalogs/vocab.yml' },
    { key: 'teaching_stages', file: 'catalogs/vocab.yml' },
    { key: 'focus_lane_tones', file: 'catalogs/vocab.yml' },
    { key: 'facet_tones', file: 'catalogs/vocab.yml' },
    { key: 'tiers', file: 'catalogs/vocab.yml' },
    { key: 'research_audit', file: 'catalogs/vocab.yml' },
    { key: 'roles', file: 'catalogs/vocab.yml' },
    { key: 'categories', file: 'catalogs/vocab.yml' },
    { key: 'deck_order', file: 'catalogs/vocab.yml' },
    { key: 'rail_color', file: 'catalogs/vocab.yml' },
    { key: 'leads_fit', file: 'catalogs/vocab.yml' },
    { key: 'data_access', file: 'catalogs/vocab.yml' },
    { key: 'venue_categories', file: 'catalogs/vocab.yml' },
    { key: 'pillar_kinds', file: 'catalogs/vocab.yml' },
    { key: 'venue_tiers', file: 'catalogs/vocab.yml' },
    { key: 'venue_ranks', file: 'catalogs/vocab.yml' },
    { key: 'venue_costs', file: 'catalogs/vocab.yml' },
    { key: 'venue_biennial', file: 'catalogs/vocab.yml' },
    { key: 'venue_no_jif', file: 'catalogs/vocab.yml' },
    { key: 'radar_buckets', file: 'catalogs/vocab.yml' },
    { key: 'radar_relevance', file: 'catalogs/vocab.yml' },
    { key: 'ticker_categories', file: 'catalogs/vocab.yml' },
    { key: 'manifest_fields', file: 'schemas/manifest-schema.yml' },
    { key: 'slurm.resource', file: 'behavior.yml' },
    { key: 'slurm.cluster_folder', file: 'behavior.yml' },
    { key: 'slurm.unsent', file: 'behavior.yml' },
    { key: 'slurm.log_dirs', file: 'behavior.yml' },
    { key: 'slurm.scratch_roots', file: 'behavior.yml' },
    { key: 'clusters.key_type', file: 'behavior.yml' },
    { key: 'clusters.key_file', file: 'behavior.yml' },
    { key: 'connections.failures', file: 'behavior.yml' },
    { key: 'sign_in', file: 'behavior.yml' },
    { key: 'recover.node_download', file: 'behavior.yml' },
    { key: 'recover.data_dir', file: 'behavior.yml' },
    { key: 'recover.partitions', file: 'behavior.yml' },
    { key: 'lint.writing_skip', file: 'behavior.yml' },
    { key: 'lint.writing_glyphs', file: 'behavior.yml' },
    { key: 'audit.required_files', file: 'behavior.yml' },
    { key: 'audit.required_sections', file: 'behavior.yml' },
    { key: 'audit.stage_folders', file: 'behavior.yml' },
    { key: 'audit.markers', file: 'behavior.yml' },
    { key: 'audit.provisional_mark', file: 'behavior.yml' },
    { key: 'audit.skip_folders', file: 'behavior.yml' },
    { key: 'website.folder', file: 'behavior.yml' },
    { key: 'website.cv', file: 'behavior.yml' },
    { key: 'website.kinds', file: 'behavior.yml' },
    { key: 'website.paper_fields', file: 'behavior.yml' },
    { key: 'website.paper_list', file: 'behavior.yml' },
    { key: 'website.code_link_name', file: 'behavior.yml' },
    { key: 'website.author_places.lead', file: 'behavior.yml' },
    { key: 'website.author_places.supervisor', file: 'behavior.yml' },
    { key: 'website.author_places.collaborator', file: 'behavior.yml' },
    { key: 'website.code_statuses.deposited', file: 'behavior.yml' },
    { key: 'website.code_statuses.review_copy', file: 'behavior.yml' },
    { key: 'website.doi_origin', file: 'behavior.yml' },
    { key: 'website.schema_section', file: 'behavior.yml' },
    { key: 'website.file_header', file: 'behavior.yml' },
    { key: 'website.site_programs', file: 'behavior.yml' },
    { key: 'website.cv_sections', file: 'behavior.yml' },
    { key: 'website.cv_lists', file: 'behavior.yml' },
    { key: 'website.cv_entry_fields', file: 'behavior.yml' },
    ...CV_FIELD_ROLES.map((role) => ({ key: `website.cv_fields.${role}`, file: 'behavior.yml' })),
    { key: 'website.cv_words.months', file: 'behavior.yml' },
    { key: 'website.cv_words.open_end', file: 'behavior.yml' },
    { key: 'website.cv_words.award_time', file: 'behavior.yml' },
    { key: 'website.files.site', file: 'behavior.yml' },
    { key: 'website.files.cv', file: 'behavior.yml' },
    { key: 'website.files.papers', file: 'behavior.yml' },
    { key: 'website.files.industry', file: 'behavior.yml' },
    { key: 'app_settings', file: 'behavior.yml' },
    { key: 'literature.sources', file: 'behavior.yml' },
    { key: 'literature.prefer', file: 'behavior.yml' },
    { key: 'recover.sources', file: 'behavior.yml' },
    { key: 'venues.browser', file: 'behavior.yml' },
    { key: 'links', file: 'behavior.yml' },
    { key: 'deposit.default_ignore', file: 'behavior.yml' },
    { key: 'deposit.zenodo.address', file: 'behavior.yml' },
    { key: 'deposit.zenodo.timeout_s', file: 'behavior.yml' },
    { key: 'deposit.zenodo.auth', file: 'behavior.yml' }
];

/** Every dotted key the hub list names, in the list's order. */
export function hubKeys(): string[] {
    return HUB_LIST.map((one) => one.key);
}

/** The dotted keys the hub list binds to one config file, or undefined for a file with none. */
export function hubKeysOf(name: string): readonly string[] | undefined {
    const keys = HUB_LIST.filter((one) => one.file === name).map((one) => one.key);
    return keys.length === 0 ? undefined : keys;
}

/** The config file of the engine a key of the hub list belongs to, or undefined for another key. */
export function hubFileOf(key: string): string | undefined {
    return HUB_LIST.find((one) => one.key === key)?.file;
}

/** The keys of the hub list each hub's own settings file is read for, in the hub list's order. */
export const OWN_HUB_KEYS: readonly string[] = [
    'scan',
    'collections',
    'chat_context',
    'feed_registries',
    'leads_run_word',
    'update_tasks',
    'project_docs',
    'code_dir',
    'deck_dir',
    'new_project_dir',
    'linkedin_dir',
    'linkedin_idea_prefix',
    'memories_dir',
    'wallpaper_dir',
    'secrets_dir',
    'notes_dir',
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
    'deck_order',
    'rail_color',
    'leads_fit',
    'data_access',
    'venue_categories',
    'pillar_kinds',
    'venue_tiers',
    'venue_ranks',
    'venue_costs',
    'venue_biennial',
    'venue_no_jif',
    'radar_buckets',
    'radar_relevance',
    'ticker_categories',
    'manifest_fields',
    'slurm.cluster_folder',
    'slurm.unsent',
    'audit.required_files',
    'audit.required_sections',
    'audit.stage_folders',
    'audit.markers',
    'audit.provisional_mark',
    'audit.skip_folders',
    'recover.sources',
    'venues.browser',
    'deposit.default_ignore',
    'deposit.zenodo.address',
    'deposit.zenodo.timeout_s',
    'deposit.zenodo.auth'
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
