import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  Snowflake,
  FileText,
  Scale,
  Users,
  Box,
  DollarSign,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle2,
  Truck,
  TrendingUp,
  Layers,
  Search,
  RefreshCw,
  Printer,
  CreditCard,
  Clock,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

import {
  coldStorageRentalService,
  DEFAULT_EMPRESA_ID,
  type InventarioCustodiaItem,
  type MovimientoCustodiaItem,
  type CausacionAlquilerItem,
} from '../../services/coldStorageRentalService';
import { coldStoragePdfService } from '../../services/coldStoragePdfService';
import {
  calcularPosicionesNecesarias,
  calcularSobrecupoKg,
  calcularRecargoSobrecupo,
  calcularMermaSalida,
  liquidarCausacionAlquiler,
  calcularTaraYNetoExacto,
  calcularLiquidacionDias,
  evaluarCarteraYVencimiento,
  TARAS_PREDETERMINADAS_KG,
  type TipoEmpaqueCustodia,
  type ContratoAlquilerCf,
  type ClienteCustodia,
  type ProductoCustodia,
  type CuartoFrio,
} from '../../../packages/validation-schemas/src/coldStorageRental.schema';
import { cashService } from '../../services/cashService';
import type { MetodoPago } from '../../types/cash.types';

export const ColdStorageRentalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'operaciones' | 'existencias' | 'cartera' | 'contratos' | 'movimientos' | 'capacidad'
  >('operaciones');

  const [loading, setLoading] = useState(false);
  const [cuartosFrios, setCuartosFrios] = useState<CuartoFrio[]>([]);
  const [clientes, setClientes] = useState<ClienteCustodia[]>([]);
  const [productos, setProductos] = useState<ProductoCustodia[]>([]);
  const [contratos, setContratos] = useState<ContratoAlquilerCf[]>([]);
  const [inventario, setInventario] = useState<InventarioCustodiaItem[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCustodiaItem[]>([]);
  const [causaciones, setCausaciones] = useState<CausacionAlquilerItem[]>([]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClienteFilter, setSelectedClienteFilter] = useState('');

  // Modales
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [showRecepcionModal, setShowRecepcionModal] = useState(false);
  const [showDespachoModal, setShowDespachoModal] = useState(false);
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);

  // Selecciones para acciones
  const [selectedItemForDespacho, setSelectedItemForDespacho] = useState<InventarioCustodiaItem | null>(null);
  const [cobroData, setCobroData] = useState<{
    clienteId: string;
    clienteNombre: string;
    contratoId?: string;
    causacionId?: string;
    monto: number;
    concepto: string;
    modalidad: 'DIAS' | 'MESES';
    dias?: number;
    kilos?: number;
  } | null>(null);

  // Estados de formularios
  const [nuevoCliente, setNuevoCliente] = useState({
    razon_social: '',
    numero_identificacion: '',
    tipo_identificacion: 'NIT',
    responsable_contacto: '',
    telefono: '',
    email: '',
    modalidad_preferida: 'MESES' as 'DIAS' | 'MESES',
    tarifa_acordada: 650000,
    posiciones: 1,
  });

  const [nuevoContrato, setNuevoContrato] = useState({
    cliente_id: '',
    cuarto_frio_id: '',
    modalidad_tiempo: 'MESES' as 'DIAS' | 'MESES',
    posiciones_contratadas: 1,
    tarifa_unitaria: 650000,
    tarifa_recargo_sobrepeso_kg: 250,
    modalidad_facturacion: 'ANTICIPADA' as 'ANTICIPADA' | 'VENCIDA',
    requiere_cuentas_orden: false,
    fecha_inicio: new Date().toISOString().substring(0, 10),
    fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    observaciones: '',
  });

  // Recepción en Báscula (Paso 2)
  const [recepcionForm, setRecepcionForm] = useState({
    contrato_id: '',
    producto_custodia_id: '',
    nombre_producto_nuevo: '',
    lote_cliente: '',
    tipo_empaque: 'CANASTILLAS' as TipoEmpaqueCustodia,
    cantidad_bultos: 10,
    tara_unitaria_kg: 2.0,
    peso_bruto_kg: 320.0,
    temperatura_c: -18.5,
    transportador_nombre: '',
    transportador_cedula: '',
    placa_vehiculo: '',
    fecha_vencimiento: '',
    observaciones: '',
    guardar_preset_tara: true,
  });

  // Despacho de Mercancía (Paso 3)
  const [despachoForm, setDespachoForm] = useState({
    inventario_id: '',
    bultos_salida: 5,
    peso_bruto_salida: 155.0,
    peso_tara_salida: 10.0,
    transportador_nombre: '',
    transportador_cedula: '',
    placa_vehiculo: '',
    observaciones: '',
    autorizar_salida_mora: false,
  });

  // Cobro en Caja (Paso 4)
  const [pagoForm, setPagoForm] = useState({
    metodoPago: 'EFECTIVO' as MetodoPago,
    turnoId: '',
    cajaId: '',
    montoRecibido: 0,
    cambio: 0,
  });

  // Carga de datos
  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [cfs, cls, prods, ctrs, invs, movs, causs] = await Promise.all([
        coldStorageRentalService.getCuartosFrios().catch(() => []),
        coldStorageRentalService.getClientesCustodia().catch(() => []),
        coldStorageRentalService.getProductosCustodia().catch(() => []),
        coldStorageRentalService.getContratos().catch(() => []),
        coldStorageRentalService.getInventarioCustodia().catch(() => []),
        coldStorageRentalService.getMovimientos().catch(() => []),
        coldStorageRentalService.getCausaciones().catch(() => []),
      ]);

      // Seed por defecto si está vacío para evitar vista en blanco
      let cuartosFinales = cfs;
      if (cuartosFinales.length === 0) {
        cuartosFinales = [
          {
            id: 'cf-principal-01',
            empresa_id: DEFAULT_EMPRESA_ID,
            codigo: 'CF-01',
            nombre: 'Cuarto Frío Principal (Congelación -18°C)',
            temperatura_setpoint: -18.0,
            capacidad_total_posiciones: 50,
            activo: true,
          },
          {
            id: 'cf-refrig-02',
            empresa_id: DEFAULT_EMPRESA_ID,
            codigo: 'CF-02',
            nombre: 'Cuarto Frío Refrigeración Fresca (0°C a +4°C)',
            temperatura_setpoint: 2.0,
            capacidad_total_posiciones: 20,
            activo: true,
          },
        ];
      }

      setCuartosFrios(cuartosFinales);
      setClientes(cls);
      setProductos(prods);
      setContratos(ctrs);
      setInventario(invs);
      setMovimientos(movs);
      setCausaciones(causs);
    } catch (err: any) {
      console.warn('Error cargando datos de cuarto frío:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // Calcular en tiempo real la tara y peso neto de la recepción
  const gravimetriaRecepcion = useMemo(() => {
    return calcularTaraYNetoExacto({
      tipoEmpaque: recepcionForm.tipo_empaque,
      cantidadBultos: recepcionForm.cantidad_bultos,
      pesoBrutoKg: recepcionForm.peso_bruto_kg,
      taraUnitariaConfigurada: recepcionForm.tara_unitaria_kg,
    });
  }, [
    recepcionForm.tipo_empaque,
    recepcionForm.cantidad_bultos,
    recepcionForm.peso_bruto_kg,
    recepcionForm.tara_unitaria_kg,
  ]);

  // Al cambiar el contrato en recepción, actualizar preset de tara del cliente
  useEffect(() => {
    if (!recepcionForm.contrato_id) return;
    const ctr = contratos.find((c) => c.id === recepcionForm.contrato_id);
    if (!ctr) return;
    const presets = coldStorageRentalService.obtenerPresetTaraCliente(ctr.cliente_id);
    if (recepcionForm.tipo_empaque === 'CANASTILLAS') {
      setRecepcionForm((prev) => ({ ...prev, tara_unitaria_kg: presets.taraCanastillaKg }));
    } else if (recepcionForm.tipo_empaque === 'CAJAS') {
      setRecepcionForm((prev) => ({ ...prev, tara_unitaria_kg: presets.taraCajaKg }));
    }
  }, [recepcionForm.contrato_id, recepcionForm.tipo_empaque, contratos]);

  // Turnos de caja abiertos para Cobro
  const turnosAbiertos = useMemo(() => {
    return cashService.getTurnos().filter((t) => t.estado === 'ABIERTO');
  }, [showCobroModal]);

  // Métricas del Dashboard
  const totalPosicionesCapacidad = cuartosFrios.reduce((acc, cf) => acc + (cf.capacidad_total_posiciones || 0), 0);
  const totalPosicionesContratadas = contratos
    .filter((c) => c.estado === 'VIGENTE')
    .reduce((acc, c) => acc + (c.posiciones_contratadas || 0), 0);
  const posicionesDisponibles = Math.max(0, totalPosicionesCapacidad - totalPosicionesContratadas);
  const totalKilosEnCustodia = inventario.reduce((acc, inv) => acc + Number(inv.peso_neto_actual_kg || 0), 0);
  const totalBultosEnCustodia = inventario.reduce((acc, inv) => acc + (inv.bultos_actuales || 0), 0);

  // Clientes con Cartera / Vencimientos
  const clientesConCartera = useMemo(() => {
    const listado: Array<{
      contrato: ContratoAlquilerCf;
      cliente: ClienteCustodia;
      causacion?: CausacionAlquilerItem;
      diasMora: number;
      mensaje: string;
      montoPendiente: number;
      semaforo: 'AL_DIA' | 'POR_VENCER' | 'EN_MORA';
    }> = [];

    contratos.forEach((ctr) => {
      const cl = clientes.find((c) => c.id === ctr.cliente_id);
      if (!cl) return;

      const causPendiente = causaciones.find(
        (c) => c.contrato_id === ctr.id && c.estado_pago === 'PENDIENTE'
      );

      if (causPendiente) {
        const evalCartera = evaluarCarteraYVencimiento({
          fechaCorteMensualidad: causPendiente.periodo_fin,
          valorMensualidad: Number(causPendiente.total),
          estadoPago: 'PENDIENTE',
        });

        listado.push({
          contrato: ctr,
          cliente: cl,
          causacion: causPendiente,
          diasMora: evalCartera.diasMora,
          mensaje: evalCartera.mensajeAlerta,
          montoPendiente: evalCartera.saldoPendiente,
          semaforo: evalCartera.estadoSemaforo,
        });
      } else if (ctr.modalidad_tiempo === 'MESES') {
        const evalCartera = evaluarCarteraYVencimiento({
          fechaCorteMensualidad: ctr.fecha_fin,
          valorMensualidad: ctr.tarifa_unitaria * ctr.posiciones_contratadas,
          estadoPago: 'PENDIENTE',
        });

        if (evalCartera.estadoSemaforo !== 'AL_DIA') {
          listado.push({
            contrato: ctr,
            cliente: cl,
            diasMora: evalCartera.diasMora,
            mensaje: evalCartera.mensajeAlerta,
            montoPendiente: evalCartera.saldoPendiente,
            semaforo: evalCartera.estadoSemaforo,
          });
        }
      }
    });

    return listado;
  }, [contratos, clientes, causaciones]);

  // Manejador Paso 1: Guardar Cliente y Contrato Rápido
  const handleGuardarClienteYContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const clienteGuardado = await coldStorageRentalService.crearClienteCustodia({
        empresa_id: DEFAULT_EMPRESA_ID,
        razon_social: nuevoCliente.razon_social,
        numero_identificacion: nuevoCliente.numero_identificacion,
        tipo_identificacion: nuevoCliente.tipo_identificacion,
        responsable_contacto: nuevoCliente.responsable_contacto,
        telefono: nuevoCliente.telefono,
        email: nuevoCliente.email || null,
        autorizados_retiro: [],
        estado: 'ACTIVO',
      });

      const consecutivo = `CTR-CF-${new Date().getFullYear()}-${String(contratos.length + 1).padStart(3, '0')}`;
      const cuartoAsignado = cuartosFrios[0]?.id || 'cf-principal-01';

      await coldStorageRentalService.crearContrato({
        empresa_id: DEFAULT_EMPRESA_ID,
        consecutivo,
        cliente_id: clienteGuardado.id,
        cuarto_frio_id: cuartoAsignado,
        modalidad_tiempo: nuevoCliente.modalidad_preferida,
        posiciones_contratadas: Number(nuevoCliente.posiciones),
        tarifa_unitaria: Number(nuevoCliente.tarifa_acordada),
        tarifa_recargo_sobrepeso_kg: 250,
        modalidad_facturacion: nuevoCliente.modalidad_preferida === 'MESES' ? 'ANTICIPADA' : 'VENCIDA',
        requiere_cuentas_orden: false,
        fecha_inicio: new Date().toISOString().substring(0, 10),
        fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        estado: 'VIGENTE',
        observaciones: `Contrato rápido para cliente ${nuevoCliente.razon_social}`,
      });

      setShowClienteModal(false);
      Swal.fire({
        icon: 'success',
        title: '¡Cliente y Contrato Activos!',
        text: `${nuevoCliente.razon_social} listo para ingresar mercancía en frío (${nuevoCliente.posiciones * 800} Kg nominales).`,
        confirmButtonColor: '#4f46e5',
      });
      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error al Registrar',
        text: err.message || 'No se pudo guardar el cliente.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejador Paso 2: Guardar Recepción en Báscula
  const handleGuardarRecepcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gravimetriaRecepcion.esValido) {
      Swal.fire({
        icon: 'warning',
        title: 'Pesaje Inválido',
        text: gravimetriaRecepcion.error || 'Verifique el peso en báscula.',
      });
      return;
    }

    try {
      setLoading(true);
      const ctr = contratos.find((c) => c.id === recepcionForm.contrato_id);
      const cl = clientes.find((c) => c.id === ctr?.cliente_id);

      // Si desea recordar la tara
      if (recepcionForm.guardar_preset_tara && cl) {
        coldStorageRentalService.guardarPresetTaraCliente(cl.id || '', {
          taraCanastillaKg:
            recepcionForm.tipo_empaque === 'CANASTILLAS'
              ? recepcionForm.tara_unitaria_kg
              : TARAS_PREDETERMINADAS_KG.CANASTILLAS,
          taraCajaKg:
            recepcionForm.tipo_empaque === 'CAJAS'
              ? recepcionForm.tara_unitaria_kg
              : TARAS_PREDETERMINADAS_KG.CAJAS,
        });
      }

      // Si no seleccionó un producto pero escribió un nombre rápido, registrar producto
      let prodId = recepcionForm.producto_custodia_id;
      if (!prodId && recepcionForm.nombre_producto_nuevo && cl) {
        const prodCreado = await coldStorageRentalService.crearProductoCustodia({
          empresa_id: DEFAULT_EMPRESA_ID,
          cliente_id: cl.id,
          nombre: recepcionForm.nombre_producto_nuevo,
          tipo_empaque: recepcionForm.tipo_empaque,
          modalidad_medicion: 'SOLO_PESO',
          activo: true,
        });
        prodId = prodCreado.id || '';
      }

      const res = await coldStorageRentalService.registrarRecepcion({
        empresa_id: DEFAULT_EMPRESA_ID,
        contrato_id: recepcionForm.contrato_id,
        producto_custodia_id: prodId || productos[0]?.id || '00000000-0000-0000-0000-000000000000',
        lote_cliente: recepcionForm.lote_cliente || `LOTE-${Date.now().toString().slice(-6)}`,
        bultos: Number(recepcionForm.cantidad_bultos),
        peso_bruto_kg: Number(recepcionForm.peso_bruto_kg),
        peso_tara_kg: Number(gravimetriaRecepcion.taraTotalKg),
        temperatura: Number(recepcionForm.temperatura_c),
        transportador_nombre: recepcionForm.transportador_nombre || 'Conductor Directo',
        transportador_cedula: recepcionForm.transportador_cedula || '000000',
        placa_vehiculo: recepcionForm.placa_vehiculo || 'LOCAL',
        operador_id: '00000000-0000-0000-0000-000000000000',
        fecha_vencimiento: recepcionForm.fecha_vencimiento || null,
        observaciones: recepcionForm.observaciones || null,
      });

      setShowRecepcionModal(false);

      Swal.fire({
        icon: 'success',
        title: '¡Mercancía Ingresada al Frío!',
        html: `
          <div class="text-left space-y-2 p-2">
            <p>📄 Acta de Entrada: <b>${res.acta_consecutivo}</b></p>
            <p>📦 Empaque: <b>${recepcionForm.cantidad_bultos} ${recepcionForm.tipo_empaque}</b></p>
            <p>⚖️ Tara Descontada: <b>${gravimetriaRecepcion.taraTotalKg} Kg</b></p>
            <p class="text-lg text-indigo-700 font-bold">✨ Peso Neto Ingresado: ${res.peso_neto_ingresado} Kg</p>
          </div>
        `,
        confirmButtonText: 'Descargar Acta PDF',
        confirmButtonColor: '#4f46e5',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
      }).then((result) => {
        if (result.isConfirmed && cl) {
          const prodObj = productos.find((p) => p.id === prodId) || {
            nombre: recepcionForm.nombre_producto_nuevo || 'Pescado en Custodia',
            tipo_empaque: recepcionForm.tipo_empaque,
            modalidad_medicion: 'SOLO_PESO',
          };
          coldStoragePdfService.generarPdfActaRecepcion({
            movimiento: {
              id: res.movimiento_id,
              empresa_id: DEFAULT_EMPRESA_ID,
              inventario_custodia_id: '',
              tipo_movimiento: 'ENTRADA',
              consecutivo_acta: res.acta_consecutivo,
              fecha_movimiento: new Date().toISOString(),
              bultos: recepcionForm.cantidad_bultos,
              peso_bruto_kg: recepcionForm.peso_bruto_kg,
              peso_tara_kg: gravimetriaRecepcion.taraTotalKg,
              peso_neto_kg: res.peso_neto_ingresado,
              temperatura_medida: recepcionForm.temperatura_c,
              merma_kg: 0,
              transportador_nombre: recepcionForm.transportador_nombre,
              transportador_cedula: recepcionForm.transportador_cedula,
              placa_vehiculo: recepcionForm.placa_vehiculo,
            },
            inventario: {
              id: '',
              empresa_id: DEFAULT_EMPRESA_ID,
              contrato_id: recepcionForm.contrato_id,
              cliente_id: cl.id || '',
              producto_custodia_id: prodId,
              lote_cliente: recepcionForm.lote_cliente,
              fecha_ingreso: new Date().toISOString(),
              bultos_iniciales: recepcionForm.cantidad_bultos,
              bultos_actuales: recepcionForm.cantidad_bultos,
              peso_neto_inicial_kg: res.peso_neto_ingresado,
              peso_neto_actual_kg: res.peso_neto_ingresado,
              activo: true,
              creado_en: '',
              actualizado_en: '',
            },
            cliente: cl,
            producto: prodObj as any,
          });
        }
      });

      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Recepción',
        text: err.message || 'No se pudo guardar la recepción.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejador Paso 3: Guardar Despacho
  const handleGuardarDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForDespacho) return;

    try {
      setLoading(true);
      const res = await coldStorageRentalService.registrarDespacho({
        empresa_id: DEFAULT_EMPRESA_ID,
        inventario_id: selectedItemForDespacho.id,
        bultos_despacho: Number(despachoForm.bultos_salida),
        peso_bruto_salida: Number(despachoForm.peso_bruto_salida),
        peso_tara_salida: Number(despachoForm.peso_tara_salida),
        transportador_nombre: despachoForm.transportador_nombre || 'Conductor Retiro',
        transportador_cedula: despachoForm.transportador_cedula || '000000',
        placa_vehiculo: despachoForm.placa_vehiculo || 'RETIRO',
        operador_id: '00000000-0000-0000-0000-000000000000',
        observaciones: despachoForm.observaciones || null,
      });

      setShowDespachoModal(false);

      Swal.fire({
        icon: 'success',
        title: '¡Mercancía Retirada con Éxito!',
        html: `
          <div class="text-left space-y-2 p-2">
            <p>📄 Acta de Despacho: <b>${res.acta_consecutivo}</b></p>
            <p>⚖️ Peso Retirado: <b>${res.peso_despachado_kg} Kg</b></p>
            <p>❄️ Merma Natural de Frío: <b>${res.merma_kg} Kg</b></p>
            <p class="text-lg text-emerald-700 font-bold">📦 Quedan en Bodega: ${res.remanente_peso_kg} Kg (${res.remanente_bultos} bultos)</p>
          </div>
        `,
        confirmButtonText: 'Descargar Acta Salida PDF',
        confirmButtonColor: '#4f46e5',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
      }).then((result) => {
        if (result.isConfirmed) {
          const cl = clientes.find((c) => c.id === selectedItemForDespacho.cliente_id) || {
            razon_social: 'Cliente',
            numero_identificacion: 'N/A',
            tipo_identificacion: 'NIT',
          };
          const pr = productos.find((p) => p.id === selectedItemForDespacho.producto_custodia_id) || {
            nombre: 'Producto en Custodia',
          };

          coldStoragePdfService.generarPdfActaDespacho({
            movimiento: {
              id: res.movimiento_id,
              empresa_id: DEFAULT_EMPRESA_ID,
              inventario_custodia_id: selectedItemForDespacho.id,
              tipo_movimiento: 'SALIDA',
              consecutivo_acta: res.acta_consecutivo,
              fecha_movimiento: new Date().toISOString(),
              bultos: despachoForm.bultos_salida,
              peso_bruto_kg: despachoForm.peso_bruto_salida,
              peso_tara_kg: despachoForm.peso_tara_salida,
              peso_neto_kg: res.peso_despachado_kg,
              merma_kg: res.merma_kg,
              transportador_nombre: despachoForm.transportador_nombre,
              transportador_cedula: despachoForm.transportador_cedula,
              placa_vehiculo: despachoForm.placa_vehiculo,
            },
            inventario: selectedItemForDespacho,
            cliente: cl as any,
            producto: pr as any,
            remanenteBultos: res.remanente_bultos,
            remanentePesoKg: res.remanente_peso_kg,
          });
        }
      });

      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Despacho',
        text: err.message || 'No se pudo registrar la salida.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejador Paso 4: Confirmar Cobro en Caja
  const handleConfirmarCobroEnCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cobroData) return;

    if (turnosAbiertos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay Turno de Caja Abierto',
        text: 'Abre primero la caja en el módulo de Tesorería/POS para asentar los fondos.',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    try {
      setLoading(true);
      const turnoSeleccionado = turnosAbiertos.find((t) => t.id === pagoForm.turnoId) || turnosAbiertos[0];
      const consecutivoRecibo = `RC-CF-${Date.now().toString().slice(-6)}`;

      const res = await coldStorageRentalService.registrarCobroEnCaja({
        turnoId: turnoSeleccionado.id,
        cajaId: turnoSeleccionado.cajaId,
        clienteId: cobroData.clienteId,
        contratoId: cobroData.contratoId,
        causacionId: cobroData.causacionId,
        monto: cobroData.monto,
        metodoPago: pagoForm.metodoPago,
        concepto: `${cobroData.concepto} - Ref: ${consecutivoRecibo}`,
        referenciaId: consecutivoRecibo,
      });

      if (!res.success) {
        throw new Error(res.error || 'Error al registrar cobro');
      }

      setShowCobroModal(false);

      const cl = clientes.find((c) => c.id === cobroData.clienteId) || {
        razon_social: cobroData.clienteNombre,
        numero_identificacion: 'N/A',
        tipo_identificacion: 'NIT',
      };

      Swal.fire({
        icon: 'success',
        title: '¡Pago Recibido en Caja!',
        html: `
          <div class="text-left space-y-2 p-2">
            <p>🧾 Recibo Oficial: <b>${consecutivoRecibo}</b></p>
            <p>💵 Monto: <b>$${Number(cobroData.monto).toLocaleString('es-CO')} COP</b></p>
            <p>💳 Método: <b>${pagoForm.metodoPago}</b></p>
            <p class="text-xs text-slate-500">Saldo asentado en turno de caja de forma inmediata.</p>
          </div>
        `,
        showDenyButton: true,
        confirmButtonText: '📄 Recibo Carta',
        denyButtonText: '🧾 Ticket Térmico 80mm',
        confirmButtonColor: '#4f46e5',
        denyButtonColor: '#0f172a',
      }).then((result) => {
        if (result.isConfirmed) {
          coldStoragePdfService.generarPdfReciboPagoAlquiler({
            consecutivo: consecutivoRecibo,
            cliente: cl as any,
            concepto: cobroData.concepto,
            modalidadTiempo: cobroData.modalidad,
            diasLiquidacion: cobroData.dias,
            kilosLiquidacion: cobroData.kilos,
            subtotal: Math.round(cobroData.monto / 1.19),
            iva: Math.round(cobroData.monto - cobroData.monto / 1.19),
            totalPagar: cobroData.monto,
            metodoPago: pagoForm.metodoPago,
          });
        } else if (result.isDenied) {
          coldStoragePdfService.generarPdfTicketTermicoAlquiler({
            consecutivo: consecutivoRecibo,
            cliente: cl as any,
            concepto: cobroData.concepto,
            totalPagar: cobroData.monto,
            metodoPago: pagoForm.metodoPago,
          });
        }
      });

      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Cobro',
        text: err.message || 'No se pudo asentar el pago en caja.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 text-slate-900 bg-slate-50 min-h-screen">
      {/* ========================================================================= */}
      {/* ENCABEZADO PRINCIPAL (LIGHT MODE WCAG AA+) */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-50 border border-indigo-200/80 rounded-2xl text-indigo-600 shadow-sm">
            <Snowflake className="w-8 h-8 animate-pulse text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              Alquiler de Cuarto Frío & Custodia 3PL
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                800 Kg / Posición
              </span>
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              Flujo operativo simplificado: registro rápido, pesaje en báscula calibrada, retiro con control de cartera y cobro en caja.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={cargarTodo}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-all shadow-sm"
            title="Refrescar Datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ASISTENTE OPERATIVO 1-2-3-4 ("LA REGLA DE LOS 12 AÑOS") */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Asistente Operativo Paso a Paso (Flujo para Cualquier Operario)
          </h2>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Fácil • Rápido • Sin errores
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* PASO 1 */}
          <button
            onClick={() => setShowClienteModal(true)}
            className="text-left p-5 rounded-2xl bg-white hover:bg-indigo-50/50 border-2 border-indigo-200/80 hover:border-indigo-500 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  1
                </span>
                <Users className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Nuevo Cliente / Contrato</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ingresa los datos del cliente. Elige si guarda por <b>días</b> o por <b>meses</b>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600">
              Registrar Cliente →
            </div>
          </button>

          {/* PASO 2 */}
          <button
            onClick={() => setShowRecepcionModal(true)}
            className="text-left p-5 rounded-2xl bg-white hover:bg-emerald-50/50 border-2 border-emerald-200/80 hover:border-emerald-500 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  2
                </span>
                <Scale className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Recibir Mercancía (Báscula)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Elige empaque: <b>Canastillas 🧺</b>, <b>Cajas 📦</b> o <b>Suelto 🐟</b>. Tara automática.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600">
              Pesar en Báscula →
            </div>
          </button>

          {/* PASO 3 */}
          <button
            onClick={() => {
              setActiveTab('existencias');
              if (inventario.length > 0) {
                setSelectedItemForDespacho(inventario[0]);
                setShowDespachoModal(true);
              }
            }}
            className="text-left p-5 rounded-2xl bg-white hover:bg-amber-50/50 border-2 border-amber-200/80 hover:border-amber-500 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  3
                </span>
                <Truck className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Retirar / Despachar</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Entrega producto al conductor. Te avisa si debe dinero antes de salir.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-amber-600">
              Despachar Producto →
            </div>
          </button>

          {/* PASO 4 */}
          <button
            onClick={() => setActiveTab('cartera')}
            className="text-left p-5 rounded-2xl bg-white hover:bg-sky-50/50 border-2 border-sky-200/80 hover:border-sky-500 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  4
                </span>
                <DollarSign className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Liquidar & Cobrar en Caja</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Recibe efectivo o Nequi. Suma a tu caja del día e imprime recibo oficial.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-sky-600">
              Ver Cartera y Cobrar →
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ALERTA Y MONITOR DE CARTERA (CLIENTES CON VENCIMIENTOS) */}
      {/* ========================================================================= */}
      {clientesConCartera.length > 0 ? (
        <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Clientes con Pagos Pendientes o Mensualidades Vencidas ({clientesConCartera.length})</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900">
              Atención en Portería / Caja
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientesConCartera.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-xs flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.cliente.razon_social}</h4>
                  <p className="text-xs text-slate-500">
                    Contrato {item.contrato.consecutivo} • {item.contrato.modalidad_tiempo}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        item.semaforo === 'EN_MORA'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.mensaje}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      ${Math.round(item.montoPendiente).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCobroData({
                      clienteId: item.cliente.id || '',
                      clienteNombre: item.cliente.razon_social,
                      contratoId: item.contrato.id,
                      causacionId: item.causacion?.id,
                      monto: item.montoPendiente,
                      concepto: `Alquiler Cuarto Frío - ${item.contrato.consecutivo} (${item.mensaje})`,
                      modalidad: item.contrato.modalidad_tiempo,
                    });
                    setShowCobroModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Cobrar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">
              Todos los clientes de alquiler y custodia se encuentran al día y a paz y salvo.
            </span>
          </div>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
            0 Facturas en Mora
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TABS DE GESTIÓN Y AUDITORÍA */}
      {/* ========================================================================= */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'operaciones', label: 'Panel Operativo & Capacidad', icon: Layers },
          { id: 'existencias', label: 'Existencias en Custodia', icon: Box },
          { id: 'cartera', label: 'Cartera & Cobro en Caja', icon: DollarSign },
          { id: 'movimientos', label: 'Actas de Báscula', icon: Scale },
          { id: 'contratos', label: 'Contratos Activos', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* CONTENIDO TAB 1: OPERACIONES Y CAPACIDAD */}
      {/* ========================================================================= */}
      {activeTab === 'operaciones' && (
        <div className="space-y-6">
          {/* Métricas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Capacidad Total</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {totalPosicionesCapacidad}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  pos. ({(totalPosicionesCapacidad * 800).toLocaleString('es-CO')} Kg)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">800 Kg estándar por posición</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Posiciones Alquiladas</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {totalPosicionesContratadas}{' '}
                <span className="text-xs font-semibold text-slate-500">contratadas</span>
              </div>
              <p className="text-xs text-emerald-600 mt-2 font-bold">
                {posicionesDisponibles} posiciones libres disponibles
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Kilos Reales en Frío</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {totalKilosEnCustodia.toLocaleString('es-CO')}{' '}
                <span className="text-xs font-semibold text-slate-500">Kg netos</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {totalBultosEnCustodia} bultos / canastillas guardadas
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Clientes Activos</span>
              <div className="text-2xl font-black text-sky-600 mt-1">
                {clientes.length}{' '}
                <span className="text-xs font-semibold text-slate-500">depositantes</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {contratos.filter((c) => c.estado === 'VIGENTE').length} contratos vigentes
              </p>
            </div>
          </div>

          {/* Cuartos Fríos Físicos */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Estado y Ocupación de Cuartos Fríos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cuartosFrios.map((cf) => {
                const contratosEnCuarto = contratos.filter(
                  (c) => c.cuarto_frio_id === cf.id && c.estado === 'VIGENTE'
                );
                const posOcupadas = contratosEnCuarto.reduce((acc, c) => acc + c.posiciones_contratadas, 0);
                const porcentajeOcupacion =
                  cf.capacidad_total_posiciones > 0
                    ? Math.min(100, Math.round((posOcupadas / cf.capacidad_total_posiciones) * 100))
                    : 0;

                return (
                  <div key={cf.id} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-indigo-600">{cf.codigo}</span>
                        <h4 className="font-black text-slate-900">{cf.nombre}</h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {cf.temperatura_setpoint} °C
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 font-semibold">
                        <span>Ocupación de Espacio</span>
                        <span>
                          {posOcupadas} de {cf.capacidad_total_posiciones} pos. ({porcentajeOcupacion}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            porcentajeOcupacion > 90
                              ? 'bg-rose-500'
                              : porcentajeOcupacion > 70
                              ? 'bg-amber-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${porcentajeOcupacion}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200">
                      <span>Capacidad Total:</span>
                      <span className="font-bold text-slate-800">
                        {(cf.capacidad_total_posiciones * 800).toLocaleString('es-CO')} Kg Max
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTENIDO TAB 2: EXISTENCIAS EN CUSTODIA */}
      {/* ========================================================================= */}
      {activeTab === 'existencias' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Inventario y Lotes en Custodia</h2>
              <p className="text-xs text-slate-500">
                Mercancía perteneciente a terceros almacenada en los cuartos fríos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (clientes.length > 0 && inventario.length > 0) {
                    const cl = clientes[0];
                    coldStoragePdfService.generarPdfCertificadoCustodia({
                      cliente: cl,
                      inventarioItems: inventario.filter((i) => i.cliente_id === cl.id),
                      fechaCorte: new Date().toISOString().substring(0, 10),
                    });
                  } else {
                    Swal.fire({
                      icon: 'info',
                      title: 'Sin datos',
                      text: 'No hay existencias activas para emitir certificado.',
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 shadow-sm"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                Certificado Existencias (PDF)
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4">Cliente (Dueño)</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Lote Cliente</th>
                  <th className="p-4">Fecha Ingreso</th>
                  <th className="p-4">Bultos / Cajas</th>
                  <th className="p-4">Kilos Netos</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventario.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No hay inventario en custodia registrado actualmente. Utiliza el <b>Paso 2</b> para recibir mercancía en báscula.
                    </td>
                  </tr>
                ) : (
                  inventario.map((item) => {
                    const cl = clientes.find((c) => c.id === item.cliente_id);
                    const prod = productos.find((p) => p.id === item.producto_custodia_id);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="p-4 font-bold text-slate-900">{cl?.razon_social || 'Cliente'}</td>
                        <td className="p-4 font-medium text-slate-700">
                          {prod?.nombre || item.producto?.nombre || 'Pescado en Frío'}
                        </td>
                        <td className="p-4 font-mono text-xs font-bold text-indigo-600">{item.lote_cliente}</td>
                        <td className="p-4 text-xs text-slate-500">
                          {item.fecha_ingreso ? item.fecha_ingreso.substring(0, 10) : 'N/A'}
                        </td>
                        <td className="p-4 font-bold text-slate-800">{item.bultos_actuales}</td>
                        <td className="p-4 font-black text-emerald-700">
                          {Number(item.peso_neto_actual_kg).toFixed(2)} Kg
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedItemForDespacho(item);
                              setShowDespachoModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
                          >
                            Retirar / Despachar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTENIDO TAB 3: CARTERA Y COBRO EN CAJA */}
      {/* ========================================================================= */}
      {activeTab === 'cartera' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Cartera y Facturación de Alquiler (Cuenta 4155)</h2>
              <p className="text-xs text-slate-500">
                Liquidación de servicios de frío, estados de pago y emisión de recibos oficiales.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4">Consecutivo</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Periodo</th>
                  <th className="p-4">Subtotal</th>
                  <th className="p-4">IVA (19%)</th>
                  <th className="p-4">Total a Cobrar</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {causaciones.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No hay causaciones contables registradas.
                    </td>
                  </tr>
                ) : (
                  causaciones.map((caus) => {
                    const cl = clientes.find((c) => c.id === caus.cliente_id);

                    return (
                      <tr key={caus.id} className="hover:bg-slate-50/80">
                        <td className="p-4 font-mono font-bold text-indigo-600">{caus.consecutivo_causacion}</td>
                        <td className="p-4 font-bold text-slate-900">{cl?.razon_social || 'Cliente'}</td>
                        <td className="p-4 text-xs text-slate-500">
                          {caus.periodo_inicio} al {caus.periodo_fin}
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          ${Number(caus.subtotal).toLocaleString('es-CO')}
                        </td>
                        <td className="p-4 text-slate-500">${Number(caus.iva_19).toLocaleString('es-CO')}</td>
                        <td className="p-4 font-black text-slate-900">
                          ${Number(caus.total).toLocaleString('es-CO')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              caus.estado_pago === 'PAGADA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {caus.estado_pago}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-2">
                          {caus.estado_pago === 'PENDIENTE' && (
                            <button
                              onClick={() => {
                                setCobroData({
                                  clienteId: caus.cliente_id,
                                  clienteNombre: cl?.razon_social || 'Cliente',
                                  contratoId: caus.contrato_id,
                                  causacionId: caus.id,
                                  monto: Number(caus.total),
                                  concepto: `Causación Alquiler ${caus.consecutivo_causacion}`,
                                  modalidad: 'MESES',
                                });
                                setShowCobroModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                            >
                              Recibir Pago
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (cl) {
                                coldStoragePdfService.generarPdfReciboPagoAlquiler({
                                  consecutivo: caus.consecutivo_causacion,
                                  cliente: cl,
                                  concepto: `Comprobante de Servicio de Alquiler Frigorífico`,
                                  periodo: `${caus.periodo_inicio} a ${caus.periodo_fin}`,
                                  subtotal: caus.subtotal,
                                  iva: caus.iva_19,
                                  totalPagar: caus.total,
                                  metodoPago: 'REGISTRADO',
                                });
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                            title="Descargar Comprobante PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTENIDO TAB 4: MOVIMIENTOS Y BÁSCULA */}
      {/* ========================================================================= */}
      {activeTab === 'movimientos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Historial de Báscula (Entradas y Salidas)</h2>
              <p className="text-xs text-slate-500">
                Actas oficiales firmadas de recepción y despacho de mercancía en cuartos fríos.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4">Acta</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Fecha y Hora</th>
                  <th className="p-4">Bultos</th>
                  <th className="p-4">Peso Bruto</th>
                  <th className="p-4">Tara</th>
                  <th className="p-4">Peso Neto</th>
                  <th className="p-4">Conductor / Placa</th>
                  <th className="p-4 text-center">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No se han registrado movimientos de báscula aún.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="p-4 font-mono font-bold text-indigo-600">{m.consecutivo_acta}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            m.tipo_movimiento === 'ENTRADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.tipo_movimiento}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(m.fecha_movimiento).toLocaleString('es-CO')}
                      </td>
                      <td className="p-4 font-bold">{m.bultos}</td>
                      <td className="p-4 font-mono">{Number(m.peso_bruto_kg).toFixed(2)} Kg</td>
                      <td className="p-4 font-mono text-slate-500">{Number(m.peso_tara_kg).toFixed(2)} Kg</td>
                      <td className="p-4 font-mono font-black text-slate-900">
                        {Number(m.peso_neto_kg).toFixed(2)} Kg
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        {m.transportador_nombre} ({m.placa_vehiculo})
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            Swal.fire({
                              icon: 'info',
                              title: 'Acta Generada',
                              text: `Consecutivo: ${m.consecutivo_acta}`,
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTENIDO TAB 5: CONTRATOS */}
      {/* ========================================================================= */}
      {activeTab === 'contratos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Contratos de Custodia Activos</h2>
              <p className="text-xs text-slate-500">
                Condiciones de alquiler por días o mensualidades de 800 kg por posición.
              </p>
            </div>
            <button
              onClick={() => setShowClienteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo Contrato
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4">Consecutivo</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Modalidad</th>
                  <th className="p-4">Posiciones</th>
                  <th className="p-4">Tarifa</th>
                  <th className="p-4">Vigencia</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Contrato PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contratos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No hay contratos activos registrados.
                    </td>
                  </tr>
                ) : (
                  contratos.map((ctr) => {
                    const cl = clientes.find((c) => c.id === ctr.cliente_id);
                    const cf = cuartosFrios.find((f) => f.id === ctr.cuarto_frio_id);

                    return (
                      <tr key={ctr.id} className="hover:bg-slate-50/80">
                        <td className="p-4 font-mono font-bold text-indigo-600">{ctr.consecutivo}</td>
                        <td className="p-4 font-bold text-slate-900">{cl?.razon_social || 'Cliente'}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {ctr.modalidad_tiempo}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-indigo-700">
                          {ctr.posiciones_contratadas} pos. ({ctr.posiciones_contratadas * 800} Kg)
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          ${Number(ctr.tarifa_unitaria).toLocaleString('es-CO')}
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {ctr.fecha_inicio} a {ctr.fecha_fin}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {ctr.estado}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (cl) {
                                coldStoragePdfService.generarPdfContratoAlquiler(ctr, cl, cf);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                            title="Descargar Contrato PDF"
                          >
                            <Download className="w-4 h-4 text-indigo-600" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTRAR CLIENTE / CONTRATO RÁPIDO (PASO 1) */}
      {/* ========================================================================= */}
      {showClienteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Paso 1: Registrar Nuevo Cliente 3PL & Contrato
              </h3>
              <button
                onClick={() => setShowClienteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarClienteYContrato} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razón Social / Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pescados y Mariscos La Bahía S.A.S."
                    value={nuevoCliente.razon_social}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIT o Cédula *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 901.234.567-8"
                    value={nuevoCliente.numero_identificacion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, numero_identificacion: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 310 123 4567"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Selector de Modalidad (Días vs Meses) */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-indigo-900">
                  ¿Cómo va a guardar la mercancía?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNuevoCliente({
                        ...nuevoCliente,
                        modalidad_preferida: 'MESES',
                        tarifa_acordada: 650000,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nuevoCliente.modalidad_preferida === 'MESES'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-sm">📅 Por Meses</div>
                    <div className="text-xs opacity-90 mt-0.5">Mensualidad fija de 800 Kg</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setNuevoCliente({
                        ...nuevoCliente,
                        modalidad_preferida: 'DIAS',
                        tarifa_acordada: 25000,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nuevoCliente.modalidad_preferida === 'DIAS'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-sm">☀️ Por Días</div>
                    <div className="text-xs opacity-90 mt-0.5">Cobro diario por peso/posición</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">
                      {nuevoCliente.modalidad_preferida === 'MESES'
                        ? 'Tarifa Mensual ($ COP)'
                        : 'Tarifa Diaria ($ COP)'}
                    </label>
                    <input
                      type="number"
                      required
                      value={nuevoCliente.tarifa_acordada}
                      onChange={(e) =>
                        setNuevoCliente({ ...nuevoCliente, tarifa_acordada: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-300 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">
                      Posiciones (800 Kg c/u)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={nuevoCliente.posiciones}
                      onChange={(e) =>
                        setNuevoCliente({ ...nuevoCliente, posiciones: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-300 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClienteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                >
                  {loading ? 'Guardando...' : 'Guardar y Continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECEPCIÓN BÁSCULA + TARA INTELIGENTE (PASO 2) */}
      {/* ========================================================================= */}
      {showRecepcionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                Paso 2: Recepción en Báscula (Cajas, Canastillas o Suelto)
              </h3>
              <button
                onClick={() => setShowRecepcionModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarRecepcion} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selecciona el Cliente y Contrato *
                  </label>
                  <select
                    required
                    value={recepcionForm.contrato_id}
                    onChange={(e) => setRecepcionForm({ ...recepcionForm, contrato_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="">-- Elige qué cliente está entregando la mercancía --</option>
                    {contratos.map((ctr) => {
                      const cl = clientes.find((c) => c.id === ctr.cliente_id);
                      return (
                        <option key={ctr.id} value={ctr.id}>
                          {cl?.razon_social} ({ctr.consecutivo} • {ctr.modalidad_tiempo})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ¿Qué producto entrega? *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Corvina, Camarón, Atún..."
                    value={recepcionForm.nombre_producto_nuevo}
                    onChange={(e) =>
                      setRecepcionForm({ ...recepcionForm, nombre_producto_nuevo: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lote del Cliente (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. LOT-OCT-01"
                    value={recepcionForm.lote_cliente}
                    onChange={(e) => setRecepcionForm({ ...recepcionForm, lote_cliente: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Selector Visual de Empaque */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-emerald-950">
                  ¿Cómo viene empacado el producto?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setRecepcionForm({
                        ...recepcionForm,
                        tipo_empaque: 'CANASTILLAS',
                        tara_unitaria_kg: 2.0,
                      })
                    }
                    className={`p-3 rounded-xl border text-center transition-all ${
                      recepcionForm.tipo_empaque === 'CANASTILLAS'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <div className="text-xl">🧺</div>
                    <div className="text-xs mt-1">Canastillas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRecepcionForm({
                        ...recepcionForm,
                        tipo_empaque: 'CAJAS',
                        tara_unitaria_kg: 0.8,
                      })
                    }
                    className={`p-3 rounded-xl border text-center transition-all ${
                      recepcionForm.tipo_empaque === 'CAJAS'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <div className="text-xl">📦</div>
                    <div className="text-xs mt-1">Cajas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRecepcionForm({
                        ...recepcionForm,
                        tipo_empaque: 'SUELTO',
                        cantidad_bultos: 1,
                        tara_unitaria_kg: 0.0,
                      })
                    }
                    className={`p-3 rounded-xl border text-center transition-all ${
                      recepcionForm.tipo_empaque === 'SUELTO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <div className="text-xl">🐟</div>
                    <div className="text-xs mt-1">Suelto / Granel</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1">
                      {recepcionForm.tipo_empaque === 'CANASTILLAS'
                        ? '¿Cuántas canastillas entran?'
                        : recepcionForm.tipo_empaque === 'CAJAS'
                        ? '¿Cuántas cajas entran?'
                        : 'Bultos (1 para suelto)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={recepcionForm.cantidad_bultos}
                      onChange={(e) =>
                        setRecepcionForm({ ...recepcionForm, cantidad_bultos: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 font-black text-slate-900 text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1">
                      Tara por cada unidad (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={recepcionForm.tara_unitaria_kg}
                      onChange={(e) =>
                        setRecepcionForm({ ...recepcionForm, tara_unitaria_kg: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 font-bold text-slate-900 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Pantalla Gigante de Báscula */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" /> BÁSCULA CALIBRADA EN TIEMPO REAL
                  </span>
                  <span className="text-xs font-mono text-slate-400">TARA RESTADA AUTOMÁTICAMENTE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Digita el Peso Bruto de la Báscula (Kg) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={recepcionForm.peso_bruto_kg}
                      onChange={(e) =>
                        setRecepcionForm({ ...recepcionForm, peso_bruto_kg: Number(e.target.value) })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border-2 border-emerald-500 text-emerald-400 font-mono font-black text-2xl focus:ring-2 focus:ring-emerald-400 outline-hidden"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
                    <div className="text-xs text-slate-400">
                      Total Tara: -{gravimetriaRecepcion.taraTotalKg.toFixed(2)} Kg
                    </div>
                    <div className="text-xs uppercase text-slate-400 font-bold mt-1">Peso Neto Real:</div>
                    <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
                      {gravimetriaRecepcion.pesoNetoKg.toFixed(2)}{' '}
                      <span className="text-sm font-sans font-bold text-slate-400">Kg</span>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={recepcionForm.guardar_preset_tara}
                    onChange={(e) =>
                      setRecepcionForm({ ...recepcionForm, guardar_preset_tara: e.target.checked })
                    }
                    className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Recordar esta tara ({recepcionForm.tara_unitaria_kg} Kg) para este cliente en el futuro</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecepcionModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !gravimetriaRecepcion.esValido}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center gap-2"
                >
                  {loading ? 'Registrando...' : '✓ Ingresar y Descargar Acta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DESPACHO / SALIDA DE MERCANCÍA (PASO 3) */}
      {/* ========================================================================= */}
      {showDespachoModal && selectedItemForDespacho && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                Paso 3: Retirar / Despachar Mercancía de Custodia
              </h3>
              <button
                onClick={() => setShowDespachoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Lote:</span>
                <span className="font-mono font-bold text-slate-800">{selectedItemForDespacho.lote_cliente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Disponible en Bodega:</span>
                <span className="font-black text-emerald-700">
                  {selectedItemForDespacho.peso_neto_actual_kg} Kg ({selectedItemForDespacho.bultos_actuales} bultos)
                </span>
              </div>
            </div>

            <form onSubmit={handleGuardarDespacho} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bultos a Retirar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItemForDespacho.bultos_actuales}
                    required
                    value={despachoForm.bultos_salida}
                    onChange={(e) =>
                      setDespachoForm({ ...despachoForm, bultos_salida: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peso Bruto Salida Báscula (Kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={despachoForm.peso_bruto_salida}
                    onChange={(e) =>
                      setDespachoForm({ ...despachoForm, peso_bruto_salida: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tara Salida (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={despachoForm.peso_tara_salida}
                    onChange={(e) =>
                      setDespachoForm({ ...despachoForm, peso_tara_salida: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Placa del Vehículo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. ABC-123"
                    value={despachoForm.placa_vehiculo}
                    onChange={(e) =>
                      setDespachoForm({ ...despachoForm, placa_vehiculo: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDespachoModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md flex items-center gap-2"
                >
                  {loading ? 'Despachando...' : '✓ Autorizar Salida y Generar Acta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: COBRO EN CAJA EXPRESS & RECIBO OFICIAL (PASO 4) */}
      {/* ========================================================================= */}
      {showCobroModal && cobroData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Paso 4: Recibir Pago en Caja & Generar Recibo
              </h3>
              <button
                onClick={() => setShowCobroModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
              <div className="text-xs font-bold text-indigo-900 uppercase">Cliente:</div>
              <div className="text-base font-black text-slate-900">{cobroData.clienteNombre}</div>
              <div className="text-xs text-slate-600">{cobroData.concepto}</div>
              <div className="text-2xl font-black text-indigo-700 pt-2 border-t border-indigo-200 mt-2">
                ${Math.round(cobroData.monto).toLocaleString('es-CO')}{' '}
                <span className="text-xs font-sans text-slate-600 font-semibold">COP Total</span>
              </div>
            </div>

            <form onSubmit={handleConfirmarCobroEnCaja} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Método de Pago *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EFECTIVO', 'TRANSFERENCIA', 'DATAFONO'] as MetodoPago[]).map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setPagoForm({ ...pagoForm, metodoPago: metodo })}
                      className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${
                        pagoForm.metodoPago === metodo
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {metodo === 'EFECTIVO' ? '💵 Efectivo' : metodo === 'TRANSFERENCIA' ? '📱 Nequi / Bancolombia' : '💳 Datáfono'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turno de Caja Abierto
                </label>
                <select
                  value={pagoForm.turnoId || turnosAbiertos[0]?.id || ''}
                  onChange={(e) => setPagoForm({ ...pagoForm, turnoId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                >
                  {turnosAbiertos.length === 0 ? (
                    <option value="">No hay turnos abiertos (Se asentará como cobro directo)</option>
                  ) : (
                    turnosAbiertos.map((t) => (
                      <option key={t.id} value={t.id}>
                        Caja Principal • Turno #{t.id.slice(-6)} (Saldo: ${t.saldoTeoricoGlobal.toLocaleString('es-CO')})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCobroModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md flex items-center gap-2"
                >
                  {loading ? 'Asentando...' : '✓ Asentar en Caja & Emitir Recibo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdStorageRentalView;
