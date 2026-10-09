// Layer 2, server (the desktop host). The app's entry, `main` of package.json: it starts the app
// with the shipped default port. Electron runs it unbuilt, as Node runs the server. The app is
// started from `app.whenReady().then` inside startApp and never awaited here, since a top-level
// await on ready never returns in an ES module main.
//
// It imports nothing that loads a package before the installed packages are checked, because an ES
// module resolves every import before it runs and a missing package would end in Node's own error
// with no window. When the packages are not as package-lock.json says, one dialog names the fix and
// the app exits with status 1. Its sentence and its button are literals, as the first-run check's
// are, since the text catalog is read through a package. The Node version is not checked here: the
// app runs on Electron's own Node, which `nvm install 24` does not change. The config reader and
// the app load with `import()` after the check passes.

import { app } from 'electron';
import { engineDir } from '../lib/data/places/engine-dir.ts';
import { packageLacks } from '../lib/server/root/process/start/first-run.ts';
import { say } from './dialogs.ts';
import { dropClosed } from './output.ts';

const lacks = packageLacks(engineDir());
if (lacks.length > 0) {
    const sentences = lacks.map((lack) => lack.sentence).join('\n');
    void app.whenReady().then(async () => {
        await say({ message: `oculus did not start: ${sentences}`, buttons: ['Quit'] }, (line) =>
            dropClosed(() => console.error(line))
        );
        app.exit(1);
    });
} else {
    const { DEFAULT_PORT } = await import('../lib/data/sources/config.ts');
    const { startApp } = await import('./app.ts');
    startApp({ defaultPort: DEFAULT_PORT });
}
