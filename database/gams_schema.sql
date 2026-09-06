
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `areas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `estado` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `asignaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asignaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `fecha_asignacion` date DEFAULT NULL,
  `fecha_devolucion` date DEFAULT NULL,
  `estado` tinyint(4) DEFAULT 1,
  `observaciones_devolucion` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `asignaciones_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `asignaciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auditoria` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `accion` varchar(100) DEFAULT NULL,
  `tabla_afectada` varchar(100) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `auditoria_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bajas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `fecha_baja` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `bajas_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `bajas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cargos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cargos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `area_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `area_id` (`area_id`),
  CONSTRAINT `cargos_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proveedor_id` int(11) DEFAULT NULL,
  `nro_factura` varchar(80) DEFAULT NULL,
  `fecha_compra` date NOT NULL,
  `fecha_recepcion` date DEFAULT NULL,
  `estado` enum('PENDIENTE','RECIBIDA','CANCELADA') DEFAULT 'PENDIENTE',
  `total` decimal(10,2) DEFAULT 0.00,
  `observaciones` text DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `proveedor_id` (`proveedor_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `compras_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compras_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `compra_id` int(11) NOT NULL,
  `repuesto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unit` decimal(10,2) DEFAULT 0.00,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `compra_id` (`compra_id`),
  KEY `repuesto_id` (`repuesto_id`),
  CONSTRAINT `compras_detalle_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_detalle_ibfk_2` FOREIGN KEY (`repuesto_id`) REFERENCES `repuestos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `configuracion_ia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracion_ia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dias_alerta` int(11) DEFAULT 30,
  `umbral_probabilidad` decimal(5,2) DEFAULT 0.70,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `empleados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `estado` tinyint(4) DEFAULT 1,
  `rol_acceso` varchar(50) DEFAULT 'EMPLEADO',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `tipo_id` int(11) DEFAULT NULL,
  `marca_id` int(11) DEFAULT NULL,
  `modelo_id` int(11) DEFAULT NULL,
  `serial` varchar(100) DEFAULT NULL,
  `ram_id` int(11) DEFAULT NULL,
  `disco` varchar(50) DEFAULT NULL,
  `procesador` varchar(100) DEFAULT NULL,
  `so_id` int(11) DEFAULT NULL,
  `fecha_compra` date DEFAULT NULL,
  `ultima_revision` date DEFAULT NULL,
  `proximo_mantenimiento` date DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'DISPONIBLE',
  `dispositivo_id` varchar(100) DEFAULT NULL,
  `sucursal_id` int(11) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `tipo_adquisicion` varchar(50) DEFAULT NULL,
  `caracteristicas` text DEFAULT NULL,
  `proveedor` varchar(150) DEFAULT NULL,
  `fecha_adquisicion` date DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `informe_baja` text DEFAULT NULL,
  `fecha_baja` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `tipo_id` (`tipo_id`),
  KEY `marca_id` (`marca_id`),
  KEY `modelo_id` (`modelo_id`),
  KEY `ram_id` (`ram_id`),
  KEY `so_id` (`so_id`),
  CONSTRAINT `equipos_ibfk_1` FOREIGN KEY (`tipo_id`) REFERENCES `tipos_equipo` (`id`),
  CONSTRAINT `equipos_ibfk_2` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`),
  CONSTRAINT `equipos_ibfk_3` FOREIGN KEY (`modelo_id`) REFERENCES `modelos` (`id`),
  CONSTRAINT `equipos_ibfk_4` FOREIGN KEY (`ram_id`) REFERENCES `ram_catalogo` (`id`),
  CONSTRAINT `equipos_ibfk_5` FOREIGN KEY (`so_id`) REFERENCES `sistemas_operativos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `historial_equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historial_equipos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) DEFAULT NULL,
  `estado_anterior` varchar(50) DEFAULT NULL,
  `estado_nuevo` varchar(50) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `historial_equipos_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ia_entrenamientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ia_entrenamientos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_entrenamiento` datetime DEFAULT current_timestamp(),
  `version` varchar(50) DEFAULT NULL,
  `equipos_usados` int(11) DEFAULT NULL,
  `rf_accuracy` decimal(5,3) DEFAULT NULL,
  `rf_precision` decimal(5,3) DEFAULT NULL,
  `rf_recall` decimal(5,3) DEFAULT NULL,
  `reg_r2` decimal(5,3) DEFAULT NULL,
  `iso_contamination` decimal(5,3) DEFAULT NULL,
  `features_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features_json`)),
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ia_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ia_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orden_trabajo_id` int(11) NOT NULL,
  `equipo_id` int(11) NOT NULL,
  `prediccion_id` int(11) DEFAULT NULL,
  `prediccion_correcta` tinyint(1) DEFAULT NULL,
  `fallo_real` tinyint(1) DEFAULT NULL,
  `probabilidad_pred` decimal(5,2) DEFAULT NULL,
  `costo_real` decimal(10,2) DEFAULT NULL,
  `duracion_dias` int(11) DEFAULT NULL,
  `repuestos_qty` int(11) DEFAULT 0,
  `observaciones` text DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `usado_en_entrenamiento` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `orden_trabajo_id` (`orden_trabajo_id`),
  KEY `idx_equipo` (`equipo_id`),
  KEY `idx_usado` (`usado_en_entrenamiento`),
  CONSTRAINT `ia_feedback_ibfk_1` FOREIGN KEY (`orden_trabajo_id`) REFERENCES `ia_ordenes_trabajo` (`id`),
  CONSTRAINT `ia_feedback_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ia_mantenimientos_propuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ia_mantenimientos_propuestos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) NOT NULL,
  `prediccion_id` int(11) DEFAULT NULL,
  `fecha_propuesta` datetime DEFAULT current_timestamp(),
  `fecha_sugerida` date DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `nivel_riesgo` varchar(20) DEFAULT NULL,
  `probabilidad` decimal(5,2) DEFAULT NULL,
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO','EJECUTADO') DEFAULT 'PENDIENTE',
  `aprobado_por` int(11) DEFAULT NULL,
  `fecha_aprobacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  KEY `prediccion_id` (`prediccion_id`),
  CONSTRAINT `ia_mantenimientos_propuestos_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `ia_mantenimientos_propuestos_ibfk_2` FOREIGN KEY (`prediccion_id`) REFERENCES `ia_predicciones` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ia_modelo_versiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ia_modelo_versiones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version` varchar(20) NOT NULL,
  `modelo_ganador` varchar(50) DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `equipos_usados` int(11) DEFAULT NULL,
  `filas_dataset` int(11) DEFAULT NULL,
  `accuracy` decimal(6,4) DEFAULT NULL,
  `precision_score` decimal(6,4) DEFAULT NULL,
  `recall` decimal(6,4) DEFAULT NULL,
  `f1` decimal(6,4) DEFAULT NULL,
  `roc_auc` decimal(6,4) DEFAULT NULL,
  `metricas_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metricas_json`)),
  `features_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features_json`)),
  `comparacion_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`comparacion_json`)),
  `activa` tinyint(1) DEFAULT 0,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ia_orden_repuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ia_orden_repuestos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orden_id` int(11) NOT NULL,
  `repuesto_id` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  `precio_unit` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `orden_id` (`orden_id`),
  KEY `repuesto_id` (`repuesto_id`),
  CONSTRAINT `ia_orden_repuestos_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ia_ordenes_trabajo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ia_orden_repuestos_ibfk_2` FOREIGN KEY (`repuesto_id`) REFERENCES `repuestos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ia_ordenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ia_ordenes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) NOT NULL,
  `prediccion_id` int(11) DEFAULT NULL,
  `fecha_generada` datetime DEFAULT current_timestamp(),
  `fecha_sugerida` date DEFAULT NULL,
  `nivel_riesgo` varchar(20) DEFAULT NULL,
  `probabilidad` decimal(5,2) DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `estado` enum('PENDIENTE','APROBADA','RECHAZADA','EJECUTADA') DEFAULT 'PENDIENTE',
  `aprobada_por` int(11) DEFAULT NULL,
  `fecha_accion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `ia_ordenes_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=690 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ia_ordenes_trabajo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ia_ordenes_trabajo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orden_ia_id` int(11) NOT NULL,
  `mantenimiento_id` int(11) DEFAULT NULL,
  `equipo_id` int(11) NOT NULL,
  `tecnico_id` int(11) DEFAULT NULL,
  `aprobada_por` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_programada` date DEFAULT NULL,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `estado` enum('PROGRAMADO','EN_PROCESO','PAUSADO','FINALIZADO') DEFAULT 'PROGRAMADO',
  `observaciones` text DEFAULT NULL,
  `costo_final` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `orden_ia_id` (`orden_ia_id`),
  KEY `mantenimiento_id` (`mantenimiento_id`),
  KEY `aprobada_por` (`aprobada_por`),
  KEY `idx_tecnico` (`tecnico_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_equipo` (`equipo_id`),
  CONSTRAINT `ia_ordenes_trabajo_ibfk_1` FOREIGN KEY (`orden_ia_id`) REFERENCES `ia_ordenes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ia_ordenes_trabajo_ibfk_2` FOREIGN KEY (`mantenimiento_id`) REFERENCES `mantenimientos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ia_ordenes_trabajo_ibfk_3` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ia_ordenes_trabajo_ibfk_4` FOREIGN KEY (`tecnico_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ia_ordenes_trabajo_ibfk_5` FOREIGN KEY (`aprobada_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ia_predicciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ia_predicciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) NOT NULL,
  `fecha_prediccion` datetime DEFAULT current_timestamp(),
  `probabilidad_falla` decimal(5,2) DEFAULT NULL,
  `nivel_riesgo` varchar(20) DEFAULT NULL,
  `dias_estimados` int(11) DEFAULT NULL,
  `anomalia_detectada` tinyint(1) DEFAULT 0,
  `modelo_version` varchar(50) DEFAULT NULL,
  `features_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features_json`)),
  `explicacion_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`explicacion_json`)),
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `ia_predicciones_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1856 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inventario_categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventario_categorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inventario_movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventario_movimientos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repuesto_id` int(11) NOT NULL,
  `tipo` enum('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  `cantidad` int(11) NOT NULL,
  `stock_antes` int(11) DEFAULT 0,
  `stock_despues` int(11) DEFAULT 0,
  `motivo` varchar(200) DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `repuesto_id` (`repuesto_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `inventario_movimientos_ibfk_1` FOREIGN KEY (`repuesto_id`) REFERENCES `repuestos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventario_movimientos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lugares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lugares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `estado` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mantenimiento_historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mantenimiento_historial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mantenimiento_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `accion` varchar(80) NOT NULL,
  `estado_anterior` varchar(40) DEFAULT NULL,
  `estado_nuevo` varchar(40) DEFAULT NULL,
  `observacion` text DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mant` (`mantenimiento_id`),
  KEY `idx_fecha` (`fecha`),
  CONSTRAINT `mantenimiento_historial_ibfk_1` FOREIGN KEY (`mantenimiento_id`) REFERENCES `mantenimientos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mantenimiento_repuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mantenimiento_repuestos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mantenimiento_id` int(11) NOT NULL,
  `repuesto_id` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  `precio_unitario` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `mantenimiento_id` (`mantenimiento_id`),
  KEY `repuesto_id` (`repuesto_id`),
  CONSTRAINT `mantenimiento_repuestos_ibfk_1` FOREIGN KEY (`mantenimiento_id`) REFERENCES `mantenimientos` (`id`),
  CONSTRAINT `mantenimiento_repuestos_ibfk_2` FOREIGN KEY (`repuesto_id`) REFERENCES `repuestos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mantenimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mantenimientos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) DEFAULT NULL,
  `solicitud_id` int(11) DEFAULT NULL,
  `tipo` enum('PREVENTIVO','CORRECTIVO') DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_programada` date DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT NULL,
  `estado` enum('PENDIENTE','PENDIENTE_CONFIRMACION','PROGRAMADO','EN_PROCESO','PAUSADO','REPROGRAMAR','FINALIZADO','RECHAZADO') DEFAULT 'PENDIENTE',
  `descripcion_problema` text DEFAULT NULL,
  `descripcion_solucion` text DEFAULT NULL,
  `tecnico` varchar(150) DEFAULT NULL,
  `tecnico_usuario_id` int(11) DEFAULT NULL,
  `confirmado_por` int(11) DEFAULT NULL,
  `fecha_confirmacion` datetime DEFAULT NULL,
  `motivo_reprogramar` text DEFAULT NULL,
  `fecha_sugerida_rep` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  KEY `solicitud_id` (`solicitud_id`),
  KEY `tecnico_usuario_id` (`tecnico_usuario_id`),
  KEY `idx_mant_fecha_prog` (`fecha_programada`),
  CONSTRAINT `mantenimientos_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `mantenimientos_ibfk_2` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes_mantenimiento` (`id`),
  CONSTRAINT `mantenimientos_ibfk_3` FOREIGN KEY (`tecnico_usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `marcas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marcas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `modelos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modelos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `marca_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `marca_id` (`marca_id`),
  CONSTRAINT `modelos_ibfk_1` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `equipo_id` int(11) DEFAULT NULL,
  `titulo` varchar(150) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `tipo` enum('MANTENIMIENTO','ALERTA','IA','ASIGNACION') DEFAULT NULL,
  `leido` tinyint(4) DEFAULT 0,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `leida` tinyint(1) DEFAULT 0,
  `datos_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_json`)),
  `respuesta` enum('PENDIENTE','APROBADA','RECHAZADA') DEFAULT 'PENDIENTE',
  `respondida` tinyint(1) DEFAULT 0,
  `referencia_id` int(11) DEFAULT NULL,
  `referencia_tipo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1072 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `proveedores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `fecha` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `push_suscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `push_suscripciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` text NOT NULL,
  `auth` varchar(255) NOT NULL,
  `activa` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `push_suscripciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ram_catalogo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ram_catalogo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `repuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repuestos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `estado` tinyint(4) DEFAULT 1,
  `precio` decimal(10,2) DEFAULT 0.00,
  `categoria_id` int(11) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `stock_minimo` int(11) DEFAULT 5,
  `codigo` varchar(50) DEFAULT NULL,
  `unidad` varchar(30) DEFAULT 'unidad',
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  CONSTRAINT `repuestos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `inventario_categorias` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) DEFAULT NULL,
  `descripcion` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sistemas_operativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sistemas_operativos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `solicitudes_mantenimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solicitudes_mantenimiento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `tipo` enum('PREVENTIVO','CORRECTIVO') DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `prioridad` enum('BAJA','MEDIA','ALTA') DEFAULT 'MEDIA',
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO','EN_PROCESO','FINALIZADO','ATENDIDO') DEFAULT 'PENDIENTE',
  `fecha_solicitud` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `solicitudes_mantenimiento_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `solicitudes_mantenimiento_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sucursales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sucursales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estado` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tecnico_especialidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tecnico_especialidades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo_equipo_id` int(11) NOT NULL,
  `nivel` enum('JUNIOR','SENIOR','ESPECIALISTA') DEFAULT 'JUNIOR',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tec_tipo` (`usuario_id`,`tipo_equipo_id`),
  KEY `idx_tipo` (`tipo_equipo_id`),
  CONSTRAINT `tecnico_especialidades_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tecnico_especialidades_ibfk_2` FOREIGN KEY (`tipo_equipo_id`) REFERENCES `tipos_equipo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tipos_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tipos_equipo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `usuario_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario_roles` (
  `usuario_id` int(11) NOT NULL,
  `rol_id` int(11) NOT NULL,
  PRIMARY KEY (`usuario_id`,`rol_id`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `usuario_roles_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `usuario_roles_ibfk_2` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estado` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `area_id` int(11) DEFAULT NULL,
  `cargo_id` int(11) DEFAULT NULL,
  `sucursal_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuario_area` (`area_id`),
  KEY `fk_usuario_cargo` (`cargo_id`),
  KEY `fk_usuario_sucursal` (`sucursal_id`),
  CONSTRAINT `fk_usuario_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`),
  CONSTRAINT `fk_usuario_cargo` FOREIGN KEY (`cargo_id`) REFERENCES `cargos` (`id`),
  CONSTRAINT `fk_usuario_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`),
  CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`cargo_id`) REFERENCES `cargos` (`id`),
  CONSTRAINT `usuarios_ibfk_3` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

