import { useState, useCallback, useRef } from 'react';
import type { DNASequence, Feature, ViewState } from '@/types/dna';
import { parseGenBank, generateGenBank, detectRestrictionSites } from '@/utils/genbankParser';

export function useDNASequence() {
  const [sequence, setSequence] = useState<DNASequence | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offset: 0,
    selectedBase: null,
    selectionStart: null,
    selectionEnd: null,
    showFeatures: true,
    showEnzymes: true,
    showPrimers: true,
    showTranslations: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载GenBank文件
  const loadGenBankFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseGenBank(content);
        setSequence(parsed);
      }
    };
    reader.readAsText(file);
  }, []);

  // 创建新序列
  const createNewSequence = useCallback((name: string, seq: string, isCircular = false) => {
    const upperSeq = seq.toUpperCase().replace(/[^ATCG]/g, '');
    const newSequence: DNASequence = {
      id: `seq-${Date.now()}`,
      name: name,
      description: '',
      sequence: upperSeq,
      length: upperSeq.length,
      isCircular: isCircular,
      features: [],
      restrictionSites: detectRestrictionSites(upperSeq),
      primers: [],
    };
    setSequence(newSequence);
  }, []);

  // 更新序列
  const updateSequence = useCallback((updates: Partial<DNASequence>) => {
    setSequence((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  // 添加特征
  const addFeature = useCallback((feature: Omit<Feature, 'id'>) => {
    setSequence((prev) => {
      if (!prev) return null;
      const newFeature: Feature = {
        ...feature,
        id: `feature-${Date.now()}`,
      };
      return {
        ...prev,
        features: [...prev.features, newFeature],
      };
    });
  }, []);

  // 删除特征
  const removeFeature = useCallback((featureId: string) => {
    setSequence((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        features: prev.features.filter((f) => f.id !== featureId),
      };
    });
  }, []);

  // 更新特征
  const updateFeature = useCallback((featureId: string, updates: Partial<Feature>) => {
    setSequence((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        features: prev.features.map((f) =>
          f.id === featureId ? { ...f, ...updates } : f
        ),
      };
    });
  }, []);

  // 添加引物
  const addPrimer = useCallback((primer: { name: string; sequence: string; start: number; end: number; strand: 'forward' | 'reverse' }) => {
    setSequence((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        primers: [...prev.primers, { ...primer, id: `primer-${Date.now()}` }],
      };
    });
  }, []);

  // 删除引物
  const removePrimer = useCallback((primerId: string) => {
    setSequence((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        primers: prev.primers.filter((p) => p.id !== primerId),
      };
    });
  }, []);

  // 编辑序列（插入、删除、替换）
  const insertBases = useCallback((position: number, bases: string) => {
    setSequence((prev) => {
      if (!prev) return null;
      const upperBases = bases.toUpperCase().replace(/[^ATCG]/g, '');
      const newSeq = prev.sequence.slice(0, position) + upperBases + prev.sequence.slice(position);
      return {
        ...prev,
        sequence: newSeq,
        length: newSeq.length,
        restrictionSites: detectRestrictionSites(newSeq),
      };
    });
  }, []);

  const deleteBases = useCallback((start: number, end: number) => {
    setSequence((prev) => {
      if (!prev) return null;
      const newSeq = prev.sequence.slice(0, start) + prev.sequence.slice(end);
      return {
        ...prev,
        sequence: newSeq,
        length: newSeq.length,
        restrictionSites: detectRestrictionSites(newSeq),
      };
    });
  }, []);

  const replaceBases = useCallback((start: number, end: number, bases: string) => {
    setSequence((prev) => {
      if (!prev) return null;
      const upperBases = bases.toUpperCase().replace(/[^ATCG]/g, '');
      const newSeq = prev.sequence.slice(0, start) + upperBases + prev.sequence.slice(end);
      return {
        ...prev,
        sequence: newSeq,
        length: newSeq.length,
        restrictionSites: detectRestrictionSites(newSeq),
      };
    });
  }, []);

  // 反转互补
  const reverseComplement = useCallback(() => {
    setSequence((prev) => {
      if (!prev) return null;
      const complement: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' };
      const newSeq = prev.sequence
        .split('')
        .reverse()
        .map((base) => complement[base] || base)
        .join('');
      return {
        ...prev,
        sequence: newSeq,
        restrictionSites: detectRestrictionSites(newSeq),
      };
    });
  }, []);

  // 保存为GenBank文件
  const saveAsGenBank = useCallback(() => {
    if (!sequence) return;
    const content = generateGenBank(sequence);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sequence.name}.gb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sequence]);

  // 保存为FASTA文件
  const saveAsFasta = useCallback(() => {
    if (!sequence) return;
    const content = `>${sequence.name} ${sequence.description}\n${sequence.sequence.match(/.{1,60}/g)?.join('\n') || sequence.sequence}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sequence.name}.fa`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sequence]);

  // 更新视图状态
  const updateViewState = useCallback((updates: Partial<ViewState>) => {
    setViewState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 设置选择区域
  const setSelection = useCallback((start: number | null, end: number | null) => {
    setViewState((prev) => ({
      ...prev,
      selectionStart: start,
      selectionEnd: end,
    }));
  }, []);

  // 获取选择区域的序列
  const getSelectedSequence = useCallback(() => {
    if (!sequence || viewState.selectionStart === null || viewState.selectionEnd === null) {
      return '';
    }
    return sequence.sequence.slice(
      Math.min(viewState.selectionStart, viewState.selectionEnd),
      Math.max(viewState.selectionStart, viewState.selectionEnd) + 1
    );
  }, [sequence, viewState.selectionStart, viewState.selectionEnd]);

  // 获取GC含量
  const getGCContent = useCallback(() => {
    if (!sequence) return 0;
    const gc = (sequence.sequence.match(/[GC]/g) || []).length;
    return (gc / sequence.length) * 100;
  }, [sequence]);

  // 获取分子量
  const getMolecularWeight = useCallback(() => {
    if (!sequence) return 0;
    const weights: Record<string, number> = { A: 313.21, T: 304.2, C: 289.18, G: 329.21 };
    let mw = 0;
    for (const base of sequence.sequence) {
      mw += weights[base] || 0;
    }
    return mw - 61.96; // 减去水分子的重量
  }, [sequence]);

  // 获取互补链
  const getComplement = useCallback((seq: string) => {
    const complement: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' };
    return seq.split('').map((base) => complement[base] || base).join('');
  }, []);

  // 翻译为蛋白质
  const translate = useCallback((seq: string, frame = 0) => {
    const codonTable: Record<string, string> = {
      'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
      'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
      'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
      'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
      'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
      'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
      'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
      'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
      'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
      'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
      'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
      'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
      'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
      'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
      'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
      'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G',
    };
    
    let protein = '';
    for (let i = frame; i < seq.length - 2; i += 3) {
      const codon = seq.substring(i, i + 3).toUpperCase();
      protein += codonTable[codon] || 'X';
    }
    return protein;
  }, []);

  return {
    sequence,
    viewState,
    fileInputRef,
    loadGenBankFile,
    createNewSequence,
    updateSequence,
    addFeature,
    removeFeature,
    updateFeature,
    addPrimer,
    removePrimer,
    insertBases,
    deleteBases,
    replaceBases,
    reverseComplement,
    saveAsGenBank,
    saveAsFasta,
    updateViewState,
    setSelection,
    getSelectedSequence,
    getGCContent,
    getMolecularWeight,
    getComplement,
    translate,
  };
}
