import type { SourceFileRecord } from './types.js';
export declare function defaultQpRoot(): string;
export declare function defaultMasterPath(): string;
export declare function discoverSourceFiles(root?: string): Promise<SourceFileRecord[]>;
export declare function publicUrlForSource(relativePath: string): string;
