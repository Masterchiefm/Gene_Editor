import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import type { DNASequence, Feature, RestrictionSite } from '@/types/dna';
import { Button } from '@/components/ui/button';
import { Scissors, Trash2, Plus, Dna, Crosshair, X } from 'lucide-react';

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

// 计算特征在行中的层数分配（避免重叠）
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

// 计算酶切位点的层数分配
const calculateEnzymeLayers = (enzymes: RestrictionSite[], startPos: number, endPos: number, charWidth: number, minLabelWidth: number = 40): Map<string, number> => {
  const layers = new Map<string, number>();
  const rowEnzymes = enzymes.filter((e) => e.position >= startPos && e.position <= endPos);
  
  const sortedEnzymes = [...rowEnzymes].sort((a, b) => a.position - b.position);
  
  sortedEnzymes.forEach((enzyme) => {
    const ePos = enzyme.position;
    const labelWidthInBases = Math.ceil(minLabelWidth / charWidth);
    const labelStart = ePos - Math.floor(labelWidthInBases / 2);
    const labelEnd = ePos + Math.floor(labelWidthInBases / 2);
    
    let layer = 0;
    let placed = false;
    
    while (!placed) {
      let canPlace = true;
      
      for (const [otherId, otherLayer] of layers) {
        if (otherLayer === layer) {
          const otherEnzyme = sortedEnzymes.find(e => e.id === otherId);
          if (otherEnzyme) {
            const otherPos = otherEnzyme.position;
            const otherLabelStart = otherPos - Math.floor(labelWidthInBases / 2);
            const otherLabelEnd = otherPos + Math.floor(labelWidthInBases / 2);
            
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
  selectedBase,
  selectionStart: externalSelectionStart,
  selectionEnd: externalSelectionEnd,
  showFeatures = true,
  showEnzymes = true,
  showTranslations = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sequenceContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [hoveredEnzyme, setHoveredEnzyme] = useState<RestrictionSite | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [clickedFeature, setClickedFeature] = useState<Feature | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // 内部选择状态（用于拖拽选择）
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  
  // 使用外部选择状态或内部拖拽状态
  const effectiveSelectionStart = externalSelectionStart ?? (isDragging ? Math.min(dragStart ?? 0, dragCurrent ?? 0) : null);
  const effectiveSelectionEnd = externalSelectionEnd ?? (isDragging ? Math.max(dragStart ?? 0, dragCurrent ?? 0) : null);
  const hasSelection = effectiveSelectionStart !== null && effectiveSelectionEnd !== null && 
                       effectiveSelectionStart !== effectiveSelectionEnd;

  const charWidth = 14;
  const baseRowHeight = 28;
  const featureHeight = 18;
  const featureGap = 4;
  const enzymeMarkerHeight = 14;
  const enzymeLabelHeight = 14;
  const translationHeight = 16;
  const paddingY = 12;

  // 获取氨基酸
  const getAminoAcid = useCallback((pos: number, frame: number) => {
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
    if (adjustedPos + 2 >= sequence.sequence.length) return '';
    
    const codon = sequence.sequence.substring(adjustedPos, adjustedPos + 3);
    return codonTable[codon] || '?';
  }, [sequence.sequence]);

  // 检查位置是否在特征内
  const getFeatureAtPosition = useCallback((position: number): Feature | null => {
    return sequence.features.find(
      (f) => position >= f.start && position <= f.end
    ) || null;
  }, [sequence.features]);

  // 计算位置对应的行和列
  const getPositionFromMouse = useCallback((clientX: number, clientY: number): number | null => {
    if (!sequenceContainerRef.current) return null;
    
    const rect = sequenceContainerRef.current.getBoundingClientRect();
    const scrollTop = sequenceContainerRef.current.scrollTop;
    const x = clientX - rect.left;
    const y = clientY - rect.top + scrollTop;
    
    // 找到对应的行
    const headerHeight = 40; // 表头高度
    const rowY = y - headerHeight - 8; // 减去padding
    
    if (rowY < 0) return null;
    
    // 累积计算找到行
    let currentY = 0;
    let rowIndex = 0;
    const totalRows = Math.ceil(sequence.length / basesPerRow);
    
    // 简化计算：假设每行高度大致相同
    const avgRowHeight = rowY / (totalRows / 2); // 粗略估计
    rowIndex = Math.floor(rowY / 50); // 假设平均行高约50
    rowIndex = Math.max(0, Math.min(rowIndex, totalRows - 1));
    
    // 精确计算
    let accumulatedY = 0;
    for (let i = 0; i < totalRows; i++) {
      const rowHeight = calculateRowHeight(i);
      if (accumulatedY + rowHeight > rowY) {
        rowIndex = i;
        break;
      }
      accumulatedY += rowHeight;
    }
    
    const startPos = rowIndex * basesPerRow + 1;
    const col = Math.floor((x - 60 + charWidth / 2) / charWidth);
    
    if (col < 0 || col >= basesPerRow) return null;
    
    const position = startPos + col;
    return position > sequence.length ? null : position;
  }, [basesPerRow, charWidth, sequence.length]);

  // 计算每行的高度
  const calculateRowHeight = useCallback((rowIndex: number): number => {
    const startPos = rowIndex * basesPerRow + 1;
    const endPos = Math.min(startPos + basesPerRow - 1, sequence.length);
    
    let height = paddingY * 2 + baseRowHeight;
    
    if (showFeatures) {
      const featureLayers = calculateFeatureLayers(sequence.features, startPos, endPos);
      const maxLayer = Math.max(0, ...Array.from(featureLayers.values()));
      height += (maxLayer + 1) * (featureHeight + featureGap) + 8;
    }
    
    if (showEnzymes) {
      const enzymeLayers = calculateEnzymeLayers(sequence.restrictionSites, startPos, endPos, charWidth);
      const maxEnzymeLayer = Math.max(-1, ...Array.from(enzymeLayers.values()));
      if (maxEnzymeLayer >= 0) {
        height += enzymeMarkerHeight + (maxEnzymeLayer + 1) * enzymeLabelHeight + 4;
      }
    }
    
    if (showTranslations && showFeatures) {
      const rowFeatures = sequence.features.filter(
        (f) => f.type === 'CDS' &&
               ((f.start >= startPos && f.start <= endPos) || 
                (f.end >= startPos && f.end <= endPos) ||
                (f.start <= startPos && f.end >= endPos))
      );
      if (rowFeatures.length > 0) {
        height += rowFeatures.length * translationHeight;
      }
    }
    
    return height;
  }, [sequence, basesPerRow, showFeatures, showEnzymes, showTranslations]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只处理左键
    const pos = getPositionFromMouse(e.clientX, e.clientY);
    if (pos !== null) {
      setIsDragging(true);
      setDragStart(pos);
      setDragCurrent(pos);
      setCursorPosition(pos);
    }
  }, [getPositionFromMouse]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
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
        setDragCurrent(pos);
        setCursorPosition(pos);
      }
    }
  }, [isDragging, getPositionFromMouse]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // 通知父组件选择变化
      if (dragStart !== null && dragCurrent !== null && dragStart !== dragCurrent) {
        const start = Math.min(dragStart, dragCurrent);
        const end = Math.max(dragStart, dragCurrent);
        onSelectionChange?.(start, end);
      }
    }
  }, [isDragging, dragStart, dragCurrent, onSelectionChange]);

  // 全局鼠标释放监听
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragStart !== null && dragCurrent !== null && dragStart !== dragCurrent) {
          const start = Math.min(dragStart, dragCurrent);
          const end = Math.max(dragStart, dragCurrent);
          onSelectionChange?.(start, end);
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging, dragStart, dragCurrent, onSelectionChange]);

  // 清除选择
  const clearSelection = useCallback(() => {
    onSelectionChange?.(null, null);
    setDragStart(null);
    setDragCurrent(null);
  }, [onSelectionChange]);

  // 计算光标位置
  const getCursorStyle = useCallback((position: number): React.CSSProperties | null => {
    const rowIndex = Math.floor((position - 1) / basesPerRow);
    const col = (position - 1) % basesPerRow;
    
    const rowOffset = getRowOffset(rowIndex);
    const sequenceY = paddingY + 16; // rulerY + 16
    
    return {
      position: 'absolute',
      left: 60 + col * charWidth,
      top: rowOffset + sequenceY - 2,
      width: 2,
      height: baseRowHeight + 4,
      backgroundColor: '#3B82F6',
      pointerEvents: 'none',
      zIndex: 10,
    };
  }, [basesPerRow, charWidth, paddingY]);

  // 预计算所有行的高度
  const rowHeights = useMemo(() => {
    const totalRows = Math.ceil(sequence.length / basesPerRow);
    const heights: number[] = [];
    for (let i = 0; i < totalRows; i++) {
      heights.push(calculateRowHeight(i));
    }
    return heights;
  }, [sequence.length, basesPerRow, calculateRowHeight]);

  // 计算累积高度用于定位
  const getRowOffset = useCallback((rowIndex: number): number => {
    let offset = 40; // 表头高度
    for (let i = 0; i < rowIndex; i++) {
      offset += rowHeights[i];
    }
    return offset;
  }, [rowHeights]);

  // 渲染单行
  const renderRow = useCallback((rowIndex: number) => {
    const startPos = rowIndex * basesPerRow + 1;
    const endPos = Math.min(startPos + basesPerRow - 1, sequence.length);
    const rowSequence = sequence.sequence.substring(startPos - 1, endPos);
    const rowHeight = rowHeights[rowIndex];
    
    const featureLayers = calculateFeatureLayers(sequence.features, startPos, endPos);
    const maxLayer = Math.max(0, ...Array.from(featureLayers.values()));
    
    const rowEnzymes = sequence.restrictionSites.filter(
      (e) => e.position >= startPos && e.position <= endPos
    );
    
    const enzymeLayers = calculateEnzymeLayers(sequence.restrictionSites, startPos, endPos, charWidth);
    const maxEnzymeLayer = Math.max(-1, ...Array.from(enzymeLayers.values()));

    let currentY = paddingY;
    const rulerY = currentY;
    currentY += 16;
    const sequenceY = currentY;
    currentY += baseRowHeight + 4;
    
    const enzymeY = rowEnzymes.length > 0 ? currentY : 0;
    const enzymeTrackHeight = maxEnzymeLayer >= 0 ? enzymeMarkerHeight + (maxEnzymeLayer + 1) * enzymeLabelHeight : 0;
    if (rowEnzymes.length > 0) {
      currentY += enzymeTrackHeight + 4;
    }
    
    const featureStartY = currentY;
    const featureTrackHeight = (maxLayer + 1) * (featureHeight + featureGap);

    return (
      <div 
        key={rowIndex} 
        className="relative border-b border-gray-100 select-none"
        style={{ height: rowHeight }}
      >
        {/* 位置标尺 */}
        <div className="absolute flex items-end" style={{ top: rulerY, left: 60, height: 14 }}>
          {Array.from({ length: Math.min(7, Math.ceil(basesPerRow / 10)) }, (_, i) => {
            const pos = startPos + i * 10;
            if (pos > sequence.length) return null;
            return (
              <span
                key={i}
                className="text-xs text-gray-400 absolute"
                style={{ left: i * 10 * charWidth }}
              >
                {pos}
              </span>
            );
          })}
        </div>
        
        {/* 酶切位点标记 */}
        {showEnzymes && rowEnzymes.length > 0 && (
          <div className="absolute" style={{ top: enzymeY, left: 60, height: enzymeTrackHeight }}>
            {rowEnzymes.map((enzyme) => {
              const col = enzyme.position - startPos;
              const layer = enzymeLayers.get(enzyme.id) || 0;
              const labelTop = enzymeMarkerHeight + layer * enzymeLabelHeight;
              return (
                <div
                  key={enzyme.id}
                  className="absolute cursor-pointer"
                  style={{ left: col * charWidth }}
                  onMouseEnter={(e) => {
                    setHoveredEnzyme(enzyme);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({
                        x: (e as unknown as MouseEvent).clientX - rect.left + 15,
                        y: (e as unknown as MouseEvent).clientY - rect.top + 15
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
        {showFeatures && (
          <div className="absolute" style={{ top: featureStartY, left: 60, height: featureTrackHeight }}>
            {sequence.features
              .filter((f) => (f.start >= startPos && f.start <= endPos) || 
                           (f.end >= startPos && f.end <= endPos) ||
                           (f.start <= startPos && f.end >= endPos))
              .map((feature) => {
                const layer = featureLayers.get(feature.id) || 0;
                const featureStart = Math.max(feature.start, startPos);
                const featureEnd = Math.min(feature.end, endPos);
                const startCol = featureStart - startPos;
                const width = (featureEnd - featureStart + 1) * charWidth;
                const top = layer * (featureHeight + featureGap);
                const isCDS = feature.type === 'CDS';
                
                return (
                  <div key={feature.id}>
                    <div
                      className={`absolute rounded cursor-pointer transition-all hover:opacity-80 hover:shadow-md ${selectedFeature?.id === feature.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: startCol * charWidth,
                        width: Math.max(width - 2, 4),
                        height: featureHeight,
                        top: top,
                        backgroundColor: feature.color || '#888',
                      }}
                      onMouseEnter={(e) => {
                        setHoveredFeature(feature);
                        setSelectedFeature(feature);
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setTooltipPos({
                            x: (e as unknown as MouseEvent).clientX - rect.left + 15,
                            y: (e as unknown as MouseEvent).clientY - rect.top + 15
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredFeature(null);
                        setSelectedFeature(null);
                      }}
                      onClick={() => {
                        setClickedFeature(feature);
                        onFeatureClick?.(feature);
                      }}
                      title={`${feature.label || feature.name} (${feature.start}-${feature.end})`}
                    >
                      {width > 24 && feature.strand !== 'both' && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2">
                          {feature.strand === 'forward' ? (
                            <svg width="12" height="12" viewBox="0 0 8 8" className="text-black/70">
                              <path d="M0 2.5 L4 4 L0 5.5 Z" fill="currentColor"/>
                            </svg>
                          ) : feature.strand === 'reverse' ? (
                            <svg width="12" height="12" viewBox="0 0 8 8" className="text-black/70">
                              <path d="M4 2.5 L0 4 L4 5.5 Z" fill="currentColor"/>
                            </svg>
                          ) : null}
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
                      {width > 24 && feature.strand !== 'both' && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2">
                          {feature.strand === 'forward' ? (
                            <svg width="12" height="12" viewBox="0 0 8 8" className="text-black/70">
                              <path d="M0 2.5 L4 4 L0 5.5 Z" fill="currentColor"/>
                            </svg>
                          ) : feature.strand === 'reverse' ? (
                            <svg width="12" height="12" viewBox="0 0 8 8" className="text-black/70">
                              <path d="M4 2.5 L0 4 L4 5.5 Z" fill="currentColor"/>
                            </svg>
                          ) : null}
                        </div>
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
                          top: top + featureHeight + 2, 
                          left: startCol * charWidth,
                          height: translationHeight
                        }}
                      >
                        {Array.from({ length: Math.ceil((featureEnd - featureStart + 1) / 3) }, (_, idx) => {
                          const pos = featureStart + idx * 3;
                          if (pos > featureEnd) return null;
                          const aa = getAminoAcid(pos, feature.frame || 0);
                          return (
                            <span
                              key={idx}
                              className="inline-block text-center text-xs text-gray-500 font-mono leading-4"
                              style={{ width: charWidth * 3 }}
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
            const isCursor = cursorPosition === position;
            const isInSelection = effectiveSelectionStart !== null && effectiveSelectionEnd !== null && 
              position >= Math.min(effectiveSelectionStart, effectiveSelectionEnd) &&
              position <= Math.max(effectiveSelectionStart, effectiveSelectionEnd);
            const feature = getFeatureAtPosition(position);
            const isInSelectedFeature = selectedFeature && 
              position >= selectedFeature.start && 
              position <= selectedFeature.end;
            const isInClickedFeature = clickedFeature && 
              position >= clickedFeature.start && 
              position <= clickedFeature.end;
            
            return (
              <span
                key={idx}
                className={`inline-block text-center cursor-text font-mono text-sm select-none leading-7
                  ${isInSelection ? 'bg-blue-300' : ''}
                  ${isInSelectedFeature ? 'bg-yellow-200' : ''}
                  ${isInClickedFeature ? 'bg-green-200' : ''}
                  ${feature ? 'font-bold' : ''}
                `}
                style={{
                  width: charWidth,
                  color: '#000',
                  backgroundColor: isInSelection ? '#93C5FD' : 
                    (isInClickedFeature ? '#BBF7D0' : 
                      (isInSelectedFeature ? '#FEF08A' : 'transparent')),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onBaseClick?.(position);
                  setCursorPosition(position);
                }}
                title={`Position: ${position}`}
              >
                {base}
              </span>
            );
          })}
        </div>
        
        {/* 光标竖线 */}
        {cursorPosition !== null && cursorPosition >= startPos && cursorPosition <= endPos && (
          <div
            className="pointer-events-none z-20"
            style={{
              position: 'absolute',
              left: 60 + (cursorPosition - startPos) * charWidth,
              top: sequenceY - 4,
              width: 2,
              height: baseRowHeight + 8,
              backgroundColor: '#2563EB',
              boxShadow: '0 0 2px rgba(37, 99, 235, 0.5)',
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
  }, [sequence, basesPerRow, charWidth, showFeatures, showEnzymes, showTranslations,
      effectiveSelectionStart, effectiveSelectionEnd, cursorPosition, getAminoAcid, getFeatureAtPosition, 
      onFeatureClick, onEnzymeClick, onBaseClick, rowHeights, clickedFeature, selectedFeature,
      handleMouseDown]);

  const totalRows = Math.ceil(sequence.length / basesPerRow);

  // 获取选中的序列文本
  const getSelectedSequence = useCallback(() => {
    if (!hasSelection) return '';
    const start = Math.min(effectiveSelectionStart!, effectiveSelectionEnd!);
    const end = Math.max(effectiveSelectionStart!, effectiveSelectionEnd!);
    return sequence.sequence.substring(start - 1, end);
  }, [hasSelection, effectiveSelectionStart, effectiveSelectionEnd, sequence.sequence]);

  return (
    <div className="relative">
      {/* 选择信息栏 */}
      {hasSelection && (
        <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold text-blue-900">
                {Math.min(effectiveSelectionStart!, effectiveSelectionEnd!)} .. {Math.max(effectiveSelectionStart!, effectiveSelectionEnd!)}
              </span>
              <span className="text-blue-700 ml-2">
                = {Math.abs(effectiveSelectionEnd! - effectiveSelectionStart!) + 1} bp
              </span>
            </div>
            <div className="text-xs text-gray-500 font-mono max-w-md truncate">
              {getSelectedSequence().substring(0, 30)}
              {getSelectedSequence().length > 30 ? '...' : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const start = Math.min(effectiveSelectionStart!, effectiveSelectionEnd!);
                const end = Math.max(effectiveSelectionStart!, effectiveSelectionEnd!);
                onAddFeature?.(start, end);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Feature
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const start = Math.min(effectiveSelectionStart!, effectiveSelectionEnd!);
                const end = Math.max(effectiveSelectionStart!, effectiveSelectionEnd!);
                onAddPrimer?.(start, end);
              }}
            >
              <Dna className="w-4 h-4 mr-1" />
              Add Primer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const start = Math.min(effectiveSelectionStart!, effectiveSelectionEnd!);
                const end = Math.max(effectiveSelectionStart!, effectiveSelectionEnd!);
                onDeleteSelection?.(start, end);
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
      >
        <div ref={sequenceContainerRef} style={{ width: basesPerRow * charWidth + 100 }}>
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
            {Array.from({ length: totalRows }, (_, i) => renderRow(i))}
          </div>
        </div>
      </div>
      
      {/* 悬停提示 - 特征 */}
      {hoveredFeature && (
        <div 
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{ 
            left: tooltipPos.x, 
            top: tooltipPos.y,
            maxWidth: '280px'
          }}
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
          style={{ 
            left: tooltipPos.x, 
            top: tooltipPos.y 
          }}
        >
          <div className="font-semibold text-sm text-red-600">
            {hoveredEnzyme.name}
          </div>
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
