// DNA序列数据类型定义

export interface Feature {
  id: string;
  name: string;
  type: string;
  start: number;
  end: number;
  strand: 'forward' | 'reverse' | 'both';
  color?: string;
  label?: string;
  note?: string;
  frame?: number; // 读码框 (0, 1, 2)，用于CDS翻译
}

export interface RestrictionSite {
  id: string;
  name: string;
  sequence: string;
  position: number;
  cutPosition?: number;
  color?: string;
}

export interface Primer {
  id: string;
  name: string;
  sequence: string;
  start: number;
  end: number;
  strand: 'forward' | 'reverse';
  tm?: number;
  color?: string;
}

export interface DNASequence {
  id: string;
  name: string;
  description: string;
  sequence: string;
  length: number;
  isCircular: boolean;
  features: Feature[];
  restrictionSites: RestrictionSite[];
  primers: Primer[];
  accession?: string;
  organism?: string;
  date?: string;
}

export interface GenBankMetadata {
  locus: string;
  definition: string;
  accession: string;
  version: string;
  keywords: string;
  source: string;
  organism: string;
  date: string;
  length: number;
  moleculeType: string;
  topology: string;
  division: string;
}

export interface ViewState {
  scale: number;
  offset: number;
  selectedBase: number | null;
  selectionStart: number | null;
  selectionEnd: number | null;
  showFeatures: boolean;
  showEnzymes: boolean;
  showPrimers: boolean;
  showTranslations: boolean;
}

export type ViewMode = 'map' | 'sequence' | 'enzymes' | 'features';
