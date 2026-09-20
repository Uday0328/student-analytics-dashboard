import React from 'react';
import { Database, Download, Moon, Sun, Terminal, RefreshCw } from 'lucide-react';
import { Student } from '../types/student';

interface HeaderProps {
  students: Student[];
  totalRawCount: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAthenaModal: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  students,
  totalRawCount,
  isDarkMode,
  onToggleTheme,
  onOpenAthenaModal,
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
              <h1 className="brand-title">Student Performance Analytics</h1>
              <span className="athena-badge">
                <span className="live-dot"></span>
                Athena Data Lake
              </span>
            </div>
            <p className="brand-subtitle">
              Enterprise academic intelligence & predictive risk modeling • Database:{' '}
              <code className="font-mono text-highlight">student_data_lake_db</code>
            </p>
          </div>
        </div>

        <div className="header-actions">
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
          gap: 1rem;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
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
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary-light);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
        }
        .brand-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .brand-title {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }
        .athena-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .brand-subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: 0.2rem;
        }
        .text-highlight {
          color: var(--color-primary-light);
          background: rgba(59, 130, 246, 0.1);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }
        .text-success {
          color: #34d399;
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
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 0.6rem 1rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .stats-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8125rem;
        }
        .stats-label {
          color: var(--text-muted);
        }
        .stats-value {
          color: var(--text-primary);
          font-weight: 600;
        }
      `}</style>
    </header>
  );
};
