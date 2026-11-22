// Layer 2, server. The thread of the usage fold, which watch.ts holds (threads/held.ts). A first
// fold reads every transcript of the week, gigabytes of them, and each one after it lists the
// stores and reads what was appended, which would take the server's one thread for seconds at a
// time; the sessions scan has a thread of its own, so a long read holds neither. The thread keeps
// the fold's state, so a thread started after one that died reads the week once more.

import { serve } from '../threads/serve.ts';
import { UsageTranscriptFold, type FoldAsk, type UsageFold } from './transcripts.ts';

/** The fold of this thread, over one state. */
function createFold(): (ask: FoldAsk, ended: AbortSignal) => Promise<UsageFold> {
    const fold = new UsageTranscriptFold();
    return ({ accounts, now }, ended) => fold.fold(accounts, now, ended);
}

serve(createFold());
