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
          padding: 1.2rem 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02);
        }
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }
        .kpi-title {
          font-size: 0.775rem;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .kpi-icon-pill {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-blue {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #BFDBFE;
        }
        .icon-emerald {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }
        .icon-purple {
          background: #F5F3FF;
          color: #7C3AED;
          border: 1px solid #DDD6FE;
        }
        .icon-amber {
          background: #FFFBEB;
          color: #D97706;
          border: 1px solid #FDE68A;
        }
        .icon-cyan {
          background: #F0FDFA;
          color: #0D9488;
          border: 1px solid #99F6E4;
        }
        .icon-rose {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FCA5A5;
        }
        .kpi-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .kpi-value {
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1.2;
          color: #1E293B;
          letter-spacing: -0.02em;
        }
        .kpi-unit {
          font-size: 0.95rem;
          font-weight: 500;
          color: #64748B;
        }
        .kpi-subtext {
          margin-top: 0.35rem;
          font-size: 0.775rem;
          display: flex;
          align-items: center;
          min-height: 1.3rem;
          color: #64748B;
        }
        .text-emerald { color: #059669; }
        .text-purple { color: #7C3AED; }
        .text-amber { color: #D97706; }
        .text-cyan { color: #0D9488; }
        .text-rose { color: #DC2626; }

        .kpi-footer-bar {
          height: 4px;
          background: #F1F5F9;
          border-radius: var(--radius-full);
          margin-top: 0.85rem;
          overflow: hidden;
        }
        .kpi-progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.4s ease;
        }
        .bg-blue { background: #3B82F6; }
        .bg-emerald { background: #10B981; }
        .bg-purple { background: #8B5CF6; }
        .bg-amber { background: #F59E0B; }
        .bg-cyan { background: #14B8A6; }
        .bg-rose { background: #EF4444; }
      `}</style>
    </section>
  );
};
