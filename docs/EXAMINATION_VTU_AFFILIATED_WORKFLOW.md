# Examination VTU-Affiliated Workflow

Configured by `college_examination_governance.governance_type = VTU_AFFILIATED`.

VTU-owned workflows must remain reference/import/reconciliation workflows in SkillonX. SkillonX must not generate fake official VTU hall tickets, process official SEE results, or bypass official question-paper delivery.

Supported now:

- Local exam/centre planning records.
- Eligibility computation from local attendance/CIE/finance signals.
- Local room/seating/invigilation operations.
- Question-paper readiness metadata without exposing confidential paper content to COE.
- Hall-ticket payload marked `UNIVERSITY_REFERENCE`.
- Result-processing API guard blocks institutional processing when VTU owns result processing.
- Capability matrix identifies university-owned, shared, and institutional capabilities.

Required workflow still incomplete:

- VTU timetable import/reference and reconciliation.
- VTU registration reference/import.
- VTU QP handling register.
- Form-A-ready export.
- Answer book and script handover registers.
- VTU result import/reconciliation.
- VTU revaluation status tracking.

