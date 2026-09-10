import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { KPISection } from './components/KPISection';
import { FilterBar } from './components/FilterBar';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { StudentTable } from './components/StudentTable';
import { StudentDetailModal } from './components/StudentDetailModal';
import { AthenaQueryModal } from './components/AthenaQueryModal';
import { AddStudentModal } from './components/AddStudentModal';
import { Student, FilterState } from './types/student';
import { studentDataService } from './services/studentDataService';
import { calculateMetrics } from './data/mockStudentData';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  school: 'all',
  sex: 'all',
  studytime: 'all',
  performance_level: 'all',
  risk_level: 'all',
  absence_group: 'all',
  searchQuery: '',
};

interface NotificationToast {
  type: 'success' | 'error';
  title: string;
  message: string;
}

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAthenaModalOpen, setIsAthenaModalOpen] = useState<boolean>(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notification, setNotification] = useState<NotificationToast | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Sync theme attribute on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch or filter students
  const loadStudents = useCallback(() => {
    // Load active filtered students
    studentDataService
      .getStudents(filters)
      .then((res) => {
        setStudents(res);
        setApiError(null);
      })
      .catch((err) => {
        console.error('Error fetching student analytics:', err);
        setApiError(err?.message || 'Failed to fetch students from AWS API Gateway.');
      });

    // Load master total count
    studentDataService
      .getStudents()
      .then((res) => {
        setAllStudents(res);
        setApiError(null);
      })
      .catch((err) => {
        console.error('Error loading total dataset:', err);
        setApiError(err?.message || 'Failed to fetch master dataset from AWS API Gateway.');
      });
  }, [filters]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const metrics = useMemo(() => {
    if (students.length > 0) {
      return calculateMetrics(students);
    }
    if (allStudents.length > 0) {
      return calculateMetrics(allStudents);
    }
    return calculateMetrics([]);
  }, [students, allStudents]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.school !== 'all' ||
      filters.sex !== 'all' ||
      filters.studytime !== 'all' ||
      filters.performance_level !== 'all' ||
      filters.risk_level !== 'all' ||
      filters.absence_group !== 'all' ||
      filters.searchQuery.trim().length > 0
    );
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleAddStudent = async (newStudent: Student) => {
    try {
      const created = await studentDataService.addStudent(newStudent);
      // Immediately reflect newly created student in active state and total count
      setStudents((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      setAllStudents((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      // Reload active and total students
      loadStudents();
      setNotification({
        type: 'success',
        title: 'Student Added Successfully',
        message: `${created.id} has been successfully added to the database.`,
      });
    } catch (err: any) {
      console.error('Failed to add student:', err);
      setNotification({
        type: 'error',
        title: 'Failed to Add Student',
        message: err?.message || 'Could not persist student record to AWS storage.',
      });
      throw err;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`toast-notification toast-${notification.type}`} role="alert">
          <div className="toast-icon">
            {notification.type === 'success' ? (
              <CheckCircle2 size={20} className="text-emerald" />
            ) : (
              <AlertCircle size={20} className="text-rose" />
            )}
          </div>
          <div className="toast-content">
            <h4 className="toast-title">{notification.title}</h4>
            <p className="toast-message">{notification.message}</p>
          </div>
          <button
            className="toast-close"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* API Error Notification */}
      {apiError && (
        <div
          style={{
            margin: '0 0 1.25rem 0',
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '0.75rem',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem',
          }}
          role="alert"
        >
          <AlertCircle size={22} className="text-rose" />
          <div style={{ flex: 1 }}>
            <strong>AWS Connection Error:</strong> {apiError}
          </div>
          <button
            onClick={loadStudents}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#f87171',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Dashboard Top Header */}
      <Header
        students={students}
        totalRawCount={allStudents.length}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenAthenaModal={() => setIsAthenaModalOpen(true)}
        onOpenAddStudentModal={() => setIsAddStudentModalOpen(true)}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* KPI Cards Section */}
      <KPISection metrics={metrics} totalDatasetCount={allStudents.length} />

      {/* Interactive Cohort Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        filteredCount={students.length}
        totalCount={allStudents.length}
      />

      {/* Analytical Charts Grid */}
      <AnalyticsCharts students={students} />

      {/* Master Student Data Table */}
      <StudentTable
        students={students}
        onSelectStudent={(stu) => setSelectedStudent(stu)}
      />

      {/* Student Deep-Dive Profile Modal */}
      <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={handleAddStudent}
        existingStudents={allStudents}
      />

      {/* AWS Athena Architecture & SQL Schema Modal */}
      <AthenaQueryModal
        isOpen={isAthenaModalOpen}
        onClose={() => setIsAthenaModalOpen(false)}
      />

      {/* Footer Branding */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          <span>Cloud Based Student Data Lake and Analytics System</span>
          <span className="footer-dot">•</span>
          <span>AWS Athena Serverless Data Lake</span>
        </div>
        <div className="footer-right font-mono">
          <span>Database: student_data_lake_db</span>
        </div>
      </footer>

      <style>{`
        .toast-notification {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 2000;
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 1rem 1.25rem;
          background: var(--bg-surface);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--border-color);
          backdrop-filter: blur(12px);
          max-width: 420px;
          animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .toast-success {
          border-left: 4px solid #10b981;
        }

        .toast-error {
          border-left: 4px solid #ef4444;
        }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .text-emerald {
          color: #10b981;
        }

        .text-rose {
          color: #ef4444;
        }

        .toast-content {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
        }

        .toast-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .toast-message {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.2rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .toast-close:hover {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
        }

        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-subtle);
          font-size: 0.775rem;
          color: var(--text-muted);
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .footer-dot {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};
