// Layer 2, server (the desktop host). The app's entry, `main` of package.json: it starts the app
// with the shipped default port. Electron runs it unbuilt, as Node runs the server. The app is
// started from `app.whenReady().then` inside startApp and never awaited here, since a top-level
// await on ready never returns in an ES module main.

import { DEFAULT_PORT } from '../lib/data/sources/config.ts';
import { startApp } from './app.ts';

startApp({ defaultPort: DEFAULT_PORT });
