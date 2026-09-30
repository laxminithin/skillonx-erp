import { z } from 'zod';
export declare const parentLoginSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const parentForgotSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const parentChangePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>;
export declare const parentProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | null | undefined;
}, {
    name?: string | undefined;
    phone?: string | null | undefined;
}>;
export declare const parentLeaveActionSchema: z.ZodObject<{
    action: z.ZodEnum<["APPROVE", "DECLINE"]>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    action: "APPROVE" | "DECLINE";
    remarks?: string | null | undefined;
}, {
    action: "APPROVE" | "DECLINE";
    remarks?: string | null | undefined;
}>;
export declare const parentLeaveCreateSchema: z.ZodObject<{
    requestTypeCode: z.ZodEnum<["STUDENT_LEAVE_REQUEST", "STUDENT_PERMISSION_REQUEST"]>;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    formData: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    submit: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    requestTypeCode: "STUDENT_LEAVE_REQUEST" | "STUDENT_PERMISSION_REQUEST";
    description?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    submit?: boolean | undefined;
    formData?: Record<string, unknown> | null | undefined;
}, {
    title: string;
    requestTypeCode: "STUDENT_LEAVE_REQUEST" | "STUDENT_PERMISSION_REQUEST";
    description?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    submit?: boolean | undefined;
    formData?: Record<string, unknown> | null | undefined;
}>;
export type ParentActor = {
    parentUserId: number;
    collegeId: number;
    role: 'PARENT';
    email: string;
    name: string;
};
export declare function parentMe(parentUserId: number): Promise<{
    id: number;
    kind: "parent";
    role: string;
    roleLabel: string;
    name: any;
    email: any;
    phone: any;
    collegeId: number;
    collegeName: any;
    collegeCode: any;
    departmentId: null;
    isActive: boolean;
    identityVerified: boolean;
    lastLoginAt: any;
    createdAt: any;
}>;
export declare function loginParent(email: string, password: string): Promise<{
    token: string;
    user: {
        id: number;
        kind: "parent";
        role: string;
        roleLabel: string;
        name: any;
        email: any;
        phone: any;
        collegeId: number;
        collegeName: any;
        collegeCode: any;
        departmentId: null;
        isActive: boolean;
        identityVerified: boolean;
        lastLoginAt: any;
        createdAt: any;
    };
}>;
export declare function forgotParentPassword(email: string): Promise<{
    message: string;
}>;
export declare function changeParentPassword(parentUserId: number, input: {
    currentPassword: string;
    newPassword: string;
}): Promise<{
    message: string;
}>;
export declare function updateParentProfile(parentUserId: number, input: {
    name?: string;
    phone?: string | null;
}): Promise<{
    id: number;
    kind: "parent";
    role: string;
    roleLabel: string;
    name: any;
    email: any;
    phone: any;
    collegeId: number;
    collegeName: any;
    collegeCode: any;
    departmentId: null;
    isActive: boolean;
    identityVerified: boolean;
    lastLoginAt: any;
    createdAt: any;
}>;
export declare function assertParentCanAccessStudent(actor: ParentActor, studentId: number): Promise<any>;
export declare function listLinkedChildren(actor: ParentActor): Promise<{
    id: number;
    name: any;
    usn: any;
    email: any;
    phone: any;
    relationshipType: any;
    isPrimaryGuardian: boolean;
    departmentName: any;
    programName: any;
    semesterLabel: any;
    sectionLabel: any;
    academicYearLabel: any;
}[]>;
export declare function parentDashboard(actor: ParentActor, studentId: number): Promise<{
    student: {
        id: number;
        kind: "student";
        role: string;
        roleLabel: string;
        name: any;
        usn: any;
        email: any;
        phone: any;
        collegeId: number;
        collegeName: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        semesterId: number | null;
        semesterLabel: any;
        semesterNumber: number | null;
        classSectionId: number | null;
        sectionLabel: any;
        schemeId: number | null;
        schemeName: any;
        academicYearId: number | null;
        academicYearLabel: any;
        profileComplete: boolean;
        isActive: boolean;
    };
    children: {
        id: number;
        name: any;
        usn: any;
        email: any;
        phone: any;
        relationshipType: any;
        isPrimaryGuardian: boolean;
        departmentName: any;
        programName: any;
        semesterLabel: any;
        sectionLabel: any;
        academicYearLabel: any;
    }[];
    attention: {
        kind: string;
        severity: string;
        title: string;
        detail?: string;
    }[];
    attendance: {
        policy: import("../attendance/policy.js").AttendancePolicy;
        overall: null;
        subjects: never[];
        standing: {
            label: string;
            tone: "muted";
            code: string;
        } | {
            label: string;
            tone: "success";
            code: string;
        } | {
            label: string;
            tone: "warning";
            code: string;
        } | {
            label: string;
            tone: "danger";
            code: string;
        };
        belowCount?: undefined;
    } | {
        policy: import("../attendance/policy.js").AttendancePolicy;
        overall: number | null;
        standing: {
            label: string;
            tone: "muted";
            code: string;
        } | {
            label: string;
            tone: "success";
            code: string;
        } | {
            label: string;
            tone: "warning";
            code: string;
        } | {
            label: string;
            tone: "danger";
            code: string;
        };
        belowCount: number;
        subjects: {
            PRESENT: number;
            ABSENT: number;
            LATE: number;
            EXCUSED: number;
            total: number;
            courseId: number;
            code: any;
            name: any;
            percentage: number | null;
            standing: {
                label: string;
                tone: "muted";
                code: string;
            } | {
                label: string;
                tone: "success";
                code: string;
            } | {
                label: string;
                tone: "warning";
                code: string;
            } | {
                label: string;
                tone: "danger";
                code: string;
            };
        }[];
    };
    performance: {
        overall: null;
        subjects: unknown[];
    } | {
        overall: {
            progress: number;
            assignments: {
                obtained: number;
                max: number;
                done: number;
                total: number;
            };
            quizzes: {
                obtained: number;
                max: number;
                done: number;
                total: number;
            };
            internals: {
                obtained: number;
                max: number;
                done: number;
                total: number;
            };
            attendance: number | null;
            attendanceStanding: {
                label: string;
                tone: "muted";
                code: string;
            } | {
                label: string;
                tone: "success";
                code: string;
            } | {
                label: string;
                tone: "warning";
                code: string;
            } | {
                label: string;
                tone: "danger";
                code: string;
            } | null;
        };
        subjects: {
            courseId: number;
            name: any;
            code: any;
            facultyName: string | null;
            learningProgress: number;
            assignments: {
                done: number;
                total: number;
                obtained: number;
                max: number;
            };
            quizzes: {
                done: number;
                total: number;
                obtained: number;
                max: number;
            };
            internals: {
                done: number;
                total: number;
                obtained: number;
                max: number;
            };
            attendance: number | null;
            attendanceStanding: {
                label: string;
                tone: "muted";
                code: string;
            } | {
                label: string;
                tone: "success";
                code: string;
            } | {
                label: string;
                tone: "warning";
                code: string;
            } | {
                label: string;
                tone: "danger";
                code: string;
            } | null;
        }[];
    } | null;
    results: never[] | {
        semesterResultId: number;
        examId: number;
        examName: any;
        examType: any;
        semesterId: number;
        semesterLabel: any;
        sgpa: number | null;
        status: any;
        resultVersion: number;
        publishedAt: any;
        subjects: {
            courseId: number;
            courseCode: any;
            courseName: any;
            internalMarks: number | null;
            externalMarks: number | null;
            totalMarks: number | null;
            grade: any;
            gradePoints: number | null;
            credits: number | null;
            resultStatus: any;
        }[];
    }[];
    finance: {
        summary: {
            totalFees: string;
            paid: string;
            outstanding: string;
            nextDueDate: string | null;
            demandCount: number;
        };
        demands: {
            id: number;
            studentId: number | null;
            subjectType: {};
            subjectId: number | null;
            academicYearId: number;
            semesterId: number | null;
            demandNumber: unknown;
            demandType: unknown;
            issueDate: unknown;
            dueDate: unknown;
            grossAmount: string;
            discountAmount: string;
            scholarshipAmount: string;
            adjustmentAmount: string;
            lateFeeAmount: string;
            netAmount: string;
            paidAmount: string;
            outstandingAmount: string;
            status: unknown;
            receiptReference: {} | null;
            items: unknown[];
        }[];
        payments: {
            id: number;
            paymentNumber: unknown;
            studentId: number | null;
            subjectType: {};
            subjectId: number | null;
            studentName: {} | null;
            applicantName: {} | null;
            applicationNumber: {} | null;
            usn: {} | null;
            amount: string;
            paymentDate: unknown;
            paymentMethod: unknown;
            transactionReference: unknown;
            status: unknown;
            chequeStatus: unknown;
            createdAt: unknown;
        }[];
        receipts: {
            id: number;
            receiptNumber: string;
            studentId: number;
            paymentId: number;
            receiptDate: unknown;
            amount: string;
            paymentMethod: unknown;
            transactionReference: unknown;
            outstandingBalance: string;
            status: unknown;
            snapshot: unknown;
            voidedAt: unknown;
            voidReason: unknown;
        }[];
        scholarships: {
            id: number;
            studentId: number;
            studentName: {} | null;
            usn: {} | null;
            schemeId: number;
            schemeName: unknown;
            schemeCode: unknown;
            academicYearId: number;
            expectedAmount: string | null;
            sanctionedAmount: string | null;
            receivedAmount: string;
            status: unknown;
            createdAt: unknown;
        }[];
        refunds: {
            id: number;
            amount: string;
            reasonCode: any;
            status: any;
            createdAt: any;
        }[];
        noDue: {
            domains: {
                domain: string;
                status: import("../finance/types.js").NoDueDomainStatus;
                label: string;
            }[];
            overallClear: boolean;
        };
    } | null;
    hostel: {
        access: {
            visibility: import("../hostel/types.js").HostelVisibility;
            canApply: boolean;
            canAccessResidentFeatures: boolean;
            residentId?: undefined;
            hostelId?: undefined;
            currentAllocationId?: undefined;
            applicationId?: undefined;
        } | {
            visibility: import("../hostel/types.js").HostelVisibility;
            canApply: boolean;
            residentId: number;
            hostelId: number;
            currentAllocationId: number | undefined;
            canAccessResidentFeatures: boolean;
            applicationId?: undefined;
        } | {
            visibility: import("../hostel/types.js").HostelVisibility;
            canApply: boolean;
            applicationId: number;
            canAccessResidentFeatures: boolean;
            residentId?: undefined;
            hostelId?: undefined;
            currentAllocationId?: undefined;
        } | {
            visibility: import("../hostel/types.js").HostelVisibility;
            canApply: boolean;
            applicationId: number;
            residentId: number;
            canAccessResidentFeatures: boolean;
            hostelId?: undefined;
            currentAllocationId?: undefined;
        } | {
            visibility: import("../hostel/types.js").HostelVisibility;
            canApply: boolean;
            residentId: number;
            canAccessResidentFeatures: boolean;
            hostelId?: undefined;
            currentAllocationId?: undefined;
            applicationId?: undefined;
        };
        room: {
            hostelName: any;
            hostelCode: any;
            blockCode: any;
            blockName: any;
            floorNumber: any;
            roomNumber: any;
            roomType: any;
            bedCode: any;
            residentNumber: any;
            admittedAt: any;
            residentStatus: any;
            allocationId: number;
            roommates: {
                name: any;
                usn: any;
                bedCode: any;
            }[];
        } | null;
        dues: {
            totalOutstanding: any;
            items: {
                demandType: any;
                description: any;
                amount: number;
                paid: number;
                outstanding: number;
                status: any;
                demandId: number;
            }[];
        };
    } | null;
    transport: {
        access: {
            visibility: import("../transport/types.js").TransportVisibility;
            canApply: boolean;
            canAccessOperations: boolean;
            transportMemberId?: undefined;
            applicationId?: undefined;
            routeId?: undefined;
            stopId?: undefined;
            transportPassId?: undefined;
        } | {
            visibility: import("../transport/types.js").TransportVisibility;
            canApply: boolean;
            transportMemberId: number;
            applicationId: number | undefined;
            routeId: number | undefined;
            stopId: number | undefined;
            transportPassId: number | undefined;
            canAccessOperations: boolean;
        } | {
            visibility: import("../transport/types.js").TransportVisibility;
            canApply: boolean;
            applicationId: number;
            canAccessOperations: boolean;
            transportMemberId?: undefined;
            routeId?: undefined;
            stopId?: undefined;
            transportPassId?: undefined;
        } | {
            visibility: import("../transport/types.js").TransportVisibility;
            canApply: boolean;
            applicationId: number;
            transportMemberId: number | undefined;
            canAccessOperations: boolean;
            routeId?: undefined;
            stopId?: undefined;
            transportPassId?: undefined;
        } | {
            visibility: import("../transport/types.js").TransportVisibility;
            canApply: boolean;
            transportMemberId: number;
            canAccessOperations: boolean;
            applicationId?: undefined;
            routeId?: undefined;
            stopId?: undefined;
            transportPassId?: undefined;
        };
        assignment: {
            id: number;
            routeId: number;
            routeName: any;
            routeCode: any;
            pickupStop: {
                id: number;
                name: any;
                code: any;
            } | null;
            dropStop: {
                id: number;
                name: any;
                code: any;
            } | null;
            serviceType: any;
            vehicle: {
                id: number;
                vehicleNumber: any;
                capacity: any;
            } | null;
            stops: {
                sequenceNumber: number;
                stopName: any;
                stopCode: any;
                scheduledPickupTime: any;
                scheduledDropTime: any;
            }[];
            startAt: any;
        } | null;
        pass: {
            id: number;
            passNumber: any;
            status: any;
            validFrom: any;
            validUntil: any;
            verificationToken: any;
            student: {
                name: any;
                usn: any;
            };
            route: {
                name: any;
                code: any;
            } | null;
            pickupStop: any;
            dropStop: any;
        } | null;
        dues: {
            totalOutstanding: any;
            items: {
                demandType: any;
                description: any;
                amount: number;
                paid: number;
                outstanding: number;
                status: any;
                demandId: number;
            }[];
        };
    } | null;
    notices: {
        notices: {
            id: number;
            title: any;
            body: any;
            createdAt: any;
            relatedType: any;
        }[];
    } | {
        notices: never[];
    };
    mentoring: {
        interactions: {
            id: number;
            interactionDate: any;
            mode: any;
            initiatedBy: any;
            purpose: any;
            summary: any;
            agreedFollowUp: any;
        }[];
    } | {
        interactions: never[];
    };
}>;
export declare function parentAttendance(actor: ParentActor, studentId: number, courseId?: number): Promise<{
    policy: import("../attendance/policy.js").AttendancePolicy;
    overall: null;
    subjects: never[];
    standing: {
        label: string;
        tone: "muted";
        code: string;
    } | {
        label: string;
        tone: "success";
        code: string;
    } | {
        label: string;
        tone: "warning";
        code: string;
    } | {
        label: string;
        tone: "danger";
        code: string;
    };
    belowCount?: undefined;
} | {
    policy: import("../attendance/policy.js").AttendancePolicy;
    overall: number | null;
    standing: {
        label: string;
        tone: "muted";
        code: string;
    } | {
        label: string;
        tone: "success";
        code: string;
    } | {
        label: string;
        tone: "warning";
        code: string;
    } | {
        label: string;
        tone: "danger";
        code: string;
    };
    belowCount: number;
    subjects: {
        PRESENT: number;
        ABSENT: number;
        LATE: number;
        EXCUSED: number;
        total: number;
        courseId: number;
        code: any;
        name: any;
        percentage: number | null;
        standing: {
            label: string;
            tone: "muted";
            code: string;
        } | {
            label: string;
            tone: "success";
            code: string;
        } | {
            label: string;
            tone: "warning";
            code: string;
        } | {
            label: string;
            tone: "danger";
            code: string;
        };
    }[];
} | {
    history: {
        sessionId: number;
        date: any;
        periodNumber: number | null;
        topicLabel: any;
        status: any;
        remarks: any;
    }[];
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
    total: number;
    historical: boolean;
    course: {
        id: number;
        code: string;
        name: string;
    };
    policy: import("../attendance/policy.js").AttendancePolicy;
    percentage: number | null;
    standing: {
        label: string;
        tone: "muted";
        code: string;
    } | {
        label: string;
        tone: "success";
        code: string;
    } | {
        label: string;
        tone: "warning";
        code: string;
    } | {
        label: string;
        tone: "danger";
        code: string;
    };
}>;
export declare function parentAcademics(actor: ParentActor, studentId: number): Promise<{
    performance: {
        overall: null;
        subjects: unknown[];
    } | {
        overall: {
            progress: number;
            assignments: {
                obtained: number;
                max: number;
                done: number;
                total: number;
            };
            quizzes: {
                obtained: number;
                max: number;
                done: number;
                total: number;
            };
            internals: {
                obtained: number;
                max: number;
                done: number;
                total: number;
            };
            attendance: number | null;
            attendanceStanding: {
                label: string;
                tone: "muted";
                code: string;
            } | {
                label: string;
                tone: "success";
                code: string;
            } | {
                label: string;
                tone: "warning";
                code: string;
            } | {
                label: string;
                tone: "danger";
                code: string;
            } | null;
        };
        subjects: {
            courseId: number;
            name: any;
            code: any;
            facultyName: string | null;
            learningProgress: number;
            assignments: {
                done: number;
                total: number;
                obtained: number;
                max: number;
            };
            quizzes: {
                done: number;
                total: number;
                obtained: number;
                max: number;
            };
            internals: {
                done: number;
                total: number;
                obtained: number;
                max: number;
            };
            attendance: number | null;
            attendanceStanding: {
                label: string;
                tone: "muted";
                code: string;
            } | {
                label: string;
                tone: "success";
                code: string;
            } | {
                label: string;
                tone: "warning";
                code: string;
            } | {
                label: string;
                tone: "danger";
                code: string;
            } | null;
        }[];
    } | null;
    record: {
        semesters: {
            semesterId: number;
            semesterLabel: any;
            semesterNumber: any;
            academicYearLabel: any;
            sgpa: number | null;
            creditsEarned: number | null;
            status: any;
        }[];
        cgpa: number | null;
        totalCreditsEarned: any;
        backlogs: {
            code: any;
            name: any;
            grade: any;
        }[];
    } | null;
}>;
export declare function parentResults(actor: ParentActor, studentId: number): Promise<{
    results: {
        semesterResultId: number;
        examId: number;
        examName: any;
        examType: any;
        semesterId: number;
        semesterLabel: any;
        sgpa: number | null;
        status: any;
        resultVersion: number;
        publishedAt: any;
        subjects: {
            courseId: number;
            courseCode: any;
            courseName: any;
            internalMarks: number | null;
            externalMarks: number | null;
            totalMarks: number | null;
            grade: any;
            gradePoints: number | null;
            credits: number | null;
            resultStatus: any;
        }[];
    }[];
}>;
export declare function parentFinance(actor: ParentActor, studentId: number): Promise<{
    summary: {
        totalFees: string;
        paid: string;
        outstanding: string;
        nextDueDate: string | null;
        demandCount: number;
    };
    demands: {
        id: number;
        studentId: number | null;
        subjectType: {};
        subjectId: number | null;
        academicYearId: number;
        semesterId: number | null;
        demandNumber: unknown;
        demandType: unknown;
        issueDate: unknown;
        dueDate: unknown;
        grossAmount: string;
        discountAmount: string;
        scholarshipAmount: string;
        adjustmentAmount: string;
        lateFeeAmount: string;
        netAmount: string;
        paidAmount: string;
        outstandingAmount: string;
        status: unknown;
        receiptReference: {} | null;
        items: unknown[];
    }[];
    payments: {
        id: number;
        paymentNumber: unknown;
        studentId: number | null;
        subjectType: {};
        subjectId: number | null;
        studentName: {} | null;
        applicantName: {} | null;
        applicationNumber: {} | null;
        usn: {} | null;
        amount: string;
        paymentDate: unknown;
        paymentMethod: unknown;
        transactionReference: unknown;
        status: unknown;
        chequeStatus: unknown;
        createdAt: unknown;
    }[];
    receipts: {
        id: number;
        receiptNumber: string;
        studentId: number;
        paymentId: number;
        receiptDate: unknown;
        amount: string;
        paymentMethod: unknown;
        transactionReference: unknown;
        outstandingBalance: string;
        status: unknown;
        snapshot: unknown;
        voidedAt: unknown;
        voidReason: unknown;
    }[];
    scholarships: {
        id: number;
        studentId: number;
        studentName: {} | null;
        usn: {} | null;
        schemeId: number;
        schemeName: unknown;
        schemeCode: unknown;
        academicYearId: number;
        expectedAmount: string | null;
        sanctionedAmount: string | null;
        receivedAmount: string;
        status: unknown;
        createdAt: unknown;
    }[];
    refunds: {
        id: number;
        amount: string;
        reasonCode: any;
        status: any;
        createdAt: any;
    }[];
    noDue: {
        domains: {
            domain: string;
            status: import("../finance/types.js").NoDueDomainStatus;
            label: string;
        }[];
        overallClear: boolean;
    };
}>;
export declare function parentReceipt(actor: ParentActor, studentId: number, receiptId: number): Promise<{
    items: {
        description: any;
        amount: string;
    }[];
    id: number;
    receiptNumber: string;
    studentId: number;
    paymentId: number;
    receiptDate: unknown;
    amount: string;
    paymentMethod: unknown;
    transactionReference: unknown;
    outstandingBalance: string;
    status: unknown;
    snapshot: unknown;
    voidedAt: unknown;
    voidReason: unknown;
}>;
export declare function parentHostel(actor: ParentActor, studentId: number): Promise<{
    access: {
        visibility: import("../hostel/types.js").HostelVisibility;
        canApply: boolean;
        canAccessResidentFeatures: boolean;
        residentId?: undefined;
        hostelId?: undefined;
        currentAllocationId?: undefined;
        applicationId?: undefined;
    } | {
        visibility: import("../hostel/types.js").HostelVisibility;
        canApply: boolean;
        residentId: number;
        hostelId: number;
        currentAllocationId: number | undefined;
        canAccessResidentFeatures: boolean;
        applicationId?: undefined;
    } | {
        visibility: import("../hostel/types.js").HostelVisibility;
        canApply: boolean;
        applicationId: number;
        canAccessResidentFeatures: boolean;
        residentId?: undefined;
        hostelId?: undefined;
        currentAllocationId?: undefined;
    } | {
        visibility: import("../hostel/types.js").HostelVisibility;
        canApply: boolean;
        applicationId: number;
        residentId: number;
        canAccessResidentFeatures: boolean;
        hostelId?: undefined;
        currentAllocationId?: undefined;
    } | {
        visibility: import("../hostel/types.js").HostelVisibility;
        canApply: boolean;
        residentId: number;
        canAccessResidentFeatures: boolean;
        hostelId?: undefined;
        currentAllocationId?: undefined;
        applicationId?: undefined;
    };
    room: {
        hostelName: any;
        hostelCode: any;
        blockCode: any;
        blockName: any;
        floorNumber: any;
        roomNumber: any;
        roomType: any;
        bedCode: any;
        residentNumber: any;
        admittedAt: any;
        residentStatus: any;
        allocationId: number;
        roommates: {
            name: any;
            usn: any;
            bedCode: any;
        }[];
    } | null;
    dues: {
        totalOutstanding: any;
        items: {
            demandType: any;
            description: any;
            amount: number;
            paid: number;
            outstanding: number;
            status: any;
            demandId: number;
        }[];
    };
}>;
export declare function parentTransport(actor: ParentActor, studentId: number): Promise<{
    access: {
        visibility: import("../transport/types.js").TransportVisibility;
        canApply: boolean;
        canAccessOperations: boolean;
        transportMemberId?: undefined;
        applicationId?: undefined;
        routeId?: undefined;
        stopId?: undefined;
        transportPassId?: undefined;
    } | {
        visibility: import("../transport/types.js").TransportVisibility;
        canApply: boolean;
        transportMemberId: number;
        applicationId: number | undefined;
        routeId: number | undefined;
        stopId: number | undefined;
        transportPassId: number | undefined;
        canAccessOperations: boolean;
    } | {
        visibility: import("../transport/types.js").TransportVisibility;
        canApply: boolean;
        applicationId: number;
        canAccessOperations: boolean;
        transportMemberId?: undefined;
        routeId?: undefined;
        stopId?: undefined;
        transportPassId?: undefined;
    } | {
        visibility: import("../transport/types.js").TransportVisibility;
        canApply: boolean;
        applicationId: number;
        transportMemberId: number | undefined;
        canAccessOperations: boolean;
        routeId?: undefined;
        stopId?: undefined;
        transportPassId?: undefined;
    } | {
        visibility: import("../transport/types.js").TransportVisibility;
        canApply: boolean;
        transportMemberId: number;
        canAccessOperations: boolean;
        applicationId?: undefined;
        routeId?: undefined;
        stopId?: undefined;
        transportPassId?: undefined;
    };
    assignment: {
        id: number;
        routeId: number;
        routeName: any;
        routeCode: any;
        pickupStop: {
            id: number;
            name: any;
            code: any;
        } | null;
        dropStop: {
            id: number;
            name: any;
            code: any;
        } | null;
        serviceType: any;
        vehicle: {
            id: number;
            vehicleNumber: any;
            capacity: any;
        } | null;
        stops: {
            sequenceNumber: number;
            stopName: any;
            stopCode: any;
            scheduledPickupTime: any;
            scheduledDropTime: any;
        }[];
        startAt: any;
    } | null;
    pass: {
        id: number;
        passNumber: any;
        status: any;
        validFrom: any;
        validUntil: any;
        verificationToken: any;
        student: {
            name: any;
            usn: any;
        };
        route: {
            name: any;
            code: any;
        } | null;
        pickupStop: any;
        dropStop: any;
    } | null;
    dues: {
        totalOutstanding: any;
        items: {
            demandType: any;
            description: any;
            amount: number;
            paid: number;
            outstanding: number;
            status: any;
            demandId: number;
        }[];
    };
}>;
export declare function parentNotices(actor: ParentActor, studentId: number): Promise<{
    notices: {
        id: number;
        title: any;
        body: any;
        createdAt: any;
        relatedType: any;
    }[];
}>;
export declare function parentMentoring(actor: ParentActor, studentId: number): Promise<{
    interactions: {
        id: number;
        interactionDate: any;
        mode: any;
        initiatedBy: any;
        purpose: any;
        summary: any;
        agreedFollowUp: any;
    }[];
}>;
export declare function parentLeaveRequests(actor: ParentActor, studentId: number, status?: string): Promise<{
    requests: {
        id: number;
        requestNumber: string | null;
        requestTypeCode: {} | null;
        requestTypeLabel: {} | null;
        title: unknown;
        description: unknown;
        status: unknown;
        priority: unknown;
        currentStage: unknown;
        currentStepOrder: number | null;
        requesterType: {};
        requesterParentUserId: number | null;
        parentActionState: {} | null;
        hostelCorrelationId: {} | null;
        formData: {};
        submittedAt: unknown;
        completedAt: unknown;
        cancelledAt: unknown;
        createdAt: unknown;
        updatedAt: unknown;
    }[];
}>;
export declare function parentLeaveRequestDetail(actor: ParentActor, requestId: number): Promise<{
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function parentSubmitLeaveForChild(actor: ParentActor, studentId: number, input: z.infer<typeof parentLeaveCreateSchema>): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
} | {
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function parentSubmitLeaveDraft(actor: ParentActor, requestId: number): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
} | {
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function parentActOnLeaveRequest(actor: ParentActor, requestId: number, input: z.infer<typeof parentLeaveActionSchema>): Promise<{
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
