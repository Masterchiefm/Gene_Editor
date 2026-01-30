import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { DNASequence, Feature, RestrictionSite } from '@/types/dna';

interface CircularPlasmidProps {
  sequence: DNASequence;
  width?: number;
  height?: number;
  onFeatureClick?: (feature: Feature) => void;
  onEnzymeClick?: (enzyme: RestrictionSite) => void;
  onBaseClick?: (position: number) => void;
  selectedBase?: number | null;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  showFeatures?: boolean;
  showEnzymes?: boolean;
}

export const CircularPlasmid: React.FC<CircularPlasmidProps> = ({
  sequence,
  width = 900,
  height = 700,
  onFeatureClick,
  onEnzymeClick,
  onBaseClick,
  selectedBase,
  selectionStart,
  selectionEnd,
  showFeatures = true,
  showEnzymes = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [hoveredEnzyme, setHoveredEnzyme] = useState<RestrictionSite | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) * 0.28;
  const innerRadius = outerRadius * 0.65;
  const enzymeRadius = outerRadius * 1.18;
  const labelRadius = outerRadius * 1.45;

  // 角度转弧度
  const angleToRadians = useCallback((angle: number) => {
    return (angle - 90) * (Math.PI / 180);
  }, []);

  // 位置转角度
  const positionToAngle = useCallback((position: number) => {
    return (position / sequence.length) * 360;
  }, [sequence.length]);

  // 获取圆弧路径
  const getArcPath = useCallback((startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const startRad = angleToRadians(startAngle);
    const endRad = angleToRadians(endAngle);
    
    const x1 = centerX + innerR * Math.cos(startRad);
    const y1 = centerY + innerR * Math.sin(startRad);
    const x2 = centerX + outerR * Math.cos(startRad);
    const y2 = centerY + outerR * Math.sin(startRad);
    const x3 = centerX + outerR * Math.cos(endRad);
    const y3 = centerY + outerR * Math.sin(endRad);
    const x4 = centerX + innerR * Math.cos(endRad);
    const y4 = centerY + innerR * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1}`;
  }, [centerX, centerY, angleToRadians]);

  // 获取标签位置
  const getLabelPosition = useCallback((angle: number, radius: number) => {
    const rad = angleToRadians(angle);
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  }, [centerX, centerY, angleToRadians]);

  // 检测两个角度区域是否重叠
  const anglesOverlap = (start1: number, end1: number, start2: number, end2: number, minGap: number) => {
    const normalizedStart1 = ((start1 % 360) + 360) % 360;
    const normalizedEnd1 = ((end1 % 360) + 360) % 360;
    const normalizedStart2 = ((start2 % 360) + 360) % 360;
    const normalizedEnd2 = ((end2 % 360) + 360) % 360;
    
    const mid1 = (normalizedStart1 + normalizedEnd1) / 2;
    const mid2 = (normalizedStart2 + normalizedEnd2) / 2;
    
    const diff = Math.abs(mid1 - mid2);
    const circularDiff = Math.min(diff, 360 - diff);
    
    return circularDiff < minGap;
  };

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

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 创建主容器
    const g = svg.append('g');

    // 绘制外圈（序列刻度）
    const tickGroup = g.append('g').attr('class', 'ticks');
    const tickCount = Math.min(sequence.length, 60);
    for (let i = 0; i < tickCount; i++) {
      const position = Math.floor((i / tickCount) * sequence.length);
      const angle = positionToAngle(position);
      const rad = angleToRadians(angle);
      
      const x1 = centerX + outerRadius * Math.cos(rad);
      const y1 = centerY + outerRadius * Math.sin(rad);
      const x2 = centerX + (outerRadius + 4) * Math.cos(rad);
      const y2 = centerY + (outerRadius + 4) * Math.sin(rad);
      
      tickGroup.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#bbb')
        .attr('stroke-width', 1);
      
      // 每5个刻度显示数字
      if (i % 5 === 0) {
        const labelPos = getLabelPosition(angle, outerRadius + 18);
        tickGroup.append('text')
          .attr('x', labelPos.x)
          .attr('y', labelPos.y)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '9')
          .attr('fill', '#888')
          .text(position.toString());
      }
    }

    // 绘制选择区域
    if (selectionStart !== null && selectionEnd !== null && selectionStart !== undefined && selectionEnd !== undefined) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      const startAngle = positionToAngle(start);
      const endAngle = positionToAngle(end);
      
      const selectionArc = d3.arc()
        .innerRadius(innerRadius - 5)
        .outerRadius(outerRadius + 5)
        .startAngle(angleToRadians(startAngle))
        .endAngle(angleToRadians(endAngle));
      
      g.append('path')
        .attr('d', selectionArc as unknown as string)
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .attr('fill', 'rgba(52, 152, 219, 0.25)')
        .attr('stroke', '#3498DB')
        .attr('stroke-width', 2);
    }

    // 绘制特征 - 使用分层布局避免重叠
    if (showFeatures && sequence.features.length > 0) {
      const featureGroup = g.append('g').attr('class', 'features');
      
      // 按角度排序特征
      const sortedFeatures = [...sequence.features].sort((a, b) => {
        const angleA = positionToAngle((a.start + a.end) / 2);
        const angleB = positionToAngle((b.start + b.end) / 2);
        return angleA - angleB;
      });

      // 计算每个特征的轨道层
      const featureLayers: Map<string, number> = new Map();
      const minAngleGap = 12; // 最小角度间隔
      
      sortedFeatures.forEach((feature) => {
        const midAngle = positionToAngle((feature.start + feature.end) / 2);
        
        let layer = 0;
        let placed = false;
        
        while (!placed && layer < 4) {
          let canPlace = true;
          
          // 检查与同一层其他特征是否重叠
          for (const [otherId, otherLayer] of featureLayers) {
            if (otherLayer === layer) {
              const otherFeature = sortedFeatures.find(f => f.id === otherId);
              if (otherFeature) {
                const otherMidAngle = positionToAngle((otherFeature.start + otherFeature.end) / 2);
                if (anglesOverlap(midAngle, midAngle, otherMidAngle, otherMidAngle, minAngleGap)) {
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
        
        featureLayers.set(feature.id, layer);
      });
      
      // 标签防重叠布局计算
      interface LabelLayoutItem {
        feature: typeof sortedFeatures[0];
        midAngle: number;
        layer: number;
        labelRadius: number;
        radialLayer: number;
        textAnchor: string;
        labelOffset: number;
        displayLabel: string;
        featureOuterR: number;
      }
      
      const labelLayoutItems: LabelLayoutItem[] = [];
      
      // 首先计算所有标签的基本信息
      sortedFeatures.forEach((feature) => {
        const layer = featureLayers.get(feature.id) || 0;
        const startAngle = positionToAngle(feature.start);
        const endAngle = positionToAngle(feature.end);
        const midAngle = (startAngle + endAngle) / 2;
        const layerOffset = layer * 18;
        const featureOuterR = innerRadius + 8 + layerOffset + 14;
        
        const labelText = feature.label || feature.name;
        const maxLabelLength = 25;
        const displayLabel = labelText.length > maxLabelLength 
          ? labelText.substring(0, maxLabelLength) + '...' 
          : labelText;
        
        const textAnchor = midAngle > 180 ? 'end' : 'start';
        const labelOffset = midAngle > 180 ? -8 : 8;
        
        labelLayoutItems.push({
          feature,
          midAngle,
          layer,
          labelRadius: labelRadius + layer * 15,
          radialLayer: 0,
          textAnchor,
          labelOffset,
          displayLabel,
          featureOuterR,
        });
      });
      
      // 计算标签径向分层，避免重叠
      // 按角度排序
      labelLayoutItems.sort((a, b) => a.midAngle - b.midAngle);
      
      const minLabelAngleGap = 14; // 标签间最小角度间隔（度）
      const labelRadiusStep = 22; // 每层半径增量
      
      // 为每个标签计算合适的径向层
      labelLayoutItems.forEach((item, index) => {
        let radialLayer = 0;
        let placed = false;
        
        while (!placed && radialLayer < 6) {
          let canPlace = true;
          const currentRadius = item.labelRadius + radialLayer * labelRadiusStep;
          
          // 检查与已处理标签的重叠
          for (let i = 0; i < index; i++) {
            const other = labelLayoutItems[i];
            const otherRadius = other.labelRadius + other.radialLayer * labelRadiusStep;
            
            // 只检查同一径向层或相邻层的标签
            if (Math.abs(currentRadius - otherRadius) < labelRadiusStep / 2) {
              // 计算角度差（考虑环形）
              let angleDiff = Math.abs(item.midAngle - other.midAngle);
              if (angleDiff > 180) angleDiff = 360 - angleDiff;
              
              if (angleDiff < minLabelAngleGap) {
                canPlace = false;
                break;
              }
            }
          }
          
          if (canPlace) {
            placed = true;
          } else {
            radialLayer++;
          }
        }
        
        item.labelRadius = item.labelRadius + radialLayer * labelRadiusStep;
        item.radialLayer = radialLayer;
      });
      
      // 绘制特征和标签
      labelLayoutItems.forEach((item) => {
        const { feature, midAngle, featureOuterR, displayLabel, textAnchor, labelOffset } = item;
        const startAngle = positionToAngle(feature.start);
        const endAngle = positionToAngle(feature.end);
        const angleSpan = endAngle - startAngle;
        const layer = featureLayers.get(feature.id) || 0;
        const layerOffset = layer * 18;
        const featureInnerR = innerRadius + 8 + layerOffset;
        const featureMidR = (featureInnerR + featureOuterR) / 2;
        
        // 绘制特征弧形
        const featurePath = getArcPath(startAngle, endAngle, featureInnerR, featureOuterR);
        
        featureGroup.append('path')
          .attr('d', featurePath)
          .attr('fill', feature.color || '#888')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.9)
          .attr('cursor', 'pointer')
          .on('mouseover', (e) => {
            setHoveredFeature(feature);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltipPos({
                x: (e as MouseEvent).clientX - rect.left + 15,
                y: (e as MouseEvent).clientY - rect.top + 15
              });
            }
          })
          .on('mouseout', () => setHoveredFeature(null))
          .on('click', () => onFeatureClick?.(feature));
        
        // 在特征弧形上绘制箭头（仅当特征足够大时）
        const minAngleForArrow = 8; // 最小角度才显示箭头
        if (angleSpan > minAngleForArrow) {
          const arrowColor = 'rgba(0,0,0,0.6)';
          const arrowSize = 5;
          
          // 计算箭头位置（弧形的中点）
          const getArrowPos = (angle: number, radius: number) => {
            const rad = angleToRadians(angle);
            return {
              x: centerX + radius * Math.cos(rad),
              y: centerY + radius * Math.sin(rad),
            };
          };
          
          // 绘制箭头函数
          const drawArrow = (angle: number, direction: 'forward' | 'reverse') => {
            const pos = getArrowPos(angle, featureMidR);
            const rad = angleToRadians(angle);
            
            // 根据方向计算箭头指向
            // forward: 顺时针方向 (角度增加方向)
            // reverse: 逆时针方向 (角度减小方向)
            const arrowAngle = direction === 'forward' 
              ? rad + Math.PI / 2  // 垂直于半径，顺时针
              : rad - Math.PI / 2; // 垂直于半径，逆时针
            
            // 计算箭头的三个点
            const tipX = pos.x + Math.cos(arrowAngle) * arrowSize;
            const tipY = pos.y + Math.sin(arrowAngle) * arrowSize;
            
            const baseAngle1 = arrowAngle + Math.PI * 0.8;
            const baseAngle2 = arrowAngle - Math.PI * 0.8;
            
            const base1X = pos.x + Math.cos(baseAngle1) * arrowSize * 0.6;
            const base1Y = pos.y + Math.sin(baseAngle1) * arrowSize * 0.6;
            const base2X = pos.x + Math.cos(baseAngle2) * arrowSize * 0.6;
            const base2Y = pos.y + Math.sin(baseAngle2) * arrowSize * 0.6;
            
            const arrowPath = `M ${tipX} ${tipY} L ${base1X} ${base1Y} L ${base2X} ${base2Y} Z`;
            
            featureGroup.append('path')
              .attr('d', arrowPath)
              .attr('fill', arrowColor);
          };
          
          // 根据链方向绘制箭头
          if (feature.strand === 'forward') {
            // 正向：在弧形中点绘制一个顺时针箭头
            drawArrow(midAngle, 'forward');
          } else if (feature.strand === 'reverse') {
            // 反向：在弧形中点绘制一个逆时针箭头
            drawArrow(midAngle, 'reverse');
          } else if (feature.strand === 'both') {
            // 双向：在弧形两端各绘制一个箭头
            const offsetAngle = angleSpan * 0.25;
            drawArrow(startAngle + offsetAngle, 'forward');
            drawArrow(endAngle - offsetAngle, 'reverse');
          }
        }
        
        // 绘制标签
        const labelPos = getLabelPosition(midAngle, item.labelRadius);
        const connectorEnd = getLabelPosition(midAngle, featureOuterR + 5);
        
        // 连接线
        featureGroup.append('line')
          .attr('x1', connectorEnd.x)
          .attr('y1', connectorEnd.y)
          .attr('x2', labelPos.x)
          .attr('y2', labelPos.y)
          .attr('stroke', feature.color || '#888')
          .attr('stroke-width', 1)
          .attr('opacity', 0.5);
        
        // 标签文字
        featureGroup.append('text')
          .attr('x', labelPos.x + labelOffset)
          .attr('y', labelPos.y)
          .attr('text-anchor', textAnchor)
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '10')
          .attr('fill', '#333')
          .attr('font-weight', '500')
          .text(displayLabel);
      });
    }

    // 绘制限制酶位点 - 限制数量避免拥挤
    if (showEnzymes && sequence.restrictionSites.length > 0) {
      const enzymeGroup = g.append('g').attr('class', 'enzymes');
      
      // 限制显示的酶数量，避免过于拥挤
      const maxEnzymes = Math.min(sequence.restrictionSites.length, 30);
      
      // 按位置排序
      const sortedEnzymes = [...sequence.restrictionSites]
        .sort((a, b) => a.position - b.position)
        .slice(0, maxEnzymes);
      
      // 过滤掉太近的酶
      const filteredEnzymes: typeof sortedEnzymes = [];
      const minEnzymeGap = sequence.length / 40; // 最小位置间隔
      
      sortedEnzymes.forEach((enzyme) => {
        const canAdd = filteredEnzymes.every(
          (e) => Math.abs(e.position - enzyme.position) > minEnzymeGap
        );
        if (canAdd) {
          filteredEnzymes.push(enzyme);
        }
      });
      
      filteredEnzymes.forEach((enzyme) => {
        const angle = positionToAngle(enzyme.position);
        const rad = angleToRadians(angle);
        
        const x1 = centerX + outerRadius * Math.cos(rad);
        const y1 = centerY + outerRadius * Math.sin(rad);
        const x2 = centerX + enzymeRadius * Math.cos(rad);
        const y2 = centerY + enzymeRadius * Math.sin(rad);
        
        // 绘制连接线
        enzymeGroup.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', enzyme.color || '#E74C3C')
          .attr('stroke-width', 1)
          .attr('opacity', 0.6);
        
        // 绘制酶标记
        enzymeGroup.append('circle')
          .attr('cx', x2)
          .attr('cy', y2)
          .attr('r', 3)
          .attr('fill', enzyme.color || '#E74C3C')
          .attr('cursor', 'pointer')
          .on('mouseover', (e) => {
            setHoveredEnzyme(enzyme);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltipPos({
                x: (e as MouseEvent).clientX - rect.left + 15,
                y: (e as MouseEvent).clientY - rect.top + 15
              });
            }
          })
          .on('mouseout', () => setHoveredEnzyme(null))
          .on('click', () => onEnzymeClick?.(enzyme));
        
        // 绘制标签
        const labelPos = getLabelPosition(angle, enzymeRadius + 18);
        const textAnchor = angle > 180 ? 'end' : 'start';
        const labelOffset = angle > 180 ? -5 : 5;
        
        enzymeGroup.append('text')
          .attr('x', labelPos.x + labelOffset)
          .attr('y', labelPos.y)
          .attr('text-anchor', textAnchor)
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '9')
          .attr('fill', enzyme.color || '#E74C3C')
          .text(enzyme.name);
      });
    }

    // 绘制中心信息
    const centerGroup = g.append('g').attr('class', 'center-info');
    
    centerGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', innerRadius - 8)
      .attr('fill', '#f8f9fa')
      .attr('stroke', '#dee2e6')
      .attr('stroke-width', 1);
    
    centerGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY - 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '13')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(sequence.name.length > 20 ? sequence.name.substring(0, 20) + '...' : sequence.name);
    
    centerGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 5)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '11')
      .attr('fill', '#666')
      .text(`${sequence.length.toLocaleString()} bp`);
    
    if (sequence.isCircular) {
      centerGroup.append('text')
        .attr('x', centerX)
        .attr('y', centerY + 22)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10')
        .attr('fill', '#888')
        .text('Circular');
    }

    // 绘制主圆环
    g.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', outerRadius)
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    
    g.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', innerRadius)
      .attr('fill', 'none')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1);

  }, [sequence, width, height, showFeatures, showEnzymes, selectedBase, selectionStart, selectionEnd, 
      centerX, centerY, outerRadius, innerRadius, enzymeRadius, labelRadius, 
      positionToAngle, angleToRadians, getArcPath, getLabelPosition,
      onFeatureClick, onEnzymeClick, onBaseClick]);

  return (
    <div ref={containerRef} className="relative" onMouseMove={handleMouseMove}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-crosshair"
      />
      
      {/* 悬停提示 - 跟随鼠标 */}
      {hoveredFeature && (
        <div 
          className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 pointer-events-none"
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
      
      {hoveredEnzyme && !hoveredFeature && (
        <div 
          className="absolute bg-white border border-red-300 rounded-lg shadow-lg p-3 z-50 pointer-events-none"
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
    </div>
  );
};

export default CircularPlasmid;
