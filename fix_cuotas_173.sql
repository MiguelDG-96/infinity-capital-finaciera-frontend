-- =========================================================
-- CORRECCIÓN: Crédito refinanciado ID=173 (RAQUEL LÓPEZ)
-- Problema: total_cuota NO incluye cargo_refinanciamiento en cuotas con penalidad
-- =========================================================

-- Verificar estado actual antes de corregir:
SELECT 
  id, 
  numero_cuota,
  capital, 
  interes, 
  penalidad, 
  cargo_refinanciamiento,
  total_cuota,
  (capital + interes + COALESCE(penalidad, 0) + COALESCE(cargo_refinanciamiento, 0)) AS total_correcto,
  (capital + interes + COALESCE(penalidad, 0) + COALESCE(cargo_refinanciamiento, 0)) - total_cuota AS diferencia
FROM cuotas
WHERE credito_id = 173
ORDER BY numero_cuota;

-- =========================================================
-- CORRECCIÓN: Actualizar total_cuota = capital + interes + penalidad + cargo_refinanciamiento
-- Solo para cuotas donde hay discrepancia (donde total_cuota no incluyó cargo_refinanciamiento)
-- =========================================================

UPDATE cuotas
SET total_cuota = ROUND(
    capital + 
    COALESCE(interes, 0) + 
    COALESCE(penalidad, 0) + 
    COALESCE(cargo_refinanciamiento, 0), 2
)
WHERE credito_id = 173
  AND cargo_refinanciamiento IS NOT NULL
  AND cargo_refinanciamiento > 0
  AND ABS(
        (capital + COALESCE(interes, 0) + COALESCE(penalidad, 0) + COALESCE(cargo_refinanciamiento, 0)) 
        - total_cuota
      ) > 0.01;

-- Verificar resultado post-corrección:
SELECT 
  id, 
  numero_cuota,
  capital, 
  interes, 
  penalidad, 
  cargo_refinanciamiento,
  total_cuota AS total_cuota_nuevo,
  estado_cuota
FROM cuotas
WHERE credito_id = 173
ORDER BY numero_cuota;

-- =========================================================
-- NOTA: Si deseas aplicar la misma corrección a TODOS los créditos refinanciados
-- que tienen este mismo bug (total sin incluir cargo_refinanciamiento):
-- =========================================================
/*
UPDATE cuotas
SET total_cuota = ROUND(
    capital + 
    COALESCE(interes, 0) + 
    COALESCE(penalidad, 0) + 
    COALESCE(cargo_refinanciamiento, 0), 2
)
WHERE cargo_refinanciamiento IS NOT NULL
  AND cargo_refinanciamiento > 0
  AND ABS(
        (capital + COALESCE(interes, 0) + COALESCE(penalidad, 0) + COALESCE(cargo_refinanciamiento, 0)) 
        - total_cuota
      ) > 0.01;
*/
