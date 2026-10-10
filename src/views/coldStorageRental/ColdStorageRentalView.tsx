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
  Trash2,
  Zap,
  ListChecks,
  CheckSquare,
  Square,
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
  calcularTotalesPartidasRecepcion,
  TARAS_PREDETERMINADAS_KG,
  type TipoEmpaqueCustodia,
  type ContratoAlquilerCf,
  type ClienteCustodia,
  type ProductoCustodia,
  type CuartoFrio,
  type PartidaRecepcion,
  type ItemDespacho,
  type ClienteRapidoInput,
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
  const [showClienteRapidoSubmodal, setShowClienteRapidoSubmodal] = useState(false);
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

  // Creación rápida de cliente in-situ en báscula (15 segundos)
  const [clienteRapidoForm, setClienteRapidoForm] = useState<ClienteRapidoInput>({
    razon_social: '',
    numero_identificacion: '',
    tipo_identificacion: 'NIT',
    telefono: '',
    email: '',
    modalidad_tiempo: 'DIAS',
    tarifa_pactada: 45000,
    capacidad_posiciones: 1,
    temperatura_acordada: -18.0,
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

  // Planilla de Recepción Múltiple en Báscula (Paso 2)
  const [partidasPlanilla, setPartidasPlanilla] = useState<PartidaRecepcion[]>([]);
  const [partidaActual, setPartidaActual] = useState({
    producto_nombre: '',
    producto_custodia_id: '',
    lote_cliente: '',
    tipo_empaque: 'CANASTILLAS' as TipoEmpaqueCustodia,
    cantidad_bultos: 10,
    tara_unitaria_kg: 2.0,
    peso_bruto_kg: 320.0,
    temperatura_c: -18.5,
  });

  const [recepcionForm, setRecepcionForm] = useState({
    contrato_id: '',
    transportador_nombre: '',
    transportador_cedula: '',
    placa_vehiculo: '',
    fecha_vencimiento: '',
    observaciones: '',
    guardar_preset_tara: true,
  });

  // Despacho Múltiple Consolidado (Paso 3)
  const [despachoClienteId, setDespachoClienteId] = useState('');
  const [despachoItemsSeleccionados, setDespachoItemsSeleccionados] = useState<
    Record<
      string,
      {
        seleccionado: boolean;
        bultos_a_retirar: number;
        peso_neto_a_retirar: number;
        es_retiro_total: boolean;
      }
    >
  >({});
  const [despachoForm, setDespachoForm] = useState({
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

  // Calcular en tiempo real la tara y peso neto de la partida en báscula
  const gravimetriaPartidaActual = useMemo(() => {
    return calcularTaraYNetoExacto({
      tipoEmpaque: partidaActual.tipo_empaque,
      cantidadBultos: partidaActual.cantidad_bultos,
      pesoBrutoKg: partidaActual.peso_bruto_kg,
      taraUnitariaConfigurada: partidaActual.tara_unitaria_kg,
    });
  }, [
    partidaActual.tipo_empaque,
    partidaActual.cantidad_bultos,
    partidaActual.peso_bruto_kg,
    partidaActual.tara_unitaria_kg,
  ]);

  // Totales consolidados de la planilla de pesaje multi-partida
  const totalesPlanilla = useMemo(() => {
    return calcularTotalesPartidasRecepcion(partidasPlanilla);
  }, [partidasPlanilla]);

  // Al cambiar el contrato en recepción, actualizar preset de tara del cliente en la partida
  useEffect(() => {
    if (!recepcionForm.contrato_id) return;
    const ctr = contratos.find((c) => c.id === recepcionForm.contrato_id);
    if (!ctr) return;
    const presets = coldStorageRentalService.obtenerPresetTaraCliente(ctr.cliente_id);
    if (partidaActual.tipo_empaque === 'CANASTILLAS') {
      setPartidaActual((prev) => ({ ...prev, tara_unitaria_kg: presets.taraCanastillaKg }));
    } else if (partidaActual.tipo_empaque === 'CAJAS') {
      setPartidaActual((prev) => ({ ...prev, tara_unitaria_kg: presets.taraCajaKg }));
    }
  }, [recepcionForm.contrato_id, partidaActual.tipo_empaque, contratos]);

  // Totales consolidados del checklist de despacho
  const totalesDespachoSeleccionado = useMemo(() => {
    let bultos = 0;
    let peso = 0;
    let count = 0;

    Object.values(despachoItemsSeleccionados).forEach((item) => {
      if (item.seleccionado) {
        bultos += item.bultos_a_retirar || 0;
        peso = Math.round((peso + (item.peso_neto_a_retirar || 0) + Number.EPSILON) * 100) / 100;
        count += 1;
      }
    });

    return { totalBultos: bultos, totalPesoKg: peso, totalSeleccionados: count };
  }, [despachoItemsSeleccionados]);

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

  // Manejador: Crear Cliente y Contrato Express (15 Segundos)
  const handleGuardarClienteRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await coldStorageRentalService.crearClienteYContratoRapido(clienteRapidoForm);
      setClientes((prev) => [res.cliente, ...prev]);
      setContratos((prev) => [res.contrato, ...prev]);
      setRecepcionForm((prev) => ({ ...prev, contrato_id: res.contrato.id || '' }));
      setShowClienteRapidoSubmodal(false);

      Swal.fire({
        icon: 'success',
        title: '¡Cliente y Contrato Activos!',
        text: `${res.cliente.razon_social} configurado en 15 segundos listo para pesaje en báscula.`,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error Creando Cliente Rápido',
        text: err.message || 'Verifique los datos del cliente.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejador: Agregar Partida de Pesaje a la Planilla en Vivo
  const handleAgregarPartida = () => {
    if (!partidaActual.producto_nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto Requerido',
        text: 'Escribe el nombre del producto que estás pesando.',
      });
      return;
    }

    if (!gravimetriaPartidaActual.esValido) {
      Swal.fire({
        icon: 'warning',
        title: 'Pesaje Inválido',
        text: gravimetriaPartidaActual.error || 'Verifique el peso en báscula.',
      });
      return;
    }

    const nuevaPartida: PartidaRecepcion = {
      id: crypto.randomUUID(),
      producto_nombre: partidaActual.producto_nombre.trim(),
      producto_custodia_id: partidaActual.producto_custodia_id || undefined,
      lote_cliente: partidaActual.lote_cliente.trim() || `LOTE-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
      tipo_empaque: partidaActual.tipo_empaque,
      cantidad_bultos: Number(partidaActual.cantidad_bultos),
      tara_unitaria_kg: Number(partidaActual.tara_unitaria_kg),
      peso_tara_total_kg: Number(gravimetriaPartidaActual.taraTotalKg),
      peso_bruto_kg: Number(partidaActual.peso_bruto_kg),
      peso_neto_kg: Number(gravimetriaPartidaActual.pesoNetoKg),
      temperatura_c: Number(partidaActual.temperatura_c),
    };

    setPartidasPlanilla((prev) => [...prev, nuevaPartida]);

    // Limpiar campos de pesaje de la partida para permitir la siguiente pesada inmediata
    setPartidaActual((prev) => ({
      ...prev,
      peso_bruto_kg: 0,
      lote_cliente: '',
    }));
  };

  // Manejador: Eliminar Partida de la Planilla
  const handleEliminarPartida = (index: number) => {
    setPartidasPlanilla((prev) => prev.filter((_, i) => i !== index));
  };

  // Manejador Paso 2: Guardar Recepción Consolidada (Planilla Completa)
  const handleGuardarRecepcionMultiple = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recepcionForm.contrato_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Cliente no Seleccionado',
        text: 'Elige un cliente y contrato o crea uno nuevo con el botón express.',
      });
      return;
    }

    if (partidasPlanilla.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Planilla Vacía',
        text: 'Agrega al menos una pesada a la planilla con el botón "+ Agregar Partida a la Planilla".',
      });
      return;
    }

    try {
      setLoading(true);
      const ctr = contratos.find((c) => c.id === recepcionForm.contrato_id);
      const cl = clientes.find((c) => c.id === ctr?.cliente_id);

      if (recepcionForm.guardar_preset_tara && cl) {
        coldStorageRentalService.guardarPresetTaraCliente(cl.id || '', {
          taraCanastillaKg:
            partidaActual.tipo_empaque === 'CANASTILLAS'
              ? partidaActual.tara_unitaria_kg
              : TARAS_PREDETERMINADAS_KG.CANASTILLAS,
          taraCajaKg:
            partidaActual.tipo_empaque === 'CAJAS'
              ? partidaActual.tara_unitaria_kg
              : TARAS_PREDETERMINADAS_KG.CAJAS,
        });
      }

      const res = await coldStorageRentalService.registrarRecepcionMultiple({
        empresa_id: DEFAULT_EMPRESA_ID,
        contrato_id: recepcionForm.contrato_id,
        cliente_id: cl?.id,
        items: partidasPlanilla,
        transportador_nombre: recepcionForm.transportador_nombre || 'Conductor Directo',
        transportador_cedula: recepcionForm.transportador_cedula || '000000',
        placa_vehiculo: recepcionForm.placa_vehiculo || 'LOCAL',
        temperatura_camion_c: partidaActual.temperatura_c,
        observaciones: recepcionForm.observaciones || null,
      });

      setShowRecepcionModal(false);
      setPartidasPlanilla([]);

      Swal.fire({
        icon: 'success',
        title: '¡Planilla de Frío Consolidada!',
        html: `
          <div class="text-left space-y-2 p-2">
            <p>📄 Acta Consolidada: <b>${res.acta_consecutivo}</b></p>
            <p>📋 Partidas Pesadas: <b>${res.partidasGuardadas} ítems</b></p>
            <p>📦 Total Bultos: <b>${res.totales.totalBultos}</b></p>
            <p>⚖️ Tara Descontada: <b>${res.totales.totalTaraTotalKg} Kg</b></p>
            <p class="text-lg text-emerald-700 font-black">✨ Peso Neto Consolidado: ${res.totales.totalPesoNetoKg} Kg</p>
          </div>
        `,
        confirmButtonText: 'Descargar Acta PDF',
        confirmButtonColor: '#059669',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
      }).then((result) => {
        if (result.isConfirmed && cl) {
          coldStoragePdfService.generarPdfActaRecepcionMultiple({
            actaConsecutivo: res.acta_consecutivo,
            cliente: cl,
            contrato: ctr,
            transportadorNombre: recepcionForm.transportador_nombre || 'Conductor Directo',
            transportadorCedula: recepcionForm.transportador_cedula || '000000',
            placaVehiculo: recepcionForm.placa_vehiculo || 'LOCAL',
            temperaturaC: partidaActual.temperatura_c,
            observaciones: recepcionForm.observaciones || null,
            items: partidasPlanilla,
          });
        }
      });

      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Recepción',
        text: err.message || 'No se pudo guardar la recepción múltiple.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejador: Abrir Modal de Despacho con Selección de Cliente
  const handleAbrirDespachoModal = (invItem?: InventarioCustodiaItem) => {
    let targetClienteId = despachoClienteId;
    if (invItem) {
      targetClienteId = invItem.cliente_id;
      setSelectedItemForDespacho(invItem);
    } else if (!targetClienteId && inventario.length > 0) {
      targetClienteId = inventario[0].cliente_id;
    }
    setDespachoClienteId(targetClienteId);

    // Pre-seleccionar ítems del cliente
    const itemsDelCliente = inventario.filter((i) => i.cliente_id === targetClienteId && i.activo);
    const nuevoMap: Record<
      string,
      { seleccionado: boolean; bultos_a_retirar: number; peso_neto_a_retirar: number; es_retiro_total: boolean }
    > = {};

    itemsDelCliente.forEach((i) => {
      const match = invItem ? i.id === invItem.id : true;
      nuevoMap[i.id] = {
        seleccionado: match,
        bultos_a_retirar: i.bultos_actuales,
        peso_neto_a_retirar: Number(i.peso_neto_actual_kg),
        es_retiro_total: true,
      };
    });

    setDespachoItemsSeleccionados(nuevoMap);
    setShowDespachoModal(true);
  };

  // Manejador: Alternar selección de un ítem en el checklist de despacho
  const handleToggleSeleccionDespacho = (invId: string) => {
    setDespachoItemsSeleccionados((prev) => {
      const itemActual = prev[invId];
      if (!itemActual) return prev;
      return {
        ...prev,
        [invId]: {
          ...itemActual,
          seleccionado: !itemActual.seleccionado,
        },
      };
    });
  };

  // Manejador: Establecer retiro total para un ítem del checklist
  const handleRetiroTotalItem = (invItem: InventarioCustodiaItem) => {
    setDespachoItemsSeleccionados((prev) => ({
      ...prev,
      [invItem.id]: {
        seleccionado: true,
        bultos_a_retirar: invItem.bultos_actuales,
        peso_neto_a_retirar: Number(invItem.peso_neto_actual_kg),
        es_retiro_total: true,
      },
    }));
  };

  // Manejador Paso 3: Guardar Despacho Consolidado (Checklist Múltiple)
  const handleGuardarDespachoMultiple = async (e: React.FormEvent) => {
    e.preventDefault();

    const cl = clientes.find((c) => c.id === despachoClienteId);
    if (!cl || !cl.id) {
      Swal.fire({ icon: 'warning', title: 'Cliente Requerido', text: 'Selecciona un cliente válido para despachar.' });
      return;
    }

    const itemsAProcesar: ItemDespacho[] = [];
    Object.entries(despachoItemsSeleccionados).forEach(([invId, data]) => {
      if (data.seleccionado && data.bultos_a_retirar > 0 && data.peso_neto_a_retirar > 0) {
        const invRow = inventario.find((i) => i.id === invId);
        itemsAProcesar.push({
          inventario_id: invId,
          producto_nombre: invRow?.producto?.nombre || 'Producto en Custodia',
          tipo_empaque: invRow?.producto?.tipo_empaque || 'ESTÁNDAR',
          bultos_a_retirar: data.bultos_a_retirar,
          peso_neto_a_retirar: data.peso_neto_a_retirar,
          es_retiro_total: data.es_retiro_total,
        });
      }
    });

    if (itemsAProcesar.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin Lotes Seleccionados',
        text: 'Marca al menos un lote con cantidades mayores a cero para despachar.',
      });
      return;
    }

    const ctr = contratos.find((c) => c.cliente_id === cl.id && c.estado === 'VIGENTE');

    try {
      setLoading(true);
      const res = await coldStorageRentalService.registrarDespachoMultiple({
        contrato_id: ctr?.id || '00000000-0000-0000-0000-000000000000',
        cliente_id: cl.id,
        items: itemsAProcesar,
        transportador_nombre: despachoForm.transportador_nombre || 'Conductor Retiro',
        transportador_cedula: despachoForm.transportador_cedula || '000000',
        placa_vehiculo: despachoForm.placa_vehiculo || 'RETIRO',
        observaciones: despachoForm.observaciones || null,
        autorizar_salida_mora: despachoForm.autorizar_salida_mora,
      });

      setShowDespachoModal(false);

      Swal.fire({
        icon: 'success',
        title: '¡Despacho Consolidado Exitoso!',
        html: `
          <div class="text-left space-y-2 p-2">
            <p>📄 Acta de Salida: <b>${res.acta_consecutivo}</b></p>
            <p>📦 Lotes Entregados: <b>${res.itemsProcesados}</b></p>
            <p>📦 Total Bultos Retirados: <b>${res.totalBultosDespachados}</b></p>
            <p class="text-lg text-amber-700 font-black">⚖️ Peso Neto Despachado: ${res.totalPesoDespachadoKg} Kg</p>
          </div>
        `,
        confirmButtonText: 'Descargar Acta Salida PDF',
        confirmButtonColor: '#d97706',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
      }).then((result) => {
        if (result.isConfirmed) {
          coldStoragePdfService.generarPdfActaDespachoMultiple({
            actaConsecutivo: res.acta_consecutivo,
            cliente: cl,
            transportadorNombre: despachoForm.transportador_nombre || 'Conductor Retiro',
            transportadorCedula: despachoForm.transportador_cedula || '000000',
            placaVehiculo: despachoForm.placa_vehiculo || 'RETIRO',
            observaciones: despachoForm.observaciones || null,
            items: itemsAProcesar,
          });
        }
      });

      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Despacho',
        text: err.message || 'No se pudo registrar el despacho múltiple.',
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
              const primerClienteConInv = clientes.find((c) =>
                inventario.some((i) => i.cliente_id === c.id && i.activo)
              );
              if (primerClienteConInv && primerClienteConInv.id) {
                setDespachoClienteId(primerClienteConInv.id);
                const itemsDelCliente = inventario.filter(
                  (i) => i.cliente_id === primerClienteConInv.id && i.activo
                );
                const nuevoMap: Record<
                  string,
                  { seleccionado: boolean; bultos_a_retirar: number; peso_neto_a_retirar: number; es_retiro_total: boolean }
                > = {};
                itemsDelCliente.forEach((i) => {
                  nuevoMap[i.id] = {
                    seleccionado: true,
                    bultos_a_retirar: i.bultos_actuales,
                    peso_neto_a_retirar: Number(i.peso_neto_actual_kg),
                    es_retiro_total: true,
                  };
                });
                setDespachoItemsSeleccionados(nuevoMap);
              }
              setShowDespachoModal(true);
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
      {/* ========================================================================= */}
      {/* MODAL 2: RECEPCIÓN Y PLANILLA DE PESAJE EN BÁSCULA (PASO 2) */}
      {/* ========================================================================= */}
      {showRecepcionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-emerald-600" />
                  Paso 2: Planilla de Pesaje y Recepción en Frío
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registra múltiples pesadas para el mismo camión o cliente con taras heterogéneas en una sola acta.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRecepcionModal(false);
                  setPartidasPlanilla([]);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Selector de Cliente / Contrato con Botón Express in-line */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-black uppercase tracking-wider text-indigo-950">
                  Cliente Depositante y Contrato Activo *
                </label>
                <button
                  type="button"
                  onClick={() => setShowClienteRapidoSubmodal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  + Nuevo Cliente Rápido (15s)
                </button>
              </div>

              <select
                required
                value={recepcionForm.contrato_id}
                onChange={(e) => setRecepcionForm({ ...recepcionForm, contrato_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-indigo-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold text-sm shadow-xs"
              >
                <option value="">-- Elige el cliente que entrega la mercancía --</option>
                {contratos
                  .filter((c) => c.estado === 'VIGENTE')
                  .map((ctr) => {
                    const cl = clientes.find((c) => c.id === ctr.cliente_id);
                    return (
                      <option key={ctr.id} value={ctr.id}>
                        {cl?.razon_social} (Contrato: {ctr.consecutivo} • {ctr.modalidad_tiempo} •{' '}
                        {ctr.posiciones_contratadas * 800} Kg nominales)
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* SECCIÓN 1: FORMULARIO DE PARTIDA ACTUAL EN BÁSCULA */}
            <div className="p-5 rounded-2xl bg-white border-2 border-emerald-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" /> 1. Pesaje de la Partida Actual en Báscula
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Configura empaque y peso bruto de esta pesada
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto / Especie *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Corvina Entera, Camarón, Atún, Filete..."
                    value={partidaActual.producto_nombre}
                    onChange={(e) => setPartidaActual({ ...partidaActual, producto_nombre: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lote del Cliente (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. LOTE-OCT-01 o N/A"
                    value={partidaActual.lote_cliente}
                    onChange={(e) => setPartidaActual({ ...partidaActual, lote_cliente: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Selector Visual de Empaque */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Tipo de Empaque y Tara Unitaria:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPartidaActual({
                        ...partidaActual,
                        tipo_empaque: 'CANASTILLAS',
                        tara_unitaria_kg: 2.0,
                      })
                    }
                    className={`p-3 rounded-xl border text-center transition-all ${
                      partidaActual.tipo_empaque === 'CANASTILLAS'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <div className="text-xl">🧺</div>
                    <div className="text-xs mt-1">Canastillas (2.0 Kg)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPartidaActual({
                        ...partidaActual,
                        tipo_empaque: 'CAJAS',
                        tara_unitaria_kg: 0.8,
                      })
                    }
                    className={`p-3 rounded-xl border text-center transition-all ${
                      partidaActual.tipo_empaque === 'CAJAS'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <div className="text-xl">📦</div>
                    <div className="text-xs mt-1">Cajas (0.8 Kg)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPartidaActual({
                        ...partidaActual,
                        tipo_empaque: 'SUELTO',
                        cantidad_bultos: 0,
                        tara_unitaria_kg: 0.0,
                      })
                    }
                    className={`p-3 rounded-xl border text-center transition-all ${
                      partidaActual.tipo_empaque === 'SUELTO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <div className="text-xl">🐟</div>
                    <div className="text-xs mt-1">Suelto / Granel (0 Kg)</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {partidaActual.tipo_empaque === 'CANASTILLAS'
                        ? 'Cantidad de Canastillas'
                        : partidaActual.tipo_empaque === 'CAJAS'
                        ? 'Cantidad de Cajas'
                        : 'Bultos (0 para granel)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={partidaActual.cantidad_bultos}
                      onChange={(e) =>
                        setPartidaActual({ ...partidaActual, cantidad_bultos: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-black text-slate-900 text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tara por Unidad (Kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={partidaActual.tara_unitaria_kg}
                      onChange={(e) =>
                        setPartidaActual({ ...partidaActual, tara_unitaria_kg: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Pantalla en Vivo de Báscula Calibrada */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" /> BÁSCULA ELECTRÓNICA CALIBRADA
                  </span>
                  <span className="text-xs font-mono text-slate-400">TARA DESCONTADA EN VIVO</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Peso Bruto en Báscula (Kg) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={partidaActual.peso_bruto_kg || ''}
                      onChange={(e) =>
                        setPartidaActual({ ...partidaActual, peso_bruto_kg: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border-2 border-emerald-500 text-emerald-400 font-mono font-black text-2xl outline-hidden"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <div className="text-xs text-slate-400">
                      Tara Calculada: -{gravimetriaPartidaActual.taraTotalKg.toFixed(2)} Kg
                    </div>
                    <div className="text-xs uppercase text-slate-400 font-bold mt-1">Peso Neto Resultante:</div>
                    <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                      {gravimetriaPartidaActual.pesoNetoKg.toFixed(2)}{' '}
                      <span className="text-xs font-sans text-slate-400">Kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Agregar Partida */}
              <button
                type="button"
                onClick={handleAgregarPartida}
                disabled={!partidaActual.producto_nombre.trim() || !gravimetriaPartidaActual.esValido}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" />
                Agregar Partida a la Planilla de Pesaje
              </button>
            </div>

            {/* SECCIÓN 2: PLANILLA DE PESAJE EN VIVO ACUMULADA */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-indigo-600" /> 2. Planilla Acumulada del Camión (
                  {partidasPlanilla.length} {partidasPlanilla.length === 1 ? 'partida' : 'partidas'})
                </span>
                {partidasPlanilla.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPartidasPlanilla([])}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Limpiar toda la planilla
                  </button>
                )}
              </div>

              {partidasPlanilla.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-white border border-dashed border-slate-300 text-slate-500 space-y-1">
                  <Scale className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Aún no hay pesadas agregadas a la planilla.</p>
                  <p className="text-xs text-slate-500">
                    Ingresa el producto, empaque y peso bruto arriba y presiona "Agregar Partida".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Producto</th>
                          <th className="p-2.5">Empaque</th>
                          <th className="p-2.5 text-center">Bultos</th>
                          <th className="p-2.5 text-right">Tara Tot (Kg)</th>
                          <th className="p-2.5 text-right">Bruto (Kg)</th>
                          <th className="p-2.5 text-right">Neto Real (Kg)</th>
                          <th className="p-2.5 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {partidasPlanilla.map((p, idx) => (
                          <tr key={p.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{p.producto_nombre}</td>
                            <td className="p-2.5 text-slate-700">{p.tipo_empaque}</td>
                            <td className="p-2.5 text-center font-bold text-slate-800">{p.cantidad_bultos}</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">
                              -{p.peso_tara_total_kg.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-700">
                              {p.peso_bruto_kg.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-emerald-700 text-sm">
                              {p.peso_neto_kg.toFixed(2)} Kg
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleEliminarPartida(idx)}
                                title="Eliminar pesada"
                                className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Barra de Totales Gravimétricos Consolidados */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-slate-900">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-900 uppercase">Total Bultos:</div>
                      <div className="text-lg font-black text-emerald-950 font-mono">
                        {totalesPlanilla.totalBultos} bultos
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-emerald-900 uppercase">Total Bruto:</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">
                        {totalesPlanilla.totalPesoBrutoKg.toFixed(2)} Kg
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-emerald-900 uppercase">Total Tara:</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">
                        -{totalesPlanilla.totalTaraTotalKg.toFixed(2)} Kg
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-600 text-white text-right">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-100">
                        Total Neto Consolidado:
                      </div>
                      <div className="text-xl font-black font-mono tracking-tight">
                        {totalesPlanilla.totalPesoNetoKg.toFixed(2)} Kg
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: TRANSPORTE Y GUARDADO FINAL */}
            <form onSubmit={handleGuardarRecepcionMultiple} className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  3. Datos de Transporte y Conductor
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Conductor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Pedro Picapiedra"
                      value={recepcionForm.transportador_nombre}
                      onChange={(e) =>
                        setRecepcionForm({ ...recepcionForm, transportador_nombre: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cédula del Conductor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1098765432"
                      value={recepcionForm.transportador_cedula}
                      onChange={(e) =>
                        setRecepcionForm({ ...recepcionForm, transportador_cedula: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Placa del Vehículo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. WKL-890"
                      value={recepcionForm.placa_vehiculo}
                      onChange={(e) =>
                        setRecepcionForm({ ...recepcionForm, placa_vehiculo: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones de Recepción</label>
                  <input
                    type="text"
                    placeholder="Ej. Descargue en rampa frigorífica 1, pescado en congelación profunda..."
                    value={recepcionForm.observaciones}
                    onChange={(e) => setRecepcionForm({ ...recepcionForm, observaciones: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-medium text-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecepcionModal(false);
                    setPartidasPlanilla([]);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || partidasPlanilla.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center gap-2 transition-all"
                >
                  {loading ? 'Guardando...' : `💾 Guardar Recepción Consolidada (${partidasPlanilla.length} Partidas)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL EXPRESS: CREACIÓN RÁPIDA DE CLIENTE (15 SEGUNDOS) */}
      {/* ========================================================================= */}
      {showClienteRapidoSubmodal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-indigo-400 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Crear Cliente y Activar Contrato (15 Segundos)
              </h3>
              <button
                type="button"
                onClick={() => setShowClienteRapidoSubmodal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Registra el cliente al vuelo sin salir del modal de pesaje. Se creará automáticamente un contrato activo.
            </p>

            <form onSubmit={handleGuardarClienteRapido} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Razón Social o Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora del Mar SAS / Juan Perez"
                  value={clienteRapidoForm.razon_social}
                  onChange={(e) =>
                    setClienteRapidoForm({ ...clienteRapidoForm, razon_social: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIT o Cédula *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 901234567-8"
                    value={clienteRapidoForm.numero_identificacion}
                    onChange={(e) =>
                      setClienteRapidoForm({ ...clienteRapidoForm, numero_identificacion: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Celular *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 3101234567"
                    value={clienteRapidoForm.telefono}
                    onChange={(e) =>
                      setClienteRapidoForm({ ...clienteRapidoForm, telefono: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad de Tiempo *</label>
                  <select
                    value={clienteRapidoForm.modalidad_tiempo}
                    onChange={(e) =>
                      setClienteRapidoForm({
                        ...clienteRapidoForm,
                        modalidad_tiempo: e.target.value as 'DIAS' | 'MESES',
                        tarifa_pactada: e.target.value === 'DIAS' ? 45000 : 650000,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="DIAS">Por DÍAS (Temporal)</option>
                    <option value="MESES">Por MESES (Mensualidad)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tarifa Pactada COP ({clienteRapidoForm.modalidad_tiempo === 'DIAS' ? '$/día' : '$/mes'}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={clienteRapidoForm.tarifa_pactada}
                    onChange={(e) =>
                      setClienteRapidoForm({
                        ...clienteRapidoForm,
                        tarifa_pactada: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-black text-indigo-700 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClienteRapidoSubmodal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  {loading ? 'Activando...' : '⚡ Activar Cliente y Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DESPACHO CONSOLIDADO CON CHECKLIST MULTI-LOTE (PASO 3) */}
      {/* ========================================================================= */}
      {showDespachoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Truck className="w-6 h-6 text-amber-600" />
                  Paso 3: Despacho Consolidado de Mercancía en Custodia
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona los lotes activos a retirar con retiro total o parcial en una sola Acta de Salida.
                </p>
              </div>
              <button
                onClick={() => setShowDespachoModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Selector de Cliente */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cliente Depositante que Retira la Mercancía *
              </label>
              <select
                required
                value={despachoClienteId}
                onChange={(e) => {
                  setDespachoClienteId(e.target.value);
                  // Reinicializar selección para el nuevo cliente
                  const itemsDelCliente = inventario.filter((i) => i.cliente_id === e.target.value && i.activo);
                  const nuevoMap: Record<
                    string,
                    { seleccionado: boolean; bultos_a_retirar: number; peso_neto_a_retirar: number; es_retiro_total: boolean }
                  > = {};
                  itemsDelCliente.forEach((i) => {
                    nuevoMap[i.id] = {
                      seleccionado: true,
                      bultos_a_retirar: i.bultos_actuales,
                      peso_neto_a_retirar: Number(i.peso_neto_actual_kg),
                      es_retiro_total: true,
                    };
                  });
                  setDespachoItemsSeleccionados(nuevoMap);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Elige un cliente --</option>
                {clientes.map((cl) => {
                  const itemsCount = inventario.filter((i) => i.cliente_id === cl.id && i.activo).length;
                  return (
                    <option key={cl.id} value={cl.id}>
                      {cl.razon_social} ({itemsCount} lotes activos en frío)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Checklist de Lotes Activos del Cliente */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                Existencias Activas en Cuarto Frío:
              </span>

              {inventario.filter((i) => i.cliente_id === despachoClienteId && i.activo).length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                  No hay inventario activo en custodia para este cliente.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {inventario
                    .filter((i) => i.cliente_id === despachoClienteId && i.activo)
                    .map((item) => {
                      const sel = despachoItemsSeleccionados[item.id] || {
                        seleccionado: false,
                        bultos_a_retirar: item.bultos_actuales,
                        peso_neto_a_retirar: Number(item.peso_neto_actual_kg),
                        es_retiro_total: true,
                      };

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            sel.seleccionado
                              ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                              : 'bg-white border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={sel.seleccionado}
                                onChange={() => handleToggleSeleccionDespacho(item.id)}
                                className="w-5 h-5 rounded-md text-amber-600 focus:ring-amber-500"
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-sm block">
                                  {item.producto?.nombre || 'Pescado en Custodia'}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Lote: <b className="text-slate-700">{item.lote_cliente}</b> • Empaque:{' '}
                                  {item.producto?.tipo_empaque || 'Estándar'} • Saldo:{' '}
                                  <b className="text-emerald-700 font-bold">{item.peso_neto_actual_kg} Kg</b> (
                                  {item.bultos_actuales} bultos)
                                </span>
                              </div>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleRetiroTotalItem(item)}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs shrink-0"
                            >
                              Retiro Total
                            </button>
                          </div>

                          {sel.seleccionado && (
                            <div className="mt-3 pt-2.5 border-t border-amber-200/80 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-slate-700 font-bold mb-1">
                                  Bultos a Retirar (Máx: {item.bultos_actuales})
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.bultos_actuales}
                                  value={sel.bultos_a_retirar}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setDespachoItemsSeleccionados((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...sel,
                                        bultos_a_retirar: val,
                                        es_retiro_total:
                                          val >= item.bultos_actuales &&
                                          sel.peso_neto_a_retirar >= Number(item.peso_neto_actual_kg),
                                      },
                                    }));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-bold text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-700 font-bold mb-1">
                                  Peso Neto a Retirar Kg (Máx: {item.peso_neto_actual_kg})
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.1"
                                  max={Number(item.peso_neto_actual_kg)}
                                  value={sel.peso_neto_a_retirar}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setDespachoItemsSeleccionados((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...sel,
                                        peso_neto_a_retirar: val,
                                        es_retiro_total:
                                          sel.bultos_a_retirar >= item.bultos_actuales &&
                                          val >= Number(item.peso_neto_actual_kg),
                                      },
                                    }));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-black text-slate-900 font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Barra de Totales a Retirar */}
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-amber-50 border border-amber-300">
                <div>
                  <span className="text-xs text-amber-900 font-bold block uppercase">Total a Despachar:</span>
                  <span className="text-sm text-slate-700">
                    {totalesDespachoSeleccionado.totalSeleccionados} lotes marcados •{' '}
                    <b>{totalesDespachoSeleccionado.totalBultos} bultos</b>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-amber-800 font-bold block">PESO NETO SALIDA:</span>
                  <span className="text-2xl font-black font-mono text-amber-800">
                    {totalesDespachoSeleccionado.totalPesoKg.toFixed(2)} Kg
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario de Transporte */}
            <form onSubmit={handleGuardarDespachoMultiple} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Conductor Receptor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Martinez"
                    value={despachoForm.transportador_nombre}
                    onChange={(e) => setDespachoForm({ ...despachoForm, transportador_nombre: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cédula del Conductor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 79888999"
                    value={despachoForm.transportador_cedula}
                    onChange={(e) => setDespachoForm({ ...despachoForm, transportador_cedula: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Placa del Vehículo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. SST-345"
                    value={despachoForm.placa_vehiculo}
                    onChange={(e) => setDespachoForm({ ...despachoForm, placa_vehiculo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej. Salida autorizada para distribución local..."
                  value={despachoForm.observaciones}
                  onChange={(e) => setDespachoForm({ ...despachoForm, observaciones: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-medium text-slate-900 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDespachoModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || totalesDespachoSeleccionado.totalSeleccionados === 0}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center gap-2"
                >
                  {loading ? 'Despachando...' : '🚚 Confirmar Despacho Consolidado y Emitir Acta'}
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
