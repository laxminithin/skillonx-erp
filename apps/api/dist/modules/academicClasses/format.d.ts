export declare function romanNumeral(n: number | null | undefined): string;
export declare function semesterTitle(label?: string | null, number?: number | null): string;
export declare function classDisplayName(input: {
    departmentCode?: string | null;
    departmentName?: string | null;
    semesterLabel?: string | null;
    semesterNumber?: number | null;
    sectionLabel?: string | null;
}): string;
export declare function classCode(input: {
    departmentCode?: string | null;
    semesterNumber?: number | null;
    semesterLabel?: string | null;
    sectionLabel?: string | null;
    yearLabel?: string | null;
}): string;
export declare function subjectKindFromCourseType(courseType?: string | null): "CORE" | "ELECTIVE" | "OPEN_ELECTIVE" | "LAB" | "ABILITY_ENHANCEMENT";
export declare function joinClassUrl(publicAppUrl: string, code: string): string;
