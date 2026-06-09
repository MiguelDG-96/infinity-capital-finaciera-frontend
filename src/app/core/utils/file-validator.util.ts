export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const ALLOWED_DOC_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, 'pdf'];

export function validateFileClientSide(file: File | null | undefined, requireImage: boolean = false): string | null {
  if (!file) return 'No se seleccionó ningún archivo.';

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) return 'El archivo no tiene una extensión válida.';

  const isAllowedExt = requireImage 
    ? ALLOWED_IMAGE_EXTENSIONS.includes(extension)
    : ALLOWED_DOC_EXTENSIONS.includes(extension);

  if (!isAllowedExt) {
    return requireImage 
      ? `Solo se permiten imágenes (${ALLOWED_IMAGE_EXTENSIONS.join(', ')}).`
      : `Solo se permiten imágenes o PDF (${ALLOWED_DOC_EXTENSIONS.join(', ')}).`;
  }

  // Basic MIME check
  if (requireImage && file.type === 'application/pdf') {
    return 'El formato PDF no está permitido para esta foto.';
  }

  return null; // Null means no error (valid)
}
