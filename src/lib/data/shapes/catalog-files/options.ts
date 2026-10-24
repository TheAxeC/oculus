// Layer 1, data. The whole-file shape of an options file, config/options/<file>.yml: every option
// of one defaults file (or of a hub's local.yml) by dotted key path, and the help line of each
// group of its dotted options, with a description on every key. The descriptions say what the head
// of config/options/appearance.yml says each word of an entry holds. The options reader
// (data/sources/config/catalog/options.ts) words its own refusals; `readSpecWords` names them.

import { z } from 'zod';
import { CONTROLS, FORMS, HEADINGS, SOURCES } from '../catalog-words.ts';
import { text, type Owned } from './common.ts';

/** The words one control or field of an options file may carry. */
const optionWords = {
    help: text.describe(
        'What the option or field holds and governs, which the Settings view and the editor show.'
    ),
    control: z
        .enum(CONTROLS)
        .optional()
        .describe(
            'The control the value is set with, which decides what the value may be; words is a word block, a map of the lists words, not_words, flags and not_flags.'
        ),
    options: z.array(text).optional().describe('The words a choice or a multi offers.'),
    from: z
        .union([
            z.enum(SOURCES),
            z.array(z.enum(SOURCES)),
            z.strictObject({
                field: text.describe('The field of the record whose value picks the source.'),
                sources: z
                    .record(z.string(), z.enum(SOURCES))
                    .describe('The source each value of that field picks.')
            })
        ])
        .optional()
        .describe(
            'The list a choice or a multi takes its words from, a word block (the control words) its words and the flags of that list, or a text box suggests from: one source, sources offered together, or the source another field of the record picks.'
        ),
    empty: z
        .union([z.literal(true), text])
        .optional()
        .describe(
            'true adds the empty value to a choice or a path; words do the same and are drawn for the empty item.'
        ),
    min: z.number().optional().describe('The least a number may be.'),
    max: z.number().optional().describe('The most a number may be.'),
    whole: z
        .literal(true)
        .optional()
        .describe('true holds a number, or each item of a list of numbers, to a whole number.'),
    form: z.enum(FORMS).optional().describe('The form a text, or each item of a list, is held to.'),
    slots: z.array(text).optional().describe('The names of the fixed items of a list.'),
    items: z.literal('number').optional().describe("number makes a list's items numbers."),
    joined: z
        .boolean()
        .optional()
        .describe('true writes a multi as one text, its words separated by spaces.'),
    allow_missing: z
        .union([z.boolean(), text])
        .optional()
        .describe(
            'Lets a folder or file be absent: always (true), or while the named toggle field of the record is true.'
        )
};

/** One field of a family: a help line alone, or the words of a control. */
type OptionField = string | Record<string, unknown>;

const optionField: z.ZodType<OptionField> = z.lazy(() =>
    z
        .union([
            text.describe('The help line of a field drawn as a text box.'),
            z.strictObject({
                ...optionWords,
                fields: z
                    .record(z.string(), optionField)
                    .optional()
                    .describe('The fields of a nested list of records, by name.')
            })
        ])
        .describe('One field of the records: its help line alone, or its control and words.')
);

/** One option of a defaults file, or one family of it. */
const optionEntry = z.strictObject({
    ...optionWords,
    fields: z
        .record(z.string(), optionField)
        .optional()
        .describe("A family's fields by name, which describe each of its records once."),
    heading: z
        .enum(HEADINGS)
        .optional()
        .describe('The subject the Settings view lists the option under.'),
    section: text.optional().describe('The group inside the heading the option is listed in.'),
    holds: z
        .literal('lists')
        .optional()
        .describe('lists marks a key/value family whose every key holds a list of values.'),
    key: text
        .optional()
        .describe(
            "The field the rows of a list of records are told apart by, by which a workspace file's settings: overrides or removes one row."
        )
});

/** config/options/<file>.yml: every option of one config file by dotted path, and its groups. */
export const optionsFileShape = z.strictObject({
    options: z
        .record(z.string(), optionEntry)
        .optional()
        .describe('Every option of the defaults file of the same name, by its dotted key path.'),
    groups: z
        .record(
            z.string(),
            text.describe('What the settings under the group govern, shown as its description.')
        )
        .optional()
        .describe('The help line of each group of dotted options, by its path.')
});

/**
 * The keys of an options file that readSpec (data/sources/config/catalog/options.ts) words itself:
 * a control, a source, a form, a heading, a `whole`, a list of slots, a help line, a key field or
 * a group line it refuses.
 */
export const readSpecWords: Owned = (key) =>
    key === 'groups' ||
    key.startsWith('groups.') ||
    /(^|\.)(control|from|form|heading|whole|slots|help|key)(\.|$)/.test(key);
