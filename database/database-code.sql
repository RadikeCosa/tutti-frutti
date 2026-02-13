-- Crear enum para estado de sala
CREATE TYPE sala_estado AS ENUM ('lobby', 'jugando', 'puntuando', 'resultado_ronda', 'finalizada');

-- Crear enum para estado de ronda
CREATE TYPE ronda_estado AS ENUM ('escribiendo', 'puntuando', 'completada');

-- Tabla salas
CREATE TABLE salas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_invitacion char(6) UNIQUE NOT NULL,
  organizador_id uuid NOT NULL,
  categorias text[] NOT NULL,
  estado sala_estado NOT NULL DEFAULT 'lobby',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla jugadores
CREATE TABLE jugadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id uuid NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  es_organizador boolean NOT NULL DEFAULT false,
  listo boolean NOT NULL DEFAULT false,
  puntos_acumulados integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla rondas
CREATE TABLE rondas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id uuid NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  numero_ronda integer NOT NULL,
  letra char(1) NOT NULL,
  estado ronda_estado NOT NULL DEFAULT 'escribiendo',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla respuestas
CREATE TABLE respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id uuid NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  ronda_id uuid NOT NULL REFERENCES rondas(id) ON DELETE CASCADE,
  categoria_index integer NOT NULL CHECK (categoria_index >= 0 AND categoria_index <= 4),
  texto text,
  puntos integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla para sugerencias de categorías por admin
CREATE TABLE categorias_sugeridas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  creador_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar Realtime si se desea (opcional)
-- alter publication supabase_realtime add table categorias_sugeridas;

-- Habilitar Realtime en las 4 tablas
alter publication supabase_realtime add table salas;
alter publication supabase_realtime add table jugadores;
alter publication supabase_realtime add table rondas;
alter publication supabase_realtime add table respuestas;

-- Índices para mejorar performance
CREATE INDEX idx_jugadores_sala_id ON jugadores(sala_id);
CREATE INDEX idx_rondas_sala_id ON rondas(sala_id);
CREATE INDEX idx_respuestas_jugador_id ON respuestas(jugador_id);
CREATE INDEX idx_respuestas_ronda_id ON respuestas(ronda_id);

CREATE INDEX idx_categorias_sugeridas_creador_id ON categorias_sugeridas(creador_id);


-- Eliminar duplicados existentes antes de agregar el constraint de unicidad
DELETE FROM respuestas a USING (
  SELECT MIN(id) as id, ronda_id, jugador_id, categoria_index
  FROM respuestas 
  GROUP BY ronda_id, jugador_id, categoria_index
  HAVING COUNT(*) > 1
) b
WHERE a.ronda_id = b.ronda_id 
  AND a.jugador_id = b.jugador_id 
  AND a.categoria_index = b.categoria_index
  AND a.id <> b.id;

-- Constraint de unicidad para prevenir que un jugador tenga dos respuestas para la misma categoría en la misma ronda
-- Previene duplicados en (ronda_id, jugador_id, categoria_index)
ALTER TABLE respuestas 
ADD CONSTRAINT unique_respuesta_por_jugador_ronda_categoria 
UNIQUE (ronda_id, jugador_id, categoria_index);

-- Habilitar RLS
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rondas ENABLE ROW LEVEL SECURITY;
ALTER TABLE respuestas ENABLE ROW LEVEL SECURITY;

ALTER TABLE categorias_sugeridas ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (todos pueden leer todo por ahora)
CREATE POLICY "Enable read access for all users" ON salas FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON jugadores FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON rondas FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON respuestas FOR SELECT USING (true);

-- Todos pueden leer todas las sugerencias
CREATE POLICY "Read all category suggestions" ON categorias_sugeridas FOR SELECT USING (true);

-- Políticas de insert (todos pueden insertar por ahora)
CREATE POLICY "Enable insert for all users" ON salas FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON jugadores FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON rondas FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON respuestas FOR INSERT WITH CHECK (true);

-- Cualquier usuario autenticado puede insertar sugerencias
CREATE POLICY "Insert any category suggestion" ON categorias_sugeridas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas de update (todos pueden actualizar por ahora)
CREATE POLICY "Enable update for all users" ON salas FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON jugadores FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON rondas FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON respuestas FOR UPDATE USING (true);

-- Solo el creador puede borrar sus sugerencias
CREATE POLICY "Delete own category suggestions" ON categorias_sugeridas FOR DELETE USING (auth.uid() = creador_id);