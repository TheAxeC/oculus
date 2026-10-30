// Layer 1, data. The whole-file shape of config/schemas/manifest-schema.yml, the project.yml edit
// form as data, with a description on every key: its sections, its fields with the widget each is
// edited by, the help line of each map a dotted field lies in, and `manifest_fields`, the fields a
// hub's settings file adds to the form of its own projects (empty in oculus's own file). The form
// with a hub's added fields laid into it is data/shapes/vocab-keys.ts's `withManifestFields`.

import { z } from 'zod';
import { MANIFEST_FIELDS_KEY } from '../vocab-keys.ts';
import { text } from './common.ts';

/** The widgets the project edit form draws a field with. */
export const MANIFEST_WIDGETS = [
    'readonly',
    'text',
    'textarea',
    'lines',
    'select',
    'chips',
    'tags',
    'date',
    'checkbox',
    'keymap',
    'rows'
] as const;

/** One field of the project edit form: its label, widget, section, help line and choices. */
const manifestField = z.strictObject({
    label: text.optional().describe('The words the form labels the field with.'),
    type: z.enum(MANIFEST_WIDGETS).describe('The widget the form edits the field with.'),
    section: text.optional().describe('The section of `sections` the field is drawn in.'),
    help: text
        .optional()
        .describe('What the field holds, shown by the form and on hover in the YAML editor.'),
    foreign_key: z
        .union([text, z.array(text)])
        .optional()
        .describe(
            "Where the choices come from: a collection by its key in the hub's collections list, projects, or a vocab.yml list written vocab.<key>; a value stored is the primary key of the entry it names, and a list offers their keys together."
        ),
    primary_key: z
        .literal(true)
        .optional()
        .describe('true marks the field a project is addressed by, its id, which no write sets.'),
    display: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
            'The rank of the field among those a reference to a project shows: the filled field of the lowest rank is shown, the id when none is filled.'
        ),
    options: z.array(text).optional().describe('A literal list of the choices.'),
    fields: z
        .array(text)
        .optional()
        .describe(
            'On a rows field: the text fields of each row, in the order the card draws them.'
        ),
    required: z
        .literal(true)
        .optional()
        .describe('true makes a project.yml without the field a finding.')
});

/**
 * One field a hub adds to the project form: the key of project.yml it adds under `field`, and the
 * rest as a field of `manifest_schema` is written, but for `primary_key` and `display`: a project
 * is addressed by oculus's own id, and shown by oculus's own ranks, in every hub.
 */
export const manifestFieldRow = manifestField.omit({ primary_key: true, display: true }).extend({
    field: text.describe('The key of project.yml the row adds, which no field of oculus holds.'),
    section: text.describe('The section of `manifest_schema.sections` the field is drawn in.')
});

/** config/schemas/manifest-schema.yml: the project edit form as data. */
export const manifestSchemaFileShape = z.strictObject({
    manifest_schema: z
        .strictObject({
            sections: z
                .record(z.string(), text.describe('The heading the section is drawn under.'))
                .optional()
                .describe('The sections of the form, in the order they are drawn.'),
            fields: z
                .record(z.string(), manifestField)
                .optional()
                .describe(
                    'The fields of a project.yml by key; a dotted key is a key inside the map its first part names.'
                )
        })
        .optional()
        .describe(
            'The project.yml edit form as data, from which the schema of every project.yml is made.'
        ),
    groups: z
        .record(z.string(), text.describe('What the map holds, shown as its description.'))
        .optional()
        .describe('The help line of each map a dotted field of `fields` lies in, by its name.'),
    [MANIFEST_FIELDS_KEY]: z
        .array(manifestFieldRow)
        .optional()
        .describe(
            "The fields a hub's settings file adds to the project form of its own projects, each after oculus's fields of its section; oculus's own file holds none."
        )
});
