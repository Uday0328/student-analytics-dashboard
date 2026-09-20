import React, { useState, useEffect, useMemo } from 'react';
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
import { MOCK_STUDENTS, calculateMetrics } from './data/mockStudentData';

const INITIAL_FILTERS: FilterState = {
  school: 'all',
  sex: 'all',
  studytime: 'all',
  performance_level: 'all',
  risk_level: 'all',
  absence_group: 'all',
  searchQuery: '',
};

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAthenaModalOpen, setIsAthenaModalOpen] = useState<boolean>(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);

  // Sync theme attribute on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Apply filters via service layer
  useEffect(() => {
    let isMounted = true;
    studentDataService
      .getStudents(filters)
      .then((res) => {
        if (isMounted) {
          setStudents(res);
        }
      })
      .catch((err) => {
        console.error('Error fetching student analytics:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleAddStudent = async (newStudent: Student) => {
    await studentDataService.createStudent(newStudent);
    const updated = await studentDataService.getStudents(filters);
    setStudents(updated);
  };

  const metrics = useMemo(() => {
    return calculateMetrics(students);
  }, [students]);

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

  return (
    <div className="dashboard-container">
      {/* Dashboard Top Header */}
      <Header
        students={students}
        totalRawCount={MOCK_STUDENTS.length}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenAthenaModal={() => setIsAthenaModalOpen(true)}
        onOpenAddStudentModal={() => setIsAddStudentModalOpen(true)}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* KPI Cards Section */}
      <KPISection metrics={metrics} totalDatasetCount={MOCK_STUDENTS.length} />

      {/* Interactive Cohort Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        filteredCount={students.length}
        totalCount={MOCK_STUDENTS.length}
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

      {/* AWS Athena Architecture & SQL Schema Modal */}
      <AthenaQueryModal
        isOpen={isAthenaModalOpen}
        onClose={() => setIsAthenaModalOpen(false)}
      />

      {/* Add New Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={handleAddStudent}
        existingStudents={students}
        nextIdNumber={MOCK_STUDENTS.length + 1}
      />

      {/* Footer Branding */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          <span>Student Performance Analytics Platform</span>
          <span className="footer-dot">•</span>
          <span>AWS Athena Serverless Data Lake</span>
        </div>
        <div className="footer-right font-mono">
          <span>Database: student_data_lake_db</span>
        </div>
      </footer>

      <style>{`
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
