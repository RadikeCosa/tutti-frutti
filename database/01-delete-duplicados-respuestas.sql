-- Eliminar duplicados existentes antes de agregar el constraint de unicidad
DELETE FROM respuestas a USING (
  SELECT MIN(id::text)::uuid as id, ronda_id, jugador_id, categoria_index
  FROM respuestas 
  GROUP BY ronda_id, jugador_id, categoria_index
  HAVING COUNT(*) > 1
) b
WHERE a.ronda_id = b.ronda_id 
  AND a.jugador_id = b.jugador_id 
  AND a.categoria_index = b.categoria_index
  AND a.id <> b.id;