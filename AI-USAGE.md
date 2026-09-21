## How I Worked With AI

AI-assisted development was part of my workflow throughout the assignment, as encouraged in the brief. I used different tools for different stages and reviewed the generated work against the original requirements before accepting changes.

### Tools Used

**ChatGPT - Requirements analysis and architecture**

I used ChatGPT first to break the assignment into explicit functional requirements, business rules, technical constraints, entities, API operations, validation rules, edge cases, testing scenarios, and a requirement-to-test traceability matrix.

I also used it to reason about where each rule should be enforced, particularly the distinction between frontend validation and backend business-rule enforcement.

**Codex - Backend implementation, review, and verification**

I used Codex to implement the Node.js/Express/TypeScript backend, Prisma/PostgreSQL schema, seed data, API endpoints, validation, authorization, business logic, and automated tests based on the analyzed requirements.

I then used Codex again to review the implementation against the assignment requirements and to fix review-level details: making priority required by the API, renaming the overdue flag for clearer semantics, adding 24-hour boundary tests, and cleaning private/generated files from the submission.

**Lovable - Frontend implementation**

I used Lovable to build the React frontend UI. The prompt explicitly instructed it to build the frontend only, consume real API data, avoid mock data, and keep the interface clean and usable.

### Prompts Used

#### 1. Requirements / Architecture Prompt

> Analyze the Hellotree maintenance request tracker assignment as a senior software engineer. Extract every explicit functional requirement, business rule, technical constraint, implicit requirement, entity, relationship, role, permission, API operation, validation rule, edge case, testing scenario, and likely manual review scenario. Separate frontend, backend/API, database, business logic, testing, and documentation concerns. Identify ambiguities and recommend sensible assumptions. Create an MVP scope and a requirement-to-implementation-to-test traceability matrix. Do not implement code yet.

#### 2. Backend Implementation Prompt

> Implement the Hellotree maintenance tracker backend professionally using Node.js, TypeScript, Express, Prisma, and PostgreSQL. Inspect the existing repository first. Implement the client/admin workflow, fake-user mechanism, database schema, migrations, seed data, validation, authorization, API endpoints, forward-only status transitions, mandatory resolution notes for Done, and the urgent-New-over-24-hours rule. The API must enforce the business rules independently of the frontend. Add automated API/business-rule tests, documentation, and a fresh-setup workflow. Do not implement the frontend and do not add unnecessary scope.

The complete implementation prompt was also used as the detailed engineering specification for the backend.

#### 3. Frontend Prompt

I used Lovable with a frontend-only prompt specifying:

* React + TypeScript
* clean responsive maintenance tracker UI
* Hellotree yellow/black/white visual direction
* client/admin role switch
* request creation form
* client request list
* admin request list
* status filters
* client filters
* valid forward-only status actions
* required resolution-note dialog
* overdue indication
* real API-ready data structures
* no mock data
* no fake requests
* no backend/database implementation
* loading, empty, validation, success, and error states

#### 4. Verification

After implementation, I reviewed the generated code and tests against the original assignment and specifically checked the three business rules and API behavior rather than relying only on the UI.

### One Thing AI Got Wrong

An early AI-generated interpretation treated some workflow restrictions too heavily as UI behavior. I caught this by rereading the assignment, particularly the requirement that the resolution-note rule must be enforced by the API.

I then verified the backend service and automated tests to ensure that invalid status transitions and missing resolution notes are rejected by the API even when the frontend is bypassed.

### One Thing I Accepted Without Changing

I accepted the overall seed-data structure because it directly supports the review flow requested by Hellotree: one admin, three clients, and twelve varied requests, including urgent requests that have already exceeded 24 hours.

This allows the reviewer to see the overdue behavior immediately without waiting or modifying the database manually.

### One Thing I Would Not Let AI Do Unsupervised

I would not allow an AI tool to deploy changes, run migrations, or modify production data on a live client system without human review.

Those actions can affect availability, privacy, data integrity, and billing. AI can misunderstand the environment or apply a technically valid change to the wrong target, so the developer must verify the environment and impact before approving such actions.
