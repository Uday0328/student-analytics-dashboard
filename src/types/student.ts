export type School = 'GP' | 'MS';
export type Sex = 'F' | 'M';
export type PerformanceLevel = 'High' | 'Medium' | 'Low';
export type AbsenceGroup = 'Low (0-4)' | 'Moderate (5-9)' | 'High (10+)';
export type RiskLevel = 'Low Risk' | 'Moderate Risk' | 'High Risk';
export type PassStatus = 'Pass' | 'Fail';

export interface Student {
  id: string;
  school: School;
  sex: Sex;
  age: number;
  studytime: number; // 1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h
  failures: number;
  schoolsup: 'yes' | 'no';
  famsup: 'yes' | 'no';
  paid: 'yes' | 'no';
  activities: 'yes' | 'no';
  higher: 'yes' | 'no';
  internet: 'yes' | 'no';
  famrel: number; // 1-5
  freetime: number; // 1-5
  goout: number; // 1-5
  health: number; // 1-5
  absences: number;
  G1: number; // 0-20
  G2: number; // 0-20
  G3: number; // 0-20 (Final Grade)
  performance_level: PerformanceLevel;
  absence_group: AbsenceGroup;
  risk_level: RiskLevel;
  pass_status: PassStatus;
}

export interface DashboardMetrics {
  totalStudents: number;
  avgG1: number;
  avgG2: number;
  avgG3: number;
  avgAbsences: number;
  avgStudyTime: number;
  passCount: number;
  failCount: number;
  passRate: number;
  highPerformers: number;
  atRiskCount: number;
  moderateRiskCount: number;
  lowRiskCount: number;
}

export interface FilterState {
  school: string;
  sex: string;
  studytime: string;
  performance_level: string;
  risk_level: string;
  absence_group: string;
  searchQuery: string;
}

export type SortField = keyof Student;
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}
