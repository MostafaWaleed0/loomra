import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, Filter, X, LayoutGrid, List, ArrowUp, ArrowDown } from 'lucide-react';

export type SortField = 'priority' | 'deadline' | 'progress' | 'status' | 'title' | 'createdAt' | 'updatedAt';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface GoalFilterBarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // Filters
  statusFilter: string;
  onStatusChange: (status: string) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;

  // Sort
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;

  // View
  goalView: string;
  onGoalViewChange: (view: string) => void;

  // Count for badge
  totalCount?: number;
  filteredCount?: number;
}

const statusOptions = [
  { value: 'all', label: 'All Status', count: 0 },
  { value: 'active', label: 'Active', count: 0 },
  { value: 'completed', label: 'Completed', count: 0 },
  { value: 'paused', label: 'Paused', count: 0 },
  { value: 'overdue', label: 'Overdue', count: 0 }
];

const priorityOptions = [
  { value: 'all', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'priority', label: 'Priority' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'progress', label: 'Progress' },
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Name' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' }
];

export function GoalFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sortConfig,
  onSortChange,
  goalView,
  onGoalViewChange,
  totalCount,
  filteredCount
}: GoalFilterBarProps) {
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery.length > 0;

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onPriorityChange('all');
  };

  const toggleDirection = () => {
    onSortChange({
      ...sortConfig,
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSortFieldChange = (field: string) => {
    onSortChange({
      field: field as SortField,
      direction: sortConfig.direction
    });
  };

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortConfig.field)?.label || 'Sort';
  const DirectionIcon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Filters & Sort Group */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="size-4 mr-2" />
                {statusFilter === 'all' ? 'Status' : statusOptions.find((s) => s.value === statusFilter)?.label}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-2 px-1 min-w-5 h-5">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={onStatusChange}>
                {statusOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                {priorityFilter === 'all' ? 'Priority' : priorityOptions.find((p) => p.value === priorityFilter)?.label}
                {priorityFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-2 px-1 min-w-5 h-5">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={priorityFilter} onValueChange={onPriorityChange}>
                {priorityOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-border" />

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <ArrowUpDown className="size-4 mr-2" />
                {currentSortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortConfig.field} onValueChange={handleSortFieldChange}>
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Direction */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={toggleDirection}
            title={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
          >
            <DirectionIcon className="size-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={goalView === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 rounded-r-none"
              onClick={() => onGoalViewChange('grid')}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={goalView === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 rounded-l-none"
              onClick={() => onGoalViewChange('list')}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X className="size-3 cursor-pointer hover:text-destructive" onClick={() => onSearchChange('')} />
            </Badge>
          )}

          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find((s) => s.value === statusFilter)?.label}
              <X className="size-3 cursor-pointer hover:text-destructive" onClick={() => onStatusChange('all')} />
            </Badge>
          )}

          {priorityFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Priority: {priorityOptions.find((p) => p.value === priorityFilter)?.label}
              <X className="size-3 cursor-pointer hover:text-destructive" onClick={() => onPriorityChange('all')} />
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs">
            Clear all
          </Button>

          {filteredCount !== undefined && totalCount !== undefined && (
            <span className="text-sm text-muted-foreground ml-auto">
              Showing {filteredCount} of {totalCount} goals
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Sorting utility function
export function sortGoals<
  T extends {
    id: string;
    title: string;
    priority?: 'low' | 'medium' | 'high';
    deadline?: string;
    progress?: number;
    status?: 'active' | 'completed' | 'paused';
    createdAt?: string;
    updatedAt?: string;
  }
>(goals: T[], sortConfig: SortConfig): T[] {
  const { field, direction } = sortConfig;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...goals].sort((a, b) => {
    let compareResult = 0;

    switch (field) {
      case 'title':
        compareResult = a.title.localeCompare(b.title);
        break;

      case 'priority': {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        compareResult = aPriority - bPriority;
        break;
      }

      case 'deadline': {
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        compareResult = aDeadline - bDeadline;
        break;
      }

      case 'progress': {
        const aProgress = a.progress || 0;
        const bProgress = b.progress || 0;
        compareResult = aProgress - bProgress;
        break;
      }

      case 'status': {
        const statusOrder = { active: 1, paused: 2, completed: 3 };
        const aStatus = statusOrder[a.status || 'active'];
        const bStatus = statusOrder[b.status || 'active'];
        compareResult = aStatus - bStatus;
        break;
      }

      case 'createdAt': {
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        compareResult = aCreated - bCreated;
        break;
      }

      case 'updatedAt': {
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        compareResult = aUpdated - bUpdated;
        break;
      }
    }

    return compareResult * multiplier;
  });
}
