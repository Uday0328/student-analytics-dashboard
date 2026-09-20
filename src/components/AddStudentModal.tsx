import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, AlertCircle } from 'lucide-react';
import { Student, School, Sex, PerformanceLevel, AbsenceGroup, RiskLevel, PassStatus } from '../types/student';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: Student) => void;
  existingStudents?: Student[];
  nextIdNumber?: number;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  existingStudents = [],
  nextIdNumber = 1001,
}) => {
  // Student Information
  const [id, setId] = useState<string>('');
  const [school, setSchool] = useState<School>('GP');
  const [sex, setSex] = useState<Sex>('F');
  const [age, setAge] = useState<number>(17);
  const [studytime, setStudytime] = useState<number>(2);
  const [absences, setAbsences] = useState<number>(2);

  // Academic Information
  const [failures, setFailures] = useState<number>(0);
  const [g1, setG1] = useState<number>(14);
  const [g2, setG2] = useState<number>(15);
  const [g3, setG3] = useState<number>(15);

  // Support / Activities
  const [schoolsup, setSchoolsup] = useState<'yes' | 'no'>('no');
  const [famsup, setFamsup] = useState<'yes' | 'no'>('yes');
  const [paid, setPaid] = useState<'yes' | 'no'>('no');
  const [activities, setActivities] = useState<'yes' | 'no'>('yes');
  const [higher, setHigher] = useState<'yes' | 'no'>('yes');
  const [internet, setInternet] = useState<'yes' | 'no'>('yes');

  // Social / Family / Health
  const [famrel, setFamrel] = useState<number>(4);
  const [freetime, setFreetime] = useState<number>(3);
  const [goout, setGoout] = useState<number>(3);
  const [health, setHealth] = useState<number>(4);

  // Error & Success State
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Pre-fill suggested unique Student ID when modal opens
  useEffect(() => {
    if (isOpen && !id) {
      const suggestedId = `STU-${String(nextIdNumber).padStart(4, '0')}`;
      setId(suggestedId);
    }
  }, [isOpen, nextIdNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedId = id.trim();

    // 1. Validate Student ID is present
    if (!trimmedId) {
      setError('Please enter a valid Student ID.');
      return;
    }

    // 2. Validate Student ID Uniqueness
    const exists = existingStudents.some(
      (s) => s.id.toLowerCase() === trimmedId.toLowerCase()
    );
    if (exists) {
      setError('Student ID already exists. Please enter a unique Student ID.');
      return;
    }

    // 3. Validate numeric ranges
    if (g1 < 0 || g1 > 20 || g2 < 0 || g2 > 20 || g3 < 0 || g3 > 20) {
      setError('Grades (G1, G2, G3) must be between 0 and 20.');
      return;
    }

    if (failures < 0 || failures > 3) {
      setError('Failures must be between 0 and 3.');
      return;
    }

    // 4. Derive metrics
    const absencesNum = Number(absences);
    const g3Num = Number(g3);

    let absence_group: AbsenceGroup = 'Low (0-4)';
    if (absencesNum >= 10) absence_group = 'High (10+)';
    else if (absencesNum >= 5) absence_group = 'Moderate (5-9)';

    let performance_level: PerformanceLevel = 'Medium';
    if (g3Num >= 15) performance_level = 'High';
    else if (g3Num < 10) performance_level = 'Low';

    let risk_level: RiskLevel = 'Low Risk';
    if (g3Num < 10 || absencesNum >= 10) {
      risk_level = 'High Risk';
    } else if (g3Num < 12 || absencesNum >= 5) {
      risk_level = 'Moderate Risk';
    }

    const pass_status: PassStatus = g3Num >= 10 ? 'Pass' : 'Fail';

    const newStudent: Student = {
      id: trimmedId,
      school,
      sex,
      age: Number(age),
      studytime: Number(studytime),
      failures: Number(failures),
      schoolsup,
      famsup,
      paid,
      activities,
      higher,
      internet,
      famrel: Number(famrel),
      freetime: Number(freetime),
      goout: Number(goout),
      health: Number(health),
      absences: absencesNum,
      G1: Number(g1),
      G2: Number(g2),
      G3: g3Num,
      performance_level,
      absence_group,
      risk_level,
      pass_status,
    };

    try {
      setIsSubmitting(true);
      await onAddStudent(newStudent);
      setSuccessMessage('Student record added successfully and stored in AWS Data Lake!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create student record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card add-student-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="add-student-logo-wrap">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="modal-title">Add New Student Record</h2>
              <p className="modal-subtitle">
                Enter complete student information to add a new record to the student analytics dataset.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-student-form">
          {error && (
            <div className="alert-error-box">
              <AlertCircle size={18} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-success-box">
              <Check size={18} className="alert-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="form-sections-container">
            {/* SECTION 1: STUDENT INFORMATION */}
            <div className="form-section">
              <h3 className="form-section-title">Student Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Student ID <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. STU-1002"
                    value={id}
                    onChange={(e) => {
                      setId(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">School</label>
                  <select
                    className="input-control"
                    value={school}
                    onChange={(e) => setSchool(e.target.value as School)}
                  >
                    <option value="GP">Gabriel Pereira (GP)</option>
                    <option value="MS">Mousinho da Silveira (MS)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sex</label>
                  <select
                    className="input-control"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as Sex)}
                  >
                    <option value="F">Female (F)</option>
                    <option value="M">Male (M)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    min="10"
                    max="30"
                    className="input-control"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Weekly Study Time</label>
                  <select
                    className="input-control"
                    value={studytime}
                    onChange={(e) => setStudytime(Number(e.target.value))}
                  >
                    <option value={1}>&lt; 2 hr / week</option>
                    <option value={2}>2 - 5 hr / week</option>
                    <option value={3}>5 - 10 hr / week</option>
                    <option value={4}>&gt; 10 hr / week</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">School Absences</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-control"
                    value={absences}
                    onChange={(e) => setAbsences(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: ACADEMIC INFORMATION */}
            <div className="form-section">
              <h3 className="form-section-title">Academic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Failures (0 - 3)</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    className="input-control"
                    value={failures}
                    onChange={(e) => setFailures(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">G1 Grade (0 - 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="input-control"
                    value={g1}
                    onChange={(e) => setG1(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">G2 Grade (0 - 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="input-control"
                    value={g2}
                    onChange={(e) => setG2(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">G3 Final Grade (0 - 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="input-control"
                    value={g3}
                    onChange={(e) => setG3(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: SUPPORT & ACTIVITIES */}
            <div className="form-section">
              <h3 className="form-section-title">Support &amp; Activities</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">School Support</label>
                  <select
                    className="input-control"
                    value={schoolsup}
                    onChange={(e) => setSchoolsup(e.target.value as 'yes' | 'no')}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Family Support</label>
                  <select
                    className="input-control"
                    value={famsup}
                    onChange={(e) => setFamsup(e.target.value as 'yes' | 'no')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Paid Classes</label>
                  <select
                    className="input-control"
                    value={paid}
                    onChange={(e) => setPaid(e.target.value as 'yes' | 'no')}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Activities</label>
                  <select
                    className="input-control"
                    value={activities}
                    onChange={(e) => setActivities(e.target.value as 'yes' | 'no')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Higher Education</label>
                  <select
                    className="input-control"
                    value={higher}
                    onChange={(e) => setHigher(e.target.value as 'yes' | 'no')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Internet Access</label>
                  <select
                    className="input-control"
                    value={internet}
                    onChange={(e) => setInternet(e.target.value as 'yes' | 'no')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 4: SOCIAL / FAMILY / HEALTH */}
            <div className="form-section">
              <h3 className="form-section-title">Social / Family / Health</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Family Relationship (1 - 5)</label>
                  <select
                    className="input-control"
                    value={famrel}
                    onChange={(e) => setFamrel(Number(e.target.value))}
                  >
                    <option value={1}>1 - Very Poor</option>
                    <option value={2}>2 - Poor</option>
                    <option value={3}>3 - Neutral</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Free Time (1 - 5)</label>
                  <select
                    className="input-control"
                    value={freetime}
                    onChange={(e) => setFreetime(Number(e.target.value))}
                  >
                    <option value={1}>1 - Very Low</option>
                    <option value={2}>2 - Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Very High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Going Out (1 - 5)</label>
                  <select
                    className="input-control"
                    value={goout}
                    onChange={(e) => setGoout(Number(e.target.value))}
                  >
                    <option value={1}>1 - Very Low</option>
                    <option value={2}>2 - Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Very High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Health Status (1 - 5)</label>
                  <select
                    className="input-control"
                    value={health}
                    onChange={(e) => setHealth(Number(e.target.value))}
                  >
                    <option value={1}>1 - Very Poor</option>
                    <option value={2}>2 - Poor</option>
                    <option value={3}>3 - Neutral</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Very Good</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              <Check size={16} />
              {isSubmitting ? 'Saving Record...' : 'Save Student Record'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .add-student-modal-content {
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: var(--radius-lg, 12px);
          box-shadow: var(--shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #E2E8F0;
          background: #FAFAFA;
        }
        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .add-student-logo-wrap {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          color: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1E293B;
        }
        .modal-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin-top: 0.15rem;
        }
        .btn-close {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 0.2rem;
          border-radius: 6px;
        }
        .btn-close:hover {
          color: #1E293B;
          background: #F1F5F9;
        }
        .add-student-form {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          overflow-y: auto;
          max-height: calc(90vh - 140px);
        }
        .alert-error-box {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .alert-icon {
          color: #DC2626;
          flex-shrink: 0;
        }
        .form-sections-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-section {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 1rem 1.25rem;
        }
        .form-section-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.85rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid #E2E8F0;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 580px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .form-label {
          font-size: 0.775rem;
          font-weight: 600;
          color: #475569;
        }
        .text-red {
          color: #EF4444;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #E2E8F0;
        }
      `}</style>
    </div>
  );
};

