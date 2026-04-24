# Waste Dashboard Execution Plan

This playbook is designed for the current React UI and the Django backend in this repo.
Use it after importing the MySQL dump so you map real tables to the dashboard without guessing.

## 1. Import the `.sql` dump into MySQL

### Option A: MySQL Workbench

1. Create an empty schema, for example `waste_dashboard`.
2. Open MySQL Workbench.
3. Go to `Server -> Data Import`.
4. Choose `Import from Self-Contained File` and select your dump file.
5. Choose `Default Target Schema` = `waste_dashboard`.
6. Click `Start Import`.

### Option B: MySQL command line

```bash
mysql -u root -p -e "CREATE DATABASE waste_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p waste_dashboard < your_dump.sql
```

## 2. Connect Django to MySQL

Set these environment variables before starting Django:

```bash
set MYSQL_NAME=waste_dashboard
set MYSQL_USER=root
set MYSQL_PASSWORD=your_password
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3306
```

Then run:

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py check
```

## 3. Inspect the schema before writing business logic

Run the inspection command added in this repo:

```bash
cd backend
python manage.py inspect_waste_schema
python manage.py inspect_waste_schema --table scm_scans
python manage.py inspect_waste_schema --table scm_scan_results
python manage.py inspect_waste_schema --table analytics_result_backup
```

Also run these SQL queries in MySQL Workbench.

### Top tables by size

```sql
SELECT
    table_name,
    table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY table_rows DESC;
```

### Columns in one table

```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_key,
    extra
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'scm_scan_results'
ORDER BY ordinal_position;
```

### Foreign keys

```sql
SELECT
    table_name,
    column_name,
    referenced_table_name,
    referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
  AND referenced_table_name IS NOT NULL
ORDER BY table_name, column_name;
```

### Candidate waste columns

```sql
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND (
      table_name LIKE '%scan%' OR
      column_name LIKE '%weight%' OR
      column_name LIKE '%waste%' OR
      column_name LIKE '%reason%' OR
      column_name LIKE '%device%' OR
      column_name LIKE '%meal%' OR
      column_name LIKE '%category%' OR
      column_name LIKE '%cost%' OR
      column_name LIKE '%co2%' OR
      column_name LIKE '%abnormal%'
  )
ORDER BY table_name, ordinal_position;
```

## 4. Identify the minimum fact table for the dashboard

You need one main fact table at row level. For each row, confirm whether it contains:

- scan timestamp
- device id or device code
- waste category
- waste reason
- waste weight
- meal type
- abnormal flag
- unit cost or cost amount
- CO2 factor or CO2 amount

### Most likely interpretation from your screenshot

- `scm_scans`: probably scan header table
  - likely fields: scan id, device id, scan timestamp, maybe meal/session metadata
- `scm_scan_results`: probably per-item or per-classification scan detail table
  - likely fields: scan id, category/classification, predicted label, weight, confidence
- `analytics_result_backup`: likely historical or denormalized analytics output
  - useful for validation, but not the first choice unless it already contains ready-made dashboard fields

### Recommended join pattern to test

```sql
SELECT *
FROM scm_scan_results r
JOIN scm_scans s ON s.id = r.scan_id
LIMIT 20;
```

If that fails, inspect these common alternatives:

- `r.scanid = s.id`
- `r.scan_id = s.scan_id`
- `r.parent_id = s.id`

## 5. Map UI components to database fields

### Dashboard summary

Needs:

- `total_waste`: `SUM(weight)`
- `total_scans`: `COUNT(DISTINCT scan_id)` or `COUNT(*)` on header table
- `total_devices`: `COUNT(DISTINCT device_id)`
- `abnormal_days`: `COUNT(DISTINCT DATE(scan_timestamp))` where abnormal condition is true
- `cost_loss`: `SUM(weight * unit_cost)` or `SUM(cost_amount)`
- `co2_impact`: `SUM(weight * co2_factor)` or `SUM(co2_amount)`

### Waste by category

Needs:

- category label column
- weight column

```sql
SELECT category, ROUND(SUM(weight), 3) AS value
FROM your_fact_table
WHERE ...
GROUP BY category
ORDER BY value DESC, category ASC;
```

### Reason breakdown

Needs:

- reason column
- category filter
- weight column

```sql
SELECT reason, ROUND(SUM(weight), 3) AS weight
FROM your_fact_table
WHERE category = 'Rice'
GROUP BY reason
ORDER BY weight DESC, reason ASC;
```

Convert each reason weight to a percentage in Django:

```python
percentage = round((reason_weight / total_reason_weight) * 100, 2)
```

### Filters

Needs:

- date range: timestamp column
- device: device id or device code
- meal type: meal/session column
- category: category column
- week: derived from timestamp or translated to date range in backend

## 6. Recommended backend architecture

Use raw SQL for the first pass because:

- your schema is not yet understood
- these APIs are aggregation-heavy
- it is faster than building perfect Django models first

Recommended layers:

1. `views.py`
2. `services/filters.py`
3. `repositories/` or raw-query service functions

Keep Django models optional unless you later need admin, forms, or row-level CRUD.

## 7. Base SQL patterns to adapt after schema confirmation

Replace names in uppercase with your real column names.

### Dashboard summary

```sql
SELECT
    ROUND(COALESCE(SUM(r.WEIGHT_COLUMN), 0), 3) AS total_waste,
    COUNT(DISTINCT s.SCAN_ID_COLUMN) AS total_scans,
    COUNT(DISTINCT s.DEVICE_ID_COLUMN) AS total_devices,
    COUNT(DISTINCT CASE WHEN r.ABNORMAL_FLAG_COLUMN = 1 THEN DATE(s.SCAN_TIME_COLUMN) END) AS abnormal_days,
    ROUND(COALESCE(SUM(
        CASE
            WHEN r.COST_AMOUNT_COLUMN IS NOT NULL THEN r.COST_AMOUNT_COLUMN
            WHEN r.UNIT_COST_COLUMN IS NOT NULL THEN r.WEIGHT_COLUMN * r.UNIT_COST_COLUMN
            ELSE 0
        END
    ), 0), 2) AS cost_loss,
    ROUND(COALESCE(SUM(
        CASE
            WHEN r.CO2_AMOUNT_COLUMN IS NOT NULL THEN r.CO2_AMOUNT_COLUMN
            WHEN r.CO2_FACTOR_COLUMN IS NOT NULL THEN r.WEIGHT_COLUMN * r.CO2_FACTOR_COLUMN
            ELSE 0
        END
    ), 0), 3) AS co2_impact
FROM RESULT_TABLE r
JOIN SCAN_TABLE s ON s.SCAN_ID_COLUMN = r.SCAN_ID_FK
WHERE s.SCAN_TIME_COLUMN >= %(date_from)s
  AND s.SCAN_TIME_COLUMN < %(date_to_next_day)s
;
```

### Waste by category

```sql
SELECT
    r.CATEGORY_COLUMN AS category,
    ROUND(COALESCE(SUM(r.WEIGHT_COLUMN), 0), 3) AS value
FROM RESULT_TABLE r
JOIN SCAN_TABLE s ON s.SCAN_ID_COLUMN = r.SCAN_ID_FK
WHERE 1 = 1
GROUP BY r.CATEGORY_COLUMN
ORDER BY value DESC, category ASC;
```

### Reason breakdown

```sql
SELECT
    r.REASON_COLUMN AS reason,
    ROUND(COALESCE(SUM(r.WEIGHT_COLUMN), 0), 3) AS value
FROM RESULT_TABLE r
JOIN SCAN_TABLE s ON s.SCAN_ID_COLUMN = r.SCAN_ID_FK
WHERE r.CATEGORY_COLUMN = %(category)s
GROUP BY r.REASON_COLUMN
ORDER BY value DESC, reason ASC;
```

## 8. Validation checklist

- Import succeeds with zero SQL errors.
- `python manage.py inspect_waste_schema` shows the expected large tables.
- You can explain the grain of one row in the fact table in one sentence.
- `SUM(weight)` over a small date range matches a manual spreadsheet check.
- `COUNT(DISTINCT device_id)` matches the device dropdown reality.
- Category totals add up to the same total waste as the summary endpoint.
- Reason percentages add up to about `100%` for a chosen category.
- Filtering by one device changes both KPI and chart outputs.
- Week filter produces the same result as the equivalent explicit date range.
- APIs return empty arrays or zeros for no-data filters, not server errors.
