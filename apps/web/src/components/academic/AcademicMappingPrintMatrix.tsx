export type PrintMatrixColumn = {
  id: number;
  code: string;
};

export type PrintMatrixRow = {
  id: number;
  code: string;
};

type AcademicMappingPrintMatrixProps = {
  title: string;
  legend: string;
  rows: PrintMatrixRow[];
  columns: PrintMatrixColumn[];
  cellValue: (rowId: number, columnId: number) => string | number | null | undefined;
};

/** Shared print matrix for CO–PO / CO–PSO / CO–SDG with dynamic target columns. */
export function AcademicMappingPrintMatrix({
  title,
  legend,
  rows,
  columns,
  cellValue,
}: AcademicMappingPrintMatrixProps) {
  return (
    <section className="academic-print-matrix">
      <h2>{title}</h2>
      <p className="academic-print-matrix__legend">{legend}</p>
      <table>
        <thead>
          <tr>
            <th>CO</th>
            {columns.map((col) => (
              <th key={col.id}>{col.code}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="text-left">{row.code}</td>
              {columns.map((col) => {
                const v = cellValue(row.id, col.id);
                return <td key={col.id}>{v == null || v === '' ? '—' : v}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
