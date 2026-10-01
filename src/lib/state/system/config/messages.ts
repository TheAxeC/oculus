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
    mismatchToggle: 'workbench.settings_mismatch_toggle',
    mismatchNumber: 'workbench.settings_mismatch_number',
    mismatchChoice: 'workbench.settings_mismatch_choice',
    mismatchText: 'workbench.settings_mismatch_text',
    mismatchList: 'workbench.settings_mismatch_list',
    empty: 'workbench.settings_empty',
    notNumber: 'workbench.settings_not_number',
    refused: 'workbench.settings_refused',
    failed: 'workbench.settings_failed',
    unwritable: 'workbench.settings_unwritable',
    network: 'workbench.settings_network',
    timedOut: 'workbench.settings_timed_out'
} as const;

/** The name a message is answered under. */
export type MessageId = keyof typeof SETTINGS_MESSAGES;

/** One sentence to be worded: its catalog key and the values it fills in, in order. */
export type Message = { key: string; args: (string | number)[] };

/** The message of one name with the values it fills in. */
export function message(id: MessageId, ...args: (string | number)[]): Message {
    return { key: SETTINGS_MESSAGES[id], args };
}
