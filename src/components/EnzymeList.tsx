import React, { useState } from 'react';
import type { RestrictionSite } from '@/types/dna';
import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EnzymeListProps {
  enzymes: RestrictionSite[];
  onEnzymeClick?: (enzyme: RestrictionSite) => void;
  onEnzymeSelect?: (enzyme: RestrictionSite) => void;
  selectedEnzymes?: string[];
}

export const EnzymeList: React.FC<EnzymeListProps> = ({
  enzymes,
  onEnzymeClick,
  onEnzymeSelect,
  selectedEnzymes = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'name'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 过滤和排序酶
  const filteredEnzymes = enzymes
    .filter((enzyme) =>
      enzyme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enzyme.sequence.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'position') {
        comparison = a.position - b.position;
      } else {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'position' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search enzymes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSort('position')}
          className={sortBy === 'position' ? 'bg-blue-50' : ''}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* 统计信息 */}
      <div className="text-sm text-gray-600">
        Showing {filteredEnzymes.length} of {enzymes.length} restriction sites
      </div>

      {/* 酶列表 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input type="checkbox" className="rounded" />
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Enzyme
                  {sortBy === 'name' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableHead>
              <TableHead>Sequence</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('position')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Position
                  {sortBy === 'position' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnzymes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No restriction sites found
                </TableCell>
              </TableRow>
            ) : (
              filteredEnzymes.map((enzyme) => (
                <TableRow
                  key={enzyme.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onEnzymeClick?.(enzyme)}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedEnzymes.includes(enzyme.id)}
                      onChange={() => onEnzymeSelect?.(enzyme)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-red-600">
                    {enzyme.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {enzyme.sequence}
                  </TableCell>
                  <TableCell>{enzyme.position}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 复制位置到剪贴板
                        navigator.clipboard.writeText(enzyme.position.toString());
                      }}
                    >
                      Copy
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EnzymeList;
