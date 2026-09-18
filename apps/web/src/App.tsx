import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { HomeRedirect, ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AccountantLayout } from './layouts/AccountantLayout';
import { AdmissionsLayout } from './layouts/AdmissionsLayout';
import { CoeLayout } from './layouts/CoeLayout';
import { LabLayout } from './layouts/LabLayout';
import { LabDashboardPage } from './pages/lab/LabDashboardPage';
import { LabsPage } from './pages/lab/LabsPage';
import { LabAssetsPage } from './pages/lab/LabAssetsPage';
import { LabStockPage } from './pages/lab/LabStockPage';
import { LabIssuesPage } from './pages/lab/LabIssuesPage';
import { LabSessionsPage } from './pages/lab/LabSessionsPage';
import { LabFaultsPage } from './pages/lab/LabFaultsPage';
import { LabSoftwarePage } from './pages/lab/LabSoftwarePage';
import { LabRequirementsPage } from './pages/lab/LabRequirementsPage';
import { LabReportsPage } from './pages/lab/LabReportsPage';
import { LabOversightPage } from './pages/lab/LabOversightPage';
import { MaintenanceLayout } from './layouts/MaintenanceLayout';
import { MyTicketsPage } from './pages/maintenance/MyTicketsPage';
import { CreateTicketPage } from './pages/maintenance/CreateTicketPage';
import { TicketDetailPage } from './pages/maintenance/TicketDetailPage';
import { TechnicianWorkPage } from './pages/maintenance/TechnicianWorkPage';
import { ManagerDashboardPage } from './pages/maintenance/ManagerDashboardPage';
import { CentralQueuePage } from './pages/maintenance/CentralQueuePage';
import { MaintenanceReportsPage } from './pages/maintenance/ReportsPage';
import { MaintenanceConfigPage } from './pages/maintenance/ConfigPage';
import { PlatformLayout } from './layouts/PlatformLayout';
import {
  AdmissionsApplicationReviewPage,
  AdmissionsApplicationsPage,
  AdmissionsDashboardPage,
  AdmissionsIntakePage,
  AdmissionsReportsPage,
  ApplicantPortalLoginPage,
  ApplicantPortalPage,
} from './pages/admissions/AdmissionsPages';
import {
  PlatformAnnouncementsPage,
  PlatformAuditPage,
  PlatformHealthPage,
  PlatformIntegrationsPage,
  PlatformMastersPage,
} from './pages/platform/PlatformMorePages';
import {
  PlatformDashboardPage,
  PlatformFeatureFlagsPage,
  PlatformModulesPage,
  PlatformRolesPage,
  PlatformTenantCreatePage,
  PlatformTenantsPage,
  PlatformUsersPage,
} from './pages/platform/PlatformPages';
import { PlatformTenantDetailPage } from './pages/platform/PlatformTenantPages';
import { ToastProvider } from './components/ui';
import { OfficeLayout } from './layouts/OfficeLayout';
import { OfficeDashboardPage, OfficeRequestsPage, OfficeRequestWorkspacePage, OfficeDocumentsPage, OfficeRegisterPage, OfficeFilesPage } from './pages/office/OfficePages';
import { LoginPage, ForgotPasswordPage } from './pages/LoginPage';
import {
  AlumniAdminPage,
  AlumniContributionsPage,
  AlumniDashboardPage,
  AlumniEventsPage,
  AlumniLoginPage,
  AlumniMentorshipPage,
  AlumniNetworkPage,
  AlumniOpportunitiesPage,
  AlumniPortalLayout,
  AlumniProfilePage,
} from './pages/alumni/AlumniPages';
import { CoursesPage, CourseWorkspacePage } from './pages/CoursesPage';
import { DashboardPage } from './pages/DashboardPage';
import { SurveysPage } from './pages/SurveysPage';
import { CreateSurveyPage } from './pages/CreateSurveyPage';
import { SurveyDetailPage } from './pages/SurveyDetailPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { StudentsPage, StudentDetailPage } from './pages/StudentsPage';
import { AnalyticsPage, ReportsPage, SettingsPage } from './pages/MiscPages';
import { FacultyResponsesPage } from './pages/FacultyResponsesPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StudentSurveyPage } from './pages/StudentSurveyPage';
import { JoinClassPage, StudentLmsLoginPage, StudentForgotPasswordPage } from './pages/JoinClassPage';
import { StudentLmsLayout } from './pages/lms/StudentLmsLayout';
import { StudentDashboardPage, StudentMorePage, StudentSubjectsPage } from './pages/lms/StudentDashboardPage';
import { StudentLearningPage, StudentSubjectPage, StudentTopicPage } from './pages/lms/StudentSubjectPage';
import { StudentProfilePage } from './pages/lms/StudentProfilePage';
import {
  StudentAssignmentDetailPage,
  StudentAssessmentsPage,
  StudentAssignmentsPage,
  StudentQuizAttemptPage,
  StudentQuizDetailPage,
  StudentQuizzesPage,
  StudentTasksPage,
} from './pages/lms/StudentWorkPages';
import {
  StudentCalendarPage,
  StudentHistoryClassPage,
  StudentHistoryPage,
  StudentNotificationsPage,
  StudentPaperDetailPage,
  StudentPapersPage,
  StudentPerformancePage,
  StudentSavedPage,
  StudentSearchPage,
} from './pages/lms/StudentInsightsPages';
import { StudentAttendancePage, StudentSubjectAttendancePage } from './pages/lms/StudentAttendancePage';
import { CourseAttendancePage } from './pages/attendance/CourseAttendancePage';
import { AdminRoomsPeriodsPage, AdminTimetablePage, FacultyTimetablePage } from './pages/timetable/AdminTimetablePage';
import { StudentTimetablePage } from './pages/timetable/StudentTimetablePage';
import { StudentResetPasswordPage } from './pages/JoinClassPage';
import {
  ManagementOverviewPage,
  ManagementAcademicsPage,
  ManagementWorkforcePage,
  ManagementRecruitmentPage,
  ManagementPerformancePage,
  ManagementLdPage,
  ManagementSuccessionPage,
  ManagementPlacementPage,
  ManagementFinancePage,
  ManagementPayrollPage,
  ManagementCampusPage,
  ManagementApprovalsPage,
  ManagementExceptionsPage,
  ManagementDepartmentsPage,
  ManagementDepartmentDetailPage,
  ManagementReportsPage,
} from './pages/management/ManagementPages';
import { AcademicClassesPage } from './pages/classes/AcademicClassesPage';
import { AcademicClassDetailPage } from './pages/classes/AcademicClassDetailPage';
import { CoordinatorWorkspacePage } from './pages/classes/CoordinatorWorkspacePage';
import { QuizDetailPage } from './pages/QuizDetailPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { CreateQuizPage } from './pages/CreateQuizPage';
import { QuizBankPage } from './pages/QuizBankPage';
import { StudentQuizPage } from './pages/StudentQuizPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { CreateAssignmentPage } from './pages/CreateAssignmentPage';
import { AssignmentDetailPage } from './pages/AssignmentDetailPage';
import { AssignmentBankPage } from './pages/AssignmentBankPage';
import { AssignmentPrintPage } from './pages/AssignmentPrintPage';
import { AssignmentSubmissionEvalPage } from './pages/AssignmentSubmissionEvalPage';
import { StudentAssignmentPage } from './pages/StudentAssignmentPage';
import { LessonPlansPage } from './pages/LessonPlansPage';
import { CreateLessonPlanPage } from './pages/CreateLessonPlanPage';
import { LessonPlanDetailPage } from './pages/LessonPlanDetailPage';
import { LessonPlanPrintPage } from './pages/LessonPlanPrintPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminFacultyPage } from './pages/admin/AdminFacultyPage';
import { AdminFacultyDetailPage } from './pages/admin/AdminFacultyDetailPage';
import {
  AdminInstitutionsPage,
  AdminInstitutionDetailPage,
} from './pages/admin/AdminInstitutionsPage';
import { AdminAcademicPage } from './pages/admin/AdminAcademicPage';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage';
import {
  AdminLessonPlansPage,
  AdminLessonMasterPage,
  AdminCalendarPage,
} from './pages/admin/AdminLessonPages';
import {
  AdminSurveysPage,
  AdminQuizzesPage,
  AdminStudentsPage,
  AdminResponsesPage,
  AdminAnalyticsPage,
  AdminReportsPage,
  AdminSettingsPage,
} from './pages/admin/AdminMiscPages';
import { AcademicMappingsHubPage } from './pages/copo/AcademicMappingsHubPage';
import { CopoSubjectPage } from './pages/copo/CopoSubjectPage';
import { CopoMappingPage } from './pages/copo/CopoMappingPage';
import { CreateCopoMappingPage } from './pages/copo/CreateCopoMappingPage';
import { CopoMappingInstancePage } from './pages/copo/CopoMappingInstancePage';
import { CopoReviewPage } from './pages/copo/CopoReviewPage';
import { CopoAnalyticsPage } from './pages/copo/CopoAnalyticsPage';
import { CopoReportsPage } from './pages/copo/CopoReportsPage';
import { CopoReportPrintPage } from './pages/copo/CopoReportPrintPage';
import { CopoOutcomesPage, CopoProgrammeOutcomesPage, CopoProgramSpecificOutcomesPage, CopoSdgPage } from './pages/copo/CopoOutcomesPage';
import { AdminCopoMasterPage } from './pages/admin/copo/AdminCopoMasterPage';
import { AdminCopoImportPage } from './pages/admin/copo/AdminCopoImportPage';
import { GapAnalysesPage } from './pages/gapAnalysis/GapAnalysesPage';
import { CreateGapAnalysisPage } from './pages/gapAnalysis/CreateGapAnalysisPage';
import { GapAnalysisDetailPage } from './pages/gapAnalysis/GapAnalysisDetailPage';
import { GapAnalysisPrintPage } from './pages/gapAnalysis/GapAnalysisPrintPage';
import { AdminGapMasterPage } from './pages/gapAnalysis/AdminGapMasterPage';
import { BeyondSyllabusPlansPage } from './pages/beyondSyllabus/BeyondSyllabusPlansPage';
import { CreateBeyondSyllabusPlanPage } from './pages/beyondSyllabus/CreateBeyondSyllabusPlanPage';
import { BeyondSyllabusDetailPage } from './pages/beyondSyllabus/BeyondSyllabusDetailPage';
import { BeyondSyllabusPrintPage } from './pages/beyondSyllabus/BeyondSyllabusPrintPage';
import { AdminCbsMasterPage } from './pages/beyondSyllabus/AdminCbsMasterPage';
import { CoEvaluationsPage } from './pages/coEvaluation/CoEvaluationsPage';
import { CreateCoEvaluationPage } from './pages/coEvaluation/CreateCoEvaluationPage';
import { CoEvaluationDetailPage } from './pages/coEvaluation/CoEvaluationDetailPage';
import { CoEvaluationPrintPage } from './pages/coEvaluation/CoEvaluationPrintPage';
import { AdminCoEvalMasterPage } from './pages/coEvaluation/AdminCoEvalMasterPage';
import { PreviousYearPapersPage } from './pages/questionPapers/PreviousYearPapersPage';
import { PreviousYearPaperDetailPage } from './pages/questionPapers/PreviousYearPaperDetailPage';
import { PreviousYearQuestionsPage } from './pages/questionPapers/PreviousYearQuestionsPage';
import { PreviousYearQuestionDetailPage } from './pages/questionPapers/PreviousYearQuestionDetailPage';
import { InternalPapersPage } from './pages/questionPapers/InternalPapersPage';
import { CreateInternalPaperPage } from './pages/questionPapers/CreateInternalPaperPage';
import { InternalPaperDetailPage } from './pages/questionPapers/InternalPaperDetailPage';
import { InternalPaperPrintPage } from './pages/questionPapers/InternalPaperPrintPage';
import { AdminQpMasterPage } from './pages/questionPapers/AdminQpMasterPage';
import { CourseTextbookMasterPage } from './pages/questionPapers/CourseTextbookMasterPage';
import { AttainmentDashboardPage } from './pages/attainment/AttainmentDashboardPage';
import { CourseAttainmentPage } from './pages/attainment/CourseAttainmentPage';
import { AttainmentRunPage } from './pages/attainment/AttainmentRunPage';
import { ImprovementCyclePage } from './pages/attainment/ImprovementCyclePage';
import { MarksEntryPage } from './pages/attainment/MarksEntryPage';
import { AttainmentPrintPage } from './pages/attainment/AttainmentPrintPage';
import {
  ExaminationDetailPage,
  CoeDashboardPage,
  CoeQuestionPapersPage,
  CoeStatusPage,
  ExamMarksEntryPage,
  ExaminationsAdminPage,
  FacultyExamDutiesPage,
} from './pages/examinations/ExaminationPages';
import {
  StudentAcademicRecordPage,
  StudentExamEligibilityPage,
  StudentExamResultsPage,
  StudentExaminationsPage,
  StudentHallTicketPage,
} from './pages/lms/StudentExamPages';
import {
  StudentServicesHomePage,
  StudentRequestsPage,
  StudentNewRequestPage,
  StudentRequestDetailPage,
  StudentCertificatesPage,
  StudentCertificateDetailPage,
  StudentGrievancesPage,
  StudentNewGrievancePage,
  StudentGrievanceDetailPage,
  StudentMentorPage,
  StudentAlertsPage,
} from './pages/lms/StudentServicesPages';
import {
  StaffActionCenterPage,
  StaffRequestDetailPage,
  StaffGrievancesPage,
  StaffGrievanceDetailPage,
  StaffMenteesPage,
  StaffServicesDashboardPage,
} from './pages/studentServices/StaffServicesPages';
import { MentorDashboardPage, MentorStudent360Page, MyMenteesPage } from './pages/mentoring/MentoringPages';
import { LecturerRequestsPage, LecturerRequestDetailPage } from './pages/mentoring/LecturerRequestsPage';
import { FacultyProfilePage } from './pages/faculty/FacultyProfilePage';
import {
  HodMentoringPage,
  PrincipalMentoringPage,
  ManagementMentoringPage,
} from './pages/mentoring/LeadershipMentoringPages';
import {
  FinanceDashboardPage,
  FinanceFeeStructuresPage,
  FinancePaymentsPage,
  FinanceReceiptsPage,
  FinanceReconciliationPage,
  FinanceRefundsPage,
  FinanceReportsPage,
  FinanceScholarshipsPage,
  FinanceStudentDetailPage,
  FinanceStudentSearchPage,
} from './pages/finance/StaffFinancePages';
import {
  StudentFeesPage,
  StudentFeeDetailsPage,
  StudentPaymentHistoryPage,
  StudentPayNowPage,
  StudentReceiptPage,
  StudentScholarshipsPage,
  StudentNoDuePage,
} from './pages/finance/StudentFinancePages';
import {
  StudentApplicationsPage,
  StudentApplicationDetailPage,
  StudentCareerProfilePage,
  StudentInternshipsPage,
  StudentOffersPage,
  StudentOpportunitiesPage,
  StudentOpportunityDetailPage,
  StudentPlacementCalendarPage,
  StudentPlacementTrainingPage,
  StudentPlacementsHomePage,
  StudentResumePage,
} from './pages/placement/StudentPlacementPages';
import {
  CoordinatorPlacementDashboardPage,
  HodPlacementOversightPage,
  ManagementPlacementDashboardPage,
  PlacementApplicationsPage,
  PlacementCompaniesPage,
  PlacementCoordinatorsPage,
  PlacementDashboardPage,
  PlacementOffersPage,
  PlacementOpportunitiesPage,
  PlacementTrainingAdminPage,
  PrincipalPlacementOversightPage,
  RecruiterPlacementPage,
  TrainerPlacementDashboardPage,
} from './pages/placement/StaffPlacementPages';
import {
  StudentLibraryHomePage,
  StudentLibrarySearchPage,
  StudentLibraryBookDetailPage,
  StudentLibraryMyBooksPage,
  StudentLibraryReservationsPage,
  StudentLibraryHistoryPage,
  StudentLibraryFinesPage,
  StudentLibraryCardPage,
} from './pages/library/StudentLibraryPages';
import {
  LibraryDashboardPage,
  LibraryCirculationDeskPage,
  LibrarySearchPage,
  LibraryReservationsPage,
  LibraryFinesPage,
  LibraryInventoryPage,
  LibraryReportsPage,
} from './pages/library/LibraryStaffPages';
import {
  StudentHostelApplyPage,
  StudentHostelClearancePage,
  StudentHostelComplaintsPage,
  StudentHostelHistoryPage,
  StudentHostelHomePage,
  StudentHostelMessPage,
  StudentHostelOutpassPage,
  StudentHostelRoomPage,
  StudentHostelVisitorsPage,
} from './pages/hostel/StudentHostelPages';
import {
  HostelApplicationsPage,
  HostelComplaintsStaffPage,
  HostelGateDashboardPage,
  HostelManagementDashboardPage,
  HostelOperationsDashboardPage,
  HostelResidentsPage,
  HostelRoomsPage,
  HostelVacatingPage,
  HostelWardenDashboardPage,
} from './pages/hostel/StaffHostelPages';
import {
  StudentTransportApplyPage,
  StudentTransportChangesPage,
  StudentTransportClearancePage,
  StudentTransportComplaintsPage,
  StudentTransportHistoryPage,
  StudentTransportHomePage,
  StudentTransportPassPage,
  StudentTransportRoutePage,
  StudentTransportTripsPage,
} from './pages/transport/StudentTransportPages';
import {
  DriverTripPage,
  TransportAdminDashboardPage,
  TransportApplicationsPage,
  TransportComplaintsStaffPage,
  TransportManagementDashboardPage,
  TransportOperationsDashboardPage,
  TransportRoutesPage,
  TransportTripsPage,
  TransportVehiclesPage,
} from './pages/transport/StaffTransportPages';
import {
  HrSelfDashboardPage,
  HrApplyLeavePage,
  HrProfilePage,
  HrAttendancePage,
  HrAdminDashboardPage,
  HrAdminEmployeesPage,
  HrManagerPage,
  HrManagementPage,
} from './pages/hr/HrPages';
import {
  HrAnalyticsOverviewPage,
  HrWorkforceAnalyticsPage,
  HrAttendanceAnalyticsPage,
  HrPayrollAnalyticsPage,
  HrRecruitmentAnalyticsPage,
  HrPerformanceAnalyticsPage,
  HrSeparationAnalyticsPage,
  HrDataQualityPage,
} from './pages/hr/HrAnalyticsPages';
import {
  LdMyLearningPage,
  LdDevelopmentPlanPage,
  LdCataloguePage,
  LdMyProgramsPage,
  LdCertificatesPage,
  LdHistoryPage,
  LdAdminDashboardPage,
  LdProgramsPage,
  LdProgramDetailPage,
  LdCompliancePage,
  LdTeamDevelopmentPage,
} from './pages/hr/HrLearningPages';
import {
  SuccessionDashboardPage,
  SuccessionRolesPage,
  SuccessionRoleDetailPage,
  SuccessionMatrixPage,
  SuccessionPoolsPage,
  SuccessionActionsPage,
  SuccessionReportsPage,
  SuccessionTeamTalentPage,
  SuccessionMyDevelopmentPage,
} from './pages/hr/HrSuccessionPages';
import {
  HrPayrollPage,
  HrPayrollDashboardPage,
  HrPayrollRunsPage,
  HrPayrollRunDetailPage,
  HrPayrollEmployeeDetailPage,
  HrSalaryStructuresPage,
  HrPayrollAdjustmentsPage,
  HrPayrollReportsPage,
  HrPayslipsPage,
} from './pages/hr/HrPayrollPages';
import {
  HrAdminEmployee360Page,
  HrCreateEmployeePage,
  HrOnboardingPage,
  HrResignationPage,
  HrServiceHistoryPage,
} from './pages/hr/HrLifecyclePages';
import {
  HodFnfClearanceDetailPage,
  HodFnfClearancePage,
  HrFnfApprovalsPage,
  HrFnfCaseDetailPage,
  HrFnfCasesPage,
  HrFnfClearancePage,
  HrFnfDashboardPage,
  HrFnfDocumentsPage,
  HrFnfFinancePage,
  HrFnfReportsPage,
  HrMySeparationPage,
} from './pages/hr/HrFnfPages';
import {
  HrAppraisalCyclesPage,
  HrAppraisalEmployeesPage,
  HrAppraisalTemplatesPage,
  HrCalibrationPage,
  HrDepartmentPerformancePage,
  HrMyAppraisalDetailPage,
  HrMyPerformancePage,
  HrPerformanceDashboardPage,
  HrPerformanceReportsPage,
  HrPrincipalPerformancePage,
  HrTeamPendingGoalsPage,
  HrTeamPendingReviewsPage,
  HrTeamPerformancePage,
  HrTeamReviewPage,
} from './pages/hr/HrPerformancePages';
import {
  HrRecruitmentCandidateDetailPage,
  HrRecruitmentDashboardPage,
  HrRecruitmentHodPage,
  HrRecruitmentInterviewEvaluatePage,
  HrRecruitmentInterviewsPage,
  HrRecruitmentJoiningPage,
  HrRecruitmentMyInterviewsPage,
  HrRecruitmentOfferDetailPage,
  HrRecruitmentOffersPage,
  HrRecruitmentOpeningDetailPage,
  HrRecruitmentOpeningsPage,
  HrRecruitmentPipelinePage,
  HrRecruitmentPreJoiningPage,
  HrRecruitmentReportsPage,
  HrRecruitmentRequisitionDetailPage,
  HrRecruitmentRequisitionsPage,
} from './pages/hr/HrRecruitmentPages';
import {
  CandidatePortalPage,
  PublicCareersPage,
  PublicJobDetailPage,
} from './pages/public/CareersPages';
import {
  HrRegularizationPage,
  HrManagerAttendancePage,
  HrAdminAttendancePage,
  HrAttendanceSettingsPage,
  HrAttendanceHolidaysPage,
} from './pages/hr/HrAttendanceClosurePages';
import { FacultyLibraryPage } from './pages/library/FacultyLibraryPage';
import { PublicVerifyPage } from './pages/PublicVerifyPage';
import { AdminLeadershipPage } from './pages/admin/AdminLeadershipPage';
import {
  HodAllocationPage,
  HodAssessmentsPage,
  HodAttendancePage,
  HodContinuityPage,
  HodDashboardPage,
  HodExceptionsPage,
  HodFacultyPage,
  HodLeavePage,
  HodProgressPage,
  HodReportsPage,
  HodResultsPage,
  HodTimetablePage,
  HodWorkloadPage,
  PrincipalApprovalsPage,
  PrincipalAssessmentsPage,
  PrincipalAttendancePage,
  PrincipalContinuityPage,
  PrincipalDashboardPage,
  PrincipalDepartmentDetailPage,
  PrincipalDepartmentsPage,
  PrincipalExceptionsPage,
  PrincipalFacultyPage,
  PrincipalHodsPage,
  PrincipalProgressPage,
  PrincipalReportsPage,
  PrincipalResultsPage,
  PrincipalStudentsPage,
  PrincipalTimetablePage,
} from './pages/leadership/HodPages';
import {
  ParentAcademicsPage,
  ParentAttendancePage,
  ParentCampusPage,
  ParentDashboardPage,
  ParentFeesPage,
  ParentForgotPasswordPage,
  ParentLoginPage,
  ParentNoticesPage,
  ParentPortalLayout,
  ParentProfilePage,
  ParentResultsPage,
} from './pages/parent/ParentPortalPages';
import { ProcurementPage } from './pages/procurement/ProcurementPages';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/s/:code" element={<StudentSurveyPage />} />
            <Route path="/q/:code" element={<StudentQuizPage />} />
            <Route path="/a/:code" element={<StudentAssignmentPage />} />
            <Route path="/join/class/:code" element={<JoinClassPage />} />
            <Route path="/lms/login" element={<StudentLmsLoginPage />} />
            <Route path="/lms/forgot-password" element={<StudentForgotPasswordPage />} />
            <Route path="/lms/reset-password" element={<StudentResetPasswordPage />} />
            <Route path="/parent/login" element={<ParentLoginPage />} />
            <Route path="/parent/forgot-password" element={<ParentForgotPasswordPage />} />
            <Route path="/alumni/login" element={<AlumniLoginPage />} />
            <Route path="/verify/document/:code" element={<PublicVerifyPage />} />
            <Route path="/careers" element={<PublicCareersPage />} />
            <Route path="/careers/portal" element={<CandidatePortalPage />} />
            <Route path="/careers/:id" element={<PublicJobDetailPage />} />
            <Route path="/applicant/login" element={<ApplicantPortalLoginPage />} />

            <Route element={<ProtectedRoute applicantOnly />}>
              <Route path="/applicant" element={<ApplicantPortalPage />} />
            </Route>

            <Route element={<ProtectedRoute parentOnly />}>
              <Route element={<ParentPortalLayout />}>
                <Route path="/parent" element={<ParentDashboardPage />} />
                <Route path="/parent/academics" element={<ParentAcademicsPage />} />
                <Route path="/parent/attendance" element={<ParentAttendancePage />} />
                <Route path="/parent/results" element={<ParentResultsPage />} />
                <Route path="/parent/fees" element={<ParentFeesPage />} />
                <Route path="/parent/campus" element={<ParentCampusPage />} />
                <Route path="/parent/notices" element={<ParentNoticesPage />} />
                <Route path="/parent/profile" element={<ParentProfilePage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute alumniOnly />}>
              <Route element={<AlumniPortalLayout />}>
                <Route path="/alumni" element={<AlumniDashboardPage />} />
                <Route path="/alumni/profile" element={<AlumniProfilePage />} />
                <Route path="/alumni/network" element={<AlumniNetworkPage />} />
                <Route path="/alumni/events" element={<AlumniEventsPage />} />
                <Route path="/alumni/opportunities" element={<AlumniOpportunitiesPage />} />
                <Route path="/alumni/mentorship" element={<AlumniMentorshipPage />} />
                <Route path="/alumni/contributions" element={<AlumniContributionsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/alumni-admin" element={<AlumniAdminPage />} />
            </Route>

            <Route element={<ProtectedRoute studentOnly />}>
              <Route element={<StudentLmsLayout />}>
                <Route path="/lms" element={<StudentDashboardPage />} />
                <Route path="/lms/subjects" element={<StudentSubjectsPage />} />
                <Route path="/lms/subjects/:courseId" element={<StudentSubjectPage />} />
                <Route path="/lms/subjects/:courseId/topics/:topicId" element={<StudentTopicPage />} />
                <Route path="/lms/learning" element={<StudentLearningPage />} />
                <Route path="/lms/tasks" element={<StudentTasksPage />} />
                <Route path="/lms/assignments" element={<StudentAssignmentsPage />} />
                <Route path="/lms/assignments/:id" element={<StudentAssignmentDetailPage />} />
                <Route path="/lms/quizzes" element={<StudentQuizzesPage />} />
                <Route path="/lms/quizzes/:id" element={<StudentQuizDetailPage />} />
                <Route path="/lms/quizzes/:id/attempt" element={<StudentQuizAttemptPage />} />
                <Route path="/lms/assessments" element={<StudentAssessmentsPage />} />
                <Route path="/lms/papers" element={<StudentPapersPage />} />
                <Route path="/lms/papers/:id" element={<StudentPaperDetailPage />} />
                <Route path="/lms/performance" element={<StudentPerformancePage />} />
                <Route path="/lms/attendance" element={<StudentAttendancePage />} />
                <Route path="/lms/attendance/:courseId" element={<StudentSubjectAttendancePage />} />
                <Route path="/lms/history" element={<StudentHistoryPage />} />
                <Route path="/lms/history/:classId" element={<StudentHistoryClassPage />} />
                <Route path="/lms/notifications" element={<StudentNotificationsPage />} />
                <Route path="/lms/calendar" element={<StudentCalendarPage />} />
                <Route path="/lms/timetable" element={<StudentTimetablePage />} />
                <Route path="/lms/exams" element={<StudentExaminationsPage />} />
                <Route path="/lms/exams/eligibility" element={<StudentExamEligibilityPage />} />
                <Route path="/lms/exams/hall-ticket" element={<StudentHallTicketPage />} />
                <Route path="/lms/exams/results" element={<StudentExamResultsPage />} />
                <Route path="/lms/exams/academic-record" element={<StudentAcademicRecordPage />} />
                <Route path="/lms/saved" element={<StudentSavedPage />} />
                <Route path="/lms/search" element={<StudentSearchPage />} />
                <Route path="/lms/more" element={<StudentMorePage />} />
                <Route path="/lms/profile" element={<StudentProfilePage />} />
                <Route path="/lms/services" element={<StudentServicesHomePage />} />
                <Route path="/lms/services/requests" element={<StudentRequestsPage />} />
                <Route path="/lms/services/requests/new" element={<StudentNewRequestPage />} />
                <Route path="/lms/services/requests/:id" element={<StudentRequestDetailPage />} />
                <Route path="/lms/services/certificates" element={<StudentCertificatesPage />} />
                <Route path="/lms/services/certificates/:id" element={<StudentCertificateDetailPage />} />
                <Route path="/lms/services/grievances" element={<StudentGrievancesPage />} />
                <Route path="/lms/services/grievances/new" element={<StudentNewGrievancePage />} />
                <Route path="/lms/services/grievances/:id" element={<StudentGrievanceDetailPage />} />
                <Route path="/lms/services/mentor" element={<StudentMentorPage />} />
                <Route path="/lms/services/alerts" element={<StudentAlertsPage />} />
                <Route path="/lms/fees" element={<StudentFeesPage />} />
                <Route path="/lms/fees/details" element={<StudentFeeDetailsPage />} />
                <Route path="/lms/fees/history" element={<StudentPaymentHistoryPage />} />
                <Route path="/lms/fees/pay" element={<StudentPayNowPage />} />
                <Route path="/lms/fees/receipt/:id" element={<StudentReceiptPage />} />
                <Route path="/lms/fees/scholarships" element={<StudentScholarshipsPage />} />
                <Route path="/lms/fees/no-due" element={<StudentNoDuePage />} />
                <Route path="/lms/library" element={<StudentLibraryHomePage />} />
                <Route path="/lms/library/search" element={<StudentLibrarySearchPage />} />
                <Route path="/lms/library/books" element={<StudentLibraryMyBooksPage />} />
                <Route path="/lms/library/books/:id" element={<StudentLibraryBookDetailPage />} />
                <Route path="/lms/library/reservations" element={<StudentLibraryReservationsPage />} />
                <Route path="/lms/library/history" element={<StudentLibraryHistoryPage />} />
                <Route path="/lms/library/fines" element={<StudentLibraryFinesPage />} />
                <Route path="/lms/library/card" element={<StudentLibraryCardPage />} />
                <Route path="/lms/hostel" element={<StudentHostelHomePage />} />
                <Route path="/lms/hostel/apply" element={<StudentHostelApplyPage />} />
                <Route path="/lms/hostel/room" element={<StudentHostelRoomPage />} />
                <Route path="/lms/hostel/outpass" element={<StudentHostelOutpassPage />} />
                <Route path="/lms/hostel/mess" element={<StudentHostelMessPage />} />
                <Route path="/lms/hostel/visitors" element={<StudentHostelVisitorsPage />} />
                <Route path="/lms/hostel/complaints" element={<StudentHostelComplaintsPage />} />
                <Route path="/lms/hostel/clearance" element={<StudentHostelClearancePage />} />
                <Route path="/lms/hostel/history" element={<StudentHostelHistoryPage />} />
                <Route path="/lms/transport" element={<StudentTransportHomePage />} />
                <Route path="/lms/transport/apply" element={<StudentTransportApplyPage />} />
                <Route path="/lms/transport/pass" element={<StudentTransportPassPage />} />
                <Route path="/lms/transport/route" element={<StudentTransportRoutePage />} />
                <Route path="/lms/transport/trips" element={<StudentTransportTripsPage />} />
                <Route path="/lms/transport/changes" element={<StudentTransportChangesPage />} />
                <Route path="/lms/transport/complaints" element={<StudentTransportComplaintsPage />} />
                <Route path="/lms/transport/clearance" element={<StudentTransportClearancePage />} />
                <Route path="/lms/transport/history" element={<StudentTransportHistoryPage />} />
                <Route path="/lms/placements" element={<StudentPlacementsHomePage />} />
                <Route path="/lms/placements/profile" element={<StudentCareerProfilePage />} />
                <Route path="/lms/placements/resume" element={<StudentResumePage />} />
                <Route path="/lms/placements/opportunities" element={<StudentOpportunitiesPage />} />
                <Route path="/lms/placements/opportunities/:id" element={<StudentOpportunityDetailPage />} />
                <Route path="/lms/placements/applications" element={<StudentApplicationsPage />} />
                <Route path="/lms/placements/applications/:id" element={<StudentApplicationDetailPage />} />
                <Route path="/lms/placements/offers" element={<StudentOffersPage />} />
                <Route path="/lms/placements/training" element={<StudentPlacementTrainingPage />} />
                <Route path="/lms/placements/internships" element={<StudentInternshipsPage />} />
                <Route path="/lms/placements/calendar" element={<StudentPlacementCalendarPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminOverviewPage />} />
                <Route path="/admin/institutions" element={<AdminInstitutionsPage />} />
                <Route path="/admin/institutions/:id" element={<AdminInstitutionDetailPage />} />
                <Route path="/admin/faculty" element={<AdminFacultyPage />} />
                <Route path="/admin/faculty/:id" element={<AdminFacultyDetailPage />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
                <Route path="/admin/surveys" element={<AdminSurveysPage />} />
                <Route path="/admin/quizzes" element={<AdminQuizzesPage />} />
                <Route path="/admin/responses" element={<AdminResponsesPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                <Route path="/admin/academic" element={<AdminAcademicPage />} />
                <Route path="/admin/leadership" element={<AdminLeadershipPage />} />
                <Route path="/admin/classes" element={<AcademicClassesPage basePath="/admin/classes" />} />
                <Route path="/admin/classes/:id" element={<AcademicClassDetailPage />} />
                <Route path="/admin/lesson-plans" element={<AdminLessonPlansPage />} />
                <Route path="/admin/lesson-master" element={<AdminLessonMasterPage />} />
                <Route path="/admin/calendar" element={<AdminCalendarPage />} />
                <Route path="/admin/timetable" element={<AdminTimetablePage />} />
                <Route path="/admin/timetable/rooms" element={<AdminRoomsPeriodsPage />} />
                <Route path="/admin/attendance" element={<AdminAttendancePage />} />
                <Route path="/admin/examinations" element={<ExaminationsAdminPage />} />
                <Route path="/admin/student-services" element={<StaffServicesDashboardPage />} />
                <Route path="/admin/finance" element={<FinanceDashboardPage />} />
                <Route path="/admin/finance/fee-structures" element={<FinanceFeeStructuresPage />} />
                <Route path="/admin/finance/payments" element={<FinancePaymentsPage />} />
                <Route path="/admin/finance/receipts" element={<FinanceReceiptsPage />} />
                <Route path="/admin/finance/reports" element={<FinanceReportsPage />} />
                <Route path="/admin/finance/students" element={<FinanceStudentSearchPage />} />
                <Route path="/admin/finance/students/:studentId" element={<FinanceStudentDetailPage />} />
                <Route path="/admin/library" element={<LibraryDashboardPage />} />
                <Route path="/admin/library/circulation" element={<LibraryCirculationDeskPage />} />
                <Route path="/admin/library/search" element={<LibrarySearchPage />} />
                <Route path="/admin/library/reservations" element={<LibraryReservationsPage />} />
                <Route path="/admin/library/fines" element={<LibraryFinesPage />} />
                <Route path="/admin/library/inventory" element={<LibraryInventoryPage />} />
                <Route path="/admin/library/reports" element={<LibraryReportsPage />} />
                <Route path="/admin/placements" element={<PlacementDashboardPage />} />
                <Route path="/admin/placements/companies" element={<PlacementCompaniesPage />} />
                <Route path="/admin/placements/opportunities" element={<PlacementOpportunitiesPage />} />
                <Route path="/admin/placements/applications" element={<PlacementApplicationsPage />} />
                <Route path="/admin/placements/offers" element={<PlacementOffersPage />} />
                <Route path="/admin/placements/training" element={<PlacementTrainingAdminPage />} />
                <Route path="/admin/placements/coordinators" element={<PlacementCoordinatorsPage />} />
                <Route path="/admin/placements/coordinator" element={<CoordinatorPlacementDashboardPage />} />
                <Route path="/admin/placements/training-admin" element={<TrainerPlacementDashboardPage />} />
                <Route path="/admin/placements/management" element={<ManagementPlacementDashboardPage />} />
                <Route path="/admin/examinations/:examId" element={<ExaminationDetailPage />} />
                <Route path="/admin/copo/hub" element={<AcademicMappingsHubPage basePath="/admin/copo" admin />} />
                <Route path="/admin/copo" element={<AcademicMappingsHubPage basePath="/admin/copo" admin />} />
                <Route path="/admin/copo/create" element={<CreateCopoMappingPage basePath="/admin/copo" />} />
                <Route path="/admin/copo/mappings/:id" element={<CopoMappingInstancePage basePath="/admin/copo" />} />
                <Route path="/admin/copo/pso" element={<AcademicMappingsHubPage basePath="/admin/copo" admin />} />
                <Route path="/admin/copo/pso/create" element={<CreateCopoMappingPage basePath="/admin/copo" />} />
                <Route path="/admin/copo/pso/mappings/:id" element={<CopoMappingInstancePage basePath="/admin/copo" />} />
                <Route path="/admin/copo/sdg" element={<AcademicMappingsHubPage basePath="/admin/copo" admin />} />
                <Route path="/admin/copo/sdg/create" element={<CreateCopoMappingPage basePath="/admin/copo" />} />
                <Route path="/admin/copo/sdg/mappings/:id" element={<CopoMappingInstancePage basePath="/admin/copo" />} />
                <Route path="/admin/copo/subjects/:courseId" element={<CopoSubjectPage basePath="/admin/copo" />} />
                <Route path="/admin/copo/master" element={<AdminCopoMasterPage />} />
                <Route path="/admin/copo/import" element={<AdminCopoImportPage />} />
                <Route path="/admin/copo/mapping" element={<CopoMappingPage basePath="/admin/copo" />} />
                <Route path="/admin/copo/review" element={<CopoReviewPage basePath="/admin/copo" />} />
                <Route path="/admin/copo/analytics" element={<CopoAnalyticsPage basePath="/admin/copo" />} />
                <Route path="/admin/copo/reports" element={<CopoReportsPage basePath="/admin/copo" />} />
                <Route path="/admin/gap-analysis" element={<GapAnalysesPage basePath="/admin/gap-analysis" admin />} />
                <Route path="/admin/gap-analysis/create" element={<CreateGapAnalysisPage basePath="/admin/gap-analysis" />} />
                <Route path="/admin/gap-analysis/:id" element={<GapAnalysisDetailPage basePath="/admin/gap-analysis" />} />
                <Route path="/admin/gap-master" element={<AdminGapMasterPage />} />
                <Route
                  path="/admin/beyond-syllabus"
                  element={<BeyondSyllabusPlansPage basePath="/admin/beyond-syllabus" admin />}
                />
                <Route
                  path="/admin/beyond-syllabus/create"
                  element={<CreateBeyondSyllabusPlanPage basePath="/admin/beyond-syllabus" />}
                />
                <Route
                  path="/admin/beyond-syllabus/:id"
                  element={<BeyondSyllabusDetailPage basePath="/admin/beyond-syllabus" />}
                />
                <Route path="/admin/cbs-master" element={<AdminCbsMasterPage />} />
                <Route path="/admin/co-evaluation" element={<CoEvaluationsPage basePath="/admin/co-evaluation" admin />} />
                <Route path="/admin/co-evaluation/create" element={<CreateCoEvaluationPage basePath="/admin/co-evaluation" />} />
                <Route path="/admin/co-evaluation/:id" element={<CoEvaluationDetailPage basePath="/admin/co-evaluation" />} />
                <Route path="/admin/co-eval-master" element={<AdminCoEvalMasterPage />} />
                <Route path="/admin/qp-master" element={<AdminQpMasterPage />} />
                <Route path="/admin/course-textbooks" element={<CourseTextbookMasterPage />} />
                <Route path="/admin/internal-question-papers" element={<InternalPapersPage basePath="/admin/internal-question-papers" admin />} />
                <Route path="/admin/internal-question-papers/:id" element={<InternalPaperDetailPage />} />
                <Route path="/admin/attainment" element={<AttainmentDashboardPage admin />} />
                <Route path="/admin/profile" element={<ProfilePage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>
              <Route element={<PlatformLayout />}>
                <Route path="/platform" element={<PlatformDashboardPage />} />
                <Route path="/platform/tenants" element={<PlatformTenantsPage />} />
                <Route path="/platform/tenants/new" element={<PlatformTenantCreatePage />} />
                <Route path="/platform/tenants/:id" element={<PlatformTenantDetailPage />} />
                <Route path="/platform/modules" element={<PlatformModulesPage />} />
                <Route path="/platform/flags" element={<PlatformFeatureFlagsPage />} />
                <Route path="/platform/users" element={<PlatformUsersPage />} />
                <Route path="/platform/roles" element={<PlatformRolesPage />} />
                <Route path="/platform/masters" element={<PlatformMastersPage />} />
                <Route path="/platform/integrations" element={<PlatformIntegrationsPage />} />
                <Route path="/platform/health" element={<PlatformHealthPage />} />
                <Route path="/platform/audit" element={<PlatformAuditPage />} />
                <Route path="/platform/announcements" element={<PlatformAnnouncementsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<OfficeLayout />}>
                <Route path="/office" element={<OfficeDashboardPage />} />
                <Route path="/office/requests" element={<OfficeRequestsPage />} />
                <Route path="/office/requests/:id" element={<OfficeRequestWorkspacePage />} />
                <Route path="/office/documents" element={<OfficeDocumentsPage />} />
                <Route path="/office/inward" element={<OfficeRegisterPage kind="inward" />} />
                <Route path="/office/outward" element={<OfficeRegisterPage kind="outward" />} />
                <Route path="/office/files" element={<OfficeFilesPage />} />
                <Route path="/office/settings" element={<OfficeDashboardPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/lesson-plans/:id/print" element={<LessonPlanPrintPage />} />
              <Route path="/assignments/:id/print" element={<AssignmentPrintPage />} />
              <Route path="/gap-analysis/:id/print" element={<GapAnalysisPrintPage />} />
              <Route path="/admin/gap-analysis/:id/print" element={<GapAnalysisPrintPage />} />
              <Route path="/beyond-syllabus/:id/print" element={<BeyondSyllabusPrintPage />} />
              <Route path="/admin/beyond-syllabus/:id/print" element={<BeyondSyllabusPrintPage />} />
              <Route path="/co-evaluation/:id/print" element={<CoEvaluationPrintPage />} />
              <Route path="/admin/co-evaluation/:id/print" element={<CoEvaluationPrintPage />} />
              <Route path="/internal-question-papers/:id/print" element={<InternalPaperPrintPage />} />
              <Route path="/admin/internal-question-papers/:id/print" element={<InternalPaperPrintPage />} />
              <Route path="/attainment/runs/:id/print" element={<AttainmentPrintPage />} />
              <Route path="/copo/mappings/:id/print" element={<CopoReportPrintPage />} />
              <Route path="/copo/pso/mappings/:id/print" element={<CopoReportPrintPage />} />
              <Route path="/copo/sdg/mappings/:id/print" element={<CopoReportPrintPage />} />
              <Route path="/copo/reports/:id/print" element={<CopoReportPrintPage />} />
              <Route path="/admin/copo/mappings/:id/print" element={<CopoReportPrintPage />} />
              <Route path="/admin/copo/pso/mappings/:id/print" element={<CopoReportPrintPage />} />
              <Route path="/admin/copo/sdg/mappings/:id/print" element={<CopoReportPrintPage />} />
              <Route path="/admin/copo/reports/:id/print" element={<CopoReportPrintPage />} />
              <Route element={<AccountantLayout />}>
                <Route path="/accountant" element={<FinanceDashboardPage />} />
                <Route path="/accountant/fee-structures" element={<FinanceFeeStructuresPage />} />
                <Route path="/accountant/payments" element={<FinancePaymentsPage />} />
                <Route path="/accountant/receipts" element={<FinanceReceiptsPage />} />
                <Route path="/accountant/refunds" element={<FinanceRefundsPage />} />
                <Route path="/accountant/scholarships" element={<FinanceScholarshipsPage />} />
                <Route path="/accountant/reconciliation" element={<FinanceReconciliationPage />} />
                <Route path="/accountant/reports" element={<FinanceReportsPage />} />
                <Route path="/accountant/students" element={<FinanceStudentSearchPage />} />
                <Route path="/accountant/students/:studentId" element={<FinanceStudentDetailPage />} />
              </Route>
              <Route element={<CoeLayout />}>
                <Route path="/coe" element={<CoeDashboardPage />} />
                <Route path="/coe/examinations" element={<ExaminationsAdminPage basePath="/coe/examinations" />} />
                <Route path="/coe/examinations/:examId" element={<ExaminationDetailPage basePath="/coe/examinations" />} />
                <Route path="/coe/examinations/subjects/:examSubjectId/marks" element={<ExamMarksEntryPage />} />
                <Route path="/coe/eligibility" element={<CoeStatusPage title="Eligibility & Registration" subtitle="Eligibility computation, fee clearance signals, condonation, and registration readiness" />} />
                <Route path="/coe/timetable" element={<CoeStatusPage title="Timetable" subtitle="Scheduled subjects, pending dates, and calendar readiness" />} />
                <Route path="/coe/question-papers" element={<CoeQuestionPapersPage />} />
                <Route path="/coe/rooms-seating" element={<CoeStatusPage title="Rooms & Seating" subtitle="Room allocation, seating generation, and locked seating readiness" />} />
                <Route path="/coe/invigilation" element={<CoeStatusPage title="Invigilation" subtitle="Faculty duty assignment, conflict checks, and exam-day staffing readiness" />} />
                <Route path="/coe/hall-tickets" element={<CoeStatusPage title="Hall Tickets" subtitle="Eligible-student hall-ticket readiness and withheld controls" />} />
                <Route path="/coe/operations" element={<CoeStatusPage title="Exam Operations" subtitle="Exam-day operations, eligibility exceptions, seating locks, and marks locks" />} />
                <Route path="/coe/marks" element={<CoeStatusPage title="Marks" subtitle="Marks submission, verification, lock, unlock, import, and audit status" />} />
                <Route path="/coe/results" element={<CoeStatusPage title="Results" subtitle="Result processing, publication readiness, and student visibility controls" />} />
                <Route path="/coe/backlogs" element={<CoeStatusPage title="Backlogs" subtitle="Fail, incomplete, withheld, and supplementary readiness signals" />} />
                <Route path="/coe/revaluation" element={<CoeStatusPage title="Revaluation" subtitle="Student revaluation requests and finance-linked demand readiness" />} />
                <Route path="/coe/corrections" element={<CoeStatusPage title="Corrections" subtitle="Marks unlock reasons, corrections, withheld states, and audit trail review" />} />
                <Route path="/coe/reports" element={<CoeStatusPage title="Reports" subtitle="Exam, eligibility, marks, results, revaluation, and question-paper readiness reports" />} />
              </Route>
              <Route element={<LabLayout />}>
                <Route path="/lab" element={<LabDashboardPage />} />
                <Route path="/lab/labs" element={<LabsPage />} />
                <Route path="/lab/assets" element={<LabAssetsPage />} />
                <Route path="/lab/stock" element={<LabStockPage />} />
                <Route path="/lab/issues" element={<LabIssuesPage />} />
                <Route path="/lab/sessions" element={<LabSessionsPage />} />
                <Route path="/lab/faults" element={<LabFaultsPage />} />
                <Route path="/lab/software" element={<LabSoftwarePage />} />
                <Route path="/lab/requirements" element={<LabRequirementsPage />} />
                <Route path="/lab/reports" element={<LabReportsPage />} />
                <Route path="/lab/oversight" element={<LabOversightPage />} />
              </Route>
              <Route element={<MaintenanceLayout />}>
                <Route path="/maintenance" element={<MyTicketsPage />} />
                <Route path="/maintenance/new" element={<CreateTicketPage />} />
                <Route path="/maintenance/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/maintenance/work" element={<TechnicianWorkPage />} />
                <Route path="/maintenance/manager" element={<ManagerDashboardPage />} />
                <Route path="/maintenance/queue" element={<CentralQueuePage />} />
                <Route path="/maintenance/reports" element={<MaintenanceReportsPage />} />
                <Route path="/maintenance/config" element={<MaintenanceConfigPage />} />
              </Route>
              <Route element={<AdmissionsLayout />}>
                <Route path="/admissions" element={<AdmissionsDashboardPage />} />
                <Route path="/admissions/applications" element={<AdmissionsApplicationsPage />} />
                <Route path="/admissions/applications/:id" element={<AdmissionsApplicationReviewPage />} />
                <Route path="/admissions/documents" element={<AdmissionsApplicationsPage status="DOCUMENTS_PENDING" />} />
                <Route path="/admissions/eligibility" element={<AdmissionsApplicationsPage status="NEEDS_REVIEW" />} />
                <Route path="/admissions/selection" element={<AdmissionsApplicationsPage status="ELIGIBLE" />} />
                <Route path="/admissions/intake" element={<AdmissionsIntakePage />} />
                <Route path="/admissions/offers" element={<AdmissionsApplicationsPage status="OFFERED" />} />
                <Route path="/admissions/reports" element={<AdmissionsReportsPage />} />
                <Route path="/admissions/settings" element={<AdmissionsReportsPage />} />
              </Route>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/procurement" element={<ProcurementPage />} />
                <Route path="/hod" element={<HodDashboardPage />} />
                <Route path="/hod/faculty" element={<HodFacultyPage />} />
                <Route path="/hod/workload" element={<HodWorkloadPage />} />
                <Route path="/hod/allocation" element={<HodAllocationPage />} />
                <Route path="/hod/timetable" element={<HodTimetablePage />} />
                <Route path="/hod/attendance" element={<HodAttendancePage />} />
                <Route path="/hod/leave" element={<HodLeavePage />} />
                <Route path="/hod/progress" element={<HodProgressPage />} />
                <Route path="/hod/assessments" element={<HodAssessmentsPage />} />
                <Route path="/hod/results" element={<HodResultsPage />} />
                <Route path="/hod/continuity" element={<HodContinuityPage />} />
                <Route path="/hod/exceptions" element={<HodExceptionsPage />} />
                <Route path="/hod/reports" element={<HodReportsPage />} />
                <Route path="/hod/placement" element={<HodPlacementOversightPage />} />
                <Route path="/hod/clearance" element={<HodFnfClearancePage />} />
                <Route path="/hod/clearance/:id" element={<HodFnfClearanceDetailPage />} />
                <Route path="/principal" element={<PrincipalDashboardPage />} />
                <Route path="/principal/departments" element={<PrincipalDepartmentsPage />} />
                <Route path="/principal/departments/:id" element={<PrincipalDepartmentDetailPage />} />
                <Route path="/principal/hods" element={<PrincipalHodsPage />} />
                <Route path="/principal/faculty" element={<PrincipalFacultyPage />} />
                <Route path="/principal/students" element={<PrincipalStudentsPage />} />
                <Route path="/principal/progress" element={<PrincipalProgressPage />} />
                <Route path="/principal/attendance" element={<PrincipalAttendancePage />} />
                <Route path="/principal/timetable" element={<PrincipalTimetablePage />} />
                <Route path="/principal/assessments" element={<PrincipalAssessmentsPage />} />
                <Route path="/principal/results" element={<PrincipalResultsPage />} />
                <Route path="/principal/continuity" element={<PrincipalContinuityPage />} />
                <Route path="/principal/approvals" element={<PrincipalApprovalsPage />} />
                <Route path="/principal/exceptions" element={<PrincipalExceptionsPage />} />
                <Route path="/principal/reports" element={<PrincipalReportsPage />} />
                <Route path="/principal/placement" element={<PrincipalPlacementOversightPage />} />
                {/* Management & Executive Portal */}
                <Route path="/management" element={<ManagementOverviewPage />} />
                <Route path="/management/academics" element={<ManagementAcademicsPage />} />
                <Route path="/management/workforce" element={<ManagementWorkforcePage />} />
                <Route path="/management/recruitment" element={<ManagementRecruitmentPage />} />
                <Route path="/management/performance" element={<ManagementPerformancePage />} />
                <Route path="/management/ld" element={<ManagementLdPage />} />
                <Route path="/management/succession" element={<ManagementSuccessionPage />} />
                <Route path="/management/placement" element={<ManagementPlacementPage />} />
                <Route path="/management/finance" element={<ManagementFinancePage />} />
                <Route path="/management/payroll" element={<ManagementPayrollPage />} />
                <Route path="/management/campus" element={<ManagementCampusPage />} />
                <Route path="/management/approvals" element={<ManagementApprovalsPage />} />
                <Route path="/management/exceptions" element={<ManagementExceptionsPage />} />
                <Route path="/management/departments" element={<ManagementDepartmentsPage />} />
                <Route path="/management/departments/:id" element={<ManagementDepartmentDetailPage />} />
                <Route path="/management/reports" element={<ManagementReportsPage />} />
                <Route path="/timetable" element={<FacultyTimetablePage />} />
                <Route path="/timetable/builder" element={<AdminTimetablePage />} />
                <Route path="/examinations" element={<ExaminationsAdminPage />} />
                <Route path="/examinations/:examId" element={<ExaminationDetailPage />} />
                <Route path="/examinations/subjects/:examSubjectId/marks" element={<ExamMarksEntryPage />} />
                <Route path="/exam-duties" element={<FacultyExamDutiesPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseWorkspacePage />} />
                <Route path="/courses/:courseId/attendance" element={<CourseAttendancePage />} />
                <Route path="/classes" element={<AcademicClassesPage />} />
                <Route path="/classes/:id" element={<AcademicClassDetailPage />} />
                <Route path="/coordinator" element={<CoordinatorWorkspacePage />} />
                <Route path="/faculty-profile" element={<FacultyProfilePage />} />
                <Route path="/copo/hub" element={<AcademicMappingsHubPage />} />
                <Route path="/copo" element={<AcademicMappingsHubPage />} />
                <Route path="/copo/create" element={<CreateCopoMappingPage />} />
                <Route path="/copo/mappings/:id" element={<CopoMappingInstancePage />} />
                <Route path="/copo/pso" element={<AcademicMappingsHubPage />} />
                <Route path="/copo/pso/create" element={<CreateCopoMappingPage />} />
                <Route path="/copo/pso/mappings/:id" element={<CopoMappingInstancePage />} />
                <Route path="/copo/sdg" element={<AcademicMappingsHubPage />} />
                <Route path="/copo/sdg/create" element={<CreateCopoMappingPage />} />
                <Route path="/copo/sdg/mappings/:id" element={<CopoMappingInstancePage />} />
                <Route path="/copo/subjects/:courseId" element={<CopoSubjectPage />} />
                <Route path="/copo/outcomes" element={<CopoOutcomesPage />} />
                <Route path="/copo/programme-outcomes" element={<CopoProgrammeOutcomesPage />} />
                <Route path="/copo/program-specific-outcomes" element={<CopoProgramSpecificOutcomesPage />} />
                <Route path="/copo/sdgs" element={<CopoSdgPage />} />
                <Route path="/copo/mapping" element={<CopoMappingPage />} />
                <Route path="/copo/review" element={<CopoReviewPage />} />
                <Route path="/copo/analytics" element={<CopoAnalyticsPage />} />
                <Route path="/copo/reports" element={<CopoReportsPage />} />
                <Route path="/gap-analysis" element={<GapAnalysesPage />} />
                <Route path="/gap-analysis/create" element={<CreateGapAnalysisPage />} />
                <Route path="/gap-analysis/:id" element={<GapAnalysisDetailPage />} />
                <Route path="/beyond-syllabus" element={<BeyondSyllabusPlansPage />} />
                <Route path="/beyond-syllabus/create" element={<CreateBeyondSyllabusPlanPage />} />
                <Route path="/beyond-syllabus/:id" element={<BeyondSyllabusDetailPage />} />
                <Route path="/co-evaluation" element={<CoEvaluationsPage />} />
                <Route path="/co-evaluation/create" element={<CreateCoEvaluationPage />} />
                <Route path="/co-evaluation/:id" element={<CoEvaluationDetailPage />} />
                <Route path="/attainment" element={<AttainmentDashboardPage />} />
                <Route path="/attainment/calculate" element={<CourseAttainmentPage />} />
                <Route path="/attainment/marks" element={<MarksEntryPage />} />
                <Route path="/attainment/runs/:id" element={<AttainmentRunPage />} />
                <Route path="/attainment/cycles/:id" element={<ImprovementCyclePage />} />
                <Route path="/previous-year-papers" element={<PreviousYearPapersPage />} />
                <Route path="/previous-year-papers/questions" element={<PreviousYearQuestionsPage />} />
                <Route path="/previous-year-papers/questions/:id" element={<PreviousYearQuestionDetailPage />} />
                <Route path="/previous-year-papers/:id" element={<PreviousYearPaperDetailPage />} />
                <Route path="/course-textbooks" element={<CourseTextbookMasterPage />} />
                <Route path="/internal-question-papers" element={<InternalPapersPage />} />
                <Route path="/internal-question-papers/create" element={<CreateInternalPaperPage />} />
                <Route path="/internal-question-papers/:id/edit" element={<CreateInternalPaperPage />} />
                <Route path="/internal-question-papers/:id" element={<InternalPaperDetailPage />} />
                <Route path="/surveys" element={<SurveysPage />} />
                <Route path="/surveys/create" element={<CreateSurveyPage />} />
                <Route path="/surveys/:id" element={<SurveyDetailPage />} />
                <Route path="/quizzes" element={<QuizzesPage />} />
                <Route path="/quizzes/create" element={<CreateQuizPage />} />
                <Route path="/quizzes/bank" element={<QuizBankPage />} />
                <Route path="/quizzes/:id" element={<QuizDetailPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/assignments/create" element={<CreateAssignmentPage />} />
                <Route path="/assignments/bank" element={<AssignmentBankPage />} />
                <Route
                  path="/assignments/:id/submissions/:submissionId"
                  element={<AssignmentSubmissionEvalPage />}
                />
                <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
                <Route path="/lesson-plans" element={<LessonPlansPage />} />
                <Route path="/lesson-plans/create" element={<CreateLessonPlanPage />} />
                <Route path="/lesson-plans/:id" element={<LessonPlanDetailPage />} />
                <Route path="/question-bank" element={<QuestionBankPage />} />
                <Route path="/responses" element={<FacultyResponsesPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/student-services" element={<StaffServicesDashboardPage />} />
                <Route path="/student-services/action-center" element={<StaffActionCenterPage />} />
                <Route path="/student-services/requests/:id" element={<StaffRequestDetailPage />} />
                <Route path="/student-services/grievances" element={<StaffGrievancesPage />} />
                <Route path="/student-services/grievances/:id" element={<StaffGrievanceDetailPage />} />
                <Route path="/student-services/mentees" element={<StaffMenteesPage />} />
                <Route path="/mentoring" element={<MentorDashboardPage />} />
                <Route path="/mentoring/my-mentees" element={<MyMenteesPage />} />
                <Route path="/mentoring/requests" element={<LecturerRequestsPage />} />
                <Route path="/mentoring/requests/:id" element={<LecturerRequestDetailPage />} />
                <Route path="/mentoring/students/:id" element={<MentorStudent360Page />} />
                <Route path="/hod/mentoring" element={<HodMentoringPage />} />
                <Route path="/principal/mentoring" element={<PrincipalMentoringPage />} />
                <Route path="/management/mentoring" element={<ManagementMentoringPage />} />
                <Route path="/finance" element={<FinanceDashboardPage />} />
                <Route path="/finance/fee-structures" element={<FinanceFeeStructuresPage />} />
                <Route path="/finance/payments" element={<FinancePaymentsPage />} />
                <Route path="/finance/receipts" element={<FinanceReceiptsPage />} />
                <Route path="/finance/reports" element={<FinanceReportsPage />} />
                <Route path="/finance/students" element={<FinanceStudentSearchPage />} />
                <Route path="/finance/students/:studentId" element={<FinanceStudentDetailPage />} />
                <Route path="/library" element={<LibraryDashboardPage />} />
                <Route path="/library/my" element={<FacultyLibraryPage />} />
                <Route path="/library/circulation" element={<LibraryCirculationDeskPage />} />
                <Route path="/library/search" element={<LibrarySearchPage />} />
                <Route path="/library/reservations" element={<LibraryReservationsPage />} />
                <Route path="/library/fines" element={<LibraryFinesPage />} />
                <Route path="/library/inventory" element={<LibraryInventoryPage />} />
                <Route path="/library/reports" element={<LibraryReportsPage />} />
                <Route path="/hostel" element={<HostelWardenDashboardPage />} />
                <Route path="/hostel/applications" element={<HostelApplicationsPage />} />
                <Route path="/hostel/residents" element={<HostelResidentsPage />} />
                <Route path="/hostel/rooms" element={<HostelRoomsPage />} />
                <Route path="/hostel/complaints" element={<HostelComplaintsStaffPage />} />
                <Route path="/hostel/vacating" element={<HostelVacatingPage />} />
                <Route path="/hostel/gate" element={<HostelGateDashboardPage />} />
                <Route path="/hostel/operations" element={<HostelOperationsDashboardPage />} />
                <Route path="/hostel/management" element={<HostelManagementDashboardPage />} />
                <Route path="/transport" element={<TransportAdminDashboardPage />} />
                <Route path="/transport/applications" element={<TransportApplicationsPage />} />
                <Route path="/transport/routes" element={<TransportRoutesPage />} />
                <Route path="/transport/vehicles" element={<TransportVehiclesPage />} />
                <Route path="/transport/trips" element={<TransportTripsPage />} />
                <Route path="/transport/complaints" element={<TransportComplaintsStaffPage />} />
                <Route path="/transport/operations" element={<TransportOperationsDashboardPage />} />
                <Route path="/transport/management" element={<TransportManagementDashboardPage />} />
                <Route path="/transport/trip" element={<DriverTripPage />} />
                <Route path="/placements" element={<PlacementDashboardPage />} />
                <Route path="/placements/companies" element={<PlacementCompaniesPage />} />
                <Route path="/placements/opportunities" element={<PlacementOpportunitiesPage />} />
                <Route path="/placements/applications" element={<PlacementApplicationsPage />} />
                <Route path="/placements/offers" element={<PlacementOffersPage />} />
                <Route path="/placements/training" element={<PlacementTrainingAdminPage />} />
                <Route path="/placements/coordinators" element={<PlacementCoordinatorsPage />} />
                <Route path="/placements/coordinator" element={<CoordinatorPlacementDashboardPage />} />
                <Route path="/placements/training-admin" element={<TrainerPlacementDashboardPage />} />
                <Route path="/placements/management" element={<ManagementPlacementDashboardPage />} />
                <Route path="/recruiter" element={<RecruiterPlacementPage />} />
                <Route path="/hr" element={<HrSelfDashboardPage />} />
                <Route path="/hr/profile" element={<HrProfilePage />} />
                <Route path="/hr/attendance" element={<HrAttendancePage />} />
                <Route path="/hr/attendance/regularization" element={<HrRegularizationPage />} />
                <Route path="/hr/leave/apply" element={<HrApplyLeavePage />} />
                <Route path="/hr/payslips" element={<HrPayslipsPage />} />
                <Route path="/hr/service-history" element={<HrServiceHistoryPage />} />
                <Route path="/hr/resignation" element={<HrResignationPage />} />
                <Route path="/hr/separation" element={<HrMySeparationPage />} />
                <Route path="/hr/fnf" element={<HrFnfDashboardPage />} />
                <Route path="/hr/fnf/cases" element={<HrFnfCasesPage />} />
                <Route path="/hr/fnf/cases/:id" element={<HrFnfCaseDetailPage />} />
                <Route path="/hr/fnf/clearance" element={<HrFnfClearancePage />} />
                <Route path="/hr/fnf/calculations" element={<HrFnfCasesPage />} />
                <Route path="/hr/fnf/approvals" element={<HrFnfApprovalsPage />} />
                <Route path="/hr/fnf/finance" element={<HrFnfFinancePage />} />
                <Route path="/hr/fnf/documents" element={<HrFnfDocumentsPage />} />
                <Route path="/hr/fnf/reports" element={<HrFnfReportsPage />} />
                <Route path="/hr/me/performance" element={<HrMyPerformancePage />} />
                <Route path="/hr/me/performance/:id" element={<HrMyAppraisalDetailPage />} />
                <Route path="/hr/performance" element={<HrPerformanceDashboardPage />} />
                <Route path="/hr/performance/cycles" element={<HrAppraisalCyclesPage />} />
                <Route path="/hr/performance/templates" element={<HrAppraisalTemplatesPage />} />
                <Route path="/hr/performance/employees" element={<HrAppraisalEmployeesPage />} />
                <Route path="/hr/performance/calibration" element={<HrCalibrationPage />} />
                <Route path="/hr/performance/reports" element={<HrPerformanceReportsPage />} />
                <Route path="/hr/performance/team" element={<HrTeamPerformancePage />} />
                <Route path="/hr/performance/team/goals" element={<HrTeamPendingGoalsPage />} />
                <Route path="/hr/performance/team/reviews" element={<HrTeamPendingReviewsPage />} />
                <Route path="/hr/performance/team/appraisals/:id" element={<HrTeamReviewPage />} />
                <Route path="/hr/performance/department" element={<HrDepartmentPerformancePage />} />
                <Route path="/hr/performance/principal" element={<HrPrincipalPerformancePage />} />
                <Route path="/hr/recruitment" element={<HrRecruitmentDashboardPage />} />
                <Route path="/hr/recruitment/requisitions" element={<HrRecruitmentRequisitionsPage />} />
                <Route path="/hr/recruitment/requisitions/:id" element={<HrRecruitmentRequisitionDetailPage />} />
                <Route path="/hr/recruitment/openings" element={<HrRecruitmentOpeningsPage />} />
                <Route path="/hr/recruitment/openings/:id" element={<HrRecruitmentOpeningDetailPage />} />
                <Route path="/hr/recruitment/pipeline" element={<HrRecruitmentPipelinePage />} />
                <Route path="/hr/recruitment/candidates/:id" element={<HrRecruitmentCandidateDetailPage />} />
                <Route path="/hr/recruitment/interviews" element={<HrRecruitmentInterviewsPage />} />
                <Route path="/hr/recruitment/interviews/:id" element={<HrRecruitmentInterviewEvaluatePage />} />
                <Route path="/hr/recruitment/offers" element={<HrRecruitmentOffersPage />} />
                <Route path="/hr/recruitment/offers/:id" element={<HrRecruitmentOfferDetailPage />} />
                <Route path="/hr/recruitment/prejoining/:applicationId" element={<HrRecruitmentPreJoiningPage />} />
                <Route path="/hr/recruitment/joining/:applicationId" element={<HrRecruitmentJoiningPage />} />
                <Route path="/hr/recruitment/reports" element={<HrRecruitmentReportsPage />} />
                <Route path="/hr/recruitment/hod" element={<HrRecruitmentHodPage />} />
                <Route path="/hr/recruitment/my-interviews" element={<HrRecruitmentMyInterviewsPage />} />
                <Route path="/hr/admin" element={<HrAdminDashboardPage />} />
                <Route path="/hr/admin/employees/new" element={<HrCreateEmployeePage />} />
                <Route path="/hr/admin/employees/:id" element={<HrAdminEmployee360Page />} />
                <Route path="/hr/admin/employees" element={<HrAdminEmployeesPage />} />
                <Route path="/hr/admin/onboarding" element={<HrOnboardingPage />} />
                <Route path="/hr/admin/leave" element={<HrManagerPage />} />
                <Route path="/hr/admin/attendance" element={<HrAdminAttendancePage />} />
                <Route path="/hr/admin/attendance/settings" element={<HrAttendanceSettingsPage />} />
                <Route path="/hr/admin/attendance/holidays" element={<HrAttendanceHolidaysPage />} />
                <Route path="/hr/manager" element={<HrManagerPage />} />
                <Route path="/hr/manager/attendance" element={<HrManagerAttendancePage />} />
                <Route path="/hr/payroll" element={<HrPayrollDashboardPage />} />
                <Route path="/hr/payroll/runs" element={<HrPayrollRunsPage />} />
                <Route path="/hr/payroll/runs/:id" element={<HrPayrollRunDetailPage />} />
                <Route path="/hr/payroll/runs/:id/employees/:employeeId" element={<HrPayrollEmployeeDetailPage />} />
                <Route path="/hr/payroll/structures" element={<HrSalaryStructuresPage />} />
                <Route path="/hr/payroll/adjustments" element={<HrPayrollAdjustmentsPage />} />
                <Route path="/hr/payroll/reports" element={<HrPayrollReportsPage />} />
                <Route path="/hr/management" element={<HrManagementPage />} />
                <Route path="/hr/analytics" element={<HrAnalyticsOverviewPage />} />
                <Route path="/hr/analytics/workforce" element={<HrWorkforceAnalyticsPage />} />
                <Route path="/hr/analytics/attendance" element={<HrAttendanceAnalyticsPage />} />
                <Route path="/hr/analytics/payroll" element={<HrPayrollAnalyticsPage />} />
                <Route path="/hr/analytics/recruitment" element={<HrRecruitmentAnalyticsPage />} />
                <Route path="/hr/analytics/performance" element={<HrPerformanceAnalyticsPage />} />
                <Route path="/hr/analytics/separation" element={<HrSeparationAnalyticsPage />} />
                <Route path="/hr/analytics/data-quality" element={<HrDataQualityPage />} />
                <Route path="/hr/learning" element={<LdMyLearningPage />} />
                <Route path="/hr/learning/plan" element={<LdDevelopmentPlanPage />} />
                <Route path="/hr/learning/catalogue" element={<LdCataloguePage />} />
                <Route path="/hr/learning/programs" element={<LdMyProgramsPage />} />
                <Route path="/hr/learning/certificates" element={<LdCertificatesPage />} />
                <Route path="/hr/learning/history" element={<LdHistoryPage />} />
                <Route path="/hr/learning/team" element={<LdTeamDevelopmentPage />} />
                <Route path="/hr/ld" element={<LdAdminDashboardPage />} />
                <Route path="/hr/ld/programs" element={<LdProgramsPage />} />
                <Route path="/hr/ld/programs/:id" element={<LdProgramDetailPage />} />
                <Route path="/hr/ld/compliance" element={<LdCompliancePage />} />
                <Route path="/hr/succession" element={<SuccessionDashboardPage />} />
                <Route path="/hr/succession/roles" element={<SuccessionRolesPage />} />
                <Route path="/hr/succession/roles/:id" element={<SuccessionRoleDetailPage />} />
                <Route path="/hr/succession/matrix" element={<SuccessionMatrixPage />} />
                <Route path="/hr/succession/pools" element={<SuccessionPoolsPage />} />
                <Route path="/hr/succession/actions" element={<SuccessionActionsPage />} />
                <Route path="/hr/succession/reports" element={<SuccessionReportsPage />} />
                <Route path="/hr/succession/team" element={<SuccessionTeamTalentPage />} />
                <Route path="/hr/succession/me" element={<SuccessionMyDevelopmentPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
