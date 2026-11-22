// Layer 2, server. The thread of the sessions scan, which root/watch/sessions.ts holds (held.ts).
// One scan lists every account's stores, runs `ps` and waits for it, parses and writes a cache file
// of megabytes and groups what it read, which would keep the server's one thread from every request
// and every key typed for as long as it takes. It sits beside the held worker's two ends because
// server/sessions, whose scan it runs, may not import them.

import { createScanner } from '../../sessions/stores/changes.ts';
import { serve } from './serve.ts';

serve(createScanner());
