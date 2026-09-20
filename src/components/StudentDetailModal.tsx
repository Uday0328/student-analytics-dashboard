import React from 'react';
import {
  X,
  User,
  Activity,
  Clock,
  Home,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types/student';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
}) => {
  if (!student) return null;

  const g3DiffG1 = student.G3 - student.G1;
  const isPass = student.G3 >= 10;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-avatar">
              <User size={22} />
            </div>
            <div>
              <div className="modal-title-row">
                <h2 className="modal-title font-mono">{student.id}</h2>
                <span className="school-pill">{student.school === 'GP' ? 'Gabriel Pereira' : 'Mousinho da Silveira'}</span>
                <span className={`gender-tag gender-${student.sex}`}>
                  {student.sex === 'F' ? 'Female' : 'Male'}, {student.age} yrs
                </span>
              </div>
              <p className="modal-subtitle">
                Student Data Lake Profile • Athena Record ID: <span className="font-mono">{student.id}</span>
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-scroll-body">
          {/* Top Academic Highlights */}
          <div className="academic-highlight-grid">
            <div className="highlight-box">
              <span className="highlight-label">Period 1 (G1)</span>
              <span className="highlight-score font-mono">{student.G1} / 20</span>
              <span className="highlight-meta">Baseline assessment</span>
            </div>
            <div className="highlight-box">
              <span className="highlight-label">Period 2 (G2)</span>
              <span className="highlight-score font-mono">{student.G2} / 20</span>
              <span className="highlight-meta">Midterm evaluation</span>
            </div>
            <div className="highlight-box primary-box">
              <span className="highlight-label">Final Grade (G3)</span>
              <span className="highlight-score font-mono text-highlight-lg">{student.G3} / 20</span>
              <span className="highlight-meta">
                {g3DiffG1 >= 0 ? `+${g3DiffG1}` : g3DiffG1} pts vs G1
              </span>
            </div>
            <div className="highlight-box">
              <span className="highlight-label">Outcome Status</span>
              <span
                className={`status-pill ${isPass ? 'status-pass' : 'status-fail'} font-mono`}
              >
                {isPass ? 'PASSED' : 'FAILED'}
              </span>
              <span className="highlight-meta">
                Tier: {student.performance_level}
              </span>
            </div>
          </div>

          {/* Key Factor Sections */}
          <div className="modal-sections-grid">
            {/* Academic Behavior & Attendance */}
            <div className="modal-section-card">
              <div className="section-header">
                <Clock size={16} className="section-icon text-blue" />
                <h3 className="section-title">Academic & Attendance Profile</h3>
              </div>
              <div className="details-list">
                <div className="detail-item">
                  <span className="detail-key">Weekly Study Time:</span>
                  <span className="detail-value font-mono">
                    Tier {student.studytime}{' '}
                    {student.studytime === 1
                      ? '(< 2h/wk)'
                      : student.studytime === 2
                      ? '(2-5h/wk)'
                      : student.studytime === 3
                      ? '(5-10h/wk)'
                      : '(>10h/wk)'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-key">Total Absences:</span>
                  <span className="detail-value font-mono">
                    {student.absences} days ({student.absence_group})
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-key">Past Class Failures:</span>
                  <span className="detail-value font-mono">{student.failures}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-key">Wants Higher Education:</span>
                  <span className="detail-value font-mono capitalize">
                    {student.higher === 'yes' ? 'Yes (Aspirant)' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Support & Environment */}
            <div className="modal-section-card">
              <div className="section-header">
                <Home size={16} className="section-icon text-purple" />
                <h3 className="section-title">Support & Environment</h3>
              </div>
              <div className="details-list">
                <div className="detail-item">
                  <span className="detail-key">School Educational Support:</span>
                  <span className="detail-value font-mono uppercase">{student.schoolsup}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-key">Family Educational Support:</span>
                  <span className="detail-value font-mono uppercase">{student.famsup}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-key">Extra Paid Classes:</span>
                  <span className="detail-value font-mono uppercase">{student.paid}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-key">Home Internet Access:</span>
                  <span className="detail-value font-mono uppercase">{student.internet}</span>
                </div>
              </div>
            </div>

            {/* Social & Behavioral Indicators */}
            <div className="modal-section-card">
              <div className="section-header">
                <Activity size={16} className="section-icon text-amber" />
                <h3 className="section-title">Social & Health Factors (1-5)</h3>
              </div>
              <div className="rating-grid">
                <div className="rating-item">
                  <span className="rating-label">Family Relationship</span>
                  <div className="rating-bar-wrap">
                    <div
                      className="rating-bar-fill bg-blue"
                      style={{ width: `${(student.famrel / 5) * 100}%` }}
                    />
                  </div>
                  <span className="rating-num font-mono">{student.famrel}/5</span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">Free Time</span>
                  <div className="rating-bar-wrap">
                    <div
                      className="rating-bar-fill bg-purple"
                      style={{ width: `${(student.freetime / 5) * 100}%` }}
                    />
                  </div>
                  <span className="rating-num font-mono">{student.freetime}/5</span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">Going Out with Friends</span>
                  <div className="rating-bar-wrap">
                    <div
                      className="rating-bar-fill bg-amber"
                      style={{ width: `${(student.goout / 5) * 100}%` }}
                    />
                  </div>
                  <span className="rating-num font-mono">{student.goout}/5</span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">Current Health Status</span>
                  <div
                    className="rating-bar-wrap"
                  >
                    <div
                      className="rating-bar-fill bg-emerald"
                      style={{ width: `${(student.health / 5) * 100}%` }}
                    />
                  </div>
                  <span className="rating-num font-mono">{student.health}/5</span>
                </div>
              </div>
            </div>

            {/* Risk & Intervention Action Plan */}
            <div className="modal-section-card intervention-card">
              <div className="section-header">
                <Sparkles size={16} className="section-icon text-cyan" />
                <h3 className="section-title">Athena Risk & Recommendation Engine</h3>
              </div>
              <div className="risk-summary-box">
                <div className="risk-tag-row">
                  <span className="risk-label">Assigned Risk Tier:</span>
                  <span
                    className={`badge ${
                      student.risk_level === 'High Risk'
                        ? 'badge-danger'
                        : student.risk_level === 'Moderate Risk'
                        ? 'badge-warning'
                        : 'badge-success'
                    } font-mono`}
                  >
                    {student.risk_level}
                  </span>
                </div>
                <div className="intervention-text">
                  {student.risk_level === 'High Risk' ? (
                    <p>
                      <strong>High Risk Alert:</strong> Final score ({student.G3}/20) is below the passing threshold with {student.absences} absences and Tier {student.studytime} study time. Recommended action: Immediate academic counseling, remedial tutoring modules, and parent-teacher alignment.
                    </p>
                  ) : student.risk_level === 'Moderate Risk' ? (
                    <p>
                      <strong>Moderate Risk Advisory:</strong> Student maintains a borderline grade ({student.G3}/20). Recommended action: Proactive study hour enhancement and attendance monitoring to prevent grade slippage.
                    </p>
                  ) : (
                    <p>
                      <strong>Excellence Trajectory:</strong> Student demonstrates solid academic mastery ({student.G3}/20) and consistent attendance habits. Candidate for advanced placement and leadership initiatives.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="footer-db-text">
            Source: <code className="font-mono">student_data_lake_db.student_analytics</code>
          </span>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close Profile
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 8, 16, 0.78);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          width: 100%;
          max-width: 820px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }
        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .modal-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--color-primary-glow);
          color: var(--color-primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
        }
        .modal-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .modal-subtitle {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin-top: 0.2rem;
        }
        .btn-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.4rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          transition: all var(--transition-fast);
        }
        .btn-close:hover {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
        }
        .modal-scroll-body {
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .academic-highlight-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 650px) {
          .academic-highlight-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .highlight-box {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
        }
        .primary-box {
          border-color: var(--border-color);
          background: var(--color-primary-glow);
        }
        .highlight-label {
          font-size: 0.725rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .highlight-score {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0.25rem 0;
        }
        .text-highlight-lg {
          color: var(--color-primary-light);
        }
        .highlight-meta {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }
        .status-pill {
          display: inline-block;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          margin: 0.25rem 0;
        }
        .status-pass {
          color: #34d399;
          background: rgba(16, 185, 129, 0.15);
        }
        .status-fail {
          color: #fb7185;
          background: rgba(244, 63, 94, 0.15);
        }
        .modal-sections-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 700px) {
          .modal-sections-grid {
            grid-template-columns: 1fr;
          }
        }
        .modal-section-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.1rem;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 0.5rem;
        }
        .section-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .details-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
        }
        .detail-key {
          color: var(--text-secondary);
        }
        .detail-value {
          color: var(--text-primary);
          font-weight: 600;
        }
        .rating-grid {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .rating-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          font-size: 0.775rem;
        }
        .rating-label {
          width: 140px;
          color: var(--text-secondary);
        }
        .rating-bar-wrap {
          flex: 1;
          height: 6px;
          background: var(--border-subtle);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .rating-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
        }
        .rating-num {
          color: var(--text-primary);
          font-weight: 600;
          width: 32px;
          text-align: right;
        }
        .intervention-card {
          grid-column: span 2;
        }
        @media (max-width: 700px) {
          .intervention-card {
            grid-column: span 1;
          }
        }
        .risk-summary-box {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .risk-tag-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .risk-label {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        .intervention-text {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
          background: var(--bg-surface);
          padding: 0.75rem 0.9rem;
          border-radius: var(--radius-md);
          border-left: 3px solid var(--color-primary);
        }
        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }
        .footer-db-text {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
