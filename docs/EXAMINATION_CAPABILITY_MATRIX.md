# Examination Capability Matrix

Machine-readable source: `apps/api/src/modules/examination/capabilities.ts`

| Capability | Existing Status | Final Status | Common/VTU/Autonomous | VTU Ownership | Autonomous Ownership | Source Of Truth | API | UI | Tests | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| CIE_MANAGEMENT | PARTIAL | PARTIAL | COMMON | INSTITUTIONAL | INSTITUTIONAL | Institution | Existing | Existing | Existing exam E2E | Internal marks integration |
| EXAM_ELIGIBILITY | EXISTS_NEEDS_ENHANCEMENT | EXISTS_NEEDS_ENHANCEMENT | COMMON | INSTITUTIONAL | INSTITUTIONAL | SkillonX + Attendance/CIE/Finance | Existing | Existing | Existing exam E2E | `computeEligibility` |
| EXAM_REGISTRATION | PARTIAL | PARTIAL | COMMON | SHARED | INSTITUTIONAL | VTU ref / SkillonX | Partial | Partial | Not complete | Blocker |
| SEE_TIMETABLE | EXISTS_NEEDS_ENHANCEMENT | EXISTS_NEEDS_ENHANCEMENT | COMMON | UNIVERSITY | INSTITUTIONAL | VTU / SkillonX | Capability guard added | Existing status UI | Governance tests | VTU institutional scheduling blocked |
| HALL_TICKET | EXISTS_NEEDS_ENHANCEMENT | EXISTS_NEEDS_ENHANCEMENT | COMMON | UNIVERSITY | INSTITUTIONAL | VTU / SkillonX | Authority metadata added | Existing student view | Existing exam E2E | VTU disclaimer metadata |
| CENTRE_MANAGEMENT | PARTIAL | PARTIAL | COMMON | SHARED | INSTITUTIONAL | Institution | Partial | Partial | Existing exam E2E | Rooms/seating only |
| SEATING | EXISTS_NEEDS_ENHANCEMENT | EXISTS_NEEDS_ENHANCEMENT | COMMON | INSTITUTIONAL | INSTITUTIONAL | SkillonX | Existing | Existing | Existing exam E2E | Capacity + lock |
| INVIGILATION | EXISTS_NEEDS_ENHANCEMENT | EXISTS_NEEDS_ENHANCEMENT | COMMON | INSTITUTIONAL | INSTITUTIONAL | SkillonX | Expanded roles | Existing | Existing exam E2E | Conflict check |
| QUESTION_PAPER_SETTING | PARTIAL | PARTIAL | AUTONOMOUS | UNIVERSITY | INSTITUTIONAL | VTU / SkillonX | Metadata only in COE | Metadata UI | QP access tests | COE cannot read contents |
| QUESTION_PAPER_CUSTODY | MISSING | PARTIAL | COMMON | SHARED | INSTITUTIONAL | VTU/local custody | Readiness metadata | Existing | QP access tests | No custody ledger |
| FORM_A | MISSING | MISSING | COMMON | SHARED | INSTITUTIONAL | VTU/SkillonX | Missing | Missing | Missing | Blocker |
| MALPRACTICE | PARTIAL | PARTIAL | COMMON | SHARED | INSTITUTIONAL | Institution/statutory | Mark status only | Partial | Not complete | Case engine missing |
| ANSWER_BOOK_INVENTORY | MISSING | MISSING | COMMON | SHARED | INSTITUTIONAL | Institution | Missing | Missing | Missing | Blocker |
| SCRIPT_CUSTODY | MISSING | MISSING | COMMON | SHARED | INSTITUTIONAL | Institution/VTU handover | Missing | Missing | Missing | Blocker |
| PRACTICAL_EXAM | PARTIAL | PARTIAL | COMMON | SHARED | INSTITUTIONAL | Institution | Partial | Partial | Not complete | Examiner workflow missing |
| MARKS_ENTRY | EXISTS_NEEDS_ENHANCEMENT | EXISTS_NEEDS_ENHANCEMENT | COMMON | SHARED | INSTITUTIONAL | SkillonX/local + imports | Existing | Existing | Existing exam E2E | Lock/unlock/import |
| VALUATION | MISSING | MISSING | AUTONOMOUS | UNIVERSITY | INSTITUTIONAL | VTU / SkillonX | Guarded by registry | Not exposed as complete | Missing | Blocker |
| RESULT_PROCESSING | EXISTS_NEEDS_ENHANCEMENT | EXISTS_NEEDS_ENHANCEMENT | AUTONOMOUS | UNIVERSITY | INSTITUTIONAL | VTU / SkillonX | Capability guard added | Existing status UI | Governance + exam E2E | VTU processing blocked |
| REVALUATION | PARTIAL | PARTIAL | COMMON | UNIVERSITY | INSTITUTIONAL | VTU / SkillonX | Existing request | Existing status | Existing limited | Recalc missing |
| GRADE_CARD | MISSING | MISSING | AUTONOMOUS | UNIVERSITY | INSTITUTIONAL | VTU / SkillonX | Missing | Missing | Missing | Blocker |
| REMUNERATION | MISSING | MISSING | COMMON | SHARED | INSTITUTIONAL | Finance/HR | Missing | Missing | Missing | Blocker |
| REPORTS | PARTIAL | PARTIAL | COMMON | SHARED | INSTITUTIONAL | Permission-aware aggregates | Partial | Existing status UI | Partial | Statutory exports missing |

