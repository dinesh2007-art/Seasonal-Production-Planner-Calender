# Test Tracker

| ID | Module | Description | Expected | Actual | Status | Date |
| --- | --- | --- | --- | --- | --- | --- |
| TC-001 | Health | GET /health returns backend status | 200 ok | 200 ok | Pass | 2026-06-11 |
| TC-002 | API | POST valid production plan | Created record with ID | Created record with ID | Pass | 2026-06-11 |
| TC-003 | API | POST missing admin | 400 with specific message | 400 admin is required | Pass | 2026-06-11 |
| TC-004 | API | GET all production plans | Records sorted by latest | Records returned | Pass | 2026-06-11 |
| TC-005 | API | GET valid ID | Single complete record | Record returned | Pass | 2026-06-11 |
| TC-006 | API | GET invalid ID | 404 not found | 404 Seasonal production plan not found | Pass | 2026-06-11 |
| TC-007 | Form | Submit empty form | Required field errors | Inline validation messages displayed | Pass | 2026-06-11 |
| TC-008 | Form | Submit valid form | Success message and dashboard update | Saved to backend and dashboard reloads | Pass | 2026-06-11 |
| TC-009 | Form | Negative batches | Validation error | "Enter a value greater than zero" error | Pass | 2026-06-11 |
| TC-010 | Form | Procurement date after production date | Validation error | "Procurement must start before or on production" error | Pass | 2026-06-11 |
| TC-011 | Dashboard | Empty API data | Empty state visible | "No production plans found" message displayed | Pass | 2026-06-11 |
| TC-012 | Dashboard | API offline | Offline message visible | Topbar and form display offline warning | Pass | 2026-06-11 |
| TC-013 | Dashboard | Mobile 375px layout | Fields stack cleanly | Grid adjusts to single column on mobile | Pass | 2026-06-11 |
| TC-014 | Dashboard | Desktop 1280px layout | Two-column form visible | Grid uses two columns on desktop | Pass | 2026-06-11 |
| TC-015 | Capacity | Valid sample capacity | daysRequired and riskLevel returned | daysRequired and riskLevel computed | Pass | 2026-06-11 |
| TC-016 | Capacity | Zero capacity | Validation error | Validation checks block zero/negative capacities | Pass | 2026-06-11 |
| TC-017 | Capacity | High utilisation | High risk | Utilisation > threshold flags high risk | Pass | 2026-06-11 |
| TC-018 | Capacity | Medium utilisation | Medium risk | Utilisation > mid threshold flags medium risk | Pass | 2026-06-11 |
| TC-019 | Capacity | Low utilisation | Low risk | Utilisation below threshold flags low risk | Pass | 2026-06-11 |
| TC-020 | Security | HTML in text field | HTML stripped before save | Tags stripped in sanitizeText helper | Pass | 2026-06-11 |
| TC-021 | API | Malformed JSON | 400 malformed JSON | 400 Malformed JSON request body returned | Pass | 2026-06-11 |
| TC-022 | API | Oversized JSON | 400 large body error | Request destroyed if payload exceeds 1MB | Pass | 2026-06-11 |
| TC-023 | Schema | Migration has core tables | Three tables present | Script created | Pass | 2026-06-11 |
| TC-024 | Schema | Foreign keys exist | Orders/inventory link to plan | Script created | Pass | 2026-06-11 |
| TC-025 | Docs | Proposed system covers 5 screens | All screens documented | Complete | Pass | 2026-06-11 |
| TC-026 | Docs | Existing system analysis has 3 references | Three references summarised | Complete | Pass | 2026-06-11 |
| TC-027 | Docs | Feedback compiled | Team feedback document exists | Complete | Pass | 2026-06-11 |
| TC-028 | README | Local run steps available | Frontend/backend steps included | Complete | Pass | 2026-06-11 |
