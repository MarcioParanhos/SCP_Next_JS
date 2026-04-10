-- Cria a tabela principal de carências.
-- Cada registro representa um lançamento de carência (real ou temporária)
-- vinculado a uma unidade escolar e, opcionalmente, a um servidor, disciplina,
-- área pedagógica, motivo e curso (para carências profissionalizantes).
CREATE TABLE IF NOT EXISTS "carencias" (
    "id"             SERIAL PRIMARY KEY,
    "type"           "CarenciaType" NOT NULL DEFAULT 'REAL',
    "school_unit_id" INTEGER NOT NULL,
    "server_id"      INTEGER,
    "discipline_id"  INTEGER,
    "area_id"        INTEGER,
    "motive_id"      INTEGER,
    "course_id"      INTEGER,
    "startDate"      TIMESTAMP(3),
    "total"          INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Chaves estrangeiras para garantir integridade referencial
    CONSTRAINT "carencias_school_unit_id_fkey" FOREIGN KEY ("school_unit_id")  REFERENCES "school_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "carencias_server_id_fkey"      FOREIGN KEY ("server_id")       REFERENCES "employees"("id")    ON DELETE SET NULL  ON UPDATE CASCADE,
    CONSTRAINT "carencias_discipline_id_fkey"  FOREIGN KEY ("discipline_id")   REFERENCES "disciplines"("id")  ON DELETE SET NULL  ON UPDATE CASCADE,
    CONSTRAINT "carencias_area_id_fkey"        FOREIGN KEY ("area_id")         REFERENCES "carencia_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "carencias_motive_id_fkey"      FOREIGN KEY ("motive_id")       REFERENCES "carencia_motives"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "carencias_course_id_fkey"      FOREIGN KEY ("course_id")       REFERENCES "courses"("id")      ON DELETE SET NULL  ON UPDATE CASCADE
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS "carencias_school_unit_id_idx" ON "carencias"("school_unit_id");
CREATE INDEX IF NOT EXISTS "carencias_server_id_idx"      ON "carencias"("server_id");

-- Cria as linhas de detalhe de cada carência (por disciplina, área, motivo e turnos).
-- Cada carência pode ter zero ou mais linhas, permitindo lançar múltiplas disciplinas
-- em uma única carência.
CREATE TABLE IF NOT EXISTS "carencia_rows" (
    "id"          SERIAL PRIMARY KEY,
    "carencia_id" INTEGER NOT NULL,
    "discipline"  TEXT,
    "area"        TEXT,
    "reason"      TEXT,
    "morning"     INTEGER NOT NULL DEFAULT 0,
    "afternoon"   INTEGER NOT NULL DEFAULT 0,
    "night"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Deleção em cascata: ao remover uma carência, suas linhas são removidas
    CONSTRAINT "carencia_rows_carencia_id_fkey" FOREIGN KEY ("carencia_id") REFERENCES "carencias"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "carencia_rows_carencia_id_idx" ON "carencia_rows"("carencia_id");
