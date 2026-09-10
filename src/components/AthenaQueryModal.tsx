import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Table,
  Copy,
  Check,
  Code2,
  ShieldCheck,
} from 'lucide-react';

interface AthenaQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SqlQueryItem {
  id: string;
  title: string;
  description: string;
  sql: string;
}

export const AthenaQueryModal: React.FC<AthenaQueryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'queries' | 'schema'>('queries');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sampleQueries: SqlQueryItem[] = [
    {
      id: 'query-main-table',
      title: '1. Inspect Main Analytics Cohort',
      description: 'Retrieve sample historical baseline student performance and risk evaluation records.',
      sql: `SELECT *
FROM "student_data_lake_db"."student_risk_analysis_new"
LIMIT 10;`,
    },
    {
      id: 'query-new-ingest',
      title: '2. Inspect New Student Ingest Table & S3 Path',
      description: 'Query newly added students stored as individual JSON files in S3 with partition/file path.',
      sql: `SELECT "$path", id
FROM "student_data_lake_db"."student_new_ingest"
ORDER BY id;`,
    },
    {
      id: 'query-risk-agg',
      title: '3. Risk Level Distribution & Academic Averages',
      description: 'Aggregate student cohorts across High Risk, Moderate Risk, and Low Risk categories with G3 averages.',
      sql: `SELECT 
  risk_level, 
  COUNT(*) AS total_students,
  ROUND(AVG(g1), 2) AS avg_g1,
  ROUND(AVG(g2), 2) AS avg_g2,
  ROUND(AVG(g3), 2) AS avg_final_grade,
  ROUND(AVG(absences), 2) AS avg_absences
FROM "student_data_lake_db"."student_risk_analysis_new"
GROUP BY risk_level
ORDER BY total_students DESC;`,
    },
    {
      id: 'query-school-performance',
      title: '4. School Dimensional Comparison (GP vs MS)',
      description: 'Cross-analyze performance and absenteeism between Gabriel Pereira (GP) and Mousinho da Silveira (MS).',
      sql: `SELECT 
  school,
  COUNT(*) AS total_cohort,
  ROUND(AVG(g3), 2) AS avg_g3,
  COUNT(CASE WHEN g3 >= 10 THEN 1 END) AS pass_count,
  ROUND(COUNT(CASE WHEN g3 >= 10 THEN 1 END) * 100.0 / COUNT(*), 2) AS pass_rate_pct,
  COUNT(CASE WHEN risk_level = 'High Risk' THEN 1 END) AS high_risk_count
FROM "student_data_lake_db"."student_risk_analysis_new"
GROUP BY school;`,
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="glass-card athena-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="athena-modal-header">
          <div className="athena-title-group">
            <div className="athena-logo-wrap">
              <Database size={24} className="text-emerald" />
            </div>
            <div>
              <div className="athena-title-row">
                <h2 className="athena-modal-heading">AWS Athena SQL & Data Lake Architecture</h2>
                <span className="badge badge-success font-mono">student_data_lake_db</span>
              </div>
              <p className="athena-modal-subheading">
                Serverless SQL analytics engine querying S3 data lake via AWS Glue Data Catalog.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close Athena modal">
            <X size={20} />
          </button>
        </div>

        {/* Configuration Metadata Bar */}
        <div className="athena-config-grid">
          <div className="config-item">
            <span className="config-label">DATABASE:</span>
            <div className="config-value-wrap">
              <span className="config-value font-mono">student_data_lake_db</span>
              <button
                className="config-copy-btn"
                onClick={() => handleCopy('student_data_lake_db', 'db')}
                title="Copy Database name"
              >
                {copiedId === 'db' ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div className="config-item">
            <span className="config-label">MAIN ANALYTICS TABLE:</span>
            <div className="config-value-wrap">
              <span className="config-value font-mono">student_risk_analysis_new</span>
              <button
                className="config-copy-btn"
                onClick={() => handleCopy('student_risk_analysis_new', 'main-table')}
                title="Copy Table name"
              >
                {copiedId === 'main-table' ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div className="config-item">
            <span className="config-label">NEW STUDENT INGEST TABLE:</span>
            <div className="config-value-wrap">
              <span className="config-value font-mono">student_new_ingest</span>
              <button
                className="config-copy-btn"
                onClick={() => handleCopy('student_new_ingest', 'new-table')}
                title="Copy Table name"
              >
                {copiedId === 'new-table' ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div className="config-item">
            <span className="config-label">S3 RAW NEW STUDENT LOCATION:</span>
            <div className="config-value-wrap">
              <span className="config-value font-mono">raw/new_students/</span>
              <button
                className="config-copy-btn"
                onClick={() => handleCopy('raw/new_students/', 's3-loc')}
                title="Copy S3 Prefix"
              >
                {copiedId === 's3-loc' ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div className="config-item config-item-wide">
            <span className="config-label">ATHENA OUTPUT LOCATION:</span>
            <div className="config-value-wrap">
              <span className="config-value font-mono">
                s3://student-data-lake-2026-pujith-958280224194-ap-southeast-2-an/athena-results/
              </span>
              <button
                className="config-copy-btn"
                onClick={() =>
                  handleCopy(
                    's3://student-data-lake-2026-pujith-958280224194-ap-southeast-2-an/athena-results/',
                    'output-loc'
                  )
                }
                title="Copy Output Location"
              >
                {copiedId === 'output-loc' ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* Read-Only Safety Notice Banner */}
        <div className="athena-notice-banner">
          <ShieldCheck size={18} className="text-emerald flex-shrink-0" />
          <span>
            <strong>READ-ONLY REFERENCE QUERIES:</strong> The queries below are for data inspection, schema discovery,
            and validation in AWS Athena. They perform pure SELECT operations and do not mutate or delete underlying S3
            objects.
          </span>
        </div>

        {/* Tabs navigation */}
        <div className="athena-tabs-bar">
          <button
            className={`athena-tab-btn ${activeTab === 'queries' ? 'active' : ''}`}
            onClick={() => setActiveTab('queries')}
          >
            <Code2 size={16} />
            <span>Sample SQL Queries</span>
          </button>
          <button
            className={`athena-tab-btn ${activeTab === 'schema' ? 'active' : ''}`}
            onClick={() => setActiveTab('schema')}
          >
            <Table size={16} />
            <span>Table Schema Reference</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="athena-modal-body">
          {activeTab === 'queries' ? (
            <div className="queries-list">
              {sampleQueries.map((q) => (
                <div key={q.id} className="query-card">
                  <div className="query-card-header">
                    <div>
                      <h4 className="query-card-title">{q.title}</h4>
                      <p className="query-card-desc">{q.description}</p>
                    </div>
                    <button
                      className="btn btn-outline btn-sm btn-copy-sql"
                      onClick={() => handleCopy(q.sql, q.id)}
                    >
                      {copiedId === q.id ? (
                        <>
                          <Check size={14} className="text-emerald" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="query-sql-pre">
                    <code>{q.sql}</code>
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="schema-view">
              {/* Table 1 */}
              <div className="schema-table-card">
                <div className="schema-table-header">
                  <div className="table-badge-group">
                    <Table size={18} className="text-blue" />
                    <span className="schema-table-name font-mono">student_risk_analysis_new</span>
                  </div>
                  <span className="badge badge-primary">Baseline Cohort (Parquet/CSV)</span>
                </div>
                <p className="schema-table-desc">
                  Primary historical student cohort dataset enriched with computed risk scores and categorical performance bands.
                </p>
                <div className="schema-columns-grid">
                  {[
                    { name: 'school', type: 'varchar(10)', desc: 'GP (Gabriel Pereira) or MS (Mousinho da Silveira)' },
                    { name: 'sex', type: 'varchar(2)', desc: 'Gender: F (Female) or M (Male)' },
                    { name: 'age', type: 'int', desc: 'Age of student in years (15–22)' },
                    { name: 'studytime', type: 'int', desc: 'Weekly study time: 1 (&lt;2h) to 4 (&gt;10h)' },
                    { name: 'absences', type: 'int', desc: 'Total school absences count' },
                    { name: 'g1', type: 'int', desc: 'First period grade (0–20 scale)' },
                    { name: 'g2', type: 'int', desc: 'Second period grade (0–20 scale)' },
                    { name: 'g3', type: 'int', desc: 'Final course grade (0–20 scale)' },
                    { name: 'performance_level', type: 'varchar(15)', desc: 'High (&ge;15), Medium (10–14), Low (&lt;10)' },
                    { name: 'absence_group', type: 'varchar(20)', desc: 'Low (0–4), Moderate (5–9), High (10+)' },
                    { name: 'risk_score', type: 'int', desc: 'Predictive risk metric (0–100)' },
                    { name: 'risk_level', type: 'varchar(20)', desc: 'Low Risk, Moderate Risk, High Risk' },
                  ].map((col) => (
                    <div key={col.name} className="schema-col-item">
                      <div className="schema-col-top">
                        <span className="schema-col-name font-mono">{col.name}</span>
                        <span className="schema-col-type font-mono">{col.type}</span>
                      </div>
                      <span className="schema-col-desc">{col.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table 2 */}
              <div className="schema-table-card">
                <div className="schema-table-header">
                  <div className="table-badge-group">
                    <Table size={18} className="text-purple" />
                    <span className="schema-table-name font-mono">student_new_ingest</span>
                  </div>
                  <span className="badge badge-purple">Real-time S3 Ingest (JSON)</span>
                </div>
                <p className="schema-table-desc">
                  External Athena table mapped directly over <code>s3://student-data-lake-2026-pujith-958280224194-ap-southeast-2-an/raw/new_students/</code> for newly enrolled students.
                </p>
                <div className="schema-columns-grid">
                  {[
                    { name: 'id', type: 'varchar(50)', desc: 'Unique student identifier (e.g. STU-1000, STU-1001)' },
                    { name: 'school', type: 'varchar(10)', desc: 'School code: GP or MS' },
                    { name: 'sex', type: 'varchar(2)', desc: 'Gender code: F or M' },
                    { name: 'age', type: 'int', desc: 'Age in years' },
                    { name: 'studytime', type: 'int', desc: 'Weekly study scale (1–4)' },
                    { name: 'failures', type: 'int', desc: 'Number of past class failures' },
                    { name: 'schoolsup', type: 'varchar(10)', desc: 'Extra educational support (yes/no)' },
                    { name: 'famsup', type: 'varchar(10)', desc: 'Family educational support (yes/no)' },
                    { name: 'paid', type: 'varchar(10)', desc: 'Extra paid course classes (yes/no)' },
                    { name: 'activities', type: 'varchar(10)', desc: 'Extra-curricular activities (yes/no)' },
                    { name: 'higher', type: 'varchar(10)', desc: 'Aspirations for higher education (yes/no)' },
                    { name: 'internet', type: 'varchar(10)', desc: 'Internet access at home (yes/no)' },
                    { name: 'famrel', type: 'int', desc: 'Family relationship quality (1–5)' },
                    { name: 'freetime', type: 'int', desc: 'Free time after school (1–5)' },
                    { name: 'goout', type: 'int', desc: 'Going out with friends (1–5)' },
                    { name: 'health', type: 'int', desc: 'Current health status (1–5)' },
                    { name: 'absences', type: 'int', desc: 'Number of school absences' },
                    { name: 'g1', type: 'int', desc: 'First period grade (0–20)' },
                    { name: 'g2', type: 'int', desc: 'Second period grade (0–20)' },
                    { name: 'g3', type: 'int', desc: 'Final grade (0–20)' },
                    { name: 'performance_level', type: 'varchar(15)', desc: 'High, Medium, or Low' },
                    { name: 'absence_group', type: 'varchar(20)', desc: 'Low, Moderate, or High' },
                    { name: 'risk_level', type: 'varchar(20)', desc: 'Low Risk, Moderate Risk, or High Risk' },
                    { name: 'pass_status', type: 'varchar(10)', desc: 'Pass (g3 &ge; 10) or Fail (g3 &lt; 10)' },
                  ].map((col) => (
                    <div key={col.name} className="schema-col-item">
                      <div className="schema-col-top">
                        <span className="schema-col-name font-mono">{col.name}</span>
                        <span className="schema-col-type font-mono">{col.type}</span>
                      </div>
                      <span className="schema-col-desc">{col.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="athena-modal-footer">
          <div className="footer-status-pill">
            <span className="status-indicator-dot" />
            <span>AWS Athena WorkGroup: <strong>primary</strong></span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Reference
          </button>
        </div>
      </div>

      <style>{`
        /* Self-contained modal overlay ensuring bulletproof top-level display */
        .modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(15, 23, 42, 0.5) !important;
          backdrop-filter: blur(4px) !important;
          -webkit-backdrop-filter: blur(4px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          padding: 1.25rem !important;
          animation: athenaFadeIn 0.2s ease-out;
        }

        @keyframes athenaFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .athena-modal-card {
          width: 100%;
          max-width: 980px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .athena-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }

        .athena-title-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .athena-logo-wrap {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
          border: 1px solid rgba(16, 185, 129, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .athena-title-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }

        .athena-modal-heading {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .athena-modal-subheading {
          font-size: 0.825rem;
          color: var(--text-secondary);
          margin: 0.2rem 0 0 0;
        }

        /* Config Grid */
        .athena-config-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.6rem 1.25rem;
          padding: 1rem 1.5rem;
          background: #F8FAFC;
          border-bottom: 1px solid var(--border-subtle);
        }

        @media (max-width: 768px) {
          .athena-config-grid {
            grid-template-columns: 1fr;
          }
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .config-item-wide {
          grid-column: 1 / -1;
        }

        .config-label {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .config-value-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-sm);
        }

        .config-value {
          font-size: 0.8rem;
          color: var(--color-primary-light);
          word-break: break-all;
          flex: 1;
        }

        .config-copy-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.2rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }

        .config-copy-btn:hover {
          color: var(--text-primary);
        }

        /* Notice banner */
        .athena-notice-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 1.5rem;
          background: rgba(16, 185, 129, 0.06);
          border-bottom: 1px solid rgba(16, 185, 129, 0.15);
          font-size: 0.78rem;
          color: #065F46;
          line-height: 1.4;
        }

        /* Tabs Bar */
        .athena-tabs-bar {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem 0 1.5rem;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
        }

        .athena-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .athena-tab-btn:hover {
          color: var(--text-primary);
        }

        .athena-tab-btn.active {
          color: var(--color-primary-light);
          border-bottom-color: var(--color-primary);
          background: rgba(59, 130, 246, 0.08);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        }

        /* Body & Queries */
        .athena-modal-body {
          padding: 1.25rem 1.5rem;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .queries-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .query-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .query-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.85rem 1.15rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-subtle);
        }

        .query-card-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .query-card-desc {
          font-size: 0.775rem;
          color: var(--text-secondary);
          margin: 0.2rem 0 0 0;
        }

        .btn-copy-sql {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }

        .query-sql-pre {
          margin: 0;
          padding: 1rem 1.15rem;
          background: #1E293B;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 0.82rem;
          line-height: 1.5;
          color: #93c5fd;
        }

        /* Schema View */
        .schema-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .schema-table-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .schema-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .table-badge-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .schema-table-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .schema-table-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .schema-columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.6rem;
        }

        .schema-col-item {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .schema-col-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .schema-col-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-primary-light);
        }

        .schema-col-type {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .schema-col-desc {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }

        /* Footer */
        .athena-modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1.5rem;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }

        .footer-status-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .status-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </div>
  );
};
