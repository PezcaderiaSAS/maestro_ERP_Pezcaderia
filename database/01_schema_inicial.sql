-- 01_schema_inicial.sql
-- Inicialización de base de datos de grado empresarial para La Pezcadería ERP

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TIPOS CUSTOM (ENUMS)
CREATE TYPE tipo_persona AS ENUM ('NATURAL', 'JURIDICA');
CREATE TYPE tipo_identificacion AS ENUM ('NIT', 'CC', 'CE');
CREATE TYPE forma_pago AS ENUM ('CREDITO', 'CONTADO');
CREATE TYPE tipo_entrega AS ENUM ('EN_RUTA', 'INMEDIATA', 'RECOGEN');
CREATE TYPE estado_pedido AS ENUM ('CREADO', 'LISTO', 'FACTURADO', 'ANULADO');
CREATE TYPE estado_compra AS ENUM ('SOLICITADO', 'RECIBIDO', 'ANULADO');
CREATE TYPE siigo_status AS ENUM ('PENDIENTE', 'ENVIADO', 'FALLIDO', 'NO_REQUERIDO');
CREATE TYPE categoria_gasto_ruta AS ENUM ('COMBUSTIBLE', 'PEAJES', 'PARQUEADERO', 'MANTENIMIENTO', 'OTROS');

-- 2. TABLAS BASE Y SUBTIPOS (MODELO UNIFIED PARTY / TERCEROS)

-- Tabla Padre: terceros
CREATE TABLE terceros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_persona tipo_persona NOT NULL DEFAULT 'NATURAL',
    tipo_identificacion tipo_identificacion NOT NULL DEFAULT 'CC',
    identificacion VARCHAR(20) UNIQUE NOT NULL,
    nombre_razon_social VARCHAR(255) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    celular VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    ciudad VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Subtipo: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES terceros(id) ON DELETE RESTRICT,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('ADMIN', 'VENDEDOR', 'FACTURADOR', 'BODEGUERO', 'CONDUCTOR')),
    pin_acceso VARCHAR(60), -- PIN encriptado (ej. bcrypt)
    google_uid VARCHAR(255) UNIQUE,
    activo BOOLEAN DEFAULT TRUE
);

-- Subtipo: clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY REFERENCES terceros(id) ON DELETE RESTRICT,
    vendedor_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
    tipo_precio VARCHAR(20) NOT NULL DEFAULT 'POS' CHECK (tipo_precio IN ('POS', 'RESTAURANTE', 'MAYORISTA')),
    encargado_compras VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE
);

-- Subtipo: proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY REFERENCES terceros(id) ON DELETE RESTRICT,
    contacto_compras VARCHAR(100),
    plazo_pago_dias INTEGER DEFAULT 0 CHECK (plazo_pago_dias >= 0),
    activo BOOLEAN DEFAULT TRUE
);

-- Subtipo: conductores
CREATE TABLE conductores (
    id UUID PRIMARY KEY REFERENCES terceros(id) ON DELETE RESTRICT,
    licencia_conduccion VARCHAR(50) NOT NULL,
    celular_corporativo VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE
);

-- 3. TABLAS DE MAESTROS (PRODUCTOS Y BODEGAS)

-- Tabla: productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    precio_compra NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (precio_compra >= 0),
    precio_venta_pos NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (precio_venta_pos >= 0),
    precio_venta_restaurante NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (precio_venta_restaurante >= 0),
    precio_venta_mayorista NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (precio_venta_mayorista >= 0),
    buffer_seguridad NUMERIC(5,2) DEFAULT 0.00 CHECK (buffer_seguridad >= 0),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: bodegas
CREATE TABLE bodegas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    ubicacion VARCHAR(255),
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla Relacional N:M: stock_bodegas
CREATE TABLE stock_bodegas (
    bodega_id UUID REFERENCES bodegas(id) ON DELETE RESTRICT,
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (bodega_id, producto_id)
);

-- 4. CONFIGURACIÓN DEL SISTEMA
CREATE TABLE configuracion_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siigo_api_key VARCHAR(255),
    siigo_username VARCHAR(255),
    siigo_partner_id VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar registro de configuración por defecto
INSERT INTO configuracion_sistema (id) VALUES (uuid_generate_v4());
