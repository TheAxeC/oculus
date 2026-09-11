// Layer 2, route. This indirection keeps the route export declarative while the target stays injectable in tests.
import type { RequestHandler } from './$types';
import { handleHpc, hpcTarget } from '$lib/server/hpc/routes';
export const POST: RequestHandler = ({ request }) => handleHpc(request, hpcTarget());
