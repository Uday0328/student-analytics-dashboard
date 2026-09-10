import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  UserPlus,
  GraduationCap,
  Sparkles,
  BookOpen,
  Heart,
  School as SchoolIcon,
  AlertTriangle,
} from 'lucide-react';
import { Student, School, Sex } from '../types/student';
import { createStudentRecord, NewStudentInput } from '../data/mockStudentData';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: Student) => Promise<void> | void;
  existingStudents: Student[];
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  existingStudents,
}) => {
  // Generate a suggested new unique ID (e.g. STU-1002)
  const defaultId = useMemo(() => {
    let maxNum = existingStudents.length;
    existingStudents.forEach((s) => {
      const match = s.id.match(/^STU-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `STU-${String(maxNum + 1).padStart(4, '0')}`;
  }, [existingStudents]);

  const [formData, setFormData] = useState<NewStudentInput>({
    id: defaultId,
    school: 'GP',
    sex: 'F',
    age: 17,
    studytime: 2,
    failures: 0,
    schoolsup: 'no',
    famsup: 'yes',
    paid: 'no',
    activities: 'yes',
    higher: 'yes',
    internet: 'yes',
    famrel: 4,
    freetime: 3,
    goout: 3,
    health: 4,
    absences: 4,
    G1: 12,
    G2: 12,
    G3: 12,
  });

  // Update defaultId whenever modal opens or existingStudents changes
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        id: `STU-${String(existingStudents.length + 1).padStart(4, '0')}`,
      }));
      setErrors({});
    }
  }, [isOpen, existingStudents.length]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-calculated preview record based on current form values
  const previewStudent = useMemo(() => {
    try {
      return createStudentRecord(formData);
    } catch {
      return null;
    }
  }, [formData]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Student ID validation
    if (!formData.id || !formData.id.trim()) {
      errs.id = 'Student ID is required';
    } else {
      const trimmedId = formData.id.trim().toUpperCase();
      const duplicate = existingStudents.some(
        (s) => s.id.toUpperCase() === trimmedId
      );
      if (duplicate) {
        errs.id = `Student ID '${formData.id}' already exists. Please choose a unique ID.`;
      }
    }

    // 2. Age validation
    if (isNaN(formData.age) || formData.age < 15 || formData.age > 25) {
      errs.age = 'Age must be between 15 and 25';
    }

    // 3. Grades validation (0-20)
    if (isNaN(formData.G1) || formData.G1 < 0 || formData.G1 > 20) {
      errs.G1 = 'G1 grade must be between 0 and 20';
    }
    if (isNaN(formData.G2) || formData.G2 < 0 || formData.G2 > 20) {
      errs.G2 = 'G2 grade must be between 0 and 20';
    }
    if (isNaN(formData.G3) || formData.G3 < 0 || formData.G3 > 20) {
      errs.G3 = 'G3 final grade must be between 0 and 20';
    }

    // 4. Absences validation (>= 0)
    if (isNaN(formData.absences) || formData.absences < 0 || formData.absences > 100) {
      errs.absences = 'Absences must be between 0 and 100';
    }

    // 5. Failures validation (0-4)
    if (isNaN(formData.failures) || formData.failures < 0 || formData.failures > 4) {
      errs.failures = 'Past failures must be between 0 and 4';
    }

    // 6. Rating fields (1-5)
    ['famrel', 'freetime', 'goout', 'health'].forEach((key) => {
      const val = (formData as any)[key];
      if (isNaN(val) || val < 1 || val > 5) {
        errs[key] = 'Rating must be between 1 and 5';
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) {
      console.warn('[AddStudentModal] Form validation failed. Errors:', errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const newStudent = createStudentRecord({
        ...formData,
        id: formData.id.trim().toUpperCase(),
      });
      console.log('[AddStudentModal] Submitting new student:', newStudent.id);
      await onAddStudent(newStudent);
      onClose();
    } catch (err: any) {
      console.error('[AddStudentModal] Failed to persist student:', err);
      setSubmitError(err?.message || 'Could not persist student record to AWS storage.');
      // Keep modal open so the user sees the error notification and doesn't lose form data
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-student-modal-title"
    >
      <div
        className="glass-card add-student-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-pill icon-primary">
              <UserPlus size={22} />
            </div>
            <div>
              <div className="modal-title-row">
                <h2 id="add-student-modal-title" className="modal-title">
                  Add New Student Record
                </h2>
                <span className="badge badge-primary font-mono">Enrollment</span>
              </div>
              <p className="modal-subtitle">
                Enroll a new student and automatically compute risk classification & performance metrics.
              </p>
            </div>
          </div>
          <button
            className="btn-close"
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="add-student-form" onSubmit={handleSubmit} className="add-student-form-wrapper">
          <div className="modal-scroll-body">
            {submitError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                }}
              >
                <AlertTriangle size={18} />
                <span>{submitError}</span>
              </div>
            )}
            {/* Real-Time Classification Preview Card */}
            {previewStudent && (
              <div className="preview-classification-card">
                <div className="preview-header">
                  <Sparkles size={16} className="text-amber" />
                  <span className="preview-title">Real-Time Classification Preview</span>
                </div>
                <div className="preview-pills">
                  <div className="preview-pill">
                    <span className="preview-label">Performance:</span>
                    <span
                      className={`badge badge-${
                        previewStudent.performance_level === 'High'
                          ? 'success'
                          : previewStudent.performance_level === 'Medium'
                          ? 'warning'
                          : 'danger'
                      }`}
                    >
                      {previewStudent.performance_level}
                    </span>
                  </div>
                  <div className="preview-pill">
                    <span className="preview-label">Risk Tier:</span>
                    <span
                      className={`badge badge-${
                        previewStudent.risk_level === 'Low Risk'
                          ? 'success'
                          : previewStudent.risk_level === 'Moderate Risk'
                          ? 'warning'
                          : 'danger'
                      }`}
                    >
                      {previewStudent.risk_level}
                    </span>
                  </div>
                  <div className="preview-pill">
                    <span className="preview-label">Absence Group:</span>
                    <span className="badge badge-neutral">
                      {previewStudent.absence_group}
                    </span>
                  </div>
                  <div className="preview-pill">
                    <span className="preview-label">Outcome:</span>
                    <span
                      className={`badge badge-${
                        previewStudent.pass_status === 'Pass' ? 'success' : 'danger'
                      }`}
                    >
                      {previewStudent.pass_status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Demographics & Institution */}
            <div className="form-section">
              <h3 className="section-title">
                <SchoolIcon size={16} className="text-blue" /> Demographics & Institution
              </h3>
              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="add-student-id" className="form-label">
                    Student ID <span className="required">*</span>
                  </label>
                  <input
                    id="add-student-id"
                    type="text"
                    className={`input-control font-mono ${errors.id ? 'input-error' : ''}`}
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    placeholder="e.g. STU-1045"
                  />
                  {errors.id && <span className="error-text">{errors.id}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="add-school" className="form-label">
                    School <span className="required">*</span>
                  </label>
                  <select
                    id="add-school"
                    className="input-control"
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value as School })
                    }
                  >
                    <option value="GP">GP (Gabriel Pereira)</option>
                    <option value="MS">MS (Mousinho da Silveira)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-sex" className="form-label">
                    Sex <span className="required">*</span>
                  </label>
                  <select
                    id="add-sex"
                    className="input-control"
                    value={formData.sex}
                    onChange={(e) =>
                      setFormData({ ...formData, sex: e.target.value as Sex })
                    }
                  >
                    <option value="F">Female (F)</option>
                    <option value="M">Male (M)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="add-age" className="form-label">
                    Age (15–25) <span className="required">*</span>
                  </label>
                  <input
                    id="add-age"
                    type="number"
                    min={15}
                    max={25}
                    className={`input-control ${errors.age ? 'input-error' : ''}`}
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                  {errors.age && <span className="error-text">{errors.age}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="add-studytime" className="form-label">
                    Weekly Study Time <span className="required">*</span>
                  </label>
                  <select
                    id="add-studytime"
                    className="input-control"
                    value={formData.studytime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        studytime: parseInt(e.target.value, 10),
                      })
                    }
                  >
                    <option value={1}>1: &lt; 2 hours/week</option>
                    <option value={2}>2: 2 – 5 hours/week</option>
                    <option value={3}>3: 5 – 10 hours/week</option>
                    <option value={4}>4: &gt; 10 hours/week</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-failures" className="form-label">
                    Past Class Failures (0–4)
                  </label>
                  <input
                    id="add-failures"
                    type="number"
                    min={0}
                    max={4}
                    className={`input-control ${errors.failures ? 'input-error' : ''}`}
                    value={formData.failures}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        failures: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                  {errors.failures && (
                    <span className="error-text">{errors.failures}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Academic Grades & Attendance */}
            <div className="form-section">
              <h3 className="section-title">
                <GraduationCap size={16} className="text-emerald" /> Academic Performance & Attendance
              </h3>
              <div className="form-grid-4">
                <div className="form-group">
                  <label htmlFor="add-g1" className="form-label">
                    Period 1 Grade (G1) <span className="required">*</span>
                  </label>
                  <input
                    id="add-g1"
                    type="number"
                    min={0}
                    max={20}
                    className={`input-control font-mono ${errors.G1 ? 'input-error' : ''}`}
                    value={formData.G1}
                    onChange={(e) =>
                      setFormData({ ...formData, G1: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                  <span className="field-hint">Scale: 0 – 20</span>
                  {errors.G1 && <span className="error-text">{errors.G1}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="add-g2" className="form-label">
                    Period 2 Grade (G2) <span className="required">*</span>
                  </label>
                  <input
                    id="add-g2"
                    type="number"
                    min={0}
                    max={20}
                    className={`input-control font-mono ${errors.G2 ? 'input-error' : ''}`}
                    value={formData.G2}
                    onChange={(e) =>
                      setFormData({ ...formData, G2: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                  <span className="field-hint">Scale: 0 – 20</span>
                  {errors.G2 && <span className="error-text">{errors.G2}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="add-g3" className="form-label">
                    Final Grade (G3) <span className="required">*</span>
                  </label>
                  <input
                    id="add-g3"
                    type="number"
                    min={0}
                    max={20}
                    className={`input-control font-mono ${errors.G3 ? 'input-error' : ''}`}
                    value={formData.G3}
                    onChange={(e) =>
                      setFormData({ ...formData, G3: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                  <span className="field-hint">Pass &ge; 10</span>
                  {errors.G3 && <span className="error-text">{errors.G3}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="add-absences" className="form-label">
                    Absences <span className="required">*</span>
                  </label>
                  <input
                    id="add-absences"
                    type="number"
                    min={0}
                    max={100}
                    className={`input-control ${errors.absences ? 'input-error' : ''}`}
                    value={formData.absences}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        absences: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                  <span className="field-hint">Days absent</span>
                  {errors.absences && (
                    <span className="error-text">{errors.absences}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Educational Support & Resources */}
            <div className="form-section">
              <h3 className="section-title">
                <BookOpen size={16} className="text-purple" /> Educational Support & Extracurriculars
              </h3>
              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="add-schoolsup" className="form-label">
                    Extra School Support
                  </label>
                  <select
                    id="add-schoolsup"
                    className="input-control"
                    value={formData.schoolsup}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schoolsup: e.target.value as 'yes' | 'no',
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-famsup" className="form-label">
                    Family Support
                  </label>
                  <select
                    id="add-famsup"
                    className="input-control"
                    value={formData.famsup}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        famsup: e.target.value as 'yes' | 'no',
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-paid" className="form-label">
                    Paid Extra Classes
                  </label>
                  <select
                    id="add-paid"
                    className="input-control"
                    value={formData.paid}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paid: e.target.value as 'yes' | 'no',
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="add-activities" className="form-label">
                    Extracurricular Activities
                  </label>
                  <select
                    id="add-activities"
                    className="input-control"
                    value={formData.activities}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        activities: e.target.value as 'yes' | 'no',
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-higher" className="form-label">
                    Higher Education Aspiration
                  </label>
                  <select
                    id="add-higher"
                    className="input-control"
                    value={formData.higher}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        higher: e.target.value as 'yes' | 'no',
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-internet" className="form-label">
                    Internet Access at Home
                  </label>
                  <select
                    id="add-internet"
                    className="input-control"
                    value={formData.internet}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        internet: e.target.value as 'yes' | 'no',
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Social, Health & Family Ratings (1-5) */}
            <div className="form-section">
              <h3 className="section-title">
                <Heart size={16} className="text-rose" /> Social, Family & Health Factors (1–5 scale)
              </h3>
              <div className="form-grid-4">
                <div className="form-group">
                  <label htmlFor="add-famrel" className="form-label">
                    Family Relationship
                  </label>
                  <input
                    id="add-famrel"
                    type="number"
                    min={1}
                    max={5}
                    className="input-control"
                    value={formData.famrel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        famrel: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                  <span className="field-hint">1: Very bad to 5: Excellent</span>
                </div>

                <div className="form-group">
                  <label htmlFor="add-freetime" className="form-label">
                    Free Time
                  </label>
                  <input
                    id="add-freetime"
                    type="number"
                    min={1}
                    max={5}
                    className="input-control"
                    value={formData.freetime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freetime: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                  <span className="field-hint">1: Very low to 5: Very high</span>
                </div>

                <div className="form-group">
                  <label htmlFor="add-goout" className="form-label">
                    Going Out
                  </label>
                  <input
                    id="add-goout"
                    type="number"
                    min={1}
                    max={5}
                    className="input-control"
                    value={formData.goout}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goout: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                  <span className="field-hint">1: Very low to 5: Very high</span>
                </div>

                <div className="form-group">
                  <label htmlFor="add-health" className="form-label">
                    Current Health
                  </label>
                  <input
                    id="add-health"
                    type="number"
                    min={1}
                    max={5}
                    className="input-control"
                    value={formData.health}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        health: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                  <span className="field-hint">1: Very bad to 5: Very good</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky/Pinned Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-glow"
              disabled={isSubmitting}
            >
              <UserPlus size={16} />
              <span>{isSubmitting ? 'Adding...' : 'Create Student Record'}</span>
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
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
          animation: modalOverlayFade 0.15s ease-out;
        }

        @keyframes modalOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .add-student-modal-content {
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
          animation: modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card);
          flex-shrink: 0;
        }

        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .modal-icon-pill {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-icon-pill.icon-primary {
          background: var(--color-primary-glow);
          color: var(--color-primary-light);
          border: 1px solid var(--border-color);
        }

        .modal-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .modal-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0.2rem 0 0;
        }

        .btn-close {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.45rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .btn-close:hover {
          background: var(--bg-surface-hover);
          color: var(--text-primary);
          border-color: var(--border-subtle);
        }

        .add-student-form-wrapper {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        .modal-scroll-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .preview-classification-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-md);
          padding: 0.85rem 1.15rem;
        }

        .preview-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .preview-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem 1.25rem;
          align-items: center;
        }

        .preview-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
        }

        .preview-label {
          color: var(--text-muted);
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          padding-bottom: 0.35rem;
          border-bottom: 1px solid var(--border-subtle);
          margin: 0;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .form-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .form-grid-3, .form-grid-4 {
            grid-template-columns: 1fr;
          }
          .add-student-modal-content {
            max-height: 95vh;
            width: 100%;
          }
          .modal-overlay {
            padding: 0.75rem;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .form-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .required {
          color: var(--color-danger);
        }

        .field-hint {
          font-size: 0.725rem;
          color: var(--text-muted);
        }

        .input-error {
          border-color: var(--color-danger) !important;
          box-shadow: 0 0 0 2px var(--color-danger-bg) !important;
        }

        .error-text {
          font-size: 0.725rem;
          color: var(--color-danger);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-card);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
