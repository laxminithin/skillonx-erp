import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type ProductSurface = 'lecturer' | 'student' | 'admin';

export function productSuffix(surface: ProductSurface) {
  if (surface === 'student') return 'Student LMS · SkillonX';
  if (surface === 'admin') return 'Admin · SkillonX';
  return 'Lecturer LMS · SkillonX';
}

export function detectProductSurface(pathname: string): ProductSurface {
  if (pathname.startsWith('/lms') || pathname.startsWith('/join/')) return 'student';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'lecturer';
}

/**
 * Set the browser tab title as "<parts> · <Product> · SkillonX".
 * Product surface is inferred from the current route unless overridden.
 */
export function useDocumentTitle(...parts: Array<string | null | undefined | false | { surface?: ProductSurface }>) {
  const location = useLocation();
  const options =
    parts.length && typeof parts[parts.length - 1] === 'object' && parts[parts.length - 1] !== null
      ? (parts[parts.length - 1] as { surface?: ProductSurface })
      : null;
  const titleParts = options ? parts.slice(0, -1) : parts;
  const surface = options?.surface ?? detectProductSurface(location.pathname);
  const title = [...titleParts.filter((p) => typeof p === 'string' && p), productSuffix(surface)].join(' · ');

  useEffect(() => {
    document.title = title;
  }, [title]);
}
