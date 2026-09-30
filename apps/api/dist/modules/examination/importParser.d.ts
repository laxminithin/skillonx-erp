export declare function parseExamImport(fileBase64: string, fileName: string): Promise<{
    rows: Record<string, unknown>[];
    fileHash: string;
}>;
