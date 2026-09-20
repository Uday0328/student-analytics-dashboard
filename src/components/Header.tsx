import React from 'react';
import { Database, Download, Moon, Sun, Terminal, RefreshCw, UserPlus } from 'lucide-react';
import { Student } from '../types/student';

interface HeaderProps {
  students: Student[];
  totalRawCount: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAthenaModal: () => void;
  onOpenAddStudentModal: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  students,
  totalRawCount,
  isDarkMode,
  onToggleTheme,
  onOpenAthenaModal,
  onOpenAddStudentModal,
  onResetFilters,
  hasActiveFilters,
}) => {
  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = [
      'id',
      'school',
      'sex',
      'age',
      'studytime',
      'absences',
      'G1',
      'G2',
      'G3',
      'performance_level',
      'absence_group',
      'risk_level',
      'pass_status',
    ];

    const rows = students.map((s) => [
      s.id,
      s.school,
      s.sex,
      s.age,
      s.studytime,
      s.absences,
      s.G1,
      s.G2,
      s.G3,
      `"${s.performance_level}"`,
      `"${s.absence_group}"`,
      `"${s.risk_level}"`,
      s.pass_status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_analytics_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="header-root">
      <div className="header-top">
        <div className="header-brand">
          <div className="brand-icon-wrapper">
            <Database className="brand-icon" size={24} />
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">Cloud Based Student Data Lake and Analytics System</h1>
              <span className="athena-badge">
                <span className="live-dot"></span>
                Athena Data Lake
              </span>
            </div>
            <p className="brand-subtitle">
              Cloud-based student performance, risk and attendance analytics • Database:{' '}
              <code className="font-mono text-highlight">student_data_lake_db</code>
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={onOpenAddStudentModal}
            className="btn btn-primary btn-sm"
            title="Add New Student Record"
          >
            <UserPlus size={15} />
            <span>+ Add Student</span>
          </button>

          <button
            onClick={onOpenAthenaModal}
            className="btn btn-secondary btn-sm"
            title="Inspect Athena SQL Views & Tables"
          >
            <Terminal size={15} />
            <span>Athena SQL & Schema</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm"
            title="Export filtered dataset to CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="btn btn-outline btn-sm"
              title="Reset all filters"
            >
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className="btn btn-outline btn-icon"
            aria-label="Toggle dark/light theme"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <div className="header-stats-bar">
        <div className="stats-pill">
          <span className="stats-label">Active Records:</span>
          <span className="stats-value font-mono">
            {students.length.toLocaleString()} / {totalRawCount.toLocaleString()}
          </span>
        </div>
        <div className="stats-pill">
          <span className="stats-label">Athena Query Mode:</span>
          <span className="stats-value text-success font-mono">Optimized Parquet View</span>
        </div>
        <div className="stats-pill">
          <span className="stats-label">Data Lake Sync:</span>
          <span className="stats-value font-mono">Real-time / S3 Synced</span>
        </div>
      </div>

      <style>{`
        .header-root {
          margin-bottom: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          background: #0D1B1F;
          padding: 1.25rem 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid #162C34;
          box-shadow: var(--shadow-sm);
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .brand-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: #0E1E23;
          border: 1px solid #162C34;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00E5D4;
          box-shadow: 0 0 10px rgba(0, 229, 212, 0.15);
        }
        .brand-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .brand-title {
          font-size: 1.45rem;
          font-weight: 800;
          letter-spacing: -0.015em;
          color: #F1F5F9;
          line-height: 1.25;
        }
        .athena-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(0, 229, 212, 0.1);
          color: #00E5D4;
          border: 1px solid rgba(0, 229, 212, 0.3);
          padding: 0.2rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }
        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #00E5D4;
          box-shadow: 0 0 8px #00E5D4;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .brand-subtitle {
          font-size: 0.85rem;
          color: #94A3B8;
          margin-top: 0.2rem;
          font-weight: 400;
        }
        .text-highlight {
          color: #00E5D4;
          background: rgba(0, 229, 212, 0.1);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-weight: 600;
        }
        .text-success {
          color: #00E5D4;
          font-weight: 600;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .header-stats-bar {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          padding: 0.65rem 1.25rem;
          background: #091619;
          border: 1px solid #162C34;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }
        .stats-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8125rem;
        }
        .stats-label {
          color: #64748B;
          font-weight: 500;
        }
        .stats-value {
          color: #F1F5F9;
          font-weight: 600;
        }
      `}</style>
    </header>
  );
};
