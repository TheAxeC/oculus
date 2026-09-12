// Layer 2, server route. The whole-file source endpoint only joins Kit's request and token to the server module
// because route modules may export only HTTP verbs.

import { handleSource } from '$lib/server/source';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => handleSource(request, locals.token);
