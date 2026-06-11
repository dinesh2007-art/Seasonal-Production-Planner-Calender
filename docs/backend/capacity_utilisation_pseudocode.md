# Capacity And Utilisation Tracking Engine Pseudocode

```text
INPUT:
  expectedOrderVolume
  batches
  productionCapacityPerDay
  productionStartDate
  productionEndDate
  ingredientProcurementStartDate
  ingredientProcurementEndDate

VALIDATE:
  if expectedOrderVolume <= 0:
    return error "Expected order volume must be greater than zero"

  if batches <= 0:
    return error "At least one production batch is required"

  if productionCapacityPerDay <= 0:
    return error "Production capacity per day must be greater than zero"

  if ingredientProcurementEndDate >= productionStartDate:
    return warning "Procurement timeline is too close to production start"

CALCULATE:
  availableProductionDays = days_between(productionStartDate, productionEndDate) + 1
  daysRequired = ceiling(expectedOrderVolume / productionCapacityPerDay)
  totalPlannedCapacity = availableProductionDays * productionCapacityPerDay
  utilisationPercentage = round((expectedOrderVolume / totalPlannedCapacity) * 100)
  batchUtilisation = round((expectedOrderVolume / (batches * productionCapacityPerDay)) * 100)

RISK:
  if daysRequired > availableProductionDays:
    riskLevel = "high"
    recommendation = "Increase production days, daily capacity, or number of batches"
  else if utilisationPercentage >= 85:
    riskLevel = "medium"
    recommendation = "Plan buffer stock or add backup capacity"
  else:
    riskLevel = "low"
    recommendation = "Current plan can meet expected festival demand"

OUTPUT:
  daysRequired
  availableProductionDays
  totalPlannedCapacity
  utilisationPercentage
  batchUtilisation
  riskLevel
  recommendation
```
