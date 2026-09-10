// Layer 1, data. Resolves the machine-local values and the text catalog from files on disk.
// Server side only: it reads the filesystem and no client module may import it.
// No environment variable is consulted anywhere; a caller passes the engine directory, and
// engineDir() derives it from this module's own location so dev and the built server agree.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export type LocalConfig = {
  /** Absolute path of the research hub whose YAML the portfolio is built from. */
  hub: string;
  /** Port the oculus server listens on, bound to 127.0.0.1. */
  port: number;
};

/** 8787 belongs to the cockpit and is never used. */
export const DEFAULT_PORT = 8790;

const LOCAL_KEYS = ['hub', 'port'];

/**
 * Walk up from a starting file until a directory holds both package.json and config/.
 * In development that lands on tools/oculus from src/lib/data/sources; in the adapter-node
 * build it lands on the same directory from build/server/chunks.
 */
export function engineDir(from: string = fileURLToPath(import.meta.url)): string {
  let dir = dirname(from);
  for (;;) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'config'))) return dir;
    const up = dirname(dir);
    if (up === dir) throw new Error(`no oculus engine directory above ${from}`);
    dir = up;
  }
}

/** The defaults: the hub is two directories above tools/oculus, the port is 8790. */
export function localDefaults(engine: string): LocalConfig {
  return { hub: resolve(engine, '..', '..'), port: DEFAULT_PORT };
}

/**
 * Read <engine>/local.yml. A missing file means the defaults. An unknown key is reported
 * once on stderr and ignored. A key of the wrong type is an error naming the file and the key.
 */
export function loadLocal(engine: string): LocalConfig {
  const file = join(engine, 'local.yml');
  const config = localDefaults(engine);
  if (!existsSync(file)) return config;

  const raw: unknown = parse(readFileSync(file, 'utf8')) ?? {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${file}: expected a map of keys`);
  }
  const record = raw as Record<string, unknown>;

  const unknown = Object.keys(record).filter((key) => !LOCAL_KEYS.includes(key));
  if (unknown.length > 0) {
    console.warn(`${file}: ignoring unknown key(s) ${unknown.join(', ')}`);
  }

  if (record.hub !== undefined) {
    if (typeof record.hub !== 'string' || record.hub.length === 0) {
      throw new Error(`${file}: hub must be a path`);
    }
    config.hub = isAbsolute(record.hub) ? record.hub : resolve(engine, record.hub);
  }
  if (record.port !== undefined) {
    if (!Number.isInteger(record.port)) throw new Error(`${file}: port must be an integer`);
    config.port = record.port as number;
  }
  return config;
}

/** Flatten a nested map of strings to dotted keys. Values are strings; anything else is an error. */
export function flattenText(node: unknown, prefix = ''): Record<string, string> {
  const flat: Record<string, string> = {};
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    throw new Error(`text catalog: ${prefix || 'root'} is not a map`);
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const dotted = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') flat[dotted] = value;
    else if (typeof value === 'number' || typeof value === 'boolean') flat[dotted] = String(value);
    else Object.assign(flat, flattenText(value, dotted));
  }
  return flat;
}

/**
 * Read config/text.yml as a flat catalog. Called per request until O6's watcher keeps an
 * in-memory copy and pushes it, so editing the file and reloading the browser shows the change.
 */
export function loadTextCatalog(engine: string): Record<string, string> {
  const file = join(engine, 'config', 'text.yml');
  return flattenText(parse(readFileSync(file, 'utf8')) ?? {});
}
