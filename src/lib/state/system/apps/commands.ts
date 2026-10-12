// Layer 2, client state. How an app runs a command of its root: the command is looked up in the
// root's `.oculus/commands.yml` (the hub's for a machine app) and run as a press of it runs, so the
// reader is asked to approve a chain that is not approved yet and sees the terminal it runs in.
//
// A command saved through the form, and a command found in a build file, are not named here: only
// the commands file's own commands are reachable, so an app can ask for nothing the reader has not
// written into that file. The call settles when the press ends: `ok` once the terminal is made,
// `declined` when the reader answered no, `failed` when the run was refused, `missing` when the
// root is not shown or the file holds no command of the name.

import type { CommandOutcome } from './frame/methods.ts';

/**
 * What running an app's command needs of the commands store and the served roots. The store sits
 * above this folder in the import order, so its three members are described by the parts of them
 * this module reads, and the composition root passes the store itself.
 */
export type AppCommandsDeps = {
    commands: {
        load: (repo: string) => Promise<{ commands: { name: string; source: string }[] }>;
        press: (repo: string, name: string, source: 'file') => Promise<boolean>;
        afterPress: (
            listener: (end: { repo: string; name: string; outcome: { kind: string } }) => void
        ) => () => void;
    };
    served: () => { key: string; dir: string }[];
    /**
     * The name of the open workspace's primary hub, whose machine apps have no root of their own.
     */
    primary: () => string | null;
};

/** The runner of an app's commands, called with the app's root key (empty for a machine app). */
export function appCommands(deps: AppCommandsDeps): {
    run: (root: string, name: string) => Promise<CommandOutcome>;
} {
    return {
        async run(root, name) {
            const key = root === '' ? deps.primary() : root;
            const repo = deps.served().find((one) => one.key === key)?.dir;
            if (repo === undefined) return 'missing';
            const listed = await deps.commands.load(repo);
            if (!listed.commands.some((one) => one.name === name && one.source === 'file')) {
                return 'missing';
            }
            return new Promise<CommandOutcome>((settle) => {
                const off = deps.commands.afterPress((end) => {
                    if (end.repo !== repo || end.name !== name) return;
                    off();
                    if (end.outcome.kind === 'started') settle('ok');
                    else settle(end.outcome.kind === 'dropped' ? 'declined' : 'failed');
                });
                void deps.commands.press(repo, name, 'file');
            });
        }
    };
}
