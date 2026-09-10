# 🎓 Cloud Based Student Data Lake and Analytics System

A modern, production-grade **Cloud Based Student Data Lake and Analytics System** built with **React**, **TypeScript**, and **Vite**. Designed as the intelligence frontend for an **AWS Athena Student Data Lake** (`student_data_lake_db`).

---

## 🚀 Key Features

- **Executive KPI Suite**: Real-time aggregation of Total Students (1,044), Pass Rate (77.97%), Average G3 (11.34/20), Average Absences (4.43 days), High Performers (204), and At-Risk Students (230).
- **Interactive Multi-Factor Cohort Filtering**:
  - School (`GP` - Gabriel Pereira, `MS` - Mousinho da Silveira)
  - Gender / Sex (`F`, `M`)
  - Study Time Tiers (Tier 1: <2h to Tier 4: >10h)
  - Performance Level (`High`, `Medium`, `Low`)
  - Risk Level (`Low Risk`, `Moderate Risk`, `High Risk`)
  - Absence Group (`Low (0-4)`, `Moderate (5-9)`, `High (10+)`)
  - Live query search across Student IDs, ages, and schools.
- **Rich Data Visualizations (Recharts)**:
  - **Pass vs Fail Outcome**: Donut chart displaying student status against the grade 10.0 pass mark.
  - **Performance Level Distribution**: Grade tier breakdown.
  - **Average G3 by School**: Comparative institutional performance between GP and MS.
  - **Average G3 by Study Time**: Positive correlation trend between study hours and academic output.
  - **Average G3 by Absence Group**: Impact analysis showing performance degradation with increased absenteeism.
  - **Risk Level Distribution**: Predictive risk segmentation for student intervention.
- **Master Student Ledger**:
  - Full sortable table across all 11 dimensions.
  - Configurable pagination (10, 25, 50, 100 rows).
  - Row click deep-dive profile modal with academic path tracing (G1 $\rightarrow$ G2 $\rightarrow$ G3), social factors, and automated intervention recommendations.
- **Athena Data Lake Inspector**:
  - Built-in schema viewer for raw tables, analytical views, and SQL queries.
  - 1-click SQL copy and execution blueprint.
- **Export & Theming**:
  - Instant CSV data export of active filtered subsets.
  - Dark / Light executive mode toggle.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |   Raw Student Ingestion (CSV / JSON)  |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |        Amazon S3 Data Lake Bucket     |
                                  |   s3://student-data-lake-bucket/raw/  |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |            AWS Glue Crawler           |
                                  |    Schema Registry: student_raw       |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |             Amazon Athena             |
                                  |     Catalog: student_data_lake_db     |
                                  +---------------------------------------+
                                          |                       |
                  (Analytical Views)      |                       | (Risk ML Inference)
                                          v                       v
               +----------------------------------+   +-------------------------------------+
               |    student_dashboard_metrics     |   |        student_risk_analysis        |
               |   student_performance_analysis   |   |          student_analytics          |
               +----------------------------------+   +-------------------------------------+
                                          \                       /
                                           \                     /
                                            v                   v
                                  +---------------------------------------+
                                  |      AWS API Gateway / Lambda Proxy   |
                                  |       (@aws-sdk/client-athena)        |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |    React + Vite + TypeScript Client   |
                                  | (Cloud Student Data Lake & Analytics) |
                                  +---------------------------------------+
```

---

## 🗄️ AWS Athena Data Lake Schema (`student_data_lake_db`)

The dashboard interfaces with the following Athena objects:

### 1. Tables
- `student_raw`: Raw ingested student data from S3.
- `student_analytics`: Transformed and standardized student academic records with categorized absence and performance tiers.
- `student_risk_analysis`: ML-scored risk classifications (`Low Risk`, `Moderate Risk`, `High Risk`) with identified risk indicators.

### 2. Views
- `student_dashboard_metrics`:
  ```sql
  CREATE OR REPLACE VIEW student_dashboard_metrics AS
  SELECT 
      COUNT(*) AS total_students,
      ROUND(AVG(g1), 2) AS avg_g1,
      ROUND(AVG(g2), 2) AS avg_g2,
      ROUND(AVG(g3), 2) AS avg_g3,
      ROUND(AVG(absences), 2) AS avg_absences,
      ROUND(AVG(studytime), 2) AS avg_study_time,
      COUNT(CASE WHEN g3 >= 10 THEN 1 END) AS pass_count,
      COUNT(CASE WHEN g3 < 10 THEN 1 END) AS fail_count,
      ROUND(COUNT(CASE WHEN g3 >= 10 THEN 1 END) * 100.0 / COUNT(*), 2) AS pass_rate,
      COUNT(CASE WHEN g3 >= 15 THEN 1 END) AS high_performers,
      COUNT(CASE WHEN g3 < 10 THEN 1 END) AS at_risk_students
  FROM "student_data_lake_db"."student_analytics";
  ```

- `student_performance_analysis`:
  ```sql
  CREATE OR REPLACE VIEW student_performance_analysis AS
  SELECT 
      school,
      studytime,
      absence_group,
      performance_level,
      risk_level,
      COUNT(*) AS student_count,
      ROUND(AVG(g3), 2) AS avg_final_grade
  FROM "student_data_lake_db"."student_analytics" a
  JOIN "student_data_lake_db"."student_risk_analysis" r ON a.student_id = r.student_id
  GROUP BY school, studytime, absence_group, performance_level, risk_level;
  ```

---

## 📊 Baseline Benchmark Metrics

| Metric | Benchmark Value |
| :--- | :--- |
| **Total Students** | `1,044` |
| **Average G1 (Period 1)** | `11.34` |
| **Average G2 (Period 2)** | `11.34` |
| **Average G3 (Final)** | `11.34` |
| **Average Absences** | `4.43 days` |
| **Average Study Time** | `1.97` |
| **Pass Count (G3 ≥ 10)** | `814` |
| **Fail Count (G3 < 10)** | `230` |
| **Pass Rate** | `77.97%` |
| **High Performers (G3 ≥ 15)** | `204` |
| **At-Risk Students** | `230` |
| **Moderate Risk** | `485` |
| **Low Risk** | `494` |

---

## 🔌 Connecting to Live AWS Athena

The codebase uses a service abstraction pattern in [`src/services/studentDataService.ts`](./src/services/studentDataService.ts).

To connect to live Athena:
1. **Option A: AWS API Gateway + Lambda (Recommended for Production)**:
   - Deploy a lightweight Lambda function with `AthenaClient` from `@aws-sdk/client-athena`.
   - Update `studentDataService.ts` to call your API Gateway endpoint `https://api.yourdomain.com/analytics/students`.

2. **Option B: Direct AWS SDK Integration via Cognito**:
   - Provide AWS Cognito credentials in `.env`:
     ```env
     VITE_AWS_REGION=us-east-1
     VITE_ATHENA_DATABASE=student_data_lake_db
     VITE_ATHENA_WORKGROUP=primary
     VITE_ATHENA_OUTPUT_S3=s3://student-data-lake-results/
     ```

---

## 🛠️ Local Development & Running

### Prerequisites
- Node.js 18+ & npm

### Commands
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Production build
npm run build
```

The dev server will run at `http://localhost:3000`.
