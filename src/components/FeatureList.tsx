import React, { useState } from 'react';
import type { Feature } from '@/types/dna';
import { Search, Plus, Edit, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface FeatureListProps {
  features: Feature[];
  onFeatureClick?: (feature: Feature) => void;
  onFeatureEdit?: (feature: Feature) => void;
  onFeatureDelete?: (featureId: string) => void;
  onFeatureAdd?: (feature: Omit<Feature, 'id'>) => void;
}

const FEATURE_TYPES = [
  'gene', 'CDS', 'exon', 'intron', 'promoter', 'terminator',
  'rep_origin', 'primer_bind', 'misc_feature', 'LTR', 'repeat_region',
  'stem_loop', 'protein_bind', 'sig_peptide', 'mat_peptide', 'source',
  '5\'UTR', '3\'UTR', 'enhancer', 'attenuator', 'RBS', 'polyA_signal',
  'polyA_site', 'tRNA', 'rRNA', 'mRNA', 'ncRNA', 'miRNA', 'snRNA', 'snoRNA',
];

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  onFeatureClick,
  onFeatureEdit,
  onFeatureDelete,
  onFeatureAdd,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'name' | 'type'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  // 新特征表单
  const [newFeature, setNewFeature] = useState<Partial<Feature>>({
    type: 'gene',
    strand: 'forward',
    start: 1,
    end: 100,
  });

  // 过滤和排序特征
  const filteredFeatures = features
    .filter((feature) =>
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feature.label && feature.label.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'position') {
        comparison = a.start - b.start;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'position' | 'name' | 'type') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleAddFeature = () => {
    if (newFeature.name && newFeature.start && newFeature.end) {
      onFeatureAdd?.(newFeature as Omit<Feature, 'id'>);
      setShowAddDialog(false);
      setNewFeature({
        type: 'gene',
        strand: 'forward',
        start: 1,
        end: 100,
      });
    }
  };

  const handleEditFeature = () => {
    if (editingFeature) {
      onFeatureEdit?.(editingFeature);
      setEditingFeature(null);
    }
  };

  const getStrandIcon = (strand: string) => {
    return strand === 'forward' ? (
      <ArrowRight className="h-4 w-4 text-blue-500" />
    ) : (
      <ArrowLeft className="h-4 w-4 text-green-500" />
    );
  };

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Feature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newFeature.name || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                  placeholder="Feature name"
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newFeature.type}
                  onChange={(e) => setNewFeature({ ...newFeature, type: e.target.value })}
                >
                  {FEATURE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start</Label>
                  <Input
                    type="number"
                    value={newFeature.start}
                    onChange={(e) => setNewFeature({ ...newFeature, start: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    type="number"
                    value={newFeature.end}
                    onChange={(e) => setNewFeature({ ...newFeature, end: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Strand</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newFeature.strand}
                  onChange={(e) => setNewFeature({ ...newFeature, strand: e.target.value as 'forward' | 'reverse' })}
                >
                  <option value="forward">Forward</option>
                  <option value="reverse">Reverse</option>
                </select>
              </div>
              <div>
                <Label>Note (optional)</Label>
                <Input
                  value={newFeature.note || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, note: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <Button onClick={handleAddFeature} className="w-full">
                Add Feature
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计信息 */}
      <div className="text-sm text-gray-600">
        Showing {filteredFeatures.length} of {features.length} features
      </div>

      {/* 特征列表 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Name
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Type
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('position')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Position
                </button>
              </TableHead>
              <TableHead>Strand</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeatures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No features found
                </TableCell>
              </TableRow>
            ) : (
              filteredFeatures.map((feature) => (
                <TableRow
                  key={feature.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onFeatureClick?.(feature)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: feature.color }}
                      />
                      {feature.label || feature.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {feature.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {feature.start} - {feature.end}
                  </TableCell>
                  <TableCell>
                    {getStrandIcon(feature.strand)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFeature(feature);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFeatureDelete?.(feature.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={!!editingFeature} onOpenChange={() => setEditingFeature(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
          </DialogHeader>
          {editingFeature && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editingFeature.name}
                  onChange={(e) => setEditingFeature({ ...editingFeature, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Label</Label>
                <Input
                  value={editingFeature.label || ''}
                  onChange={(e) => setEditingFeature({ ...editingFeature, label: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start</Label>
                  <Input
                    type="number"
                    value={editingFeature.start}
                    onChange={(e) => setEditingFeature({ ...editingFeature, start: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    type="number"
                    value={editingFeature.end}
                    onChange={(e) => setEditingFeature({ ...editingFeature, end: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Note</Label>
                <Input
                  value={editingFeature.note || ''}
                  onChange={(e) => setEditingFeature({ ...editingFeature, note: e.target.value })}
                />
              </div>
              <Button onClick={handleEditFeature} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeatureList;
