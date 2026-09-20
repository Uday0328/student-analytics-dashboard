import React from 'react';
import {
  Users,
  CheckCircle2,
  Award,
  CalendarX2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { DashboardMetrics } from '../types/student';

interface KPISectionProps {
  metrics: DashboardMetrics;
  totalDatasetCount: number;
}

export const KPISection: React.FC<KPISectionProps> = ({ metrics, totalDatasetCount }) => {
  const isFiltered = metrics.totalStudents !== totalDatasetCount;

  return (
    <section className="kpi-grid">
      {/* Total Students */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Total Students</span>
          <div className="kpi-icon-pill icon-blue">
            <Users size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono">{metrics.totalStudents.toLocaleString()}</div>
          <div className="kpi-subtext">
            {isFiltered ? (
              <span className="badge badge-primary font-mono">
                {((metrics.totalStudents / totalDatasetCount) * 100).toFixed(1)}% of cohort
              </span>
            ) : (
              <span className="text-secondary">Complete cohort dataset</span>
            )}
          </div>
        </div>
        <div className="kpi-footer-bar">
          <div
            className="kpi-progress-fill bg-blue"
            style={{ width: `${(metrics.totalStudents / totalDatasetCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Pass Rate */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Pass Rate</span>
          <div className="kpi-icon-pill icon-emerald">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-emerald">
            {metrics.passRate.toFixed(1)}%
          </div>
          <div className="kpi-subtext">
            <span className="font-mono text-muted">
              {metrics.passCount} pass / {metrics.failCount} fail
            </span>
          </div>
        </div>
        <div className="kpi-footer-bar">
          <div
            className="kpi-progress-fill bg-emerald"
            style={{ width: `${metrics.passRate}%` }}
          />
        </div>
      </div>

      {/* Average Final Grade (G3) */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Average G3 (Final)</span>
          <div className="kpi-icon-pill icon-purple">
            <Award size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-purple">
            {metrics.avgG3.toFixed(2)}{' '}
            <span className="kpi-unit font-mono">/ 20</span>
          </div>
          <div className="kpi-subtext font-mono text-muted">
            G1: {metrics.avgG1.toFixed(2)} | G2: {metrics.avgG2.toFixed(2)}
          </div>
        </div>
        <div className="kpi-footer-bar">
          <div
            className="kpi-progress-fill bg-purple"
            style={{ width: `${(metrics.avgG3 / 20) * 100}%` }}
          />
        </div>
      </div>

      {/* Average Absences */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Average Absences</span>
          <div className="kpi-icon-pill icon-amber">
            <CalendarX2 size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-amber">
            {metrics.avgAbsences.toFixed(2)}{' '}
            <span className="kpi-unit">days</span>
          </div>
          <div className="kpi-subtext">
            <span className="font-mono text-muted">
              Avg study time: {metrics.avgStudyTime.toFixed(2)} / 4
            </span>
          </div>
        </div>
        <div className="kpi-footer-bar">
          <div
            className="kpi-progress-fill bg-amber"
            style={{ width: `${Math.min(100, (metrics.avgAbsences / 20) * 100)}%` }}
          />
        </div>
      </div>

      {/* High Performers */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">High Performers</span>
          <div className="kpi-icon-pill icon-cyan">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-cyan">
            {metrics.highPerformers.toLocaleString()}
          </div>
          <div className="kpi-subtext">
            <span className="badge badge-success font-mono">
              Grade G3 ≥ 15 (
              {metrics.totalStudents > 0
                ? ((metrics.highPerformers / metrics.totalStudents) * 100).toFixed(1)
                : 0}
              %)
            </span>
          </div>
        </div>
        <div className="kpi-footer-bar">
          <div
            className="kpi-progress-fill bg-cyan"
            style={{
              width: `${
                metrics.totalStudents > 0
                  ? (metrics.highPerformers / metrics.totalStudents) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* At-Risk Students */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">At-Risk Students</span>
          <div className="kpi-icon-pill icon-rose">
            <AlertTriangle size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-rose">
            {metrics.atRiskCount.toLocaleString()}
          </div>
          <div className="kpi-subtext">
            <span className="badge badge-danger font-mono">
              {metrics.totalStudents > 0
                ? ((metrics.atRiskCount / metrics.totalStudents) * 100).toFixed(1)
                : 0}
              % fail or high risk
            </span>
          </div>
        </div>
        <div className="kpi-footer-bar">
          <div
            className="kpi-progress-fill bg-rose"
            style={{
              width: `${
                metrics.totalStudents > 0
                  ? (metrics.atRiskCount / metrics.totalStudents) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 1400px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }
        .kpi-card {
          padding: 1.15rem 1.25rem 0.9rem;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }
        .kpi-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .kpi-icon-pill {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-blue {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }
        .icon-emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }
        .icon-purple {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }
        .icon-amber {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }
        .icon-cyan {
          background: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
        }
        .icon-rose {
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
        }
        .kpi-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .kpi-value {
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--text-primary);
        }
        .kpi-unit {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        .kpi-subtext {
          margin-top: 0.35rem;
          font-size: 0.775rem;
          display: flex;
          align-items: center;
          min-height: 1.3rem;
        }
        .text-emerald { color: #10b981; }
        .text-purple { color: #a78bfa; }
        .text-amber { color: #f59e0b; }
        .text-cyan { color: #06b6d4; }
        .text-rose { color: #f43f5e; }

        .kpi-footer-bar {
          height: 3px;
          background: var(--border-subtle);
          border-radius: var(--radius-full);
          margin-top: 0.85rem;
          overflow: hidden;
        }
        .kpi-progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.4s ease;
        }
        .bg-blue { background: #3b82f6; }
        .bg-emerald { background: #10b981; }
        .bg-purple { background: #8b5cf6; }
        .bg-amber { background: #f59e0b; }
        .bg-cyan { background: #06b6d4; }
        .bg-rose { background: #f43f5e; }
      `}</style>
    </section>
  );
};
