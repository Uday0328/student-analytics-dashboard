import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { FilterState } from '../types/student';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  filteredCount,
  totalCount,
}) => {
  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearSingle = (key: keyof FilterState) => {
    handleChange(key, key === 'searchQuery' ? '' : 'all');
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'searchQuery') return val.trim().length > 0;
    return val !== 'all';
  }).length;

  return (
    <div className="glass-card filter-container">
      <div className="filter-header-row">
        <div className="filter-title-wrap">
          <Filter size={16} className="filter-icon" />
          <span className="filter-title">Interactive Cohort Filters</span>
          {activeFiltersCount > 0 && (
            <span className="badge badge-primary font-mono">{activeFiltersCount} Active</span>
          )}
        </div>

        <div className="filter-right-actions">
          <span className="filter-results-text">
            Showing <strong className="font-mono">{filteredCount}</strong> of{' '}
            <span className="font-mono">{totalCount}</span> records
          </span>
          {activeFiltersCount > 0 && (
            <button onClick={onResetFilters} className="btn btn-outline btn-sm reset-btn">
              <RotateCcw size={13} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      <div className="filter-grid">
        {/* Search */}
        <div className="filter-field search-field">
          <label className="filter-label">Search Query</label>
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="input-control search-input"
              placeholder="Search ID, school, age..."
              value={filters.searchQuery}
              onChange={(e) => handleChange('searchQuery', e.target.value)}
            />
            {filters.searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => handleClearSingle('searchQuery')}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* School */}
        <div className="filter-field">
          <label className="filter-label">School</label>
          <select
            className="input-control"
            value={filters.school}
            onChange={(e) => handleChange('school', e.target.value)}
          >
            <option value="all">All Schools</option>
            <option value="GP">Gabriel Pereira (GP)</option>
            <option value="MS">Mousinho da Silveira (MS)</option>
          </select>
        </div>

        {/* Sex */}
        <div className="filter-field">
          <label className="filter-label">Gender (Sex)</label>
          <select
            className="input-control"
            value={filters.sex}
            onChange={(e) => handleChange('sex', e.target.value)}
          >
            <option value="all">All Genders</option>
            <option value="F">Female (F)</option>
            <option value="M">Male (M)</option>
          </select>
        </div>

        {/* Study Time */}
        <div className="filter-field">
          <label className="filter-label">Study Time</label>
          <select
            className="input-control"
            value={filters.studytime}
            onChange={(e) => handleChange('studytime', e.target.value)}
          >
            <option value="all">All Study Times</option>
            <option value="1">1: &lt; 2 Hours / week</option>
            <option value="2">2: 2 - 5 Hours / week</option>
            <option value="3">3: 5 - 10 Hours / week</option>
            <option value="4">4: &gt; 10 Hours / week</option>
          </select>
        </div>

        {/* Performance Level */}
        <div className="filter-field">
          <label className="filter-label">Performance</label>
          <select
            className="input-control"
            value={filters.performance_level}
            onChange={(e) => handleChange('performance_level', e.target.value)}
          >
            <option value="all">All Performance</option>
            <option value="High">High (G3 ≥ 15)</option>
            <option value="Medium">Medium (10 ≤ G3 &lt; 15)</option>
            <option value="Low">Low (G3 &lt; 10)</option>
          </select>
        </div>

        {/* Risk Level */}
        <div className="filter-field">
          <label className="filter-label">Risk Level</label>
          <select
            className="input-control"
            value={filters.risk_level}
            onChange={(e) => handleChange('risk_level', e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Moderate Risk">Moderate Risk</option>
            <option value="High Risk">High Risk</option>
          </select>
        </div>

        {/* Absence Group */}
        <div className="filter-field">
          <label className="filter-label">Absence Group</label>
          <select
            className="input-control"
            value={filters.absence_group}
            onChange={(e) => handleChange('absence_group', e.target.value)}
          >
            <option value="all">All Absences</option>
            <option value="Low (0-4)">Low (0 - 4 days)</option>
            <option value="Moderate (5-9)">Moderate (5 - 9 days)</option>
            <option value="High (10+)">High (10+ days)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="active-chips-row">
          <span className="chips-label">Filters Applied:</span>
          {filters.searchQuery && (
            <span className="filter-chip">
              Search: "{filters.searchQuery}"
              <X size={12} onClick={() => handleClearSingle('searchQuery')} />
            </span>
          )}
          {filters.school !== 'all' && (
            <span className="filter-chip">
              School: {filters.school}
              <X size={12} onClick={() => handleClearSingle('school')} />
            </span>
          )}
          {filters.sex !== 'all' && (
            <span className="filter-chip">
              Sex: {filters.sex}
              <X size={12} onClick={() => handleClearSingle('sex')} />
            </span>
          )}
          {filters.studytime !== 'all' && (
            <span className="filter-chip">
              Study Time: Tier {filters.studytime}
              <X size={12} onClick={() => handleClearSingle('studytime')} />
            </span>
          )}
          {filters.performance_level !== 'all' && (
            <span className="filter-chip">
              Performance: {filters.performance_level}
              <X size={12} onClick={() => handleClearSingle('performance_level')} />
            </span>
          )}
          {filters.risk_level !== 'all' && (
            <span className="filter-chip">
              Risk: {filters.risk_level}
              <X size={12} onClick={() => handleClearSingle('risk_level')} />
            </span>
          )}
          {filters.absence_group !== 'all' && (
            <span className="filter-chip">
              Absences: {filters.absence_group}
              <X size={12} onClick={() => handleClearSingle('absence_group')} />
            </span>
          )}
        </div>
      )}

      <style>{`
        .filter-container {
          padding: 1.15rem 1.4rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          background: #0D1B1F;
          border: 1px solid #162C34;
          box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.4);
        }
        .filter-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .filter-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .filter-icon {
          color: #00E5D4;
        }
        .filter-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #F1F5F9;
          letter-spacing: -0.01em;
        }
        .filter-right-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .filter-results-text {
          font-size: 0.8125rem;
          color: #94A3B8;
        }
        .filter-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(6, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 1300px) {
          .filter-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .search-field {
            grid-column: span 4;
          }
        }
        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .search-field {
            grid-column: span 2;
          }
        }
        @media (max-width: 480px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
          .search-field {
            grid-column: span 1;
          }
        }
        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .filter-label {
          font-size: 0.725rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: #64748B;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding-left: 2.2rem;
          padding-right: 2rem;
          background: #071114;
          border-color: #162C34;
        }
        .clear-search-btn {
          position: absolute;
          right: 0.6rem;
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.2rem;
        }
        .clear-search-btn:hover {
          color: #00E5D4;
        }
        .active-chips-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding-top: 0.6rem;
          border-top: 1px dashed #162C34;
        }
        .chips-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94A3B8;
        }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.65rem;
          background: rgba(0, 229, 212, 0.1);
          border: 1px solid rgba(0, 229, 212, 0.3);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          color: #00E5D4;
        }
        .filter-chip svg {
          cursor: pointer;
          color: #00E5D4;
          transition: color var(--transition-fast);
        }
        .filter-chip svg:hover {
          color: #EF4444;
        }
      `}</style>
    </div>
  );
};
