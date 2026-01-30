import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import type { DNASequence, Feature, RestrictionSite } from '@/types/dna';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Dna, X } from 'lucide-react';

interface LinearSequenceProps {
  sequence: DNASequence;
  width?: number;
  basesPerRow?: number;
  onFeatureClick?: (feature: Feature) => void;
  onEnzymeClick?: (enzyme: RestrictionSite) => void;
  onBaseClick?: (position: number) => void;
  onSelectionChange?: (start: number | null, end: number | null) => void;
  onDeleteSelection?: (start: number, end: number) => void;
  onAddFeature?: (start: number, end: number) => void;
  onAddPrimer?: (start: number, end: number) => void;
  selectedBase?: number | null;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  showFeatures?: boolean;
  showEnzymes?: boolean;
  showTranslations?: boolean;
}

const BASE_COLORS: Record<string, string> = {
  'A': '#FF6B6B',
  'T': '#4ECDC4',
  'C': '#45B7D1',
  'G': '#96CEB4',
};

// 常量定义
const CHAR_WIDTH = 14;
const BASE_ROW_HEIGHT = 28;
const FEATURE_HEIGHT = 18;
const FEATURE_GAP = 4;
const ENZYME_MARKER_HEIGHT = 14;
const ENZYME_LABEL_HEIGHT = 14;
const TRANSLATION_HEIGHT = 16;
const PADDING_Y = 12;
const HEADER_HEIGHT = 40;

// 计算特征层数 - 纯函数，可缓存
const calculateFeatureLayers = (features: Feature[], startPos: number, endPos: number): Map<string, number> => {
  const layers = new Map<string, number>();
  const rowFeatures = features.filter(
    (f) => (f.start >= startPos && f.start <= endPos) || 
           (f.end >= startPos && f.end <= endPos) ||
           (f.start <= startPos && f.end >= endPos)
  );
  
  const sortedFeatures = [...rowFeatures].sort((a, b) => a.start - b.start);
  
  sortedFeatures.forEach((feature) => {
    const fStart = Math.max(feature.start, startPos);
    const fEnd = Math.min(feature.end, endPos);
    
    let layer = 0;
    let placed = false;
    
    while (!placed) {
      let canPlace = true;
      
      for (const [otherId, otherLayer] of layers) {
        if (otherLayer === layer) {
          const otherFeature = sortedFeatures.find(f => f.id === otherId);
          if (otherFeature) {
            const otherStart = Math.max(otherFeature.start, startPos);
            const otherEnd = Math.min(otherFeature.end, endPos);
            
            if (!(fEnd + 5 < otherStart || fStart > otherEnd + 5)) {
              canPlace = false;
              break;
            }
          }
        }
      }
      
      if (canPlace) {
        placed = true;
      } else {
        layer++;
      }
    }
    
    layers.set(feature.id, layer);
  });
  
  return layers;
};

// 计算酶切位点层数
const calculateEnzymeLayers = (enzymes: RestrictionSite[], startPos: number, endPos: number): Map<string, number> => {
  const layers = new Map<string, number>();
  const rowEnzymes = enzymes.filter((e) => e.position >= startPos && e.position <= endPos);
  const sortedEnzymes = [...rowEnzymes].sort((a, b) => a.position - b.position);
  
  sortedEnzymes.forEach((enzyme) => {
    const ePos = enzyme.position;
    const labelStart = ePos - 2;
    const labelEnd = ePos + 2;
    
    let layer = 0;
    let placed = false;
    
    while (!placed) {
      let canPlace = true;
      
      for (const [otherId, otherLayer] of layers) {
        if (otherLayer === layer) {
          const otherEnzyme = sortedEnzymes.find(e => e.id === otherId);
          if (otherEnzyme) {
            const otherPos = otherEnzyme.position;
            const otherLabelStart = otherPos - 2;
            const otherLabelEnd = otherPos + 2;
            
            if (!(labelEnd + 1 < otherLabelStart || labelStart > otherLabelEnd + 1)) {
              canPlace = false;
              break;
            }
          }
        }
      }
      
      if (canPlace) {
        placed = true;
      } else {
        layer++;
      }
    }
    
    layers.set(enzyme.id, layer);
  });
  
  return layers;
};

// 获取氨基酸
const getAminoAcid = (seq: string, pos: number, frame: number): string => {
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
  
  const adjustedPos = pos - 1 + frame;
  if (adjustedPos + 2 >= seq.length) return '';
  
  const codon = seq.substring(adjustedPos, adjustedPos + 3);
  return codonTable[codon] || '?';
};

export const LinearSequence: React.FC<LinearSequenceProps> = ({
  sequence,
  width = 1000,
  basesPerRow = 60,
  onFeatureClick,
  onEnzymeClick,
  onBaseClick,
  onSelectionChange,
  onDeleteSelection,
  onAddFeature,
  onAddPrimer,
  selectionStart: externalSelectionStart,
  selectionEnd: externalSelectionEnd,
  showFeatures = true,
  showEnzymes = true,
  showTranslations = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 悬停状态
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [hoveredEnzyme, setHoveredEnzyme] = useState<RestrictionSite | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // 拖拽选择状态
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ start: number | null; current: number | null }>({ start: null, current: null });
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const hasDragged = useRef(false); // 用于区分点击和拖拽
  
  // 使用 RAF 优化拖拽更新
  const rafRef = useRef<number | null>(null);
  const [dragRenderPos, setDragRenderPos] = useState<{ start: number | null; current: number | null }>({ start: null, current: null });
  
  // 有效的选择范围
  const effectiveSelection = useMemo(() => {
    if (externalSelectionStart != null && externalSelectionEnd != null) {
      return {
        start: Math.min(externalSelectionStart, externalSelectionEnd),
        end: Math.max(externalSelectionStart, externalSelectionEnd),
      };
    }
    if (dragRenderPos.start !== null && dragRenderPos.current !== null) {
      return {
        start: Math.min(dragRenderPos.start, dragRenderPos.current),
        end: Math.max(dragRenderPos.start, dragRenderPos.current),
      };
    }
    return null;
  }, [externalSelectionStart, externalSelectionEnd, dragRenderPos]);
  
  const hasSelection = effectiveSelection !== null && effectiveSelection.start !== effectiveSelection.end;

  // 预计算所有行的数据 - 只计算一次
  const rowsData = useMemo(() => {
    const totalRows = Math.ceil(sequence.length / basesPerRow);
    const rows: Array<{
      rowIndex: number;
      startPos: number;
      endPos: number;
      rowSequence: string;
      featureLayers: Map<string, number>;
      maxFeatureLayer: number;
      rowEnzymes: RestrictionSite[];
      enzymeLayers: Map<string, number>;
      maxEnzymeLayer: number;
      rowHeight: number;
      sequenceY: number;
      enzymeY: number;
      featureStartY: number;
      featureTrackHeight: number;
      enzymeTrackHeight: number;
      rowFeatures: Feature[];
    }> = [];
    
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const startPos = rowIndex * basesPerRow + 1;
      const endPos = Math.min(startPos + basesPerRow - 1, sequence.length);
      const rowSequence = sequence.sequence.substring(startPos - 1, endPos);
      
      const featureLayers = calculateFeatureLayers(sequence.features, startPos, endPos);
      const maxFeatureLayer = Math.max(0, ...Array.from(featureLayers.values()));
      
      const rowEnzymes = sequence.restrictionSites.filter(
        (e) => e.position >= startPos && e.position <= endPos
      );
      const enzymeLayers = calculateEnzymeLayers(sequence.restrictionSites, startPos, endPos);
      const maxEnzymeLayer = Math.max(-1, ...Array.from(enzymeLayers.values()));
      
      const rowFeatures = sequence.features.filter(
        (f) => (f.start >= startPos && f.start <= endPos) || 
               (f.end >= startPos && f.end <= endPos) ||
               (f.start <= startPos && f.end >= endPos)
      );
      
      // 计算各部分位置
      let currentY = PADDING_Y;
      // ruler position: currentY
      currentY += 16;
      const sequenceY = currentY;
      currentY += BASE_ROW_HEIGHT + 4;
      
      const hasEnzymes = rowEnzymes.length > 0 && showEnzymes;
      const enzymeTrackHeight = hasEnzymes && maxEnzymeLayer >= 0 
        ? ENZYME_MARKER_HEIGHT + (maxEnzymeLayer + 1) * ENZYME_LABEL_HEIGHT 
        : 0;
      const enzymeY = hasEnzymes ? currentY : 0;
      if (hasEnzymes) {
        currentY += enzymeTrackHeight + 4;
      }
      
      const featureTrackHeight = showFeatures ? (maxFeatureLayer + 1) * (FEATURE_HEIGHT + FEATURE_GAP) : 0;
      const featureStartY = currentY;
      
      let rowHeight = PADDING_Y * 2 + BASE_ROW_HEIGHT;
      if (showFeatures) {
        rowHeight += featureTrackHeight + 8;
      }
      if (hasEnzymes) {
        rowHeight += enzymeTrackHeight + 4;
      }
      
      rows.push({
        rowIndex,
        startPos,
        endPos,
        rowSequence,
        featureLayers,
        maxFeatureLayer,
        rowEnzymes,
        enzymeLayers,
        maxEnzymeLayer,
        rowHeight,
        sequenceY,
        enzymeY,
        featureStartY,
        featureTrackHeight,
        enzymeTrackHeight,
        rowFeatures,
      });
    }
    
    return rows;
  }, [sequence, basesPerRow, showFeatures, showEnzymes]);

  // 计算位置对应的碱基位置
  const getPositionFromMouse = useCallback((clientX: number, clientY: number): number | null => {
    if (!containerRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    const x = clientX - rect.left;
    const y = clientY - rect.top + scrollTop - HEADER_HEIGHT;
    
    // 找到对应的行
    let accumulatedY = 0;
    for (const row of rowsData) {
      if (accumulatedY + row.rowHeight > y) {
        // 移除 +CHAR_WIDTH/2 偏移，使用更精确的计算
        const col = Math.floor((x - 60) / CHAR_WIDTH);
        if (col < 0 || col >= basesPerRow) return null;
        const position = row.startPos + col;
        return position > sequence.length ? null : position;
      }
      accumulatedY += row.rowHeight;
    }
    
    return null;
  }, [rowsData, basesPerRow, sequence.length]);

  // 拖拽更新使用 RAF
  const updateDragPosition = useCallback((pos: number) => {
    dragState.current.current = pos;
    hasDragged.current = true; // 标记为拖拽操作
    
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setDragRenderPos({ ...dragState.current });
        rafRef.current = null;
      });
    }
  }, []);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getPositionFromMouse(e.clientX, e.clientY);
    if (pos !== null) {
      setIsDragging(true);
      hasDragged.current = false; // 重置拖拽标记
      dragState.current = { start: pos, current: pos };
      setDragRenderPos({ start: pos, current: pos });
      setCursorPosition(pos);
    }
  }, [getPositionFromMouse]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 更新 tooltip 位置
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    }
    
    if (isDragging) {
      const pos = getPositionFromMouse(e.clientX, e.clientY);
      if (pos !== null) {
        updateDragPosition(pos);
        setCursorPosition(pos);
      }
    }
  }, [isDragging, getPositionFromMouse, updateDragPosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (dragState.current.start !== null && dragState.current.current !== null) {
        const start = Math.min(dragState.current.start, dragState.current.current);
        const end = Math.max(dragState.current.start, dragState.current.current);
        if (start !== end && hasDragged.current) {
          // 只有在拖拽了（不是简单点击）并且有范围时才更新选择
          onSelectionChange?.(start, end);
        }
      }
      // 不清除 dragRenderPos，让选择保持显示直到外部状态更新
    }
  }, [isDragging, onSelectionChange]);

  // 全局鼠标释放监听
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragState.current.start !== null && dragState.current.current !== null) {
          const start = Math.min(dragState.current.start, dragState.current.current);
          const end = Math.max(dragState.current.start, dragState.current.current);
          if (start !== end && hasDragged.current) {
            // 只有在拖拽了（不是简单点击）并且有范围时才更新选择
            onSelectionChange?.(start, end);
          }
        }
        // 不清除 dragRenderPos，让选择保持显示直到外部状态更新
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging, onSelectionChange]);

  // 清理 RAF
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // 清除选择
  const clearSelection = useCallback(() => {
    onSelectionChange?.(null, null);
    dragState.current = { start: null, current: null };
    setDragRenderPos({ start: null, current: null });
  }, [onSelectionChange]);

  // 获取选中的序列文本
  const selectedSequenceText = useMemo(() => {
    if (!hasSelection) return '';
    return sequence.sequence.substring(effectiveSelection!.start - 1, effectiveSelection!.end);
  }, [hasSelection, effectiveSelection, sequence.sequence]);

  // 检查位置是否在特征内
  const getFeatureAtPosition = useCallback((position: number): Feature | null => {
    return sequence.features.find((f) => position >= f.start && position <= f.end) || null;
  }, [sequence.features]);

  // 渲染行 - 使用 memo
  const renderRow = useCallback((rowData: typeof rowsData[0]) => {
    const { 
      rowIndex, startPos, endPos, rowSequence, 
      featureLayers, rowEnzymes, enzymeLayers,
      rowHeight, sequenceY, enzymeY, featureStartY,
      featureTrackHeight, enzymeTrackHeight, rowFeatures
    } = rowData;
    
    const hasEnzymes = rowEnzymes.length > 0 && showEnzymes;
    const hasFeatures = showFeatures && rowFeatures.length > 0;
    
    return (
      <div 
        key={rowIndex} 
        className="relative border-b border-gray-100 select-none"
        style={{ height: rowHeight }}
      >
        {/* 位置标尺 */}
        <div className="absolute flex items-end" style={{ top: PADDING_Y, left: 60, height: 14 }}>
          {Array.from({ length: Math.min(7, Math.ceil(basesPerRow / 10)) }, (_, i) => {
            const pos = startPos + i * 10;
            if (pos > sequence.length) return null;
            return (
              <span
                key={i}
                className="text-xs text-gray-400 absolute"
                style={{ left: i * 10 * CHAR_WIDTH }}
              >
                {pos}
              </span>
            );
          })}
        </div>
        
        {/* 酶切位点标记 */}
        {hasEnzymes && (
          <div className="absolute" style={{ top: enzymeY, left: 60, height: enzymeTrackHeight }}>
            {rowEnzymes.map((enzyme) => {
              const col = enzyme.position - startPos;
              const layer = enzymeLayers.get(enzyme.id) || 0;
              const labelTop = ENZYME_MARKER_HEIGHT + layer * ENZYME_LABEL_HEIGHT;
              return (
                <div
                  key={enzyme.id}
                  className="absolute cursor-pointer"
                  style={{ left: col * CHAR_WIDTH }}
                  onMouseEnter={(e) => {
                    setHoveredEnzyme(enzyme);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({
                        x: e.clientX - rect.left + 15,
                        y: e.clientY - rect.top + 15
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredEnzyme(null)}
                  onClick={() => onEnzymeClick?.(enzyme)}
                >
                  <div
                    className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-l-transparent border-r-transparent"
                    style={{ borderBottomColor: enzyme.color || '#E74C3C' }}
                  />
                  <span 
                    className="text-[10px] text-red-600 whitespace-nowrap -ml-3 font-medium absolute"
                    style={{ top: labelTop }}
                  >
                    {enzyme.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* 特征轨道 */}
        {hasFeatures && (
          <div className="absolute" style={{ top: featureStartY, left: 60, height: featureTrackHeight }}>
            {rowFeatures.map((feature) => {
              const layer = featureLayers.get(feature.id) || 0;
              const featureStart = Math.max(feature.start, startPos);
              const featureEnd = Math.min(feature.end, endPos);
              const startCol = featureStart - startPos;
              const width = (featureEnd - featureStart + 1) * CHAR_WIDTH;
              const top = layer * (FEATURE_HEIGHT + FEATURE_GAP);
              const isCDS = feature.type === 'CDS';
              
              return (
                <div key={feature.id}>
                  <div
                    className="absolute rounded cursor-pointer transition-all hover:opacity-80 hover:shadow-md"
                    style={{
                      left: startCol * CHAR_WIDTH,
                      width: Math.max(width - 2, 4),
                      height: FEATURE_HEIGHT,
                      top: top,
                      backgroundColor: feature.color || '#888',
                    }}
                    onMouseEnter={(e) => {
                      setHoveredFeature(feature);
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({
                          x: e.clientX - rect.left + 15,
                          y: e.clientY - rect.top + 15
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredFeature(null)}
                    onClick={() => onFeatureClick?.(feature)}
                  >
                    {width > 24 && feature.strand !== 'both' && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2">
                        {feature.strand === 'forward' ? (
                          <svg width="12" height="12" viewBox="0 0 8 8" className="text-black/70">
                            <path d="M0 2.5 L4 4 L0 5.5 Z" fill="currentColor"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 8 8" className="text-black/70">
                            <path d="M4 2.5 L0 4 L4 5.5 Z" fill="currentColor"/>
                          </svg>
                        )}
                      </div>
                    )}
                    {width > 24 && feature.strand === 'both' && (
                      <>
                        <div className="absolute left-1 top-1/2 -translate-y-1/2">
                          <svg width="10" height="10" viewBox="0 0 8 8" className="text-black/70">
                            <path d="M4 2.5 L0 4 L4 5.5 Z" fill="currentColor"/>
                          </svg>
                        </div>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2">
                          <svg width="10" height="10" viewBox="0 0 8 8" className="text-black/70">
                            <path d="M0 2.5 L4 4 L0 5.5 Z" fill="currentColor"/>
                          </svg>
                        </div>
                      </>
                    )}
                    {width > 60 && (
                      <span className="text-xs text-black px-3 truncate block leading-[18px] text-center">
                        {feature.label || feature.name}
                      </span>
                    )}
                  </div>
                  {showTranslations && isCDS && (
                    <div
                      className="absolute flex"
                      style={{ 
                        top: top + FEATURE_HEIGHT + 2, 
                        left: startCol * CHAR_WIDTH,
                        height: TRANSLATION_HEIGHT
                      }}
                    >
                      {Array.from({ length: Math.ceil((featureEnd - featureStart + 1) / 3) }, (_, idx) => {
                        const pos = featureStart + idx * 3;
                        if (pos > featureEnd) return null;
                        const aa = getAminoAcid(sequence.sequence, pos, feature.frame || 0);
                        return (
                          <span
                            key={idx}
                            className="inline-block text-center text-xs text-gray-500 font-mono leading-4"
                            style={{ width: CHAR_WIDTH * 3 }}
                          >
                            {aa}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* 序列 - 可拖拽选择 */}
        <div 
          className="absolute flex select-none" 
          style={{ top: sequenceY, left: 60 }}
          onMouseDown={handleMouseDown}
        >
          {rowSequence.split('').map((base, idx) => {
            const position = startPos + idx;
            // 高亮区域包含起始位置，不包含结束位置（与竖线边界对应）
            const isInSelection = effectiveSelection !== null && 
              effectiveSelection.start !== effectiveSelection.end &&
              position >= effectiveSelection.start &&
              position < effectiveSelection.end;
            const feature = getFeatureAtPosition(position);
            
            return (
              <span
                key={idx}
                data-sequence-base="true"
                className={`inline-block text-center cursor-text font-mono text-sm select-none leading-7
                  ${isInSelection ? 'bg-blue-300' : ''}
                  ${feature ? 'font-bold' : ''}
                `}
                style={{
                  width: CHAR_WIDTH,
                  color: '#000',
                  backgroundColor: isInSelection ? '#93C5FD' : 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // 如果是拖拽操作，不触发 onBaseClick
                  if (hasDragged.current) {
                    hasDragged.current = false;
                    return;
                  }
                  onBaseClick?.(position);
                  setCursorPosition(position);
                }}
              >
                {base}
              </span>
            );
          })}
        </div>
        
        {/* 选择起始竖线 - 只要有选择就显示 */}
        {effectiveSelection !== null && effectiveSelection.start >= startPos && effectiveSelection.start <= endPos && effectiveSelection.start !== effectiveSelection.end && (
          <div
            className="pointer-events-none z-20"
            style={{
              position: 'absolute',
              left: 60 + (effectiveSelection.start - startPos) * CHAR_WIDTH,
              top: 0,
              width: 2,
              height: rowHeight,
              backgroundColor: '#1E40AF',
              boxShadow: '0 0 4px rgba(30, 64, 175, 0.8)',
            }}
          />
        )}
        
        {/* 选择结束竖线 - 只要有选择就显示 */}
        {effectiveSelection !== null && effectiveSelection.end >= startPos && effectiveSelection.end <= endPos && effectiveSelection.start !== effectiveSelection.end && (
          <div
            className="pointer-events-none z-20"
            style={{
              position: 'absolute',
              left: 60 + (effectiveSelection.end - startPos) * CHAR_WIDTH,
              top: 0,
              width: 2,
              height: rowHeight,
              backgroundColor: '#1E40AF',
              boxShadow: '0 0 4px rgba(30, 64, 175, 0.8)',
            }}
          />
        )}
        
        {/* 光标竖线 - 当没有有效选择或光标不在选择边界时显示 */}
        {cursorPosition !== null && cursorPosition >= startPos && cursorPosition <= endPos && 
         (effectiveSelection === null || effectiveSelection.start === effectiveSelection.end || (cursorPosition !== effectiveSelection.start && cursorPosition !== effectiveSelection.end)) && (
          <div
            className="pointer-events-none z-20"
            style={{
              position: 'absolute',
              left: 60 + (cursorPosition - startPos) * CHAR_WIDTH,
              top: 0,
              width: 2,
              height: rowHeight,
              backgroundColor: '#2563EB',
              boxShadow: '0 0 3px rgba(37, 99, 235, 0.6)',
            }}
          />
        )}
        
        {/* 位置号 */}
        <div
          className="absolute text-xs text-gray-500 font-mono leading-7"
          style={{ top: sequenceY, left: 10, width: 45 }}
        >
          {startPos.toString().padStart(6)}
        </div>
      </div>
    );
  }, [sequence.length, basesPerRow, showFeatures, showEnzymes, showTranslations, 
      effectiveSelection, cursorPosition, getFeatureAtPosition, 
      onFeatureClick, onEnzymeClick, onBaseClick, handleMouseDown]);

  // Calculate total height for potential future use
  useMemo(() => {
    return rowsData.reduce((sum, row) => sum + row.rowHeight, HEADER_HEIGHT);
  }, [rowsData]);

  return (
    <div className="relative">
      {/* 选择信息栏 */}
      {hasSelection && (
        <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold text-blue-900">
                {effectiveSelection!.start} .. {effectiveSelection!.end}
              </span>
              <span className="text-blue-700 ml-2">
                = {effectiveSelection!.end - effectiveSelection!.start + 1} bp
              </span>
            </div>
            <div className="text-xs text-gray-500 font-mono max-w-md truncate">
              {selectedSequenceText.substring(0, 30)}
              {selectedSequenceText.length > 30 ? '...' : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddFeature?.(effectiveSelection!.start, effectiveSelection!.end)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Feature
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddPrimer?.(effectiveSelection!.start, effectiveSelection!.end)}
            >
              <Dna className="w-4 h-4 mr-1" />
              Add Primer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDeleteSelection?.(effectiveSelection!.start, effectiveSelection!.end);
                clearSelection();
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div
        ref={containerRef}
        className="overflow-auto bg-white border border-gray-200 rounded-lg"
        style={{ width, maxHeight: 650 }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          // 点击空白处取消选择
          const target = e.target as HTMLElement;
          if (!target.closest('[data-sequence-base]')) {
            clearSelection();
            setCursorPosition(null);
          }
        }}
      >
        <div style={{ width: basesPerRow * CHAR_WIDTH + 100 }}>
          {/* 表头 */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between z-10">
            <div className="text-sm font-semibold text-gray-700 truncate max-w-md">
              {sequence.name}
            </div>
            <div className="text-xs text-gray-500">
              {sequence.length.toLocaleString()} bp | GC: {((sequence.sequence.match(/[GC]/g) || []).length / sequence.length * 100).toFixed(1)}%
            </div>
          </div>
          
          {/* 序列行 */}
          <div className="py-2">
            {rowsData.map(renderRow)}
          </div>
        </div>
      </div>
      
      {/* 悬停提示 - 特征 */}
      {hoveredFeature && (
        <div 
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{ left: tooltipPos.x, top: tooltipPos.y, maxWidth: '280px' }}
        >
          <div className="font-semibold text-sm" style={{ color: hoveredFeature.color }}>
            {hoveredFeature.label || hoveredFeature.name}
          </div>
          <div className="text-xs text-gray-600 mt-1">Type: {hoveredFeature.type}</div>
          <div className="text-xs text-gray-600">Position: {hoveredFeature.start} - {hoveredFeature.end}</div>
          <div className="text-xs text-gray-600">Strand: {hoveredFeature.strand}</div>
          {hoveredFeature.note && (
            <div className="text-xs text-gray-500 mt-1 italic">{hoveredFeature.note}</div>
          )}
        </div>
      )}
      
      {/* 悬停提示 - 酶 */}
      {hoveredEnzyme && !hoveredFeature && (
        <div 
          className="fixed z-50 bg-white border border-red-300 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-semibold text-sm text-red-600">{hoveredEnzyme.name}</div>
          <div className="text-xs text-gray-600 mt-1">Position: {hoveredEnzyme.position}</div>
          <div className="text-xs text-gray-600">Sequence: {hoveredEnzyme.sequence}</div>
        </div>
      )}
      
      {/* 图例 */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: BASE_COLORS['A'] }} />
          <span>A</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: BASE_COLORS['T'] }} />
          <span>T</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: BASE_COLORS['C'] }} />
          <span>C</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: BASE_COLORS['G'] }} />
          <span>G</span>
        </div>
      </div>
    </div>
  );
};

export default LinearSequence;
