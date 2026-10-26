// Layer 2, server. The refusals the surgical editors find, as the catalog key of the sentence that
// says each one and the values that fill it.
//
// The editors under edit/yaml and edit/entry-edit are pure: they hold no text catalog, so a
// function that finds a refusal answers which refusal it is (`Why`) and the function that holds the
// request's catalog, the editor's entry point, words it with `said`. Every key is a line of
// config/text/server.yml; the table below is the one list of them, which tests/checks/source/
// keys.test.ts reads in both directions.

import { words } from '../../core/words.ts';

/** The refusals of the editors, each the catalog key of its sentence. */
export const REFUSALS = {
    blockList: 'server.edit.block_list',
    blockOwn: 'server.edit.block_own',
    entryNoPlace: 'server.edit.entry_no_place',
    entryNotInFile: 'server.edit.entry_not_in_file',
    fieldNoPlace: 'server.edit.field_no_place',
    fieldNoValue: 'server.edit.field_no_value',
    fieldNotThere: 'server.edit.field_not_there',
    fileHasKey: 'server.edit.file_has_key',
    fileNoKey: 'server.edit.file_no_key',
    fileNoParse: 'server.edit.file_no_parse',
    followupBlockIsMap: 'server.edit.followup_block_is_map',
    followupNeedsDo: 'server.edit.followup_needs_do',
    followupNoDo: 'server.edit.followup_no_do',
    followupNotFlow: 'server.edit.followup_not_flow',
    keyAlreadyThere: 'server.edit.key_already_there',
    keyNoPlace: 'server.edit.key_no_place',
    keyNoValue: 'server.edit.key_no_value',
    keyNotThere: 'server.edit.key_not_there',
    listEmpty: 'server.edit.list_empty',
    manifestNoParse: 'server.edit.manifest_no_parse',
    manifestNotMap: 'server.edit.manifest_not_map',
    mapNoPlace: 'server.edit.map_no_place',
    noEntriesToReorder: 'server.edit.no_entries_to_reorder',
    noFollowup: 'server.edit.no_followup',
    noLastKey: 'server.edit.no_last_key',
    noSubtask: 'server.edit.no_subtask',
    notABlockList: 'server.edit.not_a_block_list',
    notAFieldName: 'server.edit.not_a_field_name',
    notAFieldValue: 'server.edit.not_a_field_value',
    notScalar: 'server.edit.not_scalar',
    orderNotEvery: 'server.edit.order_not_every',
    parentNotMap: 'server.edit.parent_not_map',
    primaryKey: 'server.edit.primary_key',
    removedNoFit: 'server.edit.removed_no_fit',
    rowNoKey: 'server.edit.row_no_key',
    subtaskBlockIsMap: 'server.edit.subtask_block_is_map',
    subtaskNeedsDo: 'server.edit.subtask_needs_do',
    subtaskNoDo: 'server.edit.subtask_no_do',
    subtaskNotFlow: 'server.edit.subtask_not_flow',
    unverified: 'server.edit.unverified',
    valueCannotHere: 'server.edit.value_cannot_here',
    valueNoPlace: 'server.edit.value_no_place',
    valueOneLine: 'server.edit.value_one_line',
    valueShape: 'server.edit.value_shape'
} as const;

/** One refusal an editor found: which one it is and the values its sentence is filled with. */
export type Why = { key: string; args: readonly (string | number)[] };

/** The refusal `key` of REFUSALS with the values that fill its sentence. */
export function why(key: string, ...args: (string | number)[]): Why {
    return { key, args };
}

/** The sentence of a refusal, read from the catalog the entry point of a write holds. */
export function said(text: Record<string, string>, found: Why): string {
    return words(text, found.key, ...found.args);
}
