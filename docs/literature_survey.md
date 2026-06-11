# Literature Survey and Existing Systems

## Reference 1: Spreadsheet-Based Production Planning

- It supports quick tabular planning for small businesses.
- It is easy to start because staff already understand rows, columns, and formulas.
- It becomes difficult when multiple people edit the same plan without clear ownership.
- It has limited validation unless formulas and protected ranges are carefully maintained.
- It is relevant because Sharadha Stores currently risks scattered records during festival demand.

## Reference 2: Inventory Management Systems

- These systems track stock levels, reorder points, suppliers, and item movement.
- They are strong for inventory visibility but usually do not model festival production batches in detail.
- They help prevent material shortages when ingredient requirements are known early.
- Their limitation is that they often focus on stock after purchase, not production planning before purchase.
- The proposed calendar fills this gap by linking expected orders, procurement dates, and capacity.

## Reference 3: Manufacturing Resource Planning

- MRP systems calculate material needs based on demand, lead time, and production capacity.
- They provide structured scheduling, dependency tracking, and planned purchase dates.
- They can be too complex for a small home-based food business.
- The key learning is to keep the logic practical and explainable.
- The project adapts MRP-style planning into a simpler Sharadha Stores workflow.

## Backend/Data Architecture Comparison

| Existing Approach | Strength | Limitation | Gap Filled by This Project |
| --- | --- | --- | --- |
| Spreadsheet tracker | Fast to create | Manual validation and no API | Central API with validation rules |
| Inventory app | Tracks stock | Weak festival batch planning | Links order volume to production capacity |
| MRP software | Strong planning logic | Too heavy for small business | Lightweight capacity utilisation engine |

## Suitability for Sharadha Stores

The Seasonal Production Planning Calendar is suitable for Sharadha Stores because it focuses on the exact planning pain point: converting expected festival demand into batches, procurement dates, production schedules, and capacity checks. Instead of forcing the business into a large enterprise system, it gives a smaller workflow that can grow from a simple form and dashboard into reports, alerts, and deployment.
