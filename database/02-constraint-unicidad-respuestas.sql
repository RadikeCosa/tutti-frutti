-- Constraint de unicidad para prevenir que un jugador tenga dos respuestas para la misma categoría en la misma ronda
-- Previene duplicados en (ronda_id, jugador_id, categoria_index)
ALTER TABLE respuestas 
ADD CONSTRAINT unique_respuesta_por_jugador_ronda_categoria 
UNIQUE (ronda_id, jugador_id, categoria_index);
