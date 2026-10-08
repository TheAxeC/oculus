// The process oculus holds for one repository's ESLint. It is plain JavaScript that node runs
// directly, since it must start the same way from `vite dev`, from the built server and from the
// desktop app, and it imports the ESLint package that Node resolves from the repository's own
// folder, never oculus's.
//
// Arguments: the folder of the repository's `eslint.config.*` and that file's path. Standard input
// carries one JSON request a line, `{ id, file }`, and standard output one JSON answer a line:
// `{ id, messages, docs }` (the file's messages, and the documentation URL of each rule they name)
// or `{ id, error }`. The requests are answered one at a time, in order. The process ends when its
// standard input closes.
//
// Whatever a plugin writes to standard output goes to standard error instead, so an answer is the
// only thing on standard output. The ESLint instance is held in the scope of `start`, and the
// process uses the one configuration file it was given, so a nested configuration that was never
// approved is not read.

import { createRequire } from 'node:module';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

const [folder, configFile] = process.argv.slice(2);

const answer = process.stdout.write.bind(process.stdout);
process.stdout.write = (...parts) => process.stderr.write(...parts);

/** The messages and rule documentation of one file for `eslint`. */
async function lintOne(eslint, file) {
    if (await eslint.isPathIgnored(file)) return { messages: [], docs: {} };
    const [result] = await eslint.lintFiles([file]);
    if (result === undefined) return { messages: [], docs: {} };
    const docs = {};
    try {
        const meta = eslint.getRulesMetaForResults([result]);
        for (const [rule, one] of Object.entries(meta)) {
            const url = one?.docs?.url;
            if (typeof url === 'string') docs[rule] = url;
        }
    } catch {
        // A rule whose metadata cannot be read has no documentation link.
    }
    return { messages: result.messages, docs };
}

/** Load the repository's ESLint and answer the requests of standard input. */
async function start() {
    const resolved = createRequire(`${folder}/`).resolve('eslint');
    const { ESLint } = await import(pathToFileURL(resolved).href);
    const eslint = new ESLint({
        cwd: folder,
        overrideConfigFile: configFile,
        warnIgnored: false,
        errorOnUnmatchedPattern: false
    });
    let queue = Promise.resolve();
    const lines = createInterface({ input: process.stdin });
    lines.on('line', (line) => {
        queue = queue.then(async () => {
            let id = null;
            try {
                const request = JSON.parse(line);
                id = request.id;
                answer(`${JSON.stringify({ id, ...(await lintOne(eslint, request.file)) })}\n`);
            } catch (error) {
                const text = error instanceof Error ? error.message : String(error);
                answer(`${JSON.stringify({ id, error: text.split('\n')[0] })}\n`);
            }
        });
    });
    lines.on('close', () => {
        void queue.then(() => process.exit(0));
    });
}

start().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
});
