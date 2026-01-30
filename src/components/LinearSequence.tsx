import React, { useRef, useState, useCallback, useMemo } from 'react';
import type { DNASequence, Feature, RestrictionSite } from '@/types/dna';

interface LinearSequenceProps {
  sequence: DNASequence;
  width?: number;
  basesPerRow?: number;
  onFeatureClick?: (feature: Feature) => void;
  onEnzymeClick?: (enzyme: RestrictionSite) => void;
  onBaseClick?: (position: number) => void;
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
  
  // 按起始位置排序
  const sortedFeatures = [...rowFeatures].sort((a, b) => a.start - b.start);
  
  sortedFeatures.forEach((feature) => {
    const fStart = Math.max(feature.start, startPos);
    const fEnd = Math.min(feature.end, endPos);
    
    let layer = 0;
    let placed = false;
    
    while (!placed) {
      let canPlace = true;
      
      // 检查与同一层的其他特征是否重叠
      for (const [otherId, otherLayer] of layers) {
        if (otherLayer === layer) {
          const otherFeature = sortedFeatures.find(f => f.id === otherId);
          if (otherFeature) {
            const otherStart = Math.max(otherFeature.start, startPos);
            const otherEnd = Math.min(otherFeature.end, endPos);
            
            // 检查是否有重叠（保留5个碱基的间隙）
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

// 计算酶切位点的层数分配（避免标签重叠）
const calculateEnzymeLayers = (enzymes: RestrictionSite[], startPos: number, endPos: number, charWidth: number, minLabelWidth: number = 40): Map<string, number> => {
  const layers = new Map<string, number>();
  const rowEnzymes = enzymes.filter((e) => e.position >= startPos && e.position <= endPos);
  
  // 按位置排序
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
      
      // 检查与同一层的其他酶是否重叠
      for (const [otherId, otherLayer] of layers) {
        if (otherLayer === layer) {
          const otherEnzyme = sortedEnzymes.find(e => e.id === otherId);
          if (otherEnzyme) {
            const otherPos = otherEnzyme.position;
            const otherLabelStart = otherPos - Math.floor(labelWidthInBases / 2);
            const otherLabelEnd = otherPos + Math.floor(labelWidthInBases / 2);
            
            // 检查标签是否重叠（保留1个碱基的间隙）
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
  selectedBase,
  selectionStart,
  selectionEnd,
  showFeatures = true,
  showEnzymes = true,
  showTranslations = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [hoveredEnzyme, setHoveredEnzyme] = useState<RestrictionSite | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [clickedFeature, setClickedFeature] = useState<Feature | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const charWidth = 14;
  const baseRowHeight = 28; // 序列行基础高度
  const featureHeight = 18; // 每个特征条的高度
  const featureGap = 4; // 特征条之间的间隙
  const enzymeMarkerHeight = 14; // 酶三角形标记高度
  const enzymeLabelHeight = 14; // 酶标签行高度
  const translationHeight = 16; // 氨基酸翻译行高度
  const paddingY = 12; // 上下内边距

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

  // 计算每行的高度
  const calculateRowHeight = useCallback((rowIndex: number): number => {
    const startPos = rowIndex * basesPerRow + 1;
    const endPos = Math.min(startPos + basesPerRow - 1, sequence.length);
    
    let height = paddingY * 2 + baseRowHeight; // 基础高度
    
    // 计算特征层数
    if (showFeatures) {
      const featureLayers = calculateFeatureLayers(sequence.features, startPos, endPos);
      const maxLayer = Math.max(0, ...Array.from(featureLayers.values()));
      height += (maxLayer + 1) * (featureHeight + featureGap) + 8;
    }
    
    // 酶标记高度
    if (showEnzymes) {
      const enzymeLayers = calculateEnzymeLayers(sequence.restrictionSites, startPos, endPos, charWidth);
      const maxEnzymeLayer = Math.max(-1, ...Array.from(enzymeLayers.values()));
      if (maxEnzymeLayer >= 0) {
        height += enzymeMarkerHeight + (maxEnzymeLayer + 1) * enzymeLabelHeight + 4;
      }
    }
    
    // CDS feature的氨基酸翻译高度
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

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    }
  }, []);

  // 渲染单行
  const renderRow = useCallback((rowIndex: number) => {
    const startPos = rowIndex * basesPerRow + 1;
    const endPos = Math.min(startPos + basesPerRow - 1, sequence.length);
    const rowSequence = sequence.sequence.substring(startPos - 1, endPos);
    const rowHeight = rowHeights[rowIndex];
    
    // 计算该行的特征层数
    const featureLayers = calculateFeatureLayers(sequence.features, startPos, endPos);
    const maxLayer = Math.max(0, ...Array.from(featureLayers.values()));
    
    // 获取该行的酶切位点
    const rowEnzymes = sequence.restrictionSites.filter(
      (e) => e.position >= startPos && e.position <= endPos
    );
    
    // 计算酶切位点层数
    const enzymeLayers = calculateEnzymeLayers(sequence.restrictionSites, startPos, endPos, charWidth);
    const maxEnzymeLayer = Math.max(-1, ...Array.from(enzymeLayers.values()));

    // 计算各部分的垂直位置
    // 布局顺序（从上到下）：位置标尺 -> 序列 -> 酶切位点 -> 特征轨道 -> 氨基酸翻译
    let currentY = paddingY;
    
    // 位置标尺
    const rulerY = currentY;
    currentY += 16;
    
    // 序列（最上）
    const sequenceY = currentY;
    currentY += baseRowHeight + 4;
    
    // 酶切位点（中间）
    const enzymeY = rowEnzymes.length > 0 ? currentY : 0;
    const enzymeTrackHeight = maxEnzymeLayer >= 0 ? enzymeMarkerHeight + (maxEnzymeLayer + 1) * enzymeLabelHeight : 0;
    if (rowEnzymes.length > 0) {
      currentY += enzymeTrackHeight + 4;
    }
    
    // 特征轨道（最下）
    const featureStartY = currentY;
    const featureTrackHeight = (maxLayer + 1) * (featureHeight + featureGap);
    currentY += featureTrackHeight;
    
    // CDS feature的氨基酸翻译将显示在每个feature下方

    return (
      <div 
        key={rowIndex} 
        className="relative border-b border-gray-100"
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
        
        {/* 特征轨道 - 分层显示 */}
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
                      {/* 左侧箭头 */}
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
                      {/* 双向箭头 */}
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
                      {/* 右侧箭头 */}
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
                    {/* CDS feature的氨基酸翻译 */}
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
        
        {/* 序列 */}
        <div className="absolute flex" style={{ top: sequenceY, left: 60 }}>
          {rowSequence.split('').map((base, idx) => {
            const position = startPos + idx;
            const isSelected = selectedBase === position;
            const isInSelection = selectionStart !== null && selectionEnd !== null && 
              selectionStart !== undefined && selectionEnd !== undefined &&
              position >= Math.min(selectionStart, selectionEnd) &&
              position <= Math.max(selectionStart, selectionEnd);
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
                className={`inline-block text-center cursor-pointer font-mono text-sm select-none leading-7
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                  ${isInSelection && !isSelected ? 'bg-blue-100' : ''}
                  ${isInSelectedFeature ? 'bg-yellow-200' : ''}
                  ${isInClickedFeature ? 'bg-green-200' : ''}
                  ${feature ? 'font-bold' : ''}
                `}
                style={{
                  width: charWidth,
                  color: isSelected ? 'white' : '#000',
                  backgroundColor: isSelected ? '#3B82F6' : 
                    (isInSelection ? '#DBEAFE' : 
                      (isInClickedFeature ? '#BBF7D0' : 
                        (isInSelectedFeature ? '#FEF08A' : 'transparent'))),
                }}
                onClick={() => onBaseClick?.(position)}
                title={`Position: ${position}`}
              >
                {base}
              </span>
            );
          })}
        </div>
        
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
      selectedBase, selectionStart, selectionEnd, getAminoAcid, getFeatureAtPosition, 
      onFeatureClick, onEnzymeClick, onBaseClick, rowHeights, clickedFeature]);

  const totalRows = Math.ceil(sequence.length / basesPerRow);
  const totalHeight = getRowOffset(totalRows) + 20;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-auto bg-white border border-gray-200 rounded-lg"
        style={{ width, maxHeight: 650 }}
        onMouseMove={handleMouseMove}
      >
        <div style={{ width: basesPerRow * charWidth + 100, minHeight: totalHeight }}>
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
