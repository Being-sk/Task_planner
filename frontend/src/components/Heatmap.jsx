import React, { useMemo } from 'react';
import { format, eachDayOfInterval, subDays, isSameDay } from 'date-fns';

const Heatmap = ({ tasks }) => {
  const last90Days = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 89);
    return eachDayOfInterval({ start, end });
  }, []);

  const activityMap = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      if (task.completed && task.completedAt) {
        const date = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
        const dateStr = format(date, 'yyyy-MM-dd');
        map.set(dateStr, (map.get(dateStr) || 0) + 1);
      }
    });
    return map;
  }, [tasks]);

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h4 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Activity Heatmap</h4>
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 1fr)', gap: '4px' }}>
        {last90Days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = activityMap.get(dateStr) || 0;
          
          let opacity = 0.05;
          if (count > 0) opacity = 0.2;
          if (count > 2) opacity = 0.5;
          if (count > 4) opacity = 0.8;
          if (count > 6) opacity = 1;

          return (
            <div 
              key={dateStr}
              title={`${dateStr}: ${count} tasks completed`}
              style={{
                width: '10px',
                height: '10px',
                background: 'var(--accent-black)',
                borderRadius: '2px',
                opacity: opacity,
                transition: 'all 0.3s ease'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Heatmap;
