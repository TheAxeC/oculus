// Layer 1, data. The whole-file shape of config/catalogs/agents.yml, the composer's pickers for a
// new agent session, with a description on every key, and the keys the file's own reader
// (data/sources/config/catalog/agents.ts) words itself.

import { z } from 'zod';
import { AGENT_FLAGS, AGENTS } from '../catalog-words.ts';
import { text, type Owned } from './common.ts';

/** One value a picker of agents.yml offers. */
const agentValue = z.strictObject({
    id: text.describe('The name the value is kept and chosen by.'),
    label: text.optional().describe('The words the picker shows for the value.'),
    pass: text
        .optional()
        .describe(
            "What is passed after the picker's flag; absent for the CLI's own default, which passes nothing."
        ),
    confirm: z
        .boolean()
        .optional()
        .describe(
            'true asks before a start with this value, since the agent then asks the reader less.'
        )
});

/** One picker of an agent: its flag, its default and its values. */
const agentList = z.strictObject({
    label: text.optional().describe('The words the picker is labelled with.'),
    flag: z
        .enum([...AGENT_FLAGS.claude, ...AGENT_FLAGS.codex])
        .optional()
        .describe('The one command-line flag every value of the picker is passed with.'),
    default: text.optional().describe('The id of the value the picker starts on.'),
    cache: text
        .optional()
        .describe(
            "The file of the Codex account whose list of models replaces the picker's values when it lists any."
        ),
    values: z.array(agentValue).optional().describe('The values the picker offers, in its order.')
});

/** One agent of agents.yml: its label and its pickers. */
const agentEntry = z.strictObject({
    label: text.optional().describe('The words the agent is offered with.'),
    lists: z
        .record(z.string(), agentList)
        .optional()
        .describe("The agent's pickers by name, in the order the composer draws them.")
});

/** config/catalogs/agents.yml: the composer's pickers, per agent. */
export const agentsFileShape = z.strictObject({
    agents: z
        .record(z.enum(AGENTS), agentEntry)
        .optional()
        .describe("The composer's choices for a new agent session, per agent.")
});

/**
 * The keys agents.yml may hold at each level, taken from the shapes above: the file, one agent, one
 * picker and one value of a picker. The reader of the file's text (catalog/agents.ts) names a key
 * outside them, with its line.
 */
export const AGENT_FILE_KEYS = {
    top: Object.keys(agentsFileShape.shape),
    agent: Object.keys(agentEntry.shape),
    list: Object.keys(agentList.shape),
    value: Object.keys(agentValue.shape)
};

/**
 * The keys of agents.yml that parseAgents (data/sources/config/catalog/agents.ts) words itself:
 * every key but an agent's and a picker's `label` and a value's `pass`, which it reads as they are.
 */
export const agentsWords: Owned = (key) =>
    !/^agents\.[^.]+(\.lists\.[^.]+)?\.label$|^agents\.[^.]+\.lists\.[^.]+\.values\.\d+\.pass$/.test(
        key
    );
