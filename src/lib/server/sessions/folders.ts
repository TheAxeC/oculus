// Layer 2, server. The folders the three session stores read, one per account `config/local.yml`
// names.
//
// Every `tool: claude` account keeps its registry in `<dir>/sessions` and its transcripts in
// `<dir>/projects`, and every `tool: codex` account keeps its rollouts in `<dir>/sessions`. The
// stores take these lists as options and hold no home path of their own, so a second account's
// running session is read as live and a test reads nothing but its fixture folders.
//
// Two accounts can resolve to one real folder (one account's `projects` a symlink to another's), so
// every list is reduced by real path before a scan: a transcript is then listed once, under the
// path of the account that named its folder first.

import { realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { UsageAccountConfig } from '../../data/model/index.ts';

/** The folders each store reads, every list already reduced to one folder per real path. */
export type SessionFolders = {
    /** The Claude transcript folders, `<dir>/projects` of every Claude account. */
    stores: string[];
    /** The Claude session registries, `<dir>/sessions` of every Claude account. */
    registries: string[];
    /** The Codex rollout folders, `<dir>/sessions` of every Codex account. */
    codexStores: string[];
};

/** A folder's real path, or its absolute path when it does not resolve (it is not there yet). */
export function realFolder(folder: string): string {
    try {
        return realpathSync(folder);
    } catch {
        return resolve(folder);
    }
}

/**
 * One folder per real path, each under the absolute path it was first named by, in that order. An
 * empty entry is dropped, and a folder that does not exist is kept, so a store made after the start
 * is read by the next scan.
 */
export function distinctFolders(folders: readonly string[]): string[] {
    const kept = new Map<string, string>();
    for (const folder of folders) {
        if (typeof folder !== 'string' || folder === '') continue;
        const real = realFolder(folder);
        if (!kept.has(real)) kept.set(real, resolve(folder));
    }
    return [...kept.values()];
}

/** The three stores' folders for these accounts. */
export function sessionFolders(accounts: readonly UsageAccountConfig[]): SessionFolders {
    const claude = accounts.filter((account) => account.tool === 'claude');
    const codex = accounts.filter((account) => account.tool === 'codex');
    return {
        stores: distinctFolders(claude.map((account) => join(account.dir, 'projects'))),
        registries: distinctFolders(claude.map((account) => join(account.dir, 'sessions'))),
        codexStores: distinctFolders(codex.map((account) => join(account.dir, 'sessions')))
    };
}
