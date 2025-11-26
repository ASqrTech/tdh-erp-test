# API and Database Design for Dal Production ERP

This document outlines the comprehensive database schema and API endpoints for the ERP application. It moves beyond the initial prototype structure to a fully normalized relational database design suitable for production deployment.

## Database Schema

The database is designed using a relational model (SQL).

### 1. Core System Tables

#### `users`
Stores user account information and authentication details.

| Column                  | Type             | Constraints                 | Description                               |
|-------------------------|------------------|-----------------------------|-------------------------------------------|
| `id`                    | `VARCHAR(50)`    | `PRIMARY KEY`               | Unique User ID (e.g., 'manager')          |
| `name`                  | `VARCHAR(100)`   | `NOT NULL`                  | Full name                                 |
| `role`                  | `VARCHAR(50)`    | `NOT NULL`                  | Role (e.g., 'GATE_ENTRY_OPERATOR')        |
| `password_hash`         | `VARCHAR(255)`   | `NOT NULL`                  | Bcrypt hashed password                    |
| `pin_hash`              | `VARCHAR(255)`   | `NOT NULL`                  | Hashed 4-digit security PIN               |
| `email`                 | `VARCHAR(100)`   | `UNIQUE, NULLABLE`          |                                           |
| `phone`                 | `VARCHAR(20)`    | `NULLABLE`                  |                                           |
| `address`               | `TEXT`           | `NULLABLE`                  |                                           |
| `emergency_contact_name`| `VARCHAR(100)`   | `NULLABLE`                  |                                           |
| `emergency_contact_phone`| `VARCHAR(20)`   | `NULLABLE`                  |                                           |
| `Other_details`        | `TEXT`           | `NULLABLE`                  | JSON or text blob                         |
| `status`                | `VARCHAR(20)`    | `DEFAULT 'ACTIVE'`          | 'ACTIVE' or 'INACTIVE'                    |
| `created_at`            | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |

#### `audit_logs`
System-wide audit trail for sensitive actions (logins, profile changes, deletions).

| Column      | Type          | Constraints                 | Description                               |
|-------------|---------------|-----------------------------|-------------------------------------------|
| `id`        | `BIGSERIAL`   | `PRIMARY KEY`               |                                           |
| `user_id`   | `VARCHAR(50)` | `FK to users.id`            | Who performed the action                  |
| `action`    | `VARCHAR(50)` | `NOT NULL`                  | e.g., 'LOGIN', 'UPDATE_PROFILE'           |
| `details`   | `JSONB`       | `NULLABLE`                  | Context specific details                  |
| `ip_address`| `VARCHAR(45)` | `NULLABLE`                  | IP address of the user                    |
| `timestamp` | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` |                                           |

#### `password_reset_requests`
| Column      | Type          | Constraints                 | Description                               |
|-------------|---------------|-----------------------------|-------------------------------------------|
| `id`        | `SERIAL`      | `PRIMARY KEY`               |                                           |
| `user_id`   | `VARCHAR(50)` | `FK to users.id`            |                                           |
| `status`    | `VARCHAR(20)` | `DEFAULT 'PENDING'`         | 'PENDING', 'APPROVED', 'REJECTED'         |
| `created_at`| `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` |                                           |

---

### 2. Production Process Tables
Each stage of the ERP workflow has a dedicated table.

#### `gate_entries` (Stage: Raw Dal Arrival)
Records vehicle entry and exit at the plant gate.

| Column          | Type             | Constraints                 | Description                               |
|-----------------|------------------|-----------------------------|-------------------------------------------|
| `id`            | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `gate_mode`     | `VARCHAR(10)`    | `NOT NULL`                  | 'IN' or 'OUT'                             |
| `serial_number` | `VARCHAR(50)`    | `INDEX`                     | Manual or Auto-generated S/N              |
| `vehicle_number`| `VARCHAR(20)`    | `NOT NULL, INDEX`           | e.g., AP07BM5555                          |
| `driver_name`   | `VARCHAR(100)`   |                             |                                           |
| `driver_phone`  | `VARCHAR(20)`    |                             |                                           |
| `timestamp`     | `TIMESTAMP`      | `NOT NULL`                  | Entry/Exit time                           |
| `created_by`    | `VARCHAR(50)`    | `FK to users.id`            | Operator ID                               |
| **IN Specific** |                  |                             |                                           |
| `from_broker`   | `VARCHAR(100)`   |                             |                                           |
| `to_location`   | `VARCHAR(100)`   |                             |                                           |
| **OUT Specific**|                  |                             |                                           |
| `quantity`      | `DECIMAL(10,2)`  |                             |                                           |
| `from_location` | `VARCHAR(100)`   |                             |                                           |
| `broker_name`   | `VARCHAR(100)`   |                             |                                           |
| `broker_phone`  | `VARCHAR(20)`    |                             |                                           |
| `note`          | `TEXT`           |                             |                                           |

#### `weighing_records` (Stage: Weighing)
Records gross, tare, and net weights.

| Column          | Type             | Constraints                 | Description                               |
|-----------------|------------------|-----------------------------|-------------------------------------------|
| `id`            | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `vehicle_number`| `VARCHAR(20)`    | `NOT NULL, INDEX`           | Links to gate entry                       |
| `ticket_number` | `VARCHAR(50)`    | `UNIQUE`                    | Weighbridge ticket no                     |
| `in_weight`     | `DECIMAL(10,2)`  | `NOT NULL`                  | Gross Weight (Quintals)                   |
| `out_weight`    | `DECIMAL(10,2)`  | `NOT NULL`                  | Tare Weight (Quintals)                    |
| `net_weight`    | `DECIMAL(10,2)`  | `GENERATED`                 | (In - Out)                                |
| `sample_collector`| `VARCHAR(100)` |                             |                                           |
| `note`          | `TEXT`           |                             |                                           |
| `timestamp`     | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`    | `VARCHAR(50)`    | `FK to users.id`            | Operator ID                               |

#### `quality_inspections` (Stage: Initial Quality Check)
Lab analysis of raw material samples.

| Column            | Type             | Constraints                 | Description                               |
|-------------------|------------------|-----------------------------|-------------------------------------------|
| `id`              | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `vehicle_number`  | `VARCHAR(20)`    | `NOT NULL, INDEX`           |                                           |
| `transaction_id`  | `VARCHAR(50)`    | `UNIQUE`                    | Lab Transaction ID                        |
| `moisture_percent`| `DECIMAL(5,2)`   |                             | Critical quality metric                   |
| `size_analysis_7` | `DECIMAL(5,2)`   |                             |                                           |
| `size_analysis_5` | `DECIMAL(5,2)`   |                             |                                           |
| `size_analysis_4` | `DECIMAL(5,2)`   |                             |                                           |
| `small_mud_pct`   | `DECIMAL(5,2)`   |                             |                                           |
| `big_mud_stones_pct`| `DECIMAL(5,2)` |                             |                                           |
| `damage_1`        | `DECIMAL(5,2)`   |                             |                                           |
| `damage_2`        | `DECIMAL(5,2)`   |                             |                                           |
| `report_file_url` | `VARCHAR(255)`   |                             | Path to uploaded image/PDF                |
| `status`          | `VARCHAR(20)`    | `DEFAULT 'PENDING'`         | 'APPROVED', 'REJECTED'                    |
| `note`            | `TEXT`           |                             |                                           |
| `timestamp`       | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`      | `VARCHAR(50)`    | `FK to users.id`            | Supervisor ID                             |

#### `bin_operations` (Stage: Bin Operation)
Tracks movement of material into silos/bins.

| Column          | Type             | Constraints                 | Description                               |
|-----------------|------------------|-----------------------------|-------------------------------------------|
| `id`            | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `vehicle_number`| `VARCHAR(20)`    | `NOT NULL`                  |                                           |
| `bin_status`    | `VARCHAR(20)`    | `NOT NULL`                  | 'Fill', 'Discharge', 'Maintenance'        |
| `rm1`           | `VARCHAR(50)`    |                             | Raw Material Type 1                       |
| `rm2`           | `VARCHAR(50)`    |                             | Raw Material Type 2                       |
| `rm3`           | `VARCHAR(50)`    |                             | Raw Material Type 3                       |
| `ob_qty`        | `DECIMAL(10,2)`  |                             | Opening Balance                           |
| `cb_qty`        | `DECIMAL(10,2)`  |                             | Closing Balance                           |
| `wb_qty`        | `DECIMAL(10,2)`  |                             | Weighing Balance                          |
| `pb_qty`        | `DECIMAL(10,2)`  |                             | Processing Balance                        |
| `sr_in_qty`     | `DECIMAL(10,2)`  |                             | Sales Return IN                           |
| `hub_qty`       | `DECIMAL(10,2)`  |                             |                                           |
| `timestamp`     | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`    | `VARCHAR(50)`    | `FK to users.id`            | Operator ID                               |

#### `cleaning_logs` (Stage: Cleaning)
| Column          | Type             | Constraints                 | Description                               |
|-----------------|------------------|-----------------------------|-------------------------------------------|
| `id`            | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `batch_id`      | `VARCHAR(50)`    | `NOT NULL`                  |                                           |
| `machine_no`    | `VARCHAR(50)`    |                             |                                           |
| `timestamp`     | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`    | `VARCHAR(50)`    | `FK to users.id`            | Operator ID                               |

#### `storage_records` (Stage: Storage)
Inventory tracking after cleaning/binning.

| Column            | Type             | Constraints                 | Description                               |
|-------------------|------------------|-----------------------------|-------------------------------------------|
| `id`              | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `entered_vehicle` | `VARCHAR(20)`    |                             | Reference to source vehicle               |
| `quantity`        | `DECIMAL(10,2)`  | `NOT NULL`                  | Weight in Quintals                        |
| `material_content`| `VARCHAR(50)`    |                             | Material Grade/Type                       |
| `jute_bags`       | `INTEGER`        |                             |                                           |
| `plastic_bags`    | `INTEGER`        |                             |                                           |
| `location_area`   | `VARCHAR(50)`    |                             | e.g., Kallam, Baddi                       |
| `location_unit`   | `VARCHAR(50)`    |                             | e.g., 1, 2, A, B                          |
| `timestamp`       | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`      | `VARCHAR(50)`    | `FK to users.id`            | Store Manager ID                          |

#### `processing_logs` (Stage: Processing)
| Column          | Type             | Constraints                 | Description                               |
|-----------------|------------------|-----------------------------|-------------------------------------------|
| `id`            | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `process_id`    | `VARCHAR(50)`    | `UNIQUE`                    |                                           |
| `machine_id`    | `VARCHAR(50)`    |                             |                                           |
| `parameters`    | `TEXT`           |                             | Process params (temp, speed, etc.)        |
| `timestamp`     | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`    | `VARCHAR(50)`    | `FK to users.id`            | Operator ID                               |

#### `final_quality_checks` (Stage: Final QC)
| Column            | Type             | Constraints                 | Description                               |
|-------------------|------------------|-----------------------------|-------------------------------------------|
| `id`              | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `process_ref_id`  | `VARCHAR(50)`    |                             | Link to Processing Log                    |
| `final_moisture`  | `DECIMAL(5,2)`   |                             |                                           |
| `split_pct`       | `DECIMAL(5,2)`   |                             |                                           |
| `remarks`         | `TEXT`           |                             |                                           |
| `status`          | `VARCHAR(20)`    |                             | 'PASSED', 'FAILED'                        |
| `timestamp`       | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`      | `VARCHAR(50)`    | `FK to users.id`            | Supervisor ID                             |

#### `packing_logs` (Stage: Packing)
| Column          | Type             | Constraints                 | Description                               |
|-----------------|------------------|-----------------------------|-------------------------------------------|
| `id`            | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `packing_id`    | `VARCHAR(50)`    |                             |                                           |
| `bag_size_kg`   | `INTEGER`        |                             | 25, 50, 100                               |
| `no_of_bags`    | `INTEGER`        |                             |                                           |
| `timestamp`     | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`    | `VARCHAR(50)`    | `FK to users.id`            | Supervisor ID                             |

#### `dispatch_logs` (Stage: Dispatch)
| Column          | Type             | Constraints                 | Description                               |
|-----------------|------------------|-----------------------------|-------------------------------------------|
| `id`            | `BIGSERIAL`      | `PRIMARY KEY`               |                                           |
| `dispatch_id`   | `VARCHAR(50)`    |                             |                                           |
| `destination`   | `VARCHAR(150)`   |                             |                                           |
| `truck_no`      | `VARCHAR(20)`    |                             |                                           |
| `timestamp`     | `TIMESTAMP`      | `DEFAULT CURRENT_TIMESTAMP` |                                           |
| `created_by`    | `VARCHAR(50)`    | `FK to users.id`            | Logistics Officer ID                      |

---

## API Endpoints

RESTful endpoints are structured around these resources.

### Auth & Users
*   `POST /auth/login` - Authenticate user.
*   `GET /users/me` - Get current user profile.
*   `PUT /users/me` - Update profile.
*   `GET /users` - List all users (Manager/Admin).
*   `POST /users` - Create user.
*   `DELETE /users/:id` - Deactivate user.
*   `POST /users/reset-password` - Approve reset request.

### Process Data Endpoints
Each stage has standard CRUD endpoints.

#### Gate Entry
*   `GET /api/gate-entries` - List entries (supports filtering by date, mode, vehicle).
*   `POST /api/gate-entries` - Create new entry/exit log.
*   `GET /api/gate-entries/:id` - Get specific details.

#### Weighing
*   `GET /api/weighing` - List weighing records.
*   `POST /api/weighing` - Create weighing record.

#### Quality
*   `GET /api/quality-checks` - List inspections.
*   `POST /api/quality-checks` - Submit lab report.
*   `POST /api/quality-checks/:id/approve` - Manager approval (optional workflow).

#### Bin Operations
*   `GET /api/bin-operations` - List bin movements.
*   `POST /api/bin-operations` - Log bin activity.

#### Storage
*   `GET /api/storage` - View inventory logs.
*   `POST /api/storage` - Add stock to storage.

#### Analytics (Manager)
*   `GET /api/analytics/dashboard` - Aggregate KPIs.
*   `GET /api/analytics/stage/:stageId` - Detailed stats for a specific stage (histograms, pie charts).
