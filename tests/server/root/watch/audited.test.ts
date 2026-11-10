// Layer 2, server test. What the portfolio watcher's filters read of the hubs' settings
// (server/root/watch/portfolio/audited.ts): the audit paths from `project_docs` and the folders
// left out of the watch from `code_dir` and `audit.skip_folders`, and the filter of one event under
// them. No folder is read.

import { describe, expect } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { hubLayout } from '../../../../src/lib/data/sources/config/settings/hub-rows.ts';
import type { AuditSetting } from '../../../../src/lib/server/content/audit/scan.ts';
import { relevantTo, watchScope } from '../../../../src/lib/server/root/watch/portfolio/audited.ts';
import { it } from '../../../fixtures/scratch.ts';

/** oculus's own merged config, read as the server reads it. */
const ENGINE = loadConfig(engineDir()).config;

/** A hub's `audit:` setting that requires nothing. */
const NONE: AuditSetting = {
    requiredFiles: [],
    requiredSections: [],
    stageFolders: [],
    problems: []
};

describe("the scope of the watch filters, read from the hubs' settings", () => {
    it("takes the Markdown files of project_docs and leaves out oculus's code folder alone (G125)", () => {
        const scope = watchScope([
            { merged: ENGINE, layout: hubLayout(ENGINE, []), setting: NONE }
        ]);
        expect(scope.paths).toEqual([['README.md'], ['code', 'README.md']]);
        expect(scope.never).toEqual([['code']]);
    });

    it("leaves out a hub's code folder and the folders of its audit.skip_folders (G125)", () => {
        const merged = { ...ENGINE, code_dir: 'src/code', audit: { skip_folders: ['attic'] } };
        const scope = watchScope([{ merged, layout: hubLayout(merged, []), setting: NONE }]);
        expect(scope.never).toEqual([['src', 'code'], ['attic']]);
        const relevant = relevantTo(scope);
        expect(relevant('projects/a/attic/old/project.yml')).toBe(false);
        expect(relevant('projects/a/src/code/b/project.yml')).toBe(false);
        expect(relevant('projects/a/code/b/project.yml')).toBe(true);
    });
});
