import ExcelJS from 'exceljs';
import { getInternalPaper } from './internalService.js';
export declare function exportInternalPaperXlsx(paperId: number, collegeId: number): Promise<ExcelJS.Workbook>;
export declare function buildPrintModel(paperId: number, collegeId: number, variant?: 'PAPER' | 'SCHEME' | 'MAPPING' | 'FACULTY' | 'SOLUTION' | 'PROVENANCE'): Promise<{
    paper: Record<string, unknown> & {
        id: number;
        status: string;
    };
    blueprint: import("./generator.js").Blueprint | null;
    items: Array<Record<string, unknown>>;
    validation: {
        ok: boolean;
        errors: string[];
    };
    paperValidation?: import("./validation.js").PaperValidationReport;
    coverage: ReturnType<typeof import("./generator.js").coverageFromItems>;
    quality: ReturnType<typeof import("../attainment/qualityGate.js").evaluatePaperQuality>;
    portions?: {
        modules: import("./scope.js").PortionModule[];
        coverageWarning: boolean;
        coverageWarningMessage: string | null;
    };
    orBalance?: Array<{
        groupId: string;
        marksBalanced: boolean;
        coCompatible: boolean;
        difficultyCompatible: boolean;
        rbtCompatible: boolean;
        ok: boolean;
    }>;
    sourceSummary?: ReturnType<typeof import("./generator.js").sourceSummaryFromItems>;
    draftSavedAt?: string | null;
    academicProvenance?: Array<{
        questionLabel: string;
        questionSource: string;
        marksSource: string;
        co: string | null;
        poPso: string | null;
        solutionSource: string | null;
        schemeSource: string | null;
        pyqPaperId?: string | null;
        textbookCitation?: string | null;
    }>;
    variant: "FACULTY" | "SCHEME" | "PROVENANCE" | "SOLUTION" | "PAPER" | "MAPPING";
}>;
export declare function filenameForPaper(detail: Awaited<ReturnType<typeof getInternalPaper>>): string;
