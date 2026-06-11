# Seasonal Production Planning Calendar Use Case Diagram

```mermaid
flowchart LR
  Admin["Admin"]
  Staff["Staff"]
  Management["Management"]
  Backend["Seasonal Production Planning Calendar Backend"]

  Admin --> UC1["Create production plan"]
  Admin --> UC2["Update production plan"]
  Admin --> UC3["Review capacity utilisation"]
  Admin --> UC4["Approve or revise plan"]

  Staff --> UC5["Enter expected order volume"]
  Staff --> UC6["Update ingredient procurement details"]
  Staff --> UC7["View production schedule"]

  Management --> UC8["View dashboard summary"]
  Management --> UC9["Review reports and trends"]

  UC1 --> Backend
  UC2 --> Backend
  UC3 --> Backend
  UC4 --> Backend
  UC5 --> Backend
  UC6 --> Backend
  UC7 --> Backend
  UC8 --> Backend
  UC9 --> Backend
```

## Actor Actions

- Admin creates and manages seasonal production plans for upcoming festivals.
- Staff enters order volume, ingredient procurement, and production details.
- Management reviews dashboard summaries, capacity risk, and planning reports.
- Backend validates data, stores records, calculates capacity utilisation, and returns dashboard-ready responses.
