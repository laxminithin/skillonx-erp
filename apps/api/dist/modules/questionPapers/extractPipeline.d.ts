import { type MasterPayload } from './workbook.js';
import type { ExtractedPaper, ReviewItem, SourceFileRecord } from './types.js';
export type CourseContext = {
    courseId: number | null;
    courseCode: string;
    subjectName: string;
    modules: Array<{
        id: number | null;
        name: string;
        code?: string | null;
        description?: string | null;
    }>;
    outcomes: Array<{
        id: number;
        coCode: string;
        statement: string;
    }>;
    coBlocked: boolean;
};
export type Enricher = (courseCode: string | null, subjectName: string | null) => CourseContext | null;
export declare function extractAllPapers(root?: string): Promise<{
    papers: ExtractedPaper[];
    sources: SourceFileRecord[];
    reviews: ReviewItem[];
}>;
/**
 * Overlapping department PDFs often contain the same VTU paper.
 * Keep one canonical record per exam sitting (paper_id), preferring the richer extraction.
 * All original files remain in the source register.
 */
export declare function collapseDuplicatePapers(papers: ExtractedPaper[]): ExtractedPaper[];
export declare function buildMasterPayload(extracted: {
    papers: ExtractedPaper[];
    sources: SourceFileRecord[];
    reviews: ReviewItem[];
}, enricher?: Enricher): MasterPayload;
export declare function writeMasterWorkbook(payload: MasterPayload, dest?: string): Promise<string>;
export declare function normalizeFp(text: string): string;
