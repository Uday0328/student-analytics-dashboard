import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, SortConfig, SortField } from '../types/student';

interface StudentTableProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({ students, onSelectStudent }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'id',
    order: 'asc',
  });

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedStudents = useMemo(() => {
    const list = [...students];
    list.sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];

      if (typeof aVal === 'string') {
        return sortConfig.order === 'asc'
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      if (typeof aVal === 'number') {
        return sortConfig.order === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }

      return 0;
    });
    return list;
  }, [students, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, validCurrentPage, pageSize]);

  const renderSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown size={12} className="sort-icon-muted" />;
    }
    return sortConfig.order === 'asc' ? (
      <ArrowUp size={13} className="sort-icon-active" />
    ) : (
      <ArrowDown size={13} className="sort-icon-active" />
    );
  };

  const getPerformanceBadge = (level: Student['performance_level']) => {
    switch (level) {
      case 'High':
        return <span className="badge badge-success">High (≥15)</span>;
      case 'Medium':
        return <span className="badge badge-primary">Medium (10-14)</span>;
      case 'Low':
        return <span className="badge badge-danger">Low (&lt;10)</span>;
    }
  };

  const getRiskBadge = (level: Student['risk_level']) => {
    switch (level) {
      case 'Low Risk':
        return <span className="badge badge-success">Low Risk</span>;
      case 'Moderate Risk':
        return <span className="badge badge-warning">Moderate</span>;
      case 'High Risk':
        return <span className="badge badge-danger">High Risk</span>;
    }
  };

  const getAbsenceBadge = (group: Student['absence_group']) => {
    switch (group) {
      case 'Low (0-4)':
        return <span className="badge badge-success font-mono">{group}</span>;
      case 'Moderate (5-9)':
        return <span className="badge badge-warning font-mono">{group}</span>;
      case 'High (10+)':
        return <span className="badge badge-danger font-mono">{group}</span>;
    }
  };

  const getGradePill = (grade: number) => {
    let colorClass = 'grade-medium';
    if (grade >= 15) colorClass = 'grade-high';
    else if (grade < 10) colorClass = 'grade-low';

    return <span className={`grade-pill ${colorClass} font-mono`}>{grade}</span>;
  };

  return (
    <div className="glass-card table-wrapper">
      <div className="table-header-bar">
        <div className="table-title-group">
          <FileSpreadsheet size={18} className="table-title-icon" />
          <h2 className="table-title">Student Cohort Master Records</h2>
          <span className="badge badge-primary font-mono">
            {students.length.toLocaleString()} matching records
          </span>
        </div>

        <div className="table-controls">
          <div className="page-size-selector">
            <span className="selector-label">Show:</span>
            <select
              className="input-control input-control-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="student-data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className="sortable-th">
                <div className="th-content">
                  <span>Student ID</span>
                  {renderSortIcon('id')}
                </div>
              </th>
              <th onClick={() => handleSort('school')} className="sortable-th">
                <div className="th-content">
                  <span>School</span>
                  {renderSortIcon('school')}
                </div>
              </th>
              <th onClick={() => handleSort('sex')} className="sortable-th">
                <div className="th-content">
                  <span>Sex</span>
                  {renderSortIcon('sex')}
                </div>
              </th>
              <th onClick={() => handleSort('age')} className="sortable-th">
                <div className="th-content">
                  <span>Age</span>
                  {renderSortIcon('age')}
                </div>
              </th>
              <th onClick={() => handleSort('studytime')} className="sortable-th">
                <div className="th-content">
                  <span>Study Time</span>
                  {renderSortIcon('studytime')}
                </div>
              </th>
              <th onClick={() => handleSort('absences')} className="sortable-th">
                <div className="th-content">
                  <span>Absences</span>
                  {renderSortIcon('absences')}
                </div>
              </th>
              <th onClick={() => handleSort('G1')} className="sortable-th">
                <div className="th-content">
                  <span>G1</span>
                  {renderSortIcon('G1')}
                </div>
              </th>
              <th onClick={() => handleSort('G2')} className="sortable-th">
                <div className="th-content">
                  <span>G2</span>
                  {renderSortIcon('G2')}
                </div>
              </th>
              <th onClick={() => handleSort('G3')} className="sortable-th">
                <div className="th-content">
                  <span>G3 (Final)</span>
                  {renderSortIcon('G3')}
                </div>
              </th>
              <th onClick={() => handleSort('performance_level')} className="sortable-th">
                <div className="th-content">
                  <span>Performance</span>
                  {renderSortIcon('performance_level')}
                </div>
              </th>
              <th onClick={() => handleSort('absence_group')} className="sortable-th">
                <div className="th-content">
                  <span>Absence Group</span>
                  {renderSortIcon('absence_group')}
                </div>
              </th>
              <th onClick={() => handleSort('risk_level')} className="sortable-th">
                <div className="th-content">
                  <span>Risk Level</span>
                  {renderSortIcon('risk_level')}
                </div>
              </th>
              <th className="action-th">
                <span>Inspect</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={13} className="empty-table-cell">
                  <div className="empty-state">
                    <p>No student records match the active filter criteria.</p>
                    <span className="empty-sub">Try modifying or clearing your filters above.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="table-row-interactive"
                >
                  <td className="font-mono text-highlight-col">{student.id}</td>
                  <td>
                    <span className="school-pill">{student.school}</span>
                  </td>
                  <td>
                    <span className={`gender-tag gender-${student.sex}`}>{student.sex}</span>
                  </td>
                  <td className="font-mono">{student.age}</td>
                  <td>
                    <span className="studytime-cell font-mono">Tier {student.studytime}</span>
                  </td>
                  <td className="font-mono">{student.absences} d</td>
                  <td>{getGradePill(student.G1)}</td>
                  <td>{getGradePill(student.G2)}</td>
                  <td>
                    <div className="final-grade-wrap">{getGradePill(student.G3)}</div>
                  </td>
                  <td>{getPerformanceBadge(student.performance_level)}</td>
                  <td>{getAbsenceBadge(student.absence_group)}</td>
                  <td>{getRiskBadge(student.risk_level)}</td>
                  <td className="action-cell">
                    <button
                      className="btn-icon-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(student);
                      }}
                      title="Inspect Student Profile"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination-footer">
        <div className="pagination-info">
          Showing{' '}
          <span className="font-mono">
            {students.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-mono">
            {Math.min(validCurrentPage * pageSize, students.length)}
          </span>{' '}
          of <span className="font-mono">{students.length}</span> students
        </div>

        <div className="pagination-nav">
          <button
            className="btn btn-outline btn-sm btn-nav"
            onClick={() => setCurrentPage(1)}
            disabled={validCurrentPage === 1}
            title="First Page"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className="btn btn-outline btn-sm btn-nav"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="page-counter">
            Page <strong className="font-mono">{validCurrentPage}</strong> of{' '}
            <span className="font-mono">{totalPages}</span>
          </span>
          <button
            className="btn btn-outline btn-sm btn-nav"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="btn btn-outline btn-sm btn-nav"
            onClick={() => setCurrentPage(totalPages)}
            disabled={validCurrentPage >= totalPages}
            title="Last Page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .table-wrapper {
          padding: 1.25rem 1.4rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02);
        }
        .table-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .table-title-group {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .table-title-icon {
          color: #3B82F6;
        }
        .table-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1E293B;
          letter-spacing: -0.01em;
        }
        .table-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .page-size-selector {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8125rem;
          color: #64748B;
        }
        .input-control-sm {
          padding: 0.25rem 1.75rem 0.25rem 0.6rem;
          font-size: 0.8rem;
          background: #F8FAFC;
          border-color: #CBD5E1;
        }
        .table-scroll-container {
          overflow-x: auto;
          border: 1px solid #E2E8F0;
          border-radius: var(--radius-md);
        }
        .student-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.825rem;
        }
        .student-data-table thead {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
        }
        .student-data-table th {
          padding: 0.75rem 0.9rem;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          font-size: 0.725rem;
          letter-spacing: 0.03em;
          user-select: none;
          white-space: nowrap;
        }
        .sortable-th {
          cursor: pointer;
          transition: color var(--transition-fast);
        }
        .sortable-th:hover {
          color: #1E293B;
        }
        .th-content {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .sort-icon-muted {
          color: #94A3B8;
          opacity: 0.6;
        }
        .sort-icon-active {
          color: #2563EB;
        }
        .action-th {
          text-align: center;
        }
        .student-data-table tbody tr {
          border-bottom: 1px solid #E2E8F0;
          transition: background-color var(--transition-fast);
        }
        .table-row-interactive {
          cursor: pointer;
        }
        .table-row-interactive:hover {
          background-color: #F1F5F9;
        }
        .student-data-table td {
          padding: 0.7rem 0.9rem;
          color: #1E293B;
          white-space: nowrap;
        }
        .text-highlight-col {
          font-weight: 600;
          color: #2563EB;
        }
        .school-pill {
          padding: 0.15rem 0.45rem;
          background: #F1F5F9;
          border: 1px solid #CBD5E1;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
        }
        .gender-tag {
          font-weight: 600;
          font-size: 0.75rem;
        }
        .gender-F { color: #EC4899; }
        .gender-M { color: #2563EB; }
        .grade-pill {
          display: inline-block;
          min-width: 28px;
          text-align: center;
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .grade-high {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }
        .grade-medium {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #BFDBFE;
        }
        .grade-low {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FCA5A5;
        }
        .btn-icon-view {
          background: #F8FAFC;
          border: 1px solid #CBD5E1;
          color: #64748B;
          padding: 0.3rem 0.5rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
        }
        .btn-icon-view:hover {
          color: #2563EB;
          border-color: #93C5FD;
          background: #EFF6FF;
        }
        .action-cell {
          text-align: center;
        }
        .empty-table-cell {
          text-align: center;
          padding: 3rem 1rem;
        }
        .empty-state p {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1E293B;
        }
        .empty-sub {
          font-size: 0.8125rem;
          color: #64748B;
          margin-top: 0.25rem;
          display: block;
        }
        .table-pagination-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .pagination-info {
          font-size: 0.8125rem;
          color: #64748B;
        }
        .pagination-nav {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .btn-nav {
          padding: 0.35rem 0.55rem;
          border-color: #CBD5E1;
          background: #FFFFFF;
          color: #334155;
        }
        .btn-nav:hover:not(:disabled) {
          background: #F1F5F9;
          color: #1E293B;
        }
        .btn-nav:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .page-counter {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 0 0.5rem;
        }
      `}</style>
    </div>
  );
};
