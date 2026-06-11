import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, Box, Activity, Calendar as CalendarIcon, User, Layers } from "lucide-react";

export default function CalendarView({ plans }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split("T")[0]);

  // Helper to parse config details
  const getConfig = () => {
    const saved = localStorage.getItem("sharadha_stores_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { highRiskThreshold: 100, mediumRiskThreshold: 85 };
  };
  const config = getConfig();

  // 1. Process plans to calculate production spans
  const processedPlans = plans.map(plan => {
    const expected = Number(plan.expectedOrderVolume || 0);
    const capacity = Number(plan.productionCapacityPerDay || 0);
    const batches = Number(plan.batches || 0);

    const daysRequired = Math.ceil(expected / capacity) || 1;
    const utilisation = (expected > 0 && capacity > 0 && batches > 0)
      ? Math.round((expected / (batches * capacity)) * 100)
      : 0;

    let riskLevel = "low";
    if (utilisation > config.highRiskThreshold) riskLevel = "high";
    else if (utilisation >= config.mediumRiskThreshold) riskLevel = "medium";

    // Build the production dates range
    const prodStartDate = new Date(plan.productionStartDate);
    const productionDates = [];
    for (let i = 0; i < daysRequired; i++) {
      const d = new Date(prodStartDate);
      d.setDate(prodStartDate.getDate() + i);
      productionDates.push(d.toISOString().split("T")[0]);
    }

    return {
      ...plan,
      daysRequired,
      utilisation,
      riskLevel,
      procurementDateStr: plan.ingredientProcurementStartDate,
      productionStartDateStr: plan.productionStartDate,
      productionDates
    };
  });

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

  const prevMonthDays = new Date(year, month, 0).getDate();

  const weeks = [];
  let currentWeek = [];

  // Add padding days from the previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonthDate = new Date(year, month - 1, day);
    currentWeek.push({
      day,
      dateStr: prevMonthDate.toISOString().split("T")[0],
      isCurrentMonth: false
    });
  }

  // Add days of the current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day + 1); // offset to prevent timezone shift issues
    const dateStr = dateObj.toISOString().split("T")[0];
    currentWeek.push({
      day,
      dateStr,
      isCurrentMonth: true
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add padding days for the next month
  let nextMonthDay = 1;
  while (currentWeek.length < 7 && currentWeek.length > 0) {
    const nextMonthDate = new Date(year, month + 1, nextMonthDay + 1);
    currentWeek.push({
      day: nextMonthDay,
      dateStr: nextMonthDate.toISOString().split("T")[0],
      isCurrentMonth: false
    });
    nextMonthDay++;
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Event checkers for a given date string
  const getEventsForDate = (dateStr) => {
    const procurementEvents = processedPlans.filter(p => p.procurementDateStr === dateStr);
    const productionEvents = processedPlans.filter(p => p.productionDates.includes(dateStr));
    return { procurementEvents, productionEvents };
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const selectedDateEvents = getEventsForDate(selectedDateStr);
  const selectedDateObject = new Date(selectedDateStr + "T00:00:00");

  return (
    <div className="calendar-view-container">
      <div className="calendar-grid-section">
        {/* Calendar Header */}
        <div className="calendar-header-toolbar">
          <h2>{monthNames[month]} {year}</h2>
          <div className="calendar-nav-buttons">
            <button onClick={prevMonth} className="secondary icon-btn"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="secondary small">Today</button>
            <button onClick={nextMonth} className="secondary icon-btn"><ChevronRight size={18} /></button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="calendar-weekdays-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="weekday-label">{day}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="calendar-days-grid">
          {weeks.map((week, wIdx) => (
            <React.Fragment key={wIdx}>
              {week.map((cell, dIdx) => {
                const { procurementEvents, productionEvents } = getEventsForDate(cell.dateStr);
                const hasEvents = procurementEvents.length > 0 || productionEvents.length > 0;
                const isSelected = selectedDateStr === cell.dateStr;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`calendar-cell ${!cell.isCurrentMonth ? "other-month" : ""} ${isSelected ? "selected" : ""} ${hasEvents ? "has-events" : ""}`}
                  >
                    <span className="cell-day-num">{cell.day}</span>
                    
                    <div className="cell-events-container">
                      {procurementEvents.map(p => (
                        <div key={`proc-${p.id}`} className="event-badge procurement" title={`Procurement: ${p.planName}`}>
                          🛒 {p.productionItem}
                        </div>
                      ))}
                      {productionEvents.map(p => (
                        <div key={`prod-${p.id}`} className={`event-badge production risk-${p.riskLevel}`} title={`Production: ${p.planName}`}>
                          🍳 {p.productionItem}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Selected Day Agenda panel */}
      <div className="calendar-agenda-section panel">
        <div className="agenda-header">
          <CalendarIcon size={20} className="accent-color" />
          <div>
            <h3>Schedule & Tasks</h3>
            <p className="agenda-date">{selectedDateObject.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="agenda-body">
          {/* Procurement Section */}
          {selectedDateEvents.procurementEvents.length > 0 && (
            <div className="agenda-group">
              <h4 className="agenda-group-title procurement-text">🛒 Ingredient Procurement starts today</h4>
              {selectedDateEvents.procurementEvents.map(p => (
                <div key={p.id} className="agenda-item-card">
                  <div className="agenda-item-header">
                    <strong>{p.planName}</strong>
                    <span className={`badge ${p.status}`}>{p.status}</span>
                  </div>
                  <div className="agenda-item-meta">
                    <span><User size={12} /> {p.admin}</span>
                    <span><Layers size={12} /> Item: {p.productionItem}</span>
                  </div>
                  <div className="agenda-task-list">
                    <h5>Immediate Tasks:</h5>
                    <label className="checkbox-task">
                      <input type="checkbox" defaultChecked={false} />
                      <span>Issue PO for raw materials</span>
                    </label>
                    <label className="checkbox-task">
                      <input type="checkbox" defaultChecked={false} />
                      <span>Inspect inventory quality</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Production Section */}
          {selectedDateEvents.productionEvents.length > 0 && (
            <div className="agenda-group">
              <h4 className="agenda-group-title production-text">🍳 Active Production Runs</h4>
              {selectedDateEvents.productionEvents.map(p => {
                const isStartDay = p.productionStartDateStr === selectedDateStr;
                return (
                  <div key={p.id} className="agenda-item-card">
                    <div className="agenda-item-header">
                      <strong>{p.planName}</strong>
                      <span className={`badge risk-${p.riskLevel}`}>{p.riskLevel} Risk</span>
                    </div>
                    <div className="agenda-item-meta">
                      <span><Activity size={12} /> Capacity: {p.productionCapacityPerDay}/day</span>
                      <span><ShoppingBag size={12} /> Expected Order: {p.expectedOrderVolume} units</span>
                    </div>
                    <div className="agenda-task-list">
                      <h5>Daily Status:</h5>
                      {isStartDay && (
                        <p className="start-alert">🚀 <strong>Day 1 of production!</strong> Set up equipment and safety checklists.</p>
                      )}
                      <label className="checkbox-task">
                        <input type="checkbox" defaultChecked={false} />
                        <span>Log batch {p.batches} outputs</span>
                      </label>
                      <label className="checkbox-task">
                        <input type="checkbox" defaultChecked={false} />
                        <span>Verify actual daily yield (target: {p.productionCapacityPerDay})</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedDateEvents.procurementEvents.length === 0 && selectedDateEvents.productionEvents.length === 0 && (
            <div className="agenda-empty-state">
              <CalendarIcon size={32} />
              <p>No plans or tasks scheduled for this day.</p>
              <small>Choose another date from the calendar to view its schedule.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
