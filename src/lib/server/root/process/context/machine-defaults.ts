// Layer 2, server. The default each key of the machine's `local.yml` has when no file sets it, as
// the text the Settings view shows beside the key. A path that lies in the primary hub is written
// relative to it; every other default is the value the server uses. No value of any `local.yml`
// is read here, so the answer is the same for every machine and every file.

import { join } from 'node:path';
import { ROOT_FOLDER } from '../../../../data/helpers/hub-names.ts';
import { DEFAULT_PORT, localDefaults } from '../../../../data/sources/config.ts';
import { words } from '../../../core/words.ts';
import { defaultChangesPath } from '../../../core/changes.ts';
import { defaultConnectDir } from '../../../accounts/connect/store.ts';
import { defaultApprovalsPath } from '../../../machine/approvals/approvals.ts';
import { defaultLspPath } from '../../../machine/lsp/choices.ts';
import { defaultRecordPath } from '../../../machine/runs/schedules/record.ts';
import { defaultHistoryDir } from '../../../files/fs/history.ts';
import { OPEN } from '../../../files/open.ts';
import { PER_OCULUS_NAMES } from '../../../files/workspace/paths.ts';
import { defaultOverridesPath } from '../../../sessions/overrides.ts';
import { defaultCachePath } from '../../../sessions/stores/transcripts.ts';

/** The keys under `literature:` of the file, as the catalog names them. */
const LITERATURE_NAMES = [
    'literature.wos_key',
    'literature.scopus_key',
    'literature.scopus_insttoken',
    'literature.openalex_key',
    'literature.semantic_scholar_key',
    'literature.ncbi_key',
    'literature.mailto'
];

/** A per-oculus path as the primary hub's folder holds it, relative to that folder. */
const inPrimary = (name: string): string => join(ROOT_FOLDER, name);

/**
 * The default of each key of the file, by the key. The sentences for a default that is no value
 * (the HPC host, the rows of the calendar and mail lists, the literature keys) come from `text`.
 */
export function machineDefaults(text: Record<string, string>): Record<string, string> {
    const defaults = localDefaults();
    const noHost = words(text, 'server.machine_default.hpc_host');
    const noAccounts = words(text, 'server.machine_default.no_accounts');
    const noKey = words(text, 'server.machine_default.no_key');
    return {
        port: String(DEFAULT_PORT),
        hpc_host: noHost,
        sessions_cache: defaultCachePath(),
        sessions_overrides: defaultOverridesPath(),
        bookmarks: inPrimary(PER_OCULUS_NAMES.bookmarks),
        notes: inPrimary(PER_OCULUS_NAMES.notes),
        changes: defaultChangesPath(),
        history: defaultHistoryDir(),
        approvals: defaultApprovalsPath(),
        lsp: defaultLspPath(),
        schedules: inPrimary(PER_OCULUS_NAMES.schedules),
        schedule_record: defaultRecordPath(),
        claude_bin: defaults.claudeBin,
        open_bin: OPEN,
        rite_dap_bin: defaults.riteDapBin,
        accounts: defaults.accounts.map((one) => one.dir).join(', '),
        calendars: noAccounts,
        mail: noAccounts,
        calendar_dir: defaultConnectDir('calendar'),
        mail_dir: defaultConnectDir('mail'),
        apps_dir: inPrimary(PER_OCULUS_NAMES.appsDir),
        ...Object.fromEntries(LITERATURE_NAMES.map((name) => [name, noKey]))
    };
}
