// The document endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/docs.ts and this is the one line that joins them. The hub it reads is the one every
// write lands in, which is why the target comes from lib/server/writes.ts rather than a second
// reader of local.yml.

import { handleDocs } from '$lib/server/docs';
import { target } from '$lib/server/writes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleDocs(request, target());
