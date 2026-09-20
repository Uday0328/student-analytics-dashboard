import React, { useState } from 'react';
import {
  X,
  Database,
  Table,
  Layers,
  Copy,
  Check,
  Server,
  Cloud,
  ArrowRight,
  Code,
} from 'lucide-react';
import { ATHENA_OBJECTS, AthenaSchemaObject } from '../services/studentDataService';

interface AthenaQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AthenaQueryModal: React.FC<AthenaQueryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedObj, setSelectedObj] = useState<AthenaSchemaObject>(ATHENA_OBJECTS[3]); // default to student_dashboard_metrics
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQueryForObject = (obj: AthenaSchemaObject) => {
    if (obj.sqlDefinition) return obj.sqlDefinition;
    return `SELECT * FROM "student_data_lake_db"."${obj.name}" LIMIT 50;`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card athena-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="athena-logo-wrap">
              <Database size={22} />
            </div>
            <div>
              <div className="athena-title-row">
                <h2 className="modal-title">AWS Athena Architecture & Data Lake Schema</h2>
                <span className="badge badge-success font-mono">student_data_lake_db</span>
              </div>
              <p className="modal-subtitle">
                Inspect registered Athena SQL tables, analytical views, and serverless data lake pipelines.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Architecture Pipeline Banner */}
        <div className="pipeline-banner">
          <div className="pipeline-node">
            <Cloud size={16} className="node-icon text-blue" />
            <div className="node-info">
              <span className="node-name">Amazon S3</span>
              <span className="node-sub font-mono">s3://student-data-lake-bucket/raw/</span>
            </div>
          </div>
          <ArrowRight size={16} className="pipeline-arrow" />
          <div className="pipeline-node">
            <Server size={16} className="node-icon text-purple" />
            <div className="node-info">
              <span className="node-name">AWS Glue Catalog</span>
              <span className="node-sub font-mono">student_data_lake_db</span>
            </div>
          </div>
          <ArrowRight size={16} className="pipeline-arrow" />
          <div className="pipeline-node highlight-node">
            <Database size={16} className="node-icon text-emerald" />
            <div className="node-info">
              <span className="node-name">Amazon Athena</span>
              <span className="node-sub font-mono">Presto / Trino SQL Engine</span>
            </div>
          </div>
          <ArrowRight size={16} className="pipeline-arrow" />
          <div className="pipeline-node">
            <Layers size={16} className="node-icon text-cyan" />
            <div className="node-info">
              <span className="node-name">React Analytics UI</span>
              <span className="node-sub font-mono">Student Performance App</span>
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="athena-body-grid">
          {/* Object Selector Sidebar */}
          <div className="objects-sidebar">
            <span className="sidebar-heading">Data Lake Objects (5)</span>
            <div className="objects-list">
              {ATHENA_OBJECTS.map((obj) => (
                <button
                  key={obj.name}
                  className={`object-item-btn ${
                    selectedObj.name === obj.name ? 'active-obj-btn' : ''
                  }`}
                  onClick={() => setSelectedObj(obj)}
                >
                  <div className="obj-btn-left">
                    {obj.type === 'TABLE' ? (
                      <Table size={15} className="obj-type-icon text-blue" />
                    ) : (
                      <Layers size={15} className="obj-type-icon text-purple" />
                    )}
                    <span className="obj-name font-mono">{obj.name}</span>
                  </div>
                  <span className={`obj-type-badge font-mono badge-${obj.type.toLowerCase()}`}>
                    {obj.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Object Details & SQL Inspector */}
          <div className="object-inspector-panel">
            <div className="inspector-header">
              <div>
                <div className="inspector-title-row">
                  <h3 className="inspector-obj-name font-mono">{selectedObj.name}</h3>
                  <span className="badge badge-primary font-mono">{selectedObj.type}</span>
                </div>
                <p className="inspector-desc">{selectedObj.description}</p>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopy(getQueryForObject(selectedObj))}
                title="Copy Athena SQL Query"
              >
                {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            {/* SQL Query Editor Box */}
            <div className="sql-box-container">
              <div className="sql-box-header">
                <div className="sql-box-title">
                  <Code size={14} className="text-blue" />
                  <span>Athena SQL Query Definition</span>
                </div>
                <span className="sql-workgroup font-mono">Workgroup: primary</span>
              </div>
              <pre className="sql-code-block font-mono">
                <code>{getQueryForObject(selectedObj)}</code>
              </pre>
            </div>

            {/* Schema Columns Table */}
            <div className="schema-table-wrap">
              <h4 className="schema-table-title">Schema Definition & Column Types</h4>
              <table className="schema-columns-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                    <th>Description / Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedObj.columns.map((col) => (
                    <tr key={col.name}>
                      <td className="font-mono text-highlight-col">{col.name}</td>
                      <td className="font-mono text-type-col">{col.type}</td>
                      <td className="col-desc-text">{col.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="athena-status-footer">
            <span className="live-dot"></span>
            <span>Athena Database Ready • Driver: <code className="font-mono">AWS SDK for JS (v3 AthenaClient)</code></span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      <style>{`
        .athena-modal-content {
          width: 100%;
          max-width: 960px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .athena-logo-wrap {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
          color: #34d399;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .athena-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .pipeline-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-subtle);
          overflow-x: auto;
          gap: 0.75rem;
        }
        .pipeline-node {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.4rem 0.75rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }
        .highlight-node {
          border-color: var(--border-color);
          background: var(--color-primary-glow);
        }
        .node-info {
          display: flex;
          flex-direction: column;
        }
        .node-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .node-sub {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }
        .pipeline-arrow {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .athena-body-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          flex: 1;
          overflow: hidden;
        }
        @media (max-width: 800px) {
          .athena-body-grid {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }
        }
        .objects-sidebar {
          padding: 1.25rem;
          border-right: 1px solid var(--border-subtle);
          background: var(--bg-card);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .sidebar-heading {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .objects-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .object-item-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        .object-item-btn:hover {
          background: var(--bg-surface-hover);
          border-color: var(--border-subtle);
        }
        .active-obj-btn {
          background: var(--bg-surface) !important;
          border-color: var(--border-color) !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .obj-btn-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .obj-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .obj-type-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }
        .badge-table {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }
        .badge-view {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }
        .object-inspector-panel {
          padding: 1.25rem 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .inspector-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .inspector-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .inspector-obj-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .inspector-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }
        .sql-box-container {
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .sql-box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.85rem;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.75rem;
        }
        .sql-box-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .sql-workgroup {
          color: var(--text-muted);
        }
        .sql-code-block {
          padding: 0.85rem 1rem;
          font-size: 0.775rem;
          line-height: 1.6;
          color: #38bdf8;
          overflow-x: auto;
          white-space: pre-wrap;
        }
        .schema-table-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .schema-table-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .schema-columns-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .schema-columns-table th {
          background: var(--bg-surface);
          padding: 0.55rem 0.75rem;
          text-align: left;
          font-weight: 600;
          color: var(--text-muted);
          font-size: 0.725rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .schema-columns-table td {
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .text-type-col {
          color: #a78bfa;
        }
        .col-desc-text {
          color: var(--text-secondary);
        }
        .athena-status-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.775rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
