import { Student, DashboardMetrics } from '../types/student';

// Seeded pseudo-random generator for determinism
class SeededRandom {
  private seed: number;
  constructor(seed: number = 42) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }
  choice<T>(arr: readonly T[] | T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export function generateStudentDataset(): Student[] {
  const rng = new SeededRandom(1044);
  const students: Student[] = [];
  const TOTAL = 1044;

  // Athena Verified Ground Truth Metrics:
  // Total: 1044
  // Performance:
  //   - High Performers (>=15): 204 (Avg G3: 16.16)
  //   - Medium / Average (10-14): 610 (Avg G3: 11.73)
  //   - Low / At Risk (<10): 230 (Avg G3: 6.04)
  // Total Pass: 814 (77.97%), Total Fail: 230 (22.03%), Overall Avg G3: 11.34
  //
  // Risk Levels (from Athena student_risk_analysis):
  //   - Low Risk: 494
  //   - Moderate Risk: 485
  //   - High Risk: 65
  // Total Risk = 494 + 485 + 65 = 1044

  const sexes = ['F', 'M'] as const;

  // Pre-assign exact risk distribution: 494 Low Risk, 485 Moderate Risk, 65 High Risk
  const riskPool: Student['risk_level'][] = [
    ...Array(494).fill('Low Risk'),
    ...Array(485).fill('Moderate Risk'),
    ...Array(65).fill('High Risk'),
  ];
  // Deterministic shuffle of risk assignments
  for (let i = riskPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [riskPool[i], riskPool[j]] = [riskPool[j], riskPool[i]];
  }

  for (let i = 0; i < TOTAL; i++) {
    const id = `STU-${String(i + 1).padStart(4, '0')}`;
    const school = i < 772 ? 'GP' : 'MS'; // ~74% GP
    const sex = rng.choice(sexes);
    const age = rng.nextInt(15, 20);

    let studytime = 2;
    let g3 = 11;
    let g2 = 11;
    let g1 = 11;
    let absences = 4;
    let performance_level: Student['performance_level'] = 'Medium';

    if (i < 204) {
      // High performers (204 students, G3 in 15..20, target avg ~16.16)
      performance_level = 'High';
      g3 = rng.nextInt(15, 18);
      studytime = rng.choice([2, 3, 3, 4, 4]);
      absences = rng.nextInt(0, 5);
      g1 = Math.min(20, Math.max(12, g3 + rng.nextInt(-2, 1)));
      g2 = Math.min(20, Math.max(13, g3 + rng.nextInt(-1, 1)));
    } else if (i < 204 + 610) {
      // Medium performers (610 students, G3 in 10..14, target avg ~11.73)
      performance_level = 'Medium';
      g3 = rng.nextInt(10, 14);
      studytime = rng.choice([1, 2, 2, 3]);
      absences = rng.nextInt(0, 7);
      g1 = Math.min(20, Math.max(8, g3 + rng.nextInt(-2, 2)));
      g2 = Math.min(20, Math.max(9, g3 + rng.nextInt(-2, 2)));
    } else {
      // Fail / Low performance (230 students, G3 in 0..9, target avg ~6.04)
      performance_level = 'Low';
      g3 = rng.nextInt(0, 9);
      studytime = rng.choice([1, 1, 2, 2]);
      absences = rng.nextInt(1, 12);
      g1 = Math.min(12, Math.max(0, g3 + rng.nextInt(-2, 2)));
      g2 = Math.min(11, Math.max(0, g3 + rng.nextInt(-2, 2)));
    }

    // Determine absence group
    let absence_group: Student['absence_group'] = 'Low (0-4)';
    if (absences >= 10) {
      absence_group = 'High (10+)';
    } else if (absences >= 5) {
      absence_group = 'Moderate (5-9)';
    }

    students.push({
      id,
      school,
      sex,
      age,
      studytime,
      failures: g3 < 10 ? rng.nextInt(1, 3) : 0,
      schoolsup: rng.next() > 0.85 ? 'yes' : 'no',
      famsup: rng.next() > 0.4 ? 'yes' : 'no',
      paid: rng.next() > 0.7 ? 'yes' : 'no',
      activities: rng.next() > 0.5 ? 'yes' : 'no',
      higher: g3 >= 10 ? (rng.next() > 0.1 ? 'yes' : 'no') : (rng.next() > 0.5 ? 'yes' : 'no'),
      internet: rng.next() > 0.2 ? 'yes' : 'no',
      famrel: rng.nextInt(3, 5),
      freetime: rng.nextInt(2, 5),
      goout: rng.nextInt(1, 5),
      health: rng.nextInt(2, 5),
      absences,
      G1: g1,
      G2: g2,
      G3: g3,
      performance_level,
      absence_group,
      risk_level: riskPool[i],
      pass_status: g3 >= 10 ? 'Pass' : 'Fail',
    });
  }

  // Calibrate performance group averages to match exact Athena targets:
  // High Performers (204): avg G3 = 16.16 (sum = 3297)
  calibrateGroupG3(students.slice(0, 204), 16.16, 15, 20);
  // Medium (610): avg G3 = 11.73 (sum = 7155)
  calibrateGroupG3(students.slice(204, 204 + 610), 11.73, 10, 14);
  // Low (230): avg G3 = 6.04 (sum = 1389)
  calibrateGroupG3(students.slice(204 + 610), 6.04, 0, 9);

  // Calibrate overall cohort averages: G1 = 11.21, G2 = 11.25, Absences = 4.43, StudyTime = 1.97
  adjustCohortAverages(students, 11.21, 11.25, 4.43, 1.97);

  return students;
}

function calibrateGroupG3(group: Student[], targetAvg: number, minG3: number, maxG3: number) {
  const n = group.length;
  let currentSum = group.reduce((acc, s) => acc + s.G3, 0);
  let targetSum = Math.round(targetAvg * n);
  let diff = targetSum - currentSum;

  let iterations = 0;
  while (diff !== 0 && iterations < 10000) {
    for (let i = 0; i < n && diff !== 0; i++) {
      const s = group[i];
      if (diff > 0 && s.G3 < maxG3) {
        s.G3 += 1;
        diff--;
      } else if (diff < 0 && s.G3 > minG3) {
        s.G3 -= 1;
        diff++;
      }
    }
    iterations++;
  }
}

function adjustCohortAverages(
  students: Student[],
  targetG1: number,
  targetG2: number,
  targetAbsences: number,
  targetStudyTime: number
) {
  const n = students.length;

  // Multi-pass G1 calibration (target = 11.21)
  let currentG1Sum = students.reduce((acc, s) => acc + s.G1, 0);
  let g1Diff = Math.round(targetG1 * n - currentG1Sum);
  let iter = 0;
  while (g1Diff !== 0 && iter < 10000) {
    for (let i = 0; i < n && g1Diff !== 0; i++) {
      const s = students[i];
      if (g1Diff > 0 && s.G1 < 20) {
        s.G1 += 1;
        g1Diff--;
      } else if (g1Diff < 0 && s.G1 > 0) {
        s.G1 -= 1;
        g1Diff++;
      }
    }
    iter++;
  }

  // Multi-pass G2 calibration (target = 11.25)
  let currentG2Sum = students.reduce((acc, s) => acc + s.G2, 0);
  let g2Diff = Math.round(targetG2 * n - currentG2Sum);
  iter = 0;
  while (g2Diff !== 0 && iter < 10000) {
    for (let i = 0; i < n && g2Diff !== 0; i++) {
      const s = students[i];
      if (g2Diff > 0 && s.G2 < 20) {
        s.G2 += 1;
        g2Diff--;
      } else if (g2Diff < 0 && s.G2 > 0) {
        s.G2 -= 1;
        g2Diff++;
      }
    }
    iter++;
  }

  // Multi-pass Absences calibration (target = 4.43)
  let currentAbsSum = students.reduce((acc, s) => acc + s.absences, 0);
  let absDiff = Math.round(targetAbsences * n - currentAbsSum);
  iter = 0;
  while (absDiff !== 0 && iter < 10000) {
    for (let i = 0; i < n && absDiff !== 0; i++) {
      const s = students[i];
      if (absDiff > 0 && s.absences < 30) {
        s.absences += 1;
        absDiff--;
      } else if (absDiff < 0 && s.absences > 0) {
        s.absences -= 1;
        absDiff++;
      }
    }
    iter++;
  }

  // Update absence groups after final absence values are calibrated
  for (const s of students) {
    if (s.absences >= 10) s.absence_group = 'High (10+)';
    else if (s.absences >= 5) s.absence_group = 'Moderate (5-9)';
    else s.absence_group = 'Low (0-4)';
  }

  // Multi-pass Study Time calibration (target = 1.97)
  let currentStudySum = students.reduce((acc, s) => acc + s.studytime, 0);
  let studyDiff = Math.round(targetStudyTime * n - currentStudySum);
  iter = 0;
  while (studyDiff !== 0 && iter < 10000) {
    for (let i = 0; i < n && studyDiff !== 0; i++) {
      const s = students[i];
      if (studyDiff > 0 && s.studytime < 4) {
        s.studytime += 1;
        studyDiff--;
      } else if (studyDiff < 0 && s.studytime > 1) {
        s.studytime -= 1;
        studyDiff++;
      }
    }
    iter++;
  }
}

export const MOCK_STUDENTS: Student[] = generateStudentDataset();

export function calculateMetrics(students: Student[]): DashboardMetrics {
  const total = students.length;
  if (total === 0) {
    return {
      totalStudents: 0,
      avgG1: 0,
      avgG2: 0,
      avgG3: 0,
      avgAbsences: 0,
      avgStudyTime: 0,
      passCount: 0,
      failCount: 0,
      passRate: 0,
      highPerformers: 0,
      atRiskCount: 0,
      moderateRiskCount: 0,
      lowRiskCount: 0,
    };
  }

  let sumG1 = 0;
  let sumG2 = 0;
  let sumG3 = 0;
  let sumAbsences = 0;
  let sumStudyTime = 0;
  let passCount = 0;
  let highPerformers = 0;
  let atRiskCount = 0;
  let moderateRiskCount = 0;
  let lowRiskCount = 0;

  for (const s of students) {
    sumG1 += s.G1;
    sumG2 += s.G2;
    sumG3 += s.G3;
    sumAbsences += s.absences;
    sumStudyTime += s.studytime;
    if (s.G3 >= 10) passCount++;
    if (s.performance_level === 'High') highPerformers++;
    if (s.performance_level === 'Low' || s.G3 < 10) atRiskCount++;
    if (s.risk_level === 'Moderate Risk') moderateRiskCount++;
    if (s.risk_level === 'Low Risk') lowRiskCount++;
  }

  const failCount = total - passCount;

  return {
    totalStudents: total,
    avgG1: Number((sumG1 / total).toFixed(2)),
    avgG2: Number((sumG2 / total).toFixed(2)),
    avgG3: Number((sumG3 / total).toFixed(2)),
    avgAbsences: Number((sumAbsences / total).toFixed(2)),
    avgStudyTime: Number((sumStudyTime / total).toFixed(2)),
    passCount,
    failCount,
    passRate: Number(((passCount / total) * 100).toFixed(2)),
    highPerformers,
    atRiskCount,
    moderateRiskCount,
    lowRiskCount,
  };
}

export const BASE_METRICS: DashboardMetrics = calculateMetrics(MOCK_STUDENTS);
