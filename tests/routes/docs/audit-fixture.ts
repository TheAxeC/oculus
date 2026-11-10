// Layer 2, route test fixture. The hub of an audit test in a scratch folder, its projects, and the
// audit of it as the portfolio watcher scans it, shared by audit.test.ts and audit-markers.test.ts:
// the rules and the layout of the hub's merged settings, the setting its own settings file holds,
// the website check given and the user's keys.

import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import type { AuditFinding, Collection, Project } from '../../../src/lib/data/model/index.ts';
import { auditFindings, hubAuditSetting } from '../../../src/lib/server/content/audit/scan.ts';
import { auditRules } from '../../../src/lib/server/content/audit/rules.ts';
import { hubLayout } from '../../../src/lib/data/sources/config/settings/hub-rows.ts';
import type { WebsiteCheck } from '../../../src/lib/server/content/audit/publications.ts';
import { holdersOf } from '../../../src/lib/data/helpers/hub-names.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';
import { plantScratch } from '../../fixtures/scratch.ts';

/** Oculus's merged configuration with no hub. */
export const { config } = loadConfig(engineDir());

/** The text catalog the audit words its findings from. */
export const catalog = textCatalog(config);

/** A hub in a scratch folder: its `.oculus/config.yml` holding `audit`, and the files given. */
export function hubOf(
    audit: string,
    files: Record<string, string> = {},
    folders: string[] = []
): string {
    const setting: Record<string, string> = audit === '' ? {} : { '.oculus/config.yml': audit };
    return plantScratch('oculus-audit-', { ...setting, ...files }, folders);
}

/** A project of the hub at a folder, of the tier research unless `over` says otherwise. */
export function projectAt(folder: string, over: Partial<Project> = {}): Project {
    return fixtureProject({
        id: `hub:${folder}`,
        root: 'hub',
        tier: 'research',
        title: `Title of ${folder}`,
        folder,
        file: `${folder}/project.yml`,
        ...over
    });
}

/**
 * The audit of a hub over its projects, with the rules of its merged settings and the setting its
 * own settings file holds, as the portfolio watcher scans it, the website check given (none by
 * default) and the user's keys.
 */
export function findingsOf(
    hub: string,
    projects: Project[],
    primary = true,
    website: WebsiteCheck | null = null,
    self: ReadonlySet<string> = new Set<string>(),
    collections: Collection[] = []
): AuditFinding[] {
    const merged = loadConfig(engineDir(), { hub }).config;
    return auditFindings({
        hub,
        root: 'hub',
        primary,
        held: holdersOf(projects),
        self,
        projects,
        collections,
        rules: auditRules(merged),
        setting: hubAuditSetting(hub),
        layout: hubLayout(merged, []),
        website,
        catalog
    });
}

/** The sentence of a finding, worded from the catalog as the audit words it. */
export function said(key: string, ...args: string[]): string {
    return findingText(catalog, key, ...args);
}
