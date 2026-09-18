type AcademicPrintCoverProps = {
  documentTitle: string;
  institutionName?: string | null;
  logoUrl?: string | null;
  departmentName?: string | null;
  programName?: string | null;
  subjectName: string;
  subjectCode: string;
  schemeName?: string | null;
  semesterLabel?: string | null;
  academicYearLabel?: string | null;
  preparedBy?: string | null;
  status?: string | null;
  dateLabel?: string | null;
};

/** Shared Lesson-Plan-style academic print cover for mappings and lesson plans. */
export function AcademicPrintCover({
  documentTitle,
  institutionName,
  logoUrl,
  departmentName,
  programName,
  subjectName,
  subjectCode,
  schemeName,
  semesterLabel,
  academicYearLabel,
  preparedBy,
  status,
  dateLabel,
}: AcademicPrintCoverProps) {
  return (
    <section className="academic-print-cover">
      <div className="academic-print-cover__brand">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="academic-print-cover__logo" />
        ) : (
          <div className="academic-print-cover__logo-placeholder" aria-hidden />
        )}
        <div>
          <p className="academic-print-cover__institution">{institutionName || 'Institution'}</p>
          {(departmentName || programName) && (
            <p className="academic-print-cover__dept">
              {[departmentName, programName].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <h1 className="academic-print-cover__title">{documentTitle}</h1>

      <dl className="academic-print-cover__meta">
        <div>
          <dt>Subject</dt>
          <dd>{subjectName}</dd>
        </div>
        <div>
          <dt>Course Code</dt>
          <dd>{subjectCode}</dd>
        </div>
        <div>
          <dt>Scheme</dt>
          <dd>{schemeName || '—'}</dd>
        </div>
        <div>
          <dt>Semester</dt>
          <dd>{semesterLabel || '—'}</dd>
        </div>
        <div>
          <dt>Academic Year</dt>
          <dd>{academicYearLabel || '—'}</dd>
        </div>
        <div>
          <dt>Prepared By</dt>
          <dd>{preparedBy || '—'}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{status || '—'}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{dateLabel || '—'}</dd>
        </div>
      </dl>
    </section>
  );
}
