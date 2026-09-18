/**
 * Rebuild Previous_Year_Question_Paper_Master.xlsx from source PDFs.
 *
 * Dry-run / Excel-first path — does NOT write to the active PYQ database.
 *
 * Artifacts:
 *   - apps/web/public/Previous_Year_Question_Paper_Master.xlsx
 *   - apps/api/reports/pyq_manifest.csv
 *   - apps/api/reports/pyq_anomalies.csv
 *   - apps/api/reports/PYQ_EXTRACTION_ANOMALIES.xlsx
 *   - apps/api/reports/pyq_index_crosscheck.csv
 *   - apps/api/reports/pyq_qa_summary.json
 */
import { extractAllPapers, buildMasterPayload, writeMasterWorkbook } from '../modules/questionPapers/extractPipeline.js';
import { defaultMasterPath } from '../modules/questionPapers/discover.js';
import { generatePyqReports } from './pyqReports.js';

async function main() {
  const extracted = await extractAllPapers();
  const payload = buildMasterPayload(extracted);
  const dest = defaultMasterPath();
  await writeMasterWorkbook(payload, dest);

  const { summary, anomalies } = await generatePyqReports();

  console.log(
    JSON.stringify(
      {
        dest,
        papers: payload.papers.length,
        questions: payload.questions.length,
        subquestions: payload.subquestions.length,
        masterRows: payload.masterBank.length,
        orPairs: new Set(
      payload.masterBank.map((r) => `${r.paperId}|${r.orPairId}`).filter((k) => !k.endsWith('|null') && !k.endsWith('|')),
    ).size,
        qaSummary: summary,
        anomalyCount: anomalies.length,
        dbWrites: 'NONE — Excel-first rebuild only; active PYQ tables untouched',
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
