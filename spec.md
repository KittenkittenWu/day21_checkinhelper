# Project: Arc Style Check-in System

## 1. Google Sheet Schema (Backend)
- **Sheet Name**: `Attendees`
- **Columns**:
  - `A` (idx 0): `id` (String, **Primary Key**, Student ID)
  - `B` (idx 1): `phone` (String, **Search Key**)
  - `C` (idx 2): `name` (String)
  - `D` (idx 3): `course_name` (String)
  - `E` (idx 4): `course_date` (String, format "yyyy/mm/dd")
  - `F` (idx 5): `course_type` (String, e.g., "Online"/"Offline")
  - `G` (idx 6): `status` (String, "Pending" / "CheckedIn")
  - `H` (idx 7): `check_in_time` (ISO 8601 String)

## 2. API Interface (Google Apps Script)
- **Method**: POST
- **Content-Type**: application/json
- **Actions**:
  1. **Query (By Phone)**:
     - Payload: `{ "action": "query", "phone": "0912345678" }`
     - Logic: Search Column B (phone).
     - Success Response: `{ "success": true, "data": { "id": "A001", "name": "...", "course_date": "...", ... } }`
  2. **Check-in (By ID)**:
     - Payload: `{ "action": "checkin", "id": "A001" }`
     - Logic: Search Column A (id), Update Status & Time.
     - Reason: ID is the unique identifier, safer for write operations.
     - Success Response: `{ "success": true, "timestamp": "..." }`

## 3. Frontend Architecture
- **Views**: Search (Phone Input), Confirm (Show ID/Name/Date), Success.