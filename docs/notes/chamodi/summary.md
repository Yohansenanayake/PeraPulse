# Opportunities Service Implementation Summary

This document summarizes the full implementation of the **Opportunities Service** for the PeraPulse platform, designed for handling Job and Internship listings and Student applications.

## 🚀 Key Features

### 1. Opportunity Management (Jobs & Internships)
- **CRUD Operations**: Support for creating, reading, updating, and deleting listings.
- **Filtering**: Search opportunities by `OpportunityType` (JOB, INTERNSHIP), `OpportunityStatus` (OPEN, CLOSED), or full-text query.
- **Ownership**: Only the author (Alumni) or an Administrator can modify/delete a listing.

### 2. Application System
- **Submission**: Students can apply for open opportunities with a CV URL and optional cover letter.
- **Validation**: Built-in guard to prevent duplicate applications from the same student for the same opportunity.
- **Status Tracking**: Applications move through a lifecycle: `PENDING → REVIEWED → ACCEPTED | REJECTED`.
- **Visibility**: Authors can see all applications for their own listings; Students can see a list of their own applications.

### 3. Messaging & Events (Kafka)
The service publishes real-time events to the `perapulse.opportunities.events` topic:
- `OPPORTUNITY_POSTED`: Triggered when a new listing is created.
- `APPLICATION_SUBMITTED`: Triggered when a student applies.
- `APPLICATION_STATUS_UPDATED`: Triggered when an application is accepted/rejected, enabling notifications.

### 4. Security & Architecture
- **JWT Authentication**: Integrated with Keycloak. Extracting `sub`, `roles`, and user metadata directly from the token.
- **RBAC**: Role-based access using `@PreAuthorize` (STUDENT, ALUMNI, ADMIN roles).
- **Flyway Migrations**: Automated database schema management with version control.
- **Centralized Exception Handling**: Standardized JSON error responses for `404`, `409`, `403`, etc.

---

## 🔗 Endpoints

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/opportunities` | List/filter opportunities | AUTHENTICATED |
| **POST** | `/api/opportunities` | Create a new listing | ALUMNI |
| **GET** | `/api/opportunities/{id}` | View listing details | AUTHENTICATED |
| **PUT** | `/api/opportunities/{id}` | Update a listing | OWNER / ADMIN |
| **DELETE** | `/api/opportunities/{id}` | Remove a listing | OWNER / ADMIN |
| **POST** | `/api/opportunities/{id}/apply`| Apply for a listing | STUDENT |
| **GET** | `/api/opportunities/{id}/applications` | View applications for a listing| OWNER / ADMIN |
| **GET** | `/api/applications/me` | List current user's applications | STUDENT |
| **PATCH** | `/api/applications/{appId}/status` | Update application status | OWNER / ADMIN |

---

## 🧪 Testing Coverage

The `OpportunitiesServiceApiIntegrationTests.java` covers all critical paths using **MockMvc** with an in-memory **H2** database:
- **Security Guards**: Verified that Students cannot post listings and Alumni cannot apply.
- **Ownership Checks**: Confirmed 403 Forbidden when a non-owner tries to update a listing or view applications.
- **Business Edge Cases**:
    - Validated 409 Conflict when a student tries to apply twice.
    - Verified that only `OPEN` opportunities accept applications.
- **Event Triggers**: Verified that `OpportunityEventPublisher` is called on successful operations.
- **OpenAPI**: A full OpenAPI 3.0 specification is available at `docs/api/opportunities-service.yaml`.

---

## 🗺️ Implementation Artifacts
- **Checklist**: [task.md](file:///C:/Users/U%20S%20E%20R/.gemini/antigravity/brain/5108c942-f140-490d-8c7b-484d59e15083/task.md)
- **Detailed Plan**: [implementation_plan.md](file:///C:/Users/U%20S%20E%20R/.gemini/antigravity/brain/5108c942-f140-490d-8c7b-484d59e15083/implementation_plan.md)
- **Walkthrough**: [walkthrough.md](file:///C:/Users/U%20S%20E%20R/.gemini/antigravity/brain/5108c942-f140-490d-8c7b-484d59e15083/walkthrough.md)
