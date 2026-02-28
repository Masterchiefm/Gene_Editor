import React, { useState } from 'react';
import { 
  Scissors, Copy, Clipboard, RotateCcw, 
  Search, Replace, Save, FileDown, FileUp, Undo, Redo
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SequenceToolbarProps {
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onReverseComplement?: () => void;
  onFind?: (query: string) => void;
  onReplace?: (find: string, replace: string) => void;
  onSave?: () => void;
  onSaveAs?: (format: 'genbank' | 'fasta') => void;
  onOpen?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelection?: boolean;
}

export const SequenceToolbar: React.FC<SequenceToolbarProps> = ({
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onReverseComplement,
  onFind,
  onReplace,
  onSave,
  onSaveAs,
  onOpen,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
}) => {
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showFindDialog, setShowFindDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
      {/* 文件操作 */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpen}
          className="flex items-center gap-1"
        >
          <FileUp className="h-4 w-4" />
          Open
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className="flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <FileDown className="h-4 w-4" />
              Save as
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onSaveAs?.('genbank')}>
              Save as GenBank (.gb)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSaveAs?.('fasta')}>
              Save as FASTA (.fa)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 编辑操作 */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 w-8"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-8 w-8"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* 剪贴板操作 */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCut}
          disabled={!hasSelection}
          className="h-8 w-8"
          title="Cut"
        >
          <Scissors className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          disabled={!hasSelection}
          className="h-8 w-8"
          title="Copy"
        >
          <Copy className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onPaste}
          className="h-8 w-8"
          title="Paste"
        >
          <Clipboard className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={!hasSelection}
          className="h-8 w-8"
          title="Delete"
        >
          <span className="text-sm font-bold">Del</span>
        </Button>
      </div>

      {/* 序列操作 */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReverseComplement}
          className="flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          Rev Comp
        </Button>
      </div>

      {/* 查找替换 */}
      <div className="flex items-center gap-1">
        <Dialog open={showFindDialog} onOpenChange={setShowFindDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              Find
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Find Sequence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Search for</Label>
                <Input
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder="Enter sequence..."
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={() => {
                  onFind?.(findQuery);
                  setShowFindDialog(false);
                }}
                className="w-full"
              >
                Find
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Replace className="h-4 w-4" />
              Replace
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Find and Replace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Find</Label>
                <Input
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder="Enter sequence to find..."
                  className="font-mono"
                />
              </div>
              <div>
                <Label>Replace with</Label>
                <Input
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Enter replacement..."
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={() => {
                  onReplace?.(findQuery, replaceQuery);
                  setShowReplaceDialog(false);
                }}
                className="w-full"
              >
                Replace All
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SequenceToolbar;
