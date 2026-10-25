// Layer 1, data tests. The fields a hub's `.oculus/config.yml` adds to the project form under
// `manifest_fields`: each row's field is drawn in the form of that hub's projects after oculus's
// fields of its section, and is a known key of that hub's manifests and of no other hub's; a row
// the form cannot take is a finding naming the hub's file and the row's key, and is left out. The
// cases that read a manifest plant a hub in a scratch directory and build it.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../../../src/lib/data/index.ts';
import { HUB_FILE } from '../../../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import { formFields } from '../../../../../src/lib/state/forms/schema.ts';
import { buildOneHub } from '../../../../fixtures/hubs/hub-build.ts';
import { it, plantScratch } from '../../../../fixtures/scratch.ts';
import { HUB_SETTINGS as FILE, OCULUS, withHub } from './layers-fixture.ts';

/** The row of case 9: a text field `grant_id` added to the Core section. */
const GRANT =
    '  - { field: grant_id, label: Grant, type: text, section: Core, help: "The grant number." }\n';

/** The findings on the key of the manifest of the planted hub's project, as `key | message`. */
function manifestSaid(settings: string, manifest: string, key: string): string[] {
    const hub = plantScratch('oculus-manifest-fields-', {
        [HUB_FILE]: settings,
        'projects/ideas/x/project.yml': manifest
    });
    const read = loadConfig(engineDir(), { hub });
    const { snapshot } = buildOneHub(hub, portfolioConfigFrom(read.config, read.from));
    const file = `${hub}/projects/ideas/x/project.yml`;
    return snapshot.findings
        .filter((one) => one.file === file && one.key.startsWith(key))
        .map((one) => `${one.key} | ${one.message}`);
}

describe('the fields a hub adds to the project form', () => {
    it("draws the added field after oculus's fields of its section in that hub's form only", () => {
        const read = withHub(`manifest_fields:\n${GRANT}`);
        expect(read.findings).toEqual([]);
        const own = formFields(OCULUS);
        const lab = formFields(OCULUS, read.config);
        expect(own.some((field) => field.field === 'grant_id')).toBe(false);
        const core = own.filter((field) => field.section === 'Core').map((field) => field.field);
        const labCore = lab.filter((field) => field.section === 'Core').map((field) => field.field);
        expect(labCore).toEqual([...core, 'grant_id']);
        expect(lab.find((field) => field.field === 'grant_id')).toMatchObject({
            label: 'Grant',
            type: 'text',
            help: 'The grant number.'
        });
        expect(lab.filter((field) => field.field !== 'grant_id')).toEqual(own);
    });

    it("reads the added key of that hub's manifest with no finding, and another hub's as unknown", () => {
        const manifest = 'title: X\ntier: research\nstage: nascent\ngrant_id: X1\n';
        expect(manifestSaid(`manifest_fields:\n${GRANT}`, manifest, 'grant_id')).toEqual([]);
        const home = manifestSaid('scan: [ { dir: projects/ideas } ]\n', manifest, 'grant_id');
        expect(home).toHaveLength(1);
        expect(home[0]).toContain('grant_id');
    });

    it('words each row the form cannot take and leaves it out', () => {
        const read = withHub(
            [
                'manifest_fields:',
                GRANT.trimEnd(),
                '  - { field: title, label: T, type: text, section: Core }',
                '  - { field: a, label: A, type: text, section: Nope }',
                '  - { field: b, label: B, type: slider, section: Core }',
                '  - { label: C, type: text, section: Core }',
                '  - { field: grant_id, label: Again, type: text, section: Core }',
                ''
            ].join('\n')
        );
        expect(read.findings.map((one) => `${one.file} | ${one.key} | ${one.message}`)).toEqual([
            `${FILE} | manifest_fields.1.field | manifest_fields.1.field names title, a field oculus's project form already has; the row is left out`,
            `${FILE} | manifest_fields.2.section | manifest_fields.2.section names Nope, which is not a section of the project form; the row is left out`,
            `${FILE} | manifest_fields.3.type | manifest_fields.3.type names slider, which is not a kind of field the project form draws; the row is left out`,
            `${FILE} | manifest_fields.4.field | manifest_fields.4.field names no field; the row is left out`,
            `${FILE} | manifest_fields.5.field | manifest_fields.5.field names grant_id, which an earlier row adds; the row is left out`
        ]);
        expect(read.config.manifest_fields).toEqual([
            {
                field: 'grant_id',
                label: 'Grant',
                type: 'text',
                section: 'Core',
                help: 'The grant number.'
            }
        ]);
    });
});
