import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const CalendarWidget = ({ tasks, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  // Days where ALL tasks are completed
  const completedDays = useMemo(() => {
    const dayTaskMap = new Map(); // date -> { total, completed }
    
    tasks.forEach(task => {
      if (task.scheduledAt) {
        const date = task.scheduledAt.toDate ? task.scheduledAt.toDate() : new Date(task.scheduledAt);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (!dayTaskMap.has(dateStr)) {
          dayTaskMap.set(dateStr, { total: 0, completed: 0 });
        }
        
        const stats = dayTaskMap.get(dateStr);
        stats.total++;
        if (task.completed) stats.completed++;
      }
    });
    
    const fullyCompletedDays = new Set();
    dayTaskMap.forEach((stats, dateStr) => {
      if (stats.total > 0 && stats.completed === stats.total) {
        fullyCompletedDays.add(dateStr);
      }
    });
    
    return fullyCompletedDays;
  }, [tasks]);

  const scheduledDays = useMemo(() => {
    const dates = new Set();
    tasks.forEach(task => {
        if (task.scheduledAt) {
            const date = task.scheduledAt.toDate ? task.scheduledAt.toDate() : new Date(task.scheduledAt);
            dates.add(format(date, 'yyyy-MM-dd'));
        }
    });
    return dates;
  }, [tasks]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
            {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={prevMonth} 
            className="calendar-nav-btn"
            style={{ 
              background: 'none', 
              border: '1px solid var(--border-light)', 
              color: 'var(--text-primary)', 
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
              <ChevronLeft size={16} />
          </button>
          <button 
            onClick={nextMonth} 
            className="calendar-nav-btn"
            style={{ 
              background: 'none', 
              border: '1px solid var(--border-light)', 
              color: 'var(--text-primary)', 
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
              <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '4px',
        textAlign: 'center'
      }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`head-${i}`} style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: '500', paddingBottom: '12px' }}>
            {d}
          </div>
        ))}
        
        {daysInMonth.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isCompleted = completedDays.has(dayStr);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasTask = scheduledDays.has(dayStr);
          
          return (
            <div 
              key={dayStr} 
              onClick={() => onSelectDate(day)}
              style={{ 
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                background: isSelected ? 'var(--accent-black)' : 'transparent',
                border: isTodayDate && !isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                position: 'relative',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: isSelected || isTodayDate ? '600' : '400',
                color: isSelected ? '#FFFFFF' : (isTodayDate ? 'var(--text-primary)' : 'var(--text-secondary)'),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              className="calendar-day"
            >
              {format(day, 'd')}
              
              {hasTask && !isSelected && !isCompleted && (
                  <div style={{
                      position: 'absolute',
                      bottom: '6px',
                      width: '3px',
                      height: '3px',
                      borderRadius: '50%',
                      background: 'var(--text-tertiary)'
                  }} />
              )}

              {isCompleted && (
                <div style={{ 
                  position: 'absolute', 
                  top: '2px', 
                  right: '2px',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary)'
                }}>
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWidget;
