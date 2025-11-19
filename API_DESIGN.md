# API and Database Design for Dal Production ERP

This document outlines the proposed database schema and API endpoints for the ERP application, reflecting the current implementation and data structures.

## Database Schema

We'll use a relational database with the following tables.

### 1. `users`

Stores user account information.

| Column                  | Type          | Constraints              | Description                               |
|-------------------------|---------------|--------------------------|-------------------------------------------|
| `id`                    | `VARCHAR(255)`| `PRIMARY KEY`            | Unique user identifier (e.g., 'manager')  |
| `name`                  | `VARCHAR(255)`| `NOT NULL`               | User's full name                          |
| `role`                  | `ENUM(...)`   | `NOT NULL`               | User's role (e.g., 'MANAGER', 'OPERATOR') |
| `password`              | `VARCHAR(255)`| `NOT NULL`               | User's password (hashed in production)    |
| `pin`                   | `VARCHAR(255)`| `NOT NULL`               | 4-digit security PIN (hashed in production)|
| `phone`                 | `VARCHAR(20)` | `NULLABLE`               | User's contact phone number               |
| `address`               | `TEXT`        | `NULLABLE`               | User's address                            |
| `email`                 | `VARCHAR(255)`| `UNIQUE, NULLABLE`       | User's email address                      |
| `emergency_contact_name`| `VARCHAR(255)`| `NULLABLE`               | Name of emergency contact                 |
| `emergency_contact_phone`| `VARCHAR(20)`| `NULLABLE`               | Phone of emergency contact                |
| `family_details`        | `TEXT`        | `NULLABLE`               | Basic family information                  |
| `status`                | `VARCHAR(20)` | `DEFAULT 'ACTIVE'`       | User status: 'ACTIVE' or 'INACTIVE'       |
| `created_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of account creation             |
| `updated_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of last profile update          |

### 2. `activity_logs`

Records all significant user actions within the system, including data submissions for production stages.

| Column      | Type          | Constraints                   | Description                                       |
|-------------|---------------|-------------------------------|---------------------------------------------------|
| `id`        | `SERIAL`      | `PRIMARY KEY`                 | Auto-incrementing unique ID for the log entry     |
| `timestamp` | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`   | When the action occurred                          |
| `user_id`   | `VARCHAR(255)`| `NOT NULL, FK to users.id`    | The user who performed the action                 |
| `user_name` | `VARCHAR(255)`| `NOT NULL`                    | The name of the user at the time of action        |
| `action`    | `VARCHAR(255)`| `NOT NULL`                    | Type of action (e.g., 'LOGIN', 'SUBMIT_STAGE_DATA') |
| `details`   | `JSONB`       | `NOT NULL`                    | Flexible JSON field storing action-specific data (e.g., form data for a stage, user ID for a profile update) |

### 3. `password_reset_requests`

Tracks user requests for password resets.

| Column              | Type          | Constraints                 | Description                               |
|---------------------|---------------|-----------------------------|-------------------------------------------|
| `request_id`        | `SERIAL`      | `PRIMARY KEY`               | Unique ID for the request                 |
| `user_id`           | `VARCHAR(255)`| `NOT NULL, FK to users.id`  | The user requesting the reset             |
| `status`            | `VARCHAR(50)` | `DEFAULT 'PENDING'`         | Status: 'PENDING', 'APPROVED'             |
| `request_timestamp` | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` | When the request was made                 |


## API Endpoints

The API is RESTful and uses JSON for requests and responses. Authentication is required for most endpoints.

### Authentication

- `POST /auth/login`
  - **Body**: `{ userId, pin, password }`
  - **Response**: `{ user: { id, name, role, ... } }` (Returns the full user object on success)

- `POST /auth/logout`
  - **Description**: Invalidates the user's session.

### Users

- `GET /users/me`
  - **Auth**: Required
  - **Response**: Returns the full profile of the currently logged-in user.

- `PUT /users/me`
  - **Auth**: Required
  - **Body**: `{ name, phone, address, email, emergencyContactName, emergencyContactPhone, familyDetails }`
  - **Response**: The updated user profile.

- `GET /users`
  - **Auth**: Manager/Admin only
  - **Response**: A list of all users in the system.

- `POST /users`
  - **Auth**: Manager/Admin only
  - **Body**: `{ name, role, email, phone, address }`
  - **Response**: `{ newUser: { id, name, role, ... }, temporaryCredentials: { pin, password } }`

- `PUT /users/:id`
  - **Auth**: Manager/Admin only
  - **Body**: `{ name, role, email, phone, address, pin, ... }`
  - **Response**: The updated user object.

- `DELETE /users/:id`
  - **Auth**: Manager/Admin only
  - **Description**: Deactivates a user account (soft delete by setting status to 'INACTIVE').
  - **Response**: `200 OK` with a confirmation message.

### Password Reset

- `POST /password-reset/request`
  - **Body**: `{ userId }`
  - **Response**: `200 OK` with a confirmation message.

- `POST /password-reset/approve`
  - **Auth**: Manager/Admin only
  - **Body**: `{ userId }`
  - **Response**: `200 OK` with a message that password has been reset to default.

### Activity Logs

- `GET /logs`
  - **Auth**: Required
  - **Query Params**: `?stageId=...`, `?dateRange=...`, `?userId=...`
  - **Response**: A list of activity log entries based on filters.

- `POST /logs/stage-data`
  - **Auth**: Required
  - **Description**: Submits data for a specific production stage.
  - **Body**: `{ stageId, stageName, submittedData: { ... } }`
  - **Response**: The newly created log entry.

### Dashboard

- `GET /dashboard/manager` (For Managers/Admins)
  - **Auth**: Manager/Admin only
  - **Query Params**: `?dateRange=...`
  - **Response**: Aggregated data for the manager dashboard.
  ```json
  {
    "kpis": {
      "throughputToday": 150.75,
      "vehiclesOnSite": 4,
      "qualityScore": 98.5
    },
    "processHealth": [
      { "stageId": "arrival", "name": "Raw Dal Arrival", "metric": "5 entries", "status": "nominal" },
      { "stageId": "quality_check_1", "name": "Initial Quality Check", "metric": "2 pending", "status": "warning" },
      ...
    ],
    "alerts": [
      { "level": "critical", "title": "High Moisture Detected", "description": "Vehicle AP07BM5555 recorded at 14.1%." },
      ...
    ]
  }
  ```

- `GET /dashboard/user` (For individual users)
  - **Auth**: Required
  - **Description**: Returns role-specific KPIs and data for the user's dashboard.
  - **Response Example (for GATE_ENTRY_OPERATOR)**:
  ```json
  {
    "kpis": {
        "vehiclesInToday": 8,
        "vehiclesOutToday": 5,
        "netFlowToday": 3
    },
    "recentActivity": [ ... ]
  }
  ```
