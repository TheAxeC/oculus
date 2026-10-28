// Layer 2, client state. The sentences the Settings rows answer with, as the catalog key of each in
// config/text/views/system/workbench.yml and the values it fills in. A module here holds no
// sentence: it answers a message, and the view words it with `said` of
// views/system/workbench/settings/said.ts, so every sentence is in the catalog and every key below
// is held to a reader and a word by tests/checks/source/keys.test.ts.

/** The catalog key of every message, by the name a module answers it under. */
export const SETTINGS_MESSAGES = {
    loading: 'workbench.settings_loading',
    unreadable: 'workbench.settings_unreadable',
    cut: 'workbench.settings_cut',
    unparsed: 'workbench.settings_unparsed',
    missing: 'workbench.settings_missing',
    hubFileAbsent: 'workbench.settings_hub_file_absent',
    noWorkspace: 'workbench.settings_no_workspace',
    noPrimary: 'workbench.settings_no_primary',
    pickHub: 'workbench.settings_pick_hub',
    hubLoading: 'workbench.settings_hub_loading',
    hubFailed: 'workbench.settings_hub_failed',
    mismatchToggle: 'workbench.settings_mismatch_toggle',
    mismatchNumber: 'workbench.settings_mismatch_number',
    mismatchText: 'workbench.settings_mismatch_text',
    mismatchList: 'workbench.settings_mismatch_list',
    mismatchBlock: 'workbench.settings_mismatch_block',
    empty: 'workbench.settings_empty',
    notNumber: 'workbench.settings_not_number',
    notWhole: 'workbench.settings_not_whole',
    notProgram: 'workbench.settings_not_program',
    notExtension: 'workbench.settings_not_extension',
    notBundleId: 'workbench.settings_not_bundle_id',
    notHttpsAddress: 'workbench.settings_not_https_address',
    notHttpsOrigin: 'workbench.settings_not_https_origin',
    notRowKey: 'workbench.settings_not_row_key',
    range: 'workbench.settings_range',
    rangeMin: 'workbench.settings_range_min',
    rangeMax: 'workbench.settings_range_max',
    rangeWhole: 'workbench.settings_range_whole',
    rangeWholeMin: 'workbench.settings_range_whole_min',
    rangeWholeMax: 'workbench.settings_range_whole_max',
    notHubPath: 'workbench.settings_not_hub_path',
    noFolder: 'workbench.settings_no_folder',
    noFile: 'workbench.settings_no_file',
    notAPath: 'workbench.settings_not_a_path',
    blank: 'workbench.settings_blank',
    notThisKind: 'workbench.settings_not_this_kind',
    where: 'workbench.settings_where',
    refused: 'workbench.settings_refused',
    failed: 'workbench.settings_failed',
    unwritable: 'workbench.settings_unwritable',
    network: 'workbench.settings_network',
    timedOut: 'workbench.settings_timed_out',
    duplicateKey: 'workbench.settings_duplicate_key',
    emptyKey: 'workbench.settings_empty_key',
    notYaml: 'workbench.settings_not_yaml',
    emptyItem: 'workbench.settings_empty_item',
    changedSince: 'workbench.settings_changed_since',
    draftDropped: 'workbench.settings_draft_dropped',
    listLoading: 'workbench.settings_list_loading',
    listFailed: 'workbench.settings_list_failed',
    portRefused: 'workbench.settings_machine_port_refused'
} as const;

/** The name a message is answered under. */
export type MessageId = keyof typeof SETTINGS_MESSAGES;

/** One sentence to be worded: its catalog key and the values it fills in, in order. */
export type Message = { key: string; args: (string | number)[] };

/** The message of one name with the values it fills in. */
export function message(id: MessageId, ...args: (string | number)[]): Message {
    return { key: SETTINGS_MESSAGES[id], args };
}
