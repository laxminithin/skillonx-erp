import { z } from 'zod';
import type { ExamActor } from './access.js';
export declare const roomAllocationSchema: z.ZodObject<{
    roomId: z.ZodNumber;
    capacity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    roomId: number;
    capacity: number;
}, {
    roomId: number;
    capacity: number;
}>;
export declare function allocateRooms(actor: ExamActor, examSubjectId: number, allocations: z.infer<typeof roomAllocationSchema>[]): Promise<{
    id: number;
    examSubjectId: number;
    roomId: number;
    roomName: any;
    roomCode: any;
    capacity: number;
    assignedCount: number;
}[]>;
export declare function listRoomAllocations(actor: ExamActor, examSubjectId: number): Promise<{
    id: number;
    examSubjectId: number;
    roomId: number;
    roomName: any;
    roomCode: any;
    capacity: number;
    assignedCount: number;
}[]>;
export declare function generateSeats(actor: ExamActor, examSubjectId: number): Promise<{
    id: number;
    examSubjectId: number;
    studentId: number;
    studentName: any;
    usn: any;
    roomId: number;
    roomName: any;
    roomCode: any;
    seatNumber: any;
}[]>;
export declare function lockSeats(actor: ExamActor, examSubjectId: number): Promise<{
    locked: boolean;
}>;
export declare function listSeats(actor: ExamActor, examSubjectId: number): Promise<{
    id: number;
    examSubjectId: number;
    studentId: number;
    studentName: any;
    usn: any;
    roomId: number;
    roomName: any;
    roomCode: any;
    seatNumber: any;
}[]>;
export declare function seatingPlan(actor: ExamActor, examSubjectId: number, view?: 'room' | 'class'): Promise<{
    view: "room";
    rooms: {
        room: string;
        seats: {
            id: number;
            examSubjectId: number;
            studentId: number;
            studentName: any;
            usn: any;
            roomId: number;
            roomName: any;
            roomCode: any;
            seatNumber: any;
        }[];
    }[];
    seats?: undefined;
} | {
    view: "class";
    seats: {
        id: number;
        examSubjectId: number;
        studentId: number;
        studentName: any;
        usn: any;
        roomId: number;
        roomName: any;
        roomCode: any;
        seatNumber: any;
    }[];
    rooms?: undefined;
}>;
