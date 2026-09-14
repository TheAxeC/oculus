// Layer 2, client state. Derived Live HPC queue counts and pill words read the single socket entity shared by the Focus view and rail.
import { hpc } from './entities.svelte.ts';
import { t } from './text.ts';
export function queue() {
    return hpc();
}
export function counts(): { running: number; pending: number } {
    const value = hpc();
    return value?.status === 'ok'
        ? { running: value.running, pending: value.pending }
        : { running: 0, pending: 0 };
}
export function pillText(): string {
    const value = hpc();
    return value?.status === 'ok' && value.total > 0
        ? t('hpc.pill_running', value.running, value.running === 1 ? '' : 's') +
              (value.pending ? t('hpc.pill_pending', value.pending) : '')
        : '';
}
export function badgeText(): string {
    const value = hpc();
    return value?.status === 'ok' && value.total > 0 ? `${value.running} ${value.pending}` : '';
}
