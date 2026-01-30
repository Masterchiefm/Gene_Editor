import type { DNASequence, Feature, RestrictionSite, GenBankMetadata } from '@/types/dna';

// 常用限制酶库
export const commonRestrictionEnzymes: Record<string, string> = {
  'EcoRI': 'GAATTC',
  'BamHI': 'GGATCC',
  'HindIII': 'AAGCTT',
  'XhoI': 'CTCGAG',
  'XbaI': 'TCTAGA',
  'KpnI': 'GGTACC',
  'SacI': 'GAGCTC',
  'PstI': 'CTGCAG',
  'SmaI': 'CCCGGG',
  'SalI': 'GTCGAC',
  'SphI': 'GCATGC',
  'NotI': 'GCGGCCGC',
  'XmaI': 'CCCGGG',
  'NcoI': 'CCATGG',
  'BglII': 'AGATCT',
  'ClaI': 'ATCGAT',
  'DraI': 'TTTAAA',
  'EcoRV': 'GATATC',
  'HincII': 'GTYRAC',
  'HpaI': 'GTTAAC',
  'KasI': 'GGCGCC',
  'MfeI': 'CAATTG',
  'NdeI': 'CATATG',
  'NheI': 'GCTAGC',
  'NsiI': 'ATGCAT',
  'PacI': 'TTAATTAA',
  'PmeI': 'GTTTAAAC',
  'PvuI': 'CGATCG',
  'PvuII': 'CAGCTG',
  'SacII': 'CCGCGG',
  'ScaI': 'AGTACT',
  'SnaBI': 'TACGTA',
  'SpeI': 'ACTAGT',
  'SrfI': 'GCCCAGGC',
  'SwaI': 'ATTTAAAT',
  'Tth111I': 'GACNNNGTC',
  'AfeI': 'AGCGCT',
  'AflII': 'CTTAAG',
  'AgeI': 'ACCGGT',
  'ApaI': 'GGGCCC',
  'ApaLI': 'GTGCAC',
  'AscI': 'GGCGCGCC',
  'AseI': 'ATTAAT',
  'BbvCI': 'CCTCAGC',
  'BlpI': 'GCTNAGC',
  'BmtI': 'GCTAGC',
  'BsaI': 'GGTCTC',
  'BsiEI': 'CGRYCG',
  'BsiWI': 'CGTACG',
  'BspEI': 'TCCGGA',
  'BsrGI': 'TGTACA',
  'BssHII': 'GCGCGC',
  'BstBI': 'TTCGAA',
  'BstZ17I': 'GTATAC',
  'CspCI': 'CAGNAG',
  'EagI': 'CGGCCG',
  'Eco53kI': 'GAGCTC',
  'FseI': 'GGCCGGCC',
  'FspI': 'TGCGCA',
  'HpaII': 'CCGG',
  'MluI': 'ACGCGT',
  'MscI': 'TGGCCA',
  'MspA1I': 'CMGCKG',
  'NaeI': 'GCCGGC',
  'NarI': 'GGCGCC',
  'NgoMIV': 'GCCGGC',
  'NruI': 'TCGCGA',
  'PflMI': 'CCANNNNNTGG',
  'PmlI': 'CACGTG',
  'PshAI': 'GACNNNGTC',
  'RsrII': 'CGGWCCG',
  'SbfI': 'CCTGCAGG',
  'SfcI': 'CTRYAG',
  'SfoI': 'GGCGCC',
  'SgrAI': 'CRCCGGYG',
  'SmlI': 'CTYRAG',
  'TliI': 'GACNNNGTC',
  'Tsp509I': 'AATT',
  'TspRI': 'CASTGNN',
  'BspHI': 'TCATGA',
  'BsrFI': 'RCCGGY',
  'Bst1107I': 'GTATAC',
  'BstEII': 'GGTNACC',
  'BstUI': 'CGCG',
  'Bsu36I': 'CCTNAGG',
  'Cfr10I': 'RCCGGY',
  'CfrI': 'YGGCCR',
  'DsaI': 'CCRYGG',
  'Ecl136II': 'GAGCTC',
  'EcoNI': 'CCTNNNNNAGG',
  'EcoO109I': 'RGGNCCY',
  'GdiII': 'CGGCCG',
  'HaeII': 'RGCGCY',
  'HaeIII': 'GGCC',
  'HgiAI': 'GWGCWC',
  'HgiCI': 'GGYRCC',
  'HgiEII': 'GGCC',
  'HhaI': 'GCGC',
  'Hin1I': 'GRCGYC',
  'Hin1II': 'CATG',
  'HinfI': 'GANTC',
  'Hsp92I': 'GRCGYC',
  'Hsp92II': 'CATG',
  'KspI': 'CCGCGG',
  'MaeI': 'CTAG',
  'MaeII': 'ACGT',
  'MaeIII': 'GTNAC',
  'MamI': 'GATNNNNATC',
  'MboI': 'GATC',
  'MboII': 'GAAGA',
  'McrI': 'CGRYCG',
  'MflI': 'RGATCY',
  'MnlI': 'CCTC',
  'MroI': 'TCCGGA',
  'MseI': 'TTAA',
  'MslI': 'CAYNNNNRTG',
  'MspI': 'CCGG',
  'MstI': 'TGCGA',
  'MvaI': 'CCWGG',
  'MvnI': 'CGCG',
  'NciI': 'CCSGG',
  'NdeII': 'GATC',
  'NgoAIV': 'GCCGGC',
  'NlaIII': 'CATG',
  'NlaIV': 'GGNNCC',
  'NspI': 'RCATGY',
  'NspII': 'GDGCHC',
  'NspBII': 'CMGCKG',
  'OliI': 'CACNNNNGTG',
  'PaeR7I': 'CTCGAG',
  'PagI': 'TCATGA',
  'Ppu10I': 'AATT',
  'PpuMI': 'RGGWCCY',
  'PsiI': 'TTATAA',
  'Psp1406I': 'AACGTT',
  'Psp5II': 'RGGWCCY',
  'PspAI': 'CCCGGG',
  'PspEI': 'GGTNACC',
  'PspGI': 'CCWGG',
  'PspLI': 'CGTACG',
  'PspOMI': 'GGGCCC',
  'PspPI': 'GGCC',
  'PsrI': 'GAACNNNNNNTAC',
  'PssI': 'RGGNCCY',
  'PstNI': 'CAGNNNCTG',
  'PsyI': 'GATN4ATC',
  'RsaI': 'GTAC',
  'RseI': 'GACNNNGTC',
  'Rsr2I': 'CGGWCCG',
  'SanDI': 'GGGWCCC',
  'SapI': 'GCTCTTC',
  'Sau3AI': 'GATC',
  'Sau96I': 'GGNCC',
  'SchI': 'GAGTC',
  'SciI': 'CTCGAG',
  'ScrFI': 'CCNGG',
  'SduI': 'GDGCHC',
  'SecI': 'CCNNGG',
  'SexAI': 'ACCWGGT',
  'SfaNI': 'GCATC',
  'SfeI': 'CTRYAG',
  'SfiI': 'GGCCNNNNNGGCC',
  'Sfr274I': 'CTCGAG',
  'Sfr303I': 'CCCGGG',
  'SfuI': 'TTCGAA',
  'SgfI': 'GCGATCGC',
  'SgrBI': 'CCGCAG',
  'SgrDI': 'CGTCGACG',
  'SgsI': 'GGCGCGCC',
  'SimI': 'GGGTC',
  'SlaI': 'CTCGAG',
  'SnoI': 'GTGCAC',
  'Sse8387I': 'CCTGCAGG',
  'SseBI': 'AGGCCT',
  'SsiI': 'CCGC',
  'SspI': 'AATATT',
  'SspD5I': 'GGTGA',
  'SstI': 'GAGCTC',
  'SstII': 'CCGCGG',
  'StuI': 'AGGCCT',
  'StyI': 'CCWWGG',
  'StyD4I': 'CCNGG',
  'TaaI': 'ACNGT',
  'TaiI': 'ACGT',
  'TaqI': 'TCGA',
  'TaqII': 'GACCGA',
  'TatI': 'WGTACW',
  'TauI': 'GCSGC',
  'TfiI': 'GAWTC',
  'Tru1I': 'TTAA',
  'Tru9I': 'TTAA',
  'TscI': 'ACGT',
  'TseI': 'GCWGC',
  'TsoI': 'TARCCA',
  'Tsp45I': 'GTSAC',
  'Tsp4CI': 'ACNGT',
  'TspDTI': 'ATGAA',
  'TspGWI': 'AACGAG',
  'TspMI': 'CAGCTG',
  'Tth111II': 'CAARCA',
  'Van91I': 'CCANNNNNTGG',
  'VneI': 'GTGCAC',
  'VpaK11AI': 'GGWCC',
  'VspI': 'ATTAAT',
  'XagI': 'CCTNNNNNAGG',
  'XapI': 'RAATTY',
  'XceI': 'RCATGY',
  'XcmI': 'CCANNNNNNNNNTGG',
  'XhoII': 'RGATCY',
  'XmaIII': 'CGGCCG',
  'XmaCI': 'CCCGGG',
  'XmaJI': 'CCTAGG',
  'XmiI': 'GTMKAC',
  'XmnI': 'GAANNNNTTC',
  'XspI': 'CTAG',
  'ZraI': 'GACGTC',
  'ZrmI': 'AGTACT',
  'Zsp2I': 'ATGCA T',
};

// 特征颜色映射
const featureColors: Record<string, string> = {
  'gene': '#FF6B6B',
  'CDS': '#4ECDC4',
  'exon': '#45B7D1',
  'intron': '#96CEB4',
  'promoter': '#FFEAA7',
  'terminator': '#DDA0DD',
  'rep_origin': '#98D8C8',
  'primer_bind': '#F7DC6F',
  'misc_feature': '#BB8FCE',
  'misc_binding': '#85C1E9',
  'LTR': '#F8C471',
  'repeat_region': '#82E0AA',
  'stem_loop': '#F1948A',
  'protein_bind': '#85C1E9',
  'sig_peptide': '#F7DC6F',
  'mat_peptide': '#BB8FCE',
  'source': '#D5DBDB',
  'D-loop': '#AED6F1',
  'C_region': '#A9DFBF',
  'V_region': '#F9E79F',
  'J_region': '#D7BDE2',
  'N_region': '#F5B7B1',
  'S_region': '#A3E4D7',
  'variation': '#FAD7A0',
  '5\'UTR': '#AED6F1',
  '3\'UTR': '#A9DFBF',
  'enhancer': '#F9E79F',
  'attenuator': '#D7BDE2',
  'RBS': '#F5B7B1',
  'polyA_signal': '#A3E4D7',
  'polyA_site': '#FAD7A0',
  'prim_transcript': '#AED6F1',
  'tRNA': '#A9DFBF',
  'rRNA': '#F9E79F',
  'mRNA': '#D7BDE2',
  'ncRNA': '#F5B7B1',
  'miRNA': '#A3E4D7',
  'snRNA': '#FAD7A0',
  'snoRNA': '#AED6F1',
};

export function getFeatureColor(type: string): string {
  return featureColors[type] || '#BB8FCE';
}

// 解析GenBank文件
export function parseGenBank(content: string): DNASequence {
  const lines = content.split('\n');
  
  const metadata: Partial<GenBankMetadata> = {};
  let sequence = '';
  const features: Feature[] = [];
  let inFeatures = false;
  let inSequence = false;
  let currentFeature: Partial<Feature> | null = null;
  let currentFeatureLines: string[] = [];
  
  // 解析头部信息
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    if (line.startsWith('LOCUS')) {
      const locusParts = line.substring(5).trim().split(/\s+/);
      if (locusParts.length >= 2) {
        metadata.locus = locusParts[0];
        metadata.length = parseInt(locusParts[1]) || 0;
        if (locusParts.length >= 5) {
          metadata.moleculeType = locusParts[2];
          metadata.topology = locusParts[3] || 'linear';
          metadata.division = locusParts[4];
        }
      }
    } else if (line.startsWith('DEFINITION')) {
      metadata.definition = line.substring(12).trim();
    } else if (line.startsWith('ACCESSION')) {
      metadata.accession = line.substring(12).trim();
    } else if (line.startsWith('VERSION')) {
      metadata.version = line.substring(12).trim();
    } else if (line.startsWith('KEYWORDS')) {
      metadata.keywords = line.substring(12).trim();
    } else if (line.startsWith('SOURCE')) {
      metadata.source = line.substring(12).trim();
    } else if (line.startsWith('  ORGANISM')) {
      metadata.organism = line.substring(12).trim();
    } else if (line.startsWith('FEATURES')) {
      inFeatures = true;
      i++;
      continue;
    } else if (line.startsWith('ORIGIN')) {
      inFeatures = false;
      inSequence = true;
      i++;
      continue;
    } else if (line.startsWith('//')) {
      break;
    }
    
    // 解析特征
    if (inFeatures) {
      if (line.startsWith('     ') && !line.startsWith('      ')) {
        // 新的特征
        if (currentFeature && currentFeatureLines.length > 0) {
          parseFeatureQualifiers(currentFeature, currentFeatureLines);
          features.push(currentFeature as Feature);
        }
        
        const featureMatch = line.trim().match(/^(\S+)\s+(.+)$/);
        if (featureMatch) {
          currentFeature = {
            id: `feature-${features.length}`,
            type: featureMatch[1],
            color: getFeatureColor(featureMatch[1]),
          };
          currentFeatureLines = [featureMatch[2]];
        }
      } else if (line.startsWith('      ') && currentFeature) {
        currentFeatureLines.push(line.trim());
      }
    }
    
    // 解析序列
    if (inSequence) {
      const seqMatch = line.match(/\d+\s+([\sactgACTG]+)/);
      if (seqMatch) {
        sequence += seqMatch[1].replace(/\s/g, '').toUpperCase();
      }
    }
    
    i++;
  }
  
  // 处理最后一个特征
  if (currentFeature && currentFeatureLines.length > 0) {
    parseFeatureQualifiers(currentFeature, currentFeatureLines);
    features.push(currentFeature as Feature);
  }
  
  // 检测限制酶位点
  const restrictionSites = detectRestrictionSites(sequence);
  
  return {
    id: metadata.accession || metadata.locus || 'unknown',
    name: metadata.locus || 'Unknown',
    description: metadata.definition || '',
    sequence: sequence,
    length: sequence.length,
    isCircular: metadata.topology === 'circular',
    features: features,
    restrictionSites: restrictionSites,
    primers: [],
    accession: metadata.accession,
    organism: metadata.organism,
    date: metadata.date,
  };
}

// 解析特征限定符
function parseFeatureQualifiers(feature: Partial<Feature>, lines: string[]) {
  if (lines.length === 0) return;
  
  // 解析位置信息
  const locationLine = lines[0];
  
  if (locationLine.includes('complement')) {
    feature.strand = 'reverse';
  } else {
    feature.strand = 'forward';
  }
  
  // 解析起始和结束位置
  const rangeMatch = locationLine.match(/(\d+)\.\.(\d+)/);
  if (rangeMatch) {
    feature.start = parseInt(rangeMatch[1]);
    feature.end = parseInt(rangeMatch[2]);
  } else {
    const singleMatch = locationLine.match(/(\d+)/);
    if (singleMatch) {
      feature.start = parseInt(singleMatch[1]);
      feature.end = feature.start;
    }
  }
  
  // 解析限定符
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const qualifierMatch = line.match(/^\/(\S+)="?(.+?)"?$/);
    if (qualifierMatch) {
      const key = qualifierMatch[1];
      const value = qualifierMatch[2].replace(/"$/, '');
      
      if (key === 'gene' || key === 'label') {
        feature.name = value;
        feature.label = value;
      } else if (key === 'note') {
        feature.note = value;
      } else if (key === 'locus_tag') {
        if (!feature.name) feature.name = value;
      } else if (key === 'product') {
        if (!feature.label) feature.label = value;
      }
    }
  }
  
  if (!feature.name) {
    feature.name = `${feature.type}_${feature.start}`;
  }
}

// 检测限制酶位点
export function detectRestrictionSites(sequence: string): RestrictionSite[] {
  const sites: RestrictionSite[] = [];
  const upperSeq = sequence.toUpperCase();
  
  Object.entries(commonRestrictionEnzymes).forEach(([enzymeName, recognitionSeq]) => {
    const upperRecognition = recognitionSeq.toUpperCase();
    let pos = 0;
    
    while ((pos = upperSeq.indexOf(upperRecognition, pos)) !== -1) {
      sites.push({
        id: `enzyme-${enzymeName}-${pos}`,
        name: enzymeName,
        sequence: recognitionSeq,
        position: pos + 1, // 1-based position
        color: '#E74C3C',
      });
      pos++;
    }
  });
  
  return sites.sort((a, b) => a.position - b.position);
}

// 生成GenBank格式文件
export function generateGenBank(sequence: DNASequence): string {
  const now = new Date();
  const date = `${now.getDate().toString().padStart(2, '0')}-${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][now.getMonth()]}-${now.getFullYear()}`;
  
  let content = `LOCUS       ${sequence.name.padEnd(16)} ${sequence.length.toString().padStart(7)} bp    DNA     ${sequence.isCircular ? 'circular' : 'linear'}   ${date}\n`;
  content += `DEFINITION  ${sequence.description || sequence.name}\n`;
  content += `ACCESSION   ${sequence.accession || 'unknown'}\n`;
  content += `VERSION     ${sequence.accession || 'unknown'}.1\n`;
  content += `KEYWORDS    .\n`;
  content += `SOURCE      ${sequence.organism || 'unknown'}\n`;
  content += `  ORGANISM  ${sequence.organism || 'unknown'}\n`;
  content += `            .\n`;
  
  // FEATURES
  content += `FEATURES             Location/Qualifiers\n`;
  
  sequence.features.forEach((feature) => {
    const location = feature.strand === 'reverse' 
      ? `complement(${feature.start}..${feature.end})`
      : `${feature.start}..${feature.end}`;
    
    content += `     ${feature.type.padEnd(15)} ${location}\n`;
    if (feature.name) {
      content += `                     /gene="${feature.name}"\n`;
    }
    if (feature.label && feature.label !== feature.name) {
      content += `                     /label="${feature.label}"\n`;
    }
    if (feature.note) {
      content += `                     /note="${feature.note}"\n`;
    }
  });
  
  // ORIGIN
  content += `ORIGIN\n`;
  
  for (let i = 0; i < sequence.sequence.length; i += 60) {
    const lineNum = (i + 1).toString().padStart(9);
    let line = lineNum;
    
    for (let j = 0; j < 60 && i + j < sequence.sequence.length; j += 10) {
      const segment = sequence.sequence.substring(i + j, Math.min(i + j + 10, sequence.sequence.length));
      line += ' ' + segment.toLowerCase();
    }
    
    content += line + '\n';
  }
  
  content += `//\n`;
  
  return content;
}
