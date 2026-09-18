import { type BloomLevel, type Difficulty, type ExamType, type ExtractedPage, type ExtractedPaper, type IndexRow, type PageLine, type PaperMetadata, type ParsedQuestion, type ParsedSubquestion, type ReviewItem, type PrintedAcademicTags } from './types.js';
export declare function parseIndex(pages: ExtractedPage[]): IndexRow[];
export declare function isCoverOrIndexPage(text: string): boolean;
export declare function looksLikePaperStart(text: string): boolean;
export declare function detectExamType(text: string, fileName: string): ExamType;
export declare function parseSemester(text: string): string | null;
export declare function parseProgramFromHeader(text: string, folder: string): string | null;
export declare function parseScheme(text: string, fileName: string): string | null;
export declare function extractHeaderCourseCode(text: string): string | null;
/**
 * Read the subject code from the reconstructed header lines. The code is printed as the
 * top-right header cell (x on the right margin) or immediately after the "USN" cell — a
 * placement that flattening the text stream does not preserve reliably. Falls back to null.
 */
export declare function extractHeaderCourseCodeFromLines(lines: PageLine[] | undefined): string | null;
/** Subject title is the centered line between the "Degree Examination" line and "Time:". */
export declare function extractSubjectNameFromLines(lines: PageLine[] | undefined): string | null;
export declare function extractSubjectName(text: string): string | null;
export declare function inferBloom(text: string): BloomLevel | null;
export declare function difficultyFromBloom(bloom: BloomLevel | null): Difficulty | null;
export declare function parseMarksToken(raw: string): number | null;
/** Extract CO/PO/PSO/RBT/marks as printed on the PYQ. Does not infer or rewrite. */
export declare function extractPrintedAcademicTags(text: string): PrintedAcademicTags;
export declare function parseSubquestions(block: string, sourcePage: number | null): ParsedSubquestion[];
export declare function parseQuestionsFromPaperLines(pages: ExtractedPage[]): ParsedQuestion[];
export declare function parseQuestionsFromPaperText(text: string, startPage?: number): ParsedQuestion[];
export declare function parseMcqPaper(text: string, startPage?: number): ParsedQuestion[];
export declare function buildPaperId(meta: {
    courseCode: string | null;
    examYear: number | null;
    examMonth: string | null;
    examType: ExamType;
}): string;
export declare function parsePaperMetadata(opts: {
    text: string;
    sourceFile: string;
    fileName: string;
    folder: string;
    startPage: number;
    endPage: number;
    indexRow?: IndexRow | null;
    headerLines?: PageLine[];
}): PaperMetadata;
/**
 * Read the per-paper "N of K" page counter printed in VTU footers/headers. Lets QA decide
 * whether a short paper is a genuine source truncation (fewer pages than K) or a parser
 * defect (all K pages present but questions still missing).
 */
export declare function readPaperPageSpan(pages: ExtractedPage[]): {
    firstN: number | null;
    totalK: number | null;
    pagesSeen: number;
};
export declare function splitMergedDocument(pages: ExtractedPage[], sourceFile: string, folder: string): {
    papers: ExtractedPaper[];
    index: IndexRow[];
    reviewItems: ReviewItem[];
};
