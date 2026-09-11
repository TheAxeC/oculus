// Layer 2, server. The injected ssh runner for Live HPC. Its small result shape makes every caller testable without opening a connection.
import { spawn } from 'node:child_process';

export type RunResult = { stdout: string; stderr: string; code: number };
export type Runner = (host: string, remote: string, timeoutMs: number) => Promise<RunResult>;

export function run(host: string, remote: string, timeoutMs: number): Promise<RunResult> {
    return new Promise((resolve, reject) => {
        const child = spawn('ssh', ['-o', 'ConnectTimeout=8', '-o', 'BatchMode=yes', host, remote]);
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (part) => (stdout += String(part)));
        child.stderr.on('data', (part) => (stderr += String(part)));
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error('timeout'));
        }, timeoutMs);
        child.on('error', (error) => {
            clearTimeout(timer);
            reject(error);
        });
        child.on('close', (code) => {
            clearTimeout(timer);
            resolve({ stdout, stderr, code: code ?? 1 });
        });
    });
}
