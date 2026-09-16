// Layer 1, data. Which program a file is handed to on this machine, told from its name and the
// `open.program_ext` map of config/behavior.yml, which names one application by its bundle id for
// each extension that may open.
//
// One rule, imported by both layers: the open endpoint hands a file only to the application its
// extension names, and the cards, the file view and the source tab offer "Open in its program" only
// for a name with such an entry. The name is all the page can see, so what the name cannot tell (an
// execute bit, a Finder alias, a file that cannot be read) is refused by the server when the control
// is pressed rather than hidden beforehand. Naming the program per extension, rather than leaving it
// to the machine's default for the type, is what keeps a per-file Open With choice or a changed
// default from handing a document to a program that runs it.
//
// The page reads the map out of the configuration it was sent, which is empty until the config
// channel's first message lands, so no control is drawn before then; the server reads the map from
// the configuration on disk at every request, so an edit reaches both.

import { fields } from './guards.ts';

/** An extension with its dot, lowercased, to the bundle id of the application that opens it. */
export type ProgramApps = Record<string, string>;

/** What an extension key of the map looks like: a dot and one segment with no dot, slash or space. */
const EXTENSION = /^\.[^./\s]+$/;

/** What a bundle id looks like: two or more dot-separated segments of letters, digits and dashes. */
const BUNDLE_ID = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

/** The extension of the last segment of a path, lowercased and with its dot, or the empty string. */
function extension(name: string): string {
    const base =
        name
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? name;
    const at = base.lastIndexOf('.');
    return at <= 0 ? '' : base.slice(at).toLowerCase();
}

/** Whether a string has the shape of an application's bundle id. */
export function isBundleId(value: string): boolean {
    return BUNDLE_ID.test(value);
}

/**
 * The map `open.program_ext` holds, its extensions lowercased, and null for a configuration carrying
 * no usable map: a missing block, a value that is not a map, a key that is not an extension with its
 * dot, or a value that is not a bundle id.
 */
export function programApps(config: Record<string, unknown>): ProgramApps | null {
    const held = fields(config.open).program_ext;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return null;
    const apps: ProgramApps = {};
    for (const [key, value] of Object.entries(held as Record<string, unknown>)) {
        if (!EXTENSION.test(key) || typeof value !== 'string' || !isBundleId(value)) return null;
        apps[key.toLowerCase()] = value;
    }
    return apps;
}

/** The bundle id of the application a file of this name opens in, or null when none is named. */
export function programFor(name: string, apps: ProgramApps): string | null {
    const suffix = extension(name);
    if (suffix === '' || !Object.hasOwn(apps, suffix)) return null;
    return apps[suffix];
}

/** Whether a file of this name has an application to open in. */
export function opensInProgram(name: string, apps: ProgramApps): boolean {
    return programFor(name, apps) !== null;
}
