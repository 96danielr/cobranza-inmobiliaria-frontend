/**
 * Centralized property type configuration.
 * All UI labels, field visibility, and terminology derive from this single source.
 */

export type PropertyType = 'lotes' | 'casas' | 'apartamentos' | 'locales';

export interface PropertyConfig {
  /** Singular label: "Lote", "Casa", "Apartamento", "Local" */
  singular: string;
  /** Plural label: "Lotes", "Casas", "Apartamentos", "Locales" */
  plural: string;
  /** Label for the unit number field */
  unitLabel: string;
  /** Label for manzana/block (empty string if N/A) */
  blockLabel: string;
  manzanaLabel?: string;
  /** Whether tower field is visible */
  showTower: boolean;
  towerLabel?: string;
  /** Whether floor field is visible */
  showFloor: boolean;
  floorLabel?: string;
  /** Whether manzana field is visible */
  showManzana: boolean;
  /** Label for the stage/grouping */
  stageLabel: string;
  /** Icon name (Lucide icon name) */
  icon: string;
  /** Color for badges */
  color: string;
}

export const PROPERTY_CONFIGS: Record<PropertyType, PropertyConfig> = {
  lotes: {
    singular: 'Lote',
    plural: 'Lotes',
    unitLabel: 'N° de Lote',
    blockLabel: 'Manzana',
    manzanaLabel: 'Manzana',
    showTower: false,
    showFloor: false,
    showManzana: true,
    stageLabel: 'Etapa',
    icon: 'Map',
    color: '#22c55e',
  },
  casas: {
    singular: 'Casa',
    plural: 'Casas',
    unitLabel: 'N° de Casa',
    blockLabel: 'Manzana',
    manzanaLabel: 'Manzana',
    showTower: false,
    showFloor: false,
    showManzana: true,
    stageLabel: 'Etapa',
    icon: 'Home',
    color: '#3b82f6',
  },
  apartamentos: {
    singular: 'Apartamento',
    plural: 'Apartamentos',
    unitLabel: 'N° de Apartamento',
    blockLabel: '',
    showTower: true,
    towerLabel: 'Torre',
    showFloor: true,
    floorLabel: 'Piso',
    showManzana: false,
    stageLabel: 'Etapa',
    icon: 'Building2',
    color: '#8b5cf6',
  },
  locales: {
    singular: 'Local',
    plural: 'Locales',
    unitLabel: 'N° de Local',
    blockLabel: '',
    showTower: false,
    showFloor: false,
    showManzana: false,
    stageLabel: 'Etapa / Centro Comercial',
    icon: 'Store',
    color: '#f59e0b',
  },
};

/**
 * Get config for a property type, falling back to 'lotes' for unknown values.
 */
export function getPropertyConfig(type?: string | null): PropertyConfig {
  return PROPERTY_CONFIGS[(type as PropertyType)] || PROPERTY_CONFIGS.lotes;
}

/**
 * All available property types for selectors.
 */
export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'lotes', label: 'Lotes', icon: 'Map' },
  { value: 'casas', label: 'Casas', icon: 'Home' },
  { value: 'apartamentos', label: 'Apartamentos', icon: 'Building2' },
  { value: 'locales', label: 'Locales Comerciales', icon: 'Store' },
];

/**
 * Build a display string for a property unit (replaces hardcoded "Mz X Lote Y")
 */
export function formatPropertyUnit(lot: {
  propertyType?: string;
  manzana?: string;
  lotNumber?: string;
  tower?: string;
  floor?: string;
  nomenclature?: string;
}): string {
  // If nomenclature is already set, use it
  if (lot.nomenclature) return lot.nomenclature;
  
  const cfg = getPropertyConfig(lot.propertyType);
  
  if (lot.propertyType === 'apartamentos' && lot.tower) {
    return `Torre ${lot.tower} Piso ${lot.floor || '?'} Apto ${lot.lotNumber || ''}`.trim();
  }
  if (cfg.showManzana && lot.manzana) {
    return `${cfg.blockLabel} ${lot.manzana} ${cfg.singular} ${lot.lotNumber || ''}`.trim();
  }
  return `${cfg.singular} ${lot.lotNumber || ''}`.trim();
}
