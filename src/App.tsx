import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDNASequence } from '@/hooks/useDNASequence';
import { CircularPlasmid } from '@/components/CircularPlasmid';
import { LinearSequence } from '@/components/LinearSequence';
import { EnzymeList } from '@/components/EnzymeList';
import { FeatureList } from '@/components/FeatureList';
import { SequenceToolbar } from '@/components/SequenceToolbar';
import { 
  FileUp, Plus, Dna, Circle, AlignLeft, Scissors, 
  Layers, Save, Download 
} from 'lucide-react';
import './App.css';

function App() {
  const {
    sequence,
    viewState,
    fileInputRef,
    loadGenBankFile,
    createNewSequence,
    updateSequence,
    addFeature,
    removeFeature,
    updateFeature,
    insertBases,
    deleteBases,
    reverseComplement,
    saveAsGenBank,
    saveAsFasta,
    setSelection,
    getSelectedSequence,
    getGCContent,
    getMolecularWeight,
  } = useDNASequence();

  const [activeTab, setActiveTab] = useState('map');
  const [showNewSeqDialog, setShowNewSeqDialog] = useState(false);
  const [newSeqName, setNewSeqName] = useState('');
  const [newSeqSequence, setNewSeqSequence] = useState('');
  const [newSeqCircular, setNewSeqCircular] = useState(false);
  const [clipboard, setClipboard] = useState('');
  const [seqHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadGenBankFile(file);
      setActiveTab('map');
    }
  };

  // 创建新序列
  const handleCreateNewSequence = () => {
    if (newSeqName && newSeqSequence) {
      createNewSequence(newSeqName, newSeqSequence, newSeqCircular);
      setShowNewSeqDialog(false);
      setNewSeqName('');
      setNewSeqSequence('');
      setNewSeqCircular(false);
      setActiveTab('map');
    }
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = JSON.parse(seqHistory[historyIndex - 1]);
      updateSequence(prevState);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < seqHistory.length - 1) {
      const nextState = JSON.parse(seqHistory[historyIndex + 1]);
      updateSequence(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // 剪切
  const handleCut = () => {
    const selected = getSelectedSequence();
    if (selected) {
      setClipboard(selected);
      if (viewState.selectionStart !== null && viewState.selectionEnd !== null) {
        const start = Math.min(viewState.selectionStart, viewState.selectionEnd);
        const end = Math.max(viewState.selectionStart, viewState.selectionEnd);
        deleteBases(start, end + 1);
        setSelection(null, null);
      }
    }
  };

  // 复制
  const handleCopy = () => {
    const selected = getSelectedSequence();
    if (selected) {
      setClipboard(selected);
    }
  };

  // 粘贴
  const handlePaste = () => {
    if (clipboard && viewState.selectionStart !== null) {
      insertBases(viewState.selectionStart, clipboard);
    }
  };

  // 删除
  const handleDelete = () => {
    if (viewState.selectionStart !== null && viewState.selectionEnd !== null) {
      const start = Math.min(viewState.selectionStart, viewState.selectionEnd);
      const end = Math.max(viewState.selectionStart, viewState.selectionEnd);
      deleteBases(start, end + 1);
      setSelection(null, null);
    }
  };

  // 查找
  const handleFind = (query: string) => {
    if (sequence && query) {
      const upperQuery = query.toUpperCase();
      const pos = sequence.sequence.indexOf(upperQuery);
      if (pos !== -1) {
        setSelection(pos, pos + upperQuery.length - 1);
      }
    }
  };

  // 替换
  const handleReplace = (find: string, replace: string) => {
    if (sequence && find) {
      const upperFind = find.toUpperCase();
      const upperReplace = replace.toUpperCase();
      let newSeq = sequence.sequence;
      let pos = newSeq.indexOf(upperFind);
      
      while (pos !== -1) {
        newSeq = newSeq.substring(0, pos) + upperReplace + newSeq.substring(pos + upperFind.length);
        pos = newSeq.indexOf(upperFind, pos + upperReplace.length);
      }
      
      updateSequence({ sequence: newSeq });
    }
  };

  // 如果没有序列，显示欢迎页面
  if (!sequence) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
                <Dna className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Gene Editor
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              A powerful tool for viewing and editing DNA sequences
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gb,.gbk,.genbank"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 hover:bg-blue-50 transition-colors">
                  <FileUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-700">Open GenBank File</h3>
                  <p className="text-sm text-gray-500 mt-1">.gb, .gbk files</p>
                </div>
              </label>
              
              <Dialog open={showNewSeqDialog} onOpenChange={setShowNewSeqDialog}>
                <DialogTrigger asChild>
                  <div className="border-2 border-dashed border-green-300 rounded-xl p-6 hover:bg-green-50 transition-colors cursor-pointer">
                    <Plus className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-700">New Sequence</h3>
                    <p className="text-sm text-gray-500 mt-1">Create from scratch</p>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Sequence</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Sequence Name</Label>
                      <Input
                        value={newSeqName}
                        onChange={(e) => setNewSeqName(e.target.value)}
                        placeholder="Enter sequence name..."
                      />
                    </div>
                    <div>
                      <Label>DNA Sequence</Label>
                      <textarea
                        value={newSeqSequence}
                        onChange={(e) => setNewSeqSequence(e.target.value)}
                        placeholder="Enter DNA sequence (A, T, C, G)..."
                        className="w-full h-32 p-3 border rounded-md font-mono text-sm resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="circular"
                        checked={newSeqCircular}
                        onChange={(e) => setNewSeqCircular(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="circular">Circular plasmid</Label>
                    </div>
                    <Button onClick={handleCreateNewSequence} className="w-full">
                      Create Sequence
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Dna className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Gene Editor</h1>
            </div>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">{sequence.name}</span>
              <span className="text-sm text-gray-500">
                ({sequence.length} bp{sequence.isCircular ? ', circular' : ''})
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-4 h-4 mr-1" />
              Open
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".gb,.gbk,.genbank"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveAsGenBank}
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveAsFasta}
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        {/* 工具栏 */}
        <SequenceToolbar
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDelete={handleDelete}
          onReverseComplement={reverseComplement}
          onFind={handleFind}
          onReplace={handleReplace}
          onSave={saveAsGenBank}
          onSaveAs={(format) => format === 'genbank' ? saveAsGenBank() : saveAsFasta()}
          onOpen={() => fileInputRef.current?.click()}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          hasSelection={viewState.selectionStart !== null}
        />
      </header>

      {/* 主内容区 */}
      <main className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Circle className="w-4 h-4" />
              Map
            </TabsTrigger>
            <TabsTrigger value="sequence" className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              Sequence
            </TabsTrigger>
            <TabsTrigger value="enzymes" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Enzymes
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Features
            </TabsTrigger>
          </TabsList>

          {/* Map 视图 */}
          <TabsContent value="map" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-center">
                <CircularPlasmid
                  sequence={sequence}
                  width={800}
                  height={600}
                  onFeatureClick={(feature) => {
                    console.log('Feature clicked:', feature);
                  }}
                  onEnzymeClick={(enzyme) => {
                    console.log('Enzyme clicked:', enzyme);
                  }}
                  onBaseClick={(position) => {
                    setSelection(position, position);
                  }}
                  selectedBase={viewState.selectedBase}
                  selectionStart={viewState.selectionStart}
                  selectionEnd={viewState.selectionEnd}
                  showFeatures={viewState.showFeatures}
                  showEnzymes={viewState.showEnzymes}
                />
              </div>
            </div>
            
            {/* 序列统计 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Length</div>
                <div className="text-2xl font-bold text-gray-800">{sequence.length.toLocaleString()} bp</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">GC Content</div>
                <div className="text-2xl font-bold text-gray-800">{getGCContent().toFixed(1)}%</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Molecular Weight</div>
                <div className="text-2xl font-bold text-gray-800">{(getMolecularWeight() / 1000000).toFixed(2)} MDa</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Features</div>
                <div className="text-2xl font-bold text-gray-800">{sequence.features.length}</div>
              </div>
            </div>
          </TabsContent>

          {/* Sequence 视图 */}
          <TabsContent value="sequence" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <LinearSequence
                sequence={sequence}
                width={1000}
                basesPerRow={60}
                onFeatureClick={(feature) => {
                  console.log('Feature clicked:', feature);
                }}
                onEnzymeClick={(enzyme) => {
                  console.log('Enzyme clicked:', enzyme);
                }}
                onBaseClick={(position) => {
                  setSelection(position, position);
                }}
                selectedBase={viewState.selectedBase}
                selectionStart={viewState.selectionStart}
                selectionEnd={viewState.selectionEnd}
                showFeatures={viewState.showFeatures}
                showEnzymes={viewState.showEnzymes}
                showTranslations={viewState.showTranslations}
              />
            </div>
          </TabsContent>

          {/* Enzymes 视图 */}
          <TabsContent value="enzymes" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <EnzymeList
                enzymes={sequence.restrictionSites}
                onEnzymeClick={(enzyme) => {
                  setSelection(enzyme.position, enzyme.position + enzyme.sequence.length - 1);
                }}
              />
            </div>
          </TabsContent>

          {/* Features 视图 */}
          <TabsContent value="features" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <FeatureList
                features={sequence.features}
                onFeatureClick={(feature) => {
                  setSelection(feature.start, feature.end);
                }}
                onFeatureAdd={addFeature}
                onFeatureEdit={(feature) => {
                  updateFeature(feature.id, feature);
                }}
                onFeatureDelete={removeFeature}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* 底部状态栏 */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>{sequence.name}</span>
            <span>|</span>
            <span>{sequence.length.toLocaleString()} bp</span>
            <span>|</span>
            <span>GC: {getGCContent().toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-4">
            {viewState.selectionStart !== null && viewState.selectionEnd !== null && (
              <span>
                Selected: {Math.abs(viewState.selectionEnd - viewState.selectionStart) + 1} bp
              </span>
            )}
            <span>{sequence.isCircular ? 'Circular' : 'Linear'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
