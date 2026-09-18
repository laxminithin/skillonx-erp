import { Navigate } from 'react-router-dom';
import { AcademicMappingsHubPage } from './AcademicMappingsHubPage';

/** Legacy per-kind hub — redirects into the unified Academic Mappings list. */
export function CopoHubPage({
  basePath = '/copo',
  admin = false,
}: {
  basePath?: string;
  admin?: boolean;
  kind?: 'PO' | 'PSO' | 'SDG';
}) {
  const root = basePath.replace(/\/(pso|sdg)$/, '') || '/copo';
  return <AcademicMappingsHubPage basePath={root} admin={admin} />;
}

export function RedirectToAcademicMappings({ to = '/copo' }: { to?: string }) {
  return <Navigate to={to} replace />;
}
