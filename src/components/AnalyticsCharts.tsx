import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Student } from '../types/student';

interface AnalyticsChartsProps {
  students: Student[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ students }) => {
  // Chart 1: Pass vs Fail
  const passCount = students.filter((s) => s.G3 >= 10).length;
  const failCount = students.filter((s) => s.G3 < 10).length;
  const passFailData = [
    { name: 'Pass (G3 ≥ 10)', value: passCount, color: '#10B981' },
    { name: 'Fail (G3 < 10)', value: failCount, color: '#EF4444' },
  ];

  // Chart 2: Performance Level Distribution
  const highCount = students.filter((s) => s.performance_level === 'High').length;
  const mediumCount = students.filter((s) => s.performance_level === 'Medium').length;
  const lowCount = students.filter((s) => s.performance_level === 'Low').length;
  const perfData = [
    { name: 'High (≥15)', students: highCount, color: '#14B8A6' },
    { name: 'Medium (10-14)', students: mediumCount, color: '#3B82F6' },
    { name: 'Low (<10)', students: lowCount, color: '#EF4444' },
  ];

  // Chart 3: Average G3 by School
  const gpStudents = students.filter((s) => s.school === 'GP');
  const msStudents = students.filter((s) => s.school === 'MS');
  const gpAvgG3 =
    gpStudents.length > 0
      ? Number((gpStudents.reduce((a, s) => a + s.G3, 0) / gpStudents.length).toFixed(2))
      : 0;
  const msAvgG3 =
    msStudents.length > 0
      ? Number((msStudents.reduce((a, s) => a + s.G3, 0) / msStudents.length).toFixed(2))
      : 0;
  const schoolData = [
    { name: 'Gabriel Pereira (GP)', avgG3: gpAvgG3, count: gpStudents.length },
    { name: 'Mousinho da Silveira (MS)', avgG3: msAvgG3, count: msStudents.length },
  ];

  // Chart 4: Average G3 by Study Time
  const studyTimes = [
    { tier: 1, label: '< 2h / wk' },
    { tier: 2, label: '2 - 5h / wk' },
    { tier: 3, label: '5 - 10h / wk' },
    { tier: 4, label: '> 10h / wk' },
  ];
  const studyTimeData = studyTimes.map((st) => {
    const stStudents = students.filter((s) => s.studytime === st.tier);
    const avg =
      stStudents.length > 0
        ? Number((stStudents.reduce((a, s) => a + s.G3, 0) / stStudents.length).toFixed(2))
        : 0;
    return {
      tier: `Tier ${st.tier}`,
      label: st.label,
      avgG3: avg,
      students: stStudents.length,
    };
  });

  // Chart 5: Average G3 by Absence Group
  const absenceGroups = ['Low (0-4)', 'Moderate (5-9)', 'High (10+)'] as const;
  const absenceGroupData = absenceGroups.map((grp) => {
    const grpStudents = students.filter((s) => s.absence_group === grp);
    const avg =
      grpStudents.length > 0
        ? Number((grpStudents.reduce((a, s) => a + s.G3, 0) / grpStudents.length).toFixed(2))
        : 0;
    return {
      group: grp,
      avgG3: avg,
      students: grpStudents.length,
    };
  });

  // Chart 6: Risk Level Distribution
  const lowRiskCount = students.filter((s) => s.risk_level === 'Low Risk').length;
  const modRiskCount = students.filter((s) => s.risk_level === 'Moderate Risk').length;
  const highRiskCount = students.filter((s) => s.risk_level === 'High Risk').length;
  const riskData = [
    { name: 'Low Risk', value: lowRiskCount, color: '#10B981' },
    { name: 'Moderate Risk', value: modRiskCount, color: '#F59E0B' },
    { name: 'High Risk', value: highRiskCount, color: '#EF4444' },
  ];

  // Custom tooltip renderer for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-title">{label || payload[0].name}</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="tooltip-row">
              <span className="tooltip-dot" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-value font-mono">
                {entry.value !== undefined ? entry.value : entry.payload.avgG3}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="charts-section">
      <div className="charts-grid">
        {/* Chart 1: Pass vs Fail Students */}
        <div className="glass-card chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Pass vs Fail Outcome</h3>
              <p className="chart-desc">Threshold: Final Grade (G3) ≥ 10.0</p>
            </div>
            <span className="badge badge-primary font-mono">
              {students.length > 0 ? ((passCount / students.length) * 100).toFixed(1) : 0}% Pass
            </span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: '#1E293B', fontSize: '0.8125rem', fontWeight: 500 }}>
                      {value}: <strong className="font-mono" style={{ color: '#0F172A' }}>{entry.payload.value}</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Performance Level Distribution */}
        <div className="glass-card chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Performance Level Distribution</h3>
              <p className="chart-desc">Academic tiers based on final G3 score</p>
            </div>
            <span className="badge badge-teal font-mono">{students.length} Total</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perfData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="students" name="Students" radius={[6, 6, 0, 0]}>
                  {perfData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Average G3 by School */}
        <div className="glass-card chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Average G3 by School</h3>
              <p className="chart-desc">Comparative institutional academic standing</p>
            </div>
            <span className="badge badge-primary font-mono">Max Scale: 20</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={schoolData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" domain={[0, 20]} fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgG3" name="Avg Final Grade" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                  <Cell fill="#3B82F6" />
                  <Cell fill="#8B5CF6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Average G3 by Study Time */}
        <div className="glass-card chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Average G3 by Study Time</h3>
              <p className="chart-desc">Impact of weekly preparation hours on grades</p>
            </div>
            <span className="badge badge-teal font-mono">Positive Trend</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={studyTimeData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" domain={[0, 20]} fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgG3" name="Avg Final Grade" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Average G3 by Absence Group */}
        <div className="glass-card chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Average G3 by Absence Group</h3>
              <p className="chart-desc">Attendance impact on student performance</p>
            </div>
            <span className="badge badge-warning font-mono">Attendance Critical</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={absenceGroupData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="group" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" domain={[0, 20]} fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgG3" name="Avg Final Grade" fill="#F59E0B" radius={[6, 6, 0, 0]}>
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Risk Level Distribution */}
        <div className="glass-card chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Risk Level Distribution</h3>
              <p className="chart-desc">Predictive modeling classification breakdown</p>
            </div>
            <span className="badge badge-danger font-mono">
              {highRiskCount} High Risk
            </span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-risk-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: '#1E293B', fontSize: '0.8125rem', fontWeight: 500 }}>
                      {value}: <strong className="font-mono" style={{ color: '#0F172A' }}>{entry.payload.value}</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style>{`
        .charts-section {
          margin-bottom: 1.75rem;
        }
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        .chart-card {
          padding: 1.25rem 1.4rem;
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02);
        }
        .chart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .chart-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1E293B;
          letter-spacing: -0.01em;
        }
        .chart-desc {
          font-size: 0.775rem;
          color: #64748B;
          margin-top: 0.15rem;
        }
        .chart-body {
          flex: 1;
          min-height: 240px;
        }
        .chart-tooltip {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          padding: 0.6rem 0.85rem;
          border-radius: var(--radius-md);
          box-shadow: 0 10px 25px -3px rgba(15, 23, 42, 0.1);
        }
        .tooltip-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 0.35rem;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 0.25rem;
        }
        .tooltip-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.75rem;
          margin-top: 0.2rem;
        }
        .tooltip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .tooltip-name {
          color: #64748B;
        }
        .tooltip-value {
          color: #1E293B;
          font-weight: 600;
        }
      `}</style>
    </section>
  );
};
