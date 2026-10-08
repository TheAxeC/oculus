// Layer 2, server. The reader's approval of a repository's Svelte and Vite configuration, which the
// Svelte server and the TypeScript server's Svelte plugin both depend on: whether the present
// text of the files is approved, and the approval and its taking back. The files and their text
// are config-files.ts's; the approvals file is approvals/approvals.ts's.

import {
    anyConfigApproved,
    approveConfig,
    configKey,
    configText,
    isConfigApproved,
    revokeConfig,
    type ApprovalWrite
} from '../../../approvals/approvals.ts';
import type { LspConfig } from '../../../../../data/model/index.ts';
import type { RootEnv } from '../../servers.ts';
import { configFilesOf, hasSvelte } from './config-files.ts';

/** The configuration of a root: its files and the approval over their present text. */
export async function configOf(env: RootEnv): Promise<{ text: string; view: LspConfig }> {
    const files = await configFilesOf(env.root);
    const text = configText(env.root, files);
    return {
        text,
        view: {
            files: files.map((one) => one.path),
            approved: isConfigApproved(env.approvals, 'svelte-config', text),
            key: configKey('svelte-config', text),
            svelte: hasSvelte(env.root)
        }
    };
}

/**
 * Whether the present text of the root's configuration is approved. A machine that approved no
 * configuration anywhere answers no without reading the repository.
 */
export async function isRootApproved(env: RootEnv): Promise<boolean> {
    return anyConfigApproved(env.approvals, 'svelte-config') && (await configOf(env)).view.approved;
}

/**
 * Approve the present text of the root's configuration when it is the text the reader was shown:
 * the key the approval names must be the key of the files as they are now. Answers `null` for a
 * key that no longer matches, which approves nothing.
 */
export async function approveRootConfig(env: RootEnv, key: string): Promise<ApprovalWrite | null> {
    const { text } = await configOf(env);
    return configKey('svelte-config', text) === key
        ? approveConfig(env.approvals, 'svelte-config', text)
        : null;
}

/** Take back the approval of the present text of the root's configuration. */
export async function revokeRootConfig(env: RootEnv): Promise<ApprovalWrite> {
    return revokeConfig(env.approvals, 'svelte-config', (await configOf(env)).text);
}
