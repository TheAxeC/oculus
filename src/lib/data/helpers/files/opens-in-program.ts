// Layer 1, data. Which program a file is handed to on this machine, told from its name and the
// `open.program_ext` map of config/behavior.yml, which names one application by its bundle id for
// each extension that may open.
//
// One rule, imported by both layers: the open endpoint hands a file only to the application its
// extension names (on Linux, to the desktop's program for a listed extension), and the cards, the
// file view and the source tab offer "Open in its program" only for a name with such an entry. The
// name is all the page can see, so what the name cannot tell (an execute bit, a Finder alias, a
// file that cannot be read) is refused by the server when the control is pressed rather than
// hidden beforehand. Naming the program per extension, rather than leaving it to the machine's
// default for the type, is what keeps a per-file Open With choice or a changed default from
// handing a document to a program that runs it.
//
// The map is read out of the configuration by `programApps` of data/sources/config/settings.ts, the
// reader the page and the server both use, so an extension the cards offer is one the open endpoint
// takes. The page reads it out of the configuration it was sent, which is empty until the config
// channel's first message lands, so no control is drawn before then; the server reads the map from
// the configuration on disk at every request, so an edit reaches both.

/** An extension with its dot, lowercased, to the bundle id of the application that opens it. */
export type ProgramApps = Record<string, string>;

/**
 * The extension of the last segment of a path, lowercased and with its dot, or the empty string for
 * a name with none.
 */
export function extensionOf(name: string): string {
    const base =
        name
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? name;
    const at = base.lastIndexOf('.');
    return at <= 0 ? '' : base.slice(at).toLowerCase();
}

/** The bundle id of the application a file of this name opens in, or null when none is named. */
export function programFor(name: string, apps: ProgramApps): string | null {
    const suffix = extensionOf(name);
    if (suffix === '' || !Object.hasOwn(apps, suffix)) return null;
    return apps[suffix];
}

/** Whether a file of this name has an application to open in. */
export function opensInProgram(name: string, apps: ProgramApps): boolean {
    return programFor(name, apps) !== null;
}
