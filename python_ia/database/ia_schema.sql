-- ================================================
-- GAM — Schema completo del módulo IA Predictiva
-- Ejecutar una sola vez sobre gams_mantenimiento
-- ================================================

-- Versiones del modelo
CREATE TABLE IF NOT EXISTS ia_modelo_versiones (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  version          VARCHAR(20)  NOT NULL,
  modelo_ganador   VARCHAR(50),
  fecha            DATETIME     DEFAULT CURRENT_TIMESTAMP,
  equipos_usados   INT          DEFAULT 0,
  filas_dataset    INT          DEFAULT 0,
  accuracy         DECIMAL(6,4) DEFAULT 0,
  precision_score  DECIMAL(6,4) DEFAULT 0,
  recall           DECIMAL(6,4) DEFAULT 0,
  f1               DECIMAL(6,4) DEFAULT 0,
  roc_auc          DECIMAL(6,4) DEFAULT 0,
  metricas_json    JSON,
  features_json    JSON,
  comparacion_json JSON,
  activa           TINYINT(1)   DEFAULT 0,
  notas            TEXT,
  INDEX idx_activa (activa),
  INDEX idx_fecha  (fecha)
);

-- Predicciones por equipo
CREATE TABLE IF NOT EXISTS ia_predicciones (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id        INT          NOT NULL,
  version_modelo   VARCHAR(20),
  fecha            DATETIME     DEFAULT CURRENT_TIMESTAMP,
  probabilidad     DECIMAL(5,2) DEFAULT 0,
  nivel_riesgo     VARCHAR(20),
  dias_estimados   INT          DEFAULT 0,
  anomalia         TINYINT(1)   DEFAULT 0,
  shap_json        JSON,
  explicacion_json JSON,
  FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  INDEX idx_equipo  (equipo_id),
  INDEX idx_fecha   (fecha),
  INDEX idx_nivel   (nivel_riesgo)
);

-- Órdenes de mantenimiento generadas por la IA
CREATE TABLE IF NOT EXISTS ia_ordenes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id      INT          NOT NULL,
  prediccion_id  INT          NULL,
  fecha_generada DATETIME     DEFAULT CURRENT_TIMESTAMP,
  fecha_sugerida DATE,
  nivel_riesgo   VARCHAR(20),
  probabilidad   DECIMAL(5,2) DEFAULT 0,
  motivo         TEXT,
  estado         ENUM('PENDIENTE','APROBADA','RECHAZADA','EJECUTADA') DEFAULT 'PENDIENTE',
  aprobada_por   INT          NULL,
  fecha_accion   DATETIME     NULL,
  FOREIGN KEY (equipo_id)     REFERENCES equipos(id) ON DELETE CASCADE,
  FOREIGN KEY (prediccion_id) REFERENCES ia_predicciones(id) ON DELETE SET NULL,
  INDEX idx_equipo  (equipo_id),
  INDEX idx_estado  (estado),
  INDEX idx_fecha   (fecha_generada)
);

-- Notificaciones del sistema
CREATE TABLE IF NOT EXISTS notificaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT          NOT NULL,
  tipo        VARCHAR(50),
  titulo      VARCHAR(255),
  mensaje     TEXT,
  leida       TINYINT(1)   DEFAULT 0,
  fecha       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  datos_json  JSON,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_leida   (leida),
  INDEX idx_fecha   (fecha)
);