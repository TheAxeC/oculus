// Layer 1, data. The composer's choices out of config/catalogs/agents.yml, and the argv words a
// start takes from them.
//
// The file is read from its text rather than from the merged config, since a refusal names the line
// it is on and only the text knows lines. Every refusal is a finding and the rest of the file still
// reads: a value the rule refuses is left out of its picker, and a picker whose flag is not one the
// CLI takes, or whose default is not one of its values, is left out whole, so the composer never
// offers a choice the start would then refuse. The flags each agent may be given are held here, and
// a start builds its argv from the parsed file and nothing else: a pick is an id, and the words
// that reach the command line are the file's.
//
// The yaml library's own node test is imported as `isYamlMap`, so a parsed value is never mistaken
// for a node.

import { z } from 'zod';
import { LineCounter, isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Node, Pair, YAMLMap } from 'yaml';
import type {
    AgentChoice,
    AgentChoiceList,
    AgentChoices,
    AgentChoicesFinding,
    AgentChoicesWhy,
    AgentId
} from '../../../model/index.ts';
import { itemsShape, mapShape, readAs, readOr } from '../../../shapes/shapes.ts';

/** The agents the file may name, in the order the composer offers them. */
export const AGENTS: AgentId[] = ['claude', 'codex'];

/**
 * The flags each agent's pickers may pass, from `claude --help` and `codex --help`. A picker that
 * names any other flag is refused, so the file cannot put an arbitrary option on a command line.
 */
export const AGENT_FLAGS: Record<AgentId, string[]> = {
    claude: ['--model', '--effort', '--permission-mode'],
    codex: ['-m', '-c', '-s', '-a']
};

/** The values a flag with a closed set of them accepts, from the same two help texts. */
const CLOSED: Record<string, string[]> = {
    '--effort': ['low', 'medium', 'high', 'xhigh', 'max'],
    '--permission-mode': ['acceptEdits', 'auto', 'bypassPermissions', 'manual', 'dontAsk', 'plan'],
    '-s': ['read-only', 'workspace-write', 'danger-full-access'],
    '-a': ['untrusted', 'on-failure', 'on-request', 'never']
};

/** The configuration keys a `-c` pair may set. */
const CONFIG_KEYS = ['model_reasoning_effort'];

const TOP_KEYS = ['agents'];
const AGENT_KEYS = ['label', 'lists'];
const LIST_KEYS = ['label', 'flag', 'default', 'values', 'cache'];
const VALUE_KEYS = ['id', 'label', 'pass', 'confirm'];

/** What a read of the file gives: the agents it offers, and every line it refused. */
export type AgentsRead = { agents: AgentChoices[]; findings: AgentChoicesFinding[] };

/**
 * Whether a word may follow a flag: not empty, not itself an option, and without whitespace or a
 * control character, since it is one element of an argument vector.
 */
export function passable(word: string): boolean {
    // eslint-disable-next-line no-control-regex
    return word !== '' && !word.startsWith('-') && !/[\s\u0000-\u001f\u007f]/.test(word);
}

/** Whether a value may follow this flag, by the flag's closed set or its `-c` keys. */
function allowed(flag: string, pass: string): boolean {
    if (!passable(pass)) return false;
    const closed = Object.hasOwn(CLOSED, flag) ? CLOSED[flag] : undefined;
    if (closed !== undefined) return closed.includes(pass);
    if (flag === '-c') {
        const at = pass.indexOf('=');
        return at > 0 && CONFIG_KEYS.includes(pass.slice(0, at)) && at < pass.length - 1;
    }
    return true;
}

/** Read config/catalogs/agents.yml's text. */
export function parseAgents(text: string): AgentsRead {
    const counter = new LineCounter();
    const doc = parseDocument(text, { lineCounter: counter, prettyErrors: false });
    const findings: AgentChoicesFinding[] = [];
    const lineOf = (node: Node | Pair | null | undefined): number => {
        const range = node !== null && node !== undefined && 'range' in node ? node.range : null;
        const key = node !== null && node !== undefined && 'key' in node ? node.key : null;
        const at = range?.[0] ?? (isScalar(key) ? key.range?.[0] : undefined) ?? 0;
        return counter.linePos(at).line;
    };
    const say = (node: Node | Pair | null | undefined, why: AgentChoicesWhy, what: string) => {
        findings.push({ line: lineOf(node), why, what });
    };
    for (const error of doc.errors) {
        findings.push({ line: counter.linePos(error.pos[0]).line, why: 'parse', what: '' });
    }
    if (doc.errors.length > 0) return { agents: [], findings };
    const root = doc.contents;
    if (!isYamlMap(root)) {
        say(root, 'shape', 'agents');
        return { agents: [], findings };
    }
    const agents: AgentChoices[] = [];
    for (const pair of root.items) {
        const key = keyOf(pair);
        if (!TOP_KEYS.includes(key)) {
            say(pair, 'unknown_key', key);
            continue;
        }
        if (!isYamlMap(pair.value)) {
            say(pair, 'shape', key);
            continue;
        }
        for (const entry of pair.value.items) {
            const one = readAgent(entry, say);
            if (one !== null) agents.push(one);
        }
    }
    agents.sort((a, b) => AGENTS.indexOf(a.agent) - AGENTS.indexOf(b.agent));
    return { agents, findings };
}

type Say = (node: Node | Pair | null | undefined, why: AgentChoicesWhy, what: string) => void;

/** A pair's key as a string, and the empty string for a key that is not a scalar. */
function keyOf(pair: Pair): string {
    return isScalar(pair.key) ? String(pair.key.value) : '';
}

/** A scalar string value of a map, or null for anything that is not one. */
function stringIn(map: YAMLMap, key: string): string | null {
    const node = map.get(key, true);
    return isScalar(node) && typeof node.value === 'string' ? node.value : null;
}

/** Flag every key of a map the rule does not name. */
function unknownKeys(map: YAMLMap, known: string[], say: Say): void {
    for (const pair of map.items) {
        const key = keyOf(pair);
        if (!known.includes(key)) say(pair, 'unknown_key', key);
    }
}

function readAgent(pair: Pair, say: Say): AgentChoices | null {
    const name = keyOf(pair);
    if (!AGENTS.includes(name as AgentId)) {
        say(pair, 'unknown_agent', name);
        return null;
    }
    const agent = name as AgentId;
    const body = pair.value;
    if (!isYamlMap(body)) {
        say(pair, 'shape', name);
        return null;
    }
    unknownKeys(body, AGENT_KEYS, say);
    const lists: AgentChoiceList[] = [];
    const rawLists = body.get('lists', true);
    if (!isYamlMap(rawLists)) {
        say(pair, 'shape', `${name}.lists`);
        return { agent, label: stringIn(body, 'label') ?? name, lists };
    }
    for (const entry of rawLists.items) {
        const list = readList(agent, entry, say);
        if (list !== null) lists.push(list);
    }
    return { agent, label: stringIn(body, 'label') ?? name, lists };
}

function readList(agent: AgentId, pair: Pair, say: Say): AgentChoiceList | null {
    const key = keyOf(pair);
    const body = pair.value;
    if (key === '' || !isYamlMap(body)) {
        say(pair, 'shape', key);
        return null;
    }
    unknownKeys(body, LIST_KEYS, say);
    const flag = stringIn(body, 'flag') ?? '';
    if (!AGENT_FLAGS[agent].includes(flag)) {
        say(body.get('flag', true) ?? pair, 'flag', flag);
        return null;
    }
    const cache = stringIn(body, 'cache');
    if (cache !== null && (agent !== 'codex' || flag !== '-m' || !passable(cache))) {
        say(body.get('cache', true), 'value', cache);
    }
    const values: AgentChoice[] = [];
    const rawValues = body.get('values', true);
    if (!isSeq(rawValues)) {
        say(pair, 'shape', `${key}.values`);
        return null;
    }
    for (const item of rawValues.items) {
        const value = readValue(flag, item as Node, values, say);
        if (value !== null) values.push(value);
    }
    const fallback = stringIn(body, 'default');
    if (fallback === null) {
        say(pair, 'no_default', key);
        return null;
    }
    if (!values.some((one) => one.id === fallback)) {
        say(body.get('default', true), 'default_missing', fallback);
        return null;
    }
    const list: AgentChoiceList = {
        key,
        label: stringIn(body, 'label') ?? key,
        flag,
        default: fallback,
        values
    };
    if (cache !== null && agent === 'codex' && flag === '-m' && passable(cache)) {
        list.cache = cache;
    }
    return list;
}

function readValue(flag: string, node: Node, held: AgentChoice[], say: Say): AgentChoice | null {
    if (!isYamlMap(node)) {
        say(node, 'shape', 'value');
        return null;
    }
    unknownKeys(node, VALUE_KEYS, say);
    const id = stringIn(node, 'id');
    const label = stringIn(node, 'label');
    if (id === null || id === '' || label === null || label === '') {
        say(node, 'shape', id ?? '');
        return null;
    }
    if (held.some((one) => one.id === id)) {
        say(node, 'repeated', id);
        return null;
    }
    const confirm = confirmOf(node, say);
    const passNode = node.get('pass', true);
    if (passNode === undefined) return { id, label, pass: null, ...confirm };
    const pass = isScalar(passNode) ? String(passNode.value) : '';
    if (!allowed(flag, pass)) {
        say(passNode, 'value', pass);
        return null;
    }
    return { id, label, pass, ...confirm };
}

/**
 * Whether a start with a value is asked about first: `confirm: true`. An absent key reads as
 * false, and a value that is neither true nor false is a finding on the key that reads as true, so
 * the question is asked rather than lost to a misspelling.
 */
function confirmOf(node: YAMLMap, say: Say): { confirm?: true } {
    const held = node.get('confirm', true);
    if (held === undefined) return {};
    if (isScalar(held) && held.value === false) return {};
    if (!isScalar(held) || held.value !== true) say(held, 'shape', 'confirm');
    return { confirm: true };
}

/**
 * The argv words one agent's picks pass: each picker's flag and value, in the file's order, the
 * picker's default where the pick names none, and nothing for a value that passes nothing. A pick
 * naming a value the picker does not hold is refused rather than dropped, since the reader chose
 * something the start would otherwise quietly not do.
 */
export function choiceArgs(choices: AgentChoices, picks: Record<string, string>): string[] {
    const args: string[] = [];
    for (const list of choices.lists) {
        const id = Object.hasOwn(picks, list.key) ? picks[list.key] : list.default;
        const value = list.values.find((one) => one.id === id);
        if (value === undefined) throw new Error(`${list.key} has no choice ${id}`);
        if (value.pass !== null) args.push(list.flag, value.pass);
    }
    return args;
}

/** A text that carries something besides white space, answered trimmed. */
const trimmedShape = z.string().trim().min(1);

/** The models of a cache file: a list of them, or a map holding the list under `models`. */
const modelsShape = z.union([itemsShape, mapShape.transform((map) => map.models).pipe(itemsShape)]);

/** The first of the named fields that is a non-empty string. */
function firstText(map: Record<string, unknown>, names: string[]): string {
    for (const name of names) {
        const value = trimmedShape.safeParse(map[name]);
        if (value.success) return value.data;
    }
    return '';
}

/**
 * The models a Codex account's models_cache.json lists, as choices passing each model's slug. The
 * file is Codex's own and its shape is read loosely: a list of models, or a map holding one under
 * `models`, each model named by `slug`, `id` or `model` and shown by its display name where it has
 * one. A model whose name could not follow a flag is left out.
 */
export function cacheModels(raw: unknown): AgentChoice[] {
    const found: AgentChoice[] = [];
    for (const item of readOr(modelsShape, raw, [])) {
        const model = readAs(mapShape, item);
        if (model === null) continue;
        const slug = firstText(model, ['slug', 'id', 'model']);
        if (!passable(slug) || found.some((one) => one.id === slug)) continue;
        const label = firstText(model, ['display_name', 'displayName', 'name']) || slug;
        found.push({ id: slug, label, pass: slug });
    }
    return found;
}

/**
 * One agent's choices with its cached models in place of the file's own: the values that pass
 * nothing (the CLI default) are kept in front of them, and the default stays the file's when it is
 * still offered, else the first value. No cached model leaves the file's list as it is.
 */
export function withCacheModels(choices: AgentChoices, models: AgentChoice[]): AgentChoices {
    if (models.length === 0) return choices;
    return {
        ...choices,
        lists: choices.lists.map((list) => {
            if (list.cache === undefined) return list;
            const values = [...list.values.filter((one) => one.pass === null), ...models];
            const kept = values.some((one) => one.id === list.default);
            return { ...list, values, default: kept ? list.default : values[0].id };
        })
    };
}
