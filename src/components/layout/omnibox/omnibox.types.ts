import type { LucideIcon } from 'lucide-react';
import type { ERPViewKey } from '../EnterpriseSidebar';

/**
 * Categorías seleccionables para filtrar resultados en el Omnibox
 */
export type OmniboxCategory = 'Todos' | 'Navegación' | 'Clientes' | 'Productos' | 'Acciones';

/**
 * Categorías específicas asignables a una acción individual
 */
export type OmniboxActionCategory = 'Navegación' | 'Clientes' | 'Productos' | 'Acciones';

/**
 * Variantes de color semántico para badges en Rico UI Dark Glassmorphism
 */
export type OmniboxBadgeVariant = 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';

/**
 * Modelo de datos para un elemento ejecutable dentro del Omnibox
 */
export interface OmniboxAction {
  id: string;
  title: string;
  category: OmniboxActionCategory;
  icon: LucideIcon;
  detail?: string;
  badge?: string;
  badgeVariant?: OmniboxBadgeVariant;
  onSelect: () => void;
}

/**
 * Props del componente modal raíz de la paleta de comandos
 */
export interface GlobalOmniboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ERPViewKey) => void;
}

/**
 * Definición estructural para los botones chip de categoría en la barra superior
 */
export interface CategoryChipItem {
  id: OmniboxCategory;
  label: string;
  prefix?: string;
  icon: LucideIcon;
}

