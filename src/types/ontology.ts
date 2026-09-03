// Types for Padārtha Ontology Management System (POMS)

export type LanguageMode = 'sa' | 'iast' | 'en'; // Devanagari Sanskrit, IAST transliteration, English

export type PadarthaCategory =
  | 'Dravya'    // Substance
  | 'Guna'      // Quality
  | 'Karma'     // Action
  | 'Samanya'   // Generality / Universal
  | 'Visesa'    // Particularity
  | 'Samavaya'  // Inherence
  | 'Abhava';   // Non-existence

export type EternalStatus = 'Eternal' | 'Non-Eternal' | 'Both' | 'N/A';

export interface MultilingualText {
  sa: string;     // Devanagari (e.g., "पृथ्वी")
  iast: string;   // Transliteration (e.g., "Pṛthivī")
  en: string;     // English translation (e.g., "Earth / Solid State")
}

export interface SutraCitation {
  textSa: string;    // Sanskrit aphorism
  textIast: string;  // IAST aphorism
  translation: string; // English translation
  source: string;    // e.g. "Tarkasaṃgraha 2", "Vaiśeṣikasūtra 1.1.5"
}

export interface PadarthaEntity {
  id: string;
  category: PadarthaCategory;
  name: MultilingualText;
  description: MultilingualText;
  sutra?: SutraCitation;
  eternalStatus: EternalStatus;
  parentId?: string; // Sub-category hierarchy
  attributes: string[]; // Key qualities or characteristics
  associatedGunas?: string[]; // IDs of Guṇas inhering in this Dravya
  associatedKarmas?: string[]; // IDs of Karmas possible in this Dravya
  associatedDravyas?: string[]; // For Guṇas/Karmas, which Dravyas they inhere in
  tags: string[];
  color?: string; // Custom badge/node color
}

export type RelationType =
  | 'inheresIn'           // Samavāya (Inherence)
  | 'contacts'            // Saṃyoga (Conjunction / Temporary contact)
  | 'materialCauseOf'     // Samavāyi-kāraṇa (Material cause)
  | 'nonMaterialCauseOf'  // Asamavāyi-kāraṇa (Non-material cause)
  | 'efficientCauseOf'    // Nimitta-kāraṇa (Efficient cause)
  | 'exclusiveQualityOf'  // Asādhāraṇa-guṇa (Exclusive defining attribute)
  | 'subCategoryOf'       // Taxonomical child
  | 'oppositeOf';         // Contradictory attribute / Abhāva target

export interface EntityRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  label: MultilingualText;
  isEternal: boolean;
  description?: MultilingualText;
}

export interface GraphNode {
  id: string;
  label: string;
  category: PadarthaCategory;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius: number;
  entity: PadarthaEntity;
}

export interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  type: RelationType;
  label: string;
  relation: EntityRelation;
}

export interface InferenceRule {
  id: string;
  name: MultilingualText;
  description: MultilingualText;
  premise: string; // Logical premise statement
  ruleType: 'quality_inherence' | 'causality' | 'eternality' | 'syllogism';
  evaluate: (entities: PadarthaEntity[], relations: EntityRelation[]) => InferenceResult;
}

export interface SyllogismStep {
  step: 'Pratijna' | 'Hetu' | 'Udaharana' | 'Upanaya' | 'Nigamana';
  nameSa: string;
  nameEn: string;
  statement: string;
}

export interface InferenceResult {
  ruleId: string;
  passed: boolean;
  conclusion: string;
  proofTrace: SyllogismStep[];
  affectedEntityIds: string[];
  details: string;
}

export interface SPARQLQuery {
  id: string;
  title: string;
  query: string;
  description: string;
}

export interface RealInstance {
  id: string;
  name: string;
  description: string;
  primaryDravya: string;
  inherentGunas: string[];
  possibleKarmas: string[];
  isEternal: boolean;
  causeType: 'Kārya' /* Effect / Created */ | 'Nitya' /* Eternal Cause */;
}

export interface DarshanaComparison {
  categoryName: MultilingualText;
  vaisesika: string;
  nyaya: string;
  sankhya: string;
  advaita: string;
  jaina: string;
}
