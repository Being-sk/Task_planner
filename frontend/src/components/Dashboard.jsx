import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { 
  Plus, Trash2, Calendar, Target, Sparkles, CheckCircle, 
  RotateCcw, X, Edit2, Check, ArrowUpRight, Zap, Link, 
  Compass, Maximize2, Timer, Pause, Play, Download, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePlan, atomizeTask, getResources } from '../api';
import CalendarWidget from './CalendarWidget';
import Heatmap from './Heatmap';
import { format, isSameDay } from 'date-fns';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { tasks, loading } = useSelector((state) => state.tasks);
  
  // UI State
  const [newTask, setNewTask] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [processingTaskId, setProcessingTaskId] = useState(null);

  // Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTask, setFocusTask] = useState(null);
  const [timerInFocus, setTimerInFocus] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerInFocus(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        text: newTask,
        completed: false,
        createdAt: serverTimestamp(),
        scheduledAt: Timestamp.fromDate(selectedDate),
        subtasks: [],
        resources: []
      });
      setNewTask('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        completed: !currentStatus,
        completedAt: !currentStatus ? serverTimestamp() : null
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Continue with clearing all tasks? This action is irreversible.")) return;
    const batch = writeBatch(db);
    tasks.forEach(task => batch.delete(doc(db, 'tasks', task.id)));
    try { await batch.commit(); } catch(err) { console.error(err); }
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const handleSaveEdit = async (taskId) => {
    if (!editingText.trim()) return;
    try {
      await updateDoc(doc(db, 'tasks', taskId), { text: editingText.trim() });
      setEditingTaskId(null);
    } catch (err) { console.error(err); }
  };

  const handleAtomize = async (task) => {
    setProcessingTaskId(task.id);
    try {
      const { subtasks } = await atomizeTask(task.text);
      await updateDoc(doc(db, 'tasks', task.id), { subtasks });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleGetResources = async (task) => {
    setProcessingTaskId(task.id);
    try {
      const { resources } = await getResources(task.text);
      await updateDoc(doc(db, 'tasks', task.id), { resources });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingTaskId(null);
    }
  };

  const startFocus = (task) => {
    setFocusTask(task);
    setTimerInFocus(0);
    setIsFocusMode(true);
    setIsTimerRunning(true);
  };

  const stopFocus = () => {
    setIsFocusMode(false);
    setIsTimerRunning(false);
    setFocusTask(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (taskCount) => {
    // Just a placeholder for time estimation
    return `${taskCount * 15}m`;
  };

  const handleGeneratePlan = async () => {
    const userGoal = window.prompt('Define your objective (e.g., "Master Swift Development")');
    if (!userGoal) return;
    const durationInput = window.prompt('Timescale in days? (e.g., "14")');
    if (!durationInput) return;
    const duration = parseInt(durationInput);
    if (isNaN(duration) || duration < 1) return;

    setGenerating(true);
    try {
      const data = await generatePlan(`${userGoal} in ${duration} days`);
      const totalTasks = data.tasks.length;
      const tasksPerDay = Math.ceil(totalTasks / duration);
      const batch = writeBatch(db);
      let startDate = new Date(selectedDate);
      
      data.tasks.forEach((t, i) => {
        const dayOffset = Math.floor(i / tasksPerDay);
        const taskDate = new Date(startDate);
        taskDate.setDate(taskDate.getDate() + dayOffset);
        const taskRef = doc(collection(db, 'tasks'));
        batch.set(taskRef, {
          userId: user.uid,
          text: t.text,
          completed: false,
          createdAt: serverTimestamp(),
          scheduledAt: Timestamp.fromDate(taskDate),
          subtasks: [],
          resources: []
        });
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (task.scheduledAt) {
      const date = task.scheduledAt.toDate ? task.scheduledAt.toDate() : new Date(task.scheduledAt);
      return isSameDay(date, selectedDate);
    }
    return true;
  });

  const remainingCount = filteredTasks.filter(t => !t.completed).length;
  const totalCount = filteredTasks.length;
  const progress = totalCount > 0 ? Math.round(((totalCount - remainingCount) / totalCount) * 100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '80px', alignItems: 'start' }}>
      
      {/* --- DEEP FOCUS OVERLAY --- */}
      <AnimatePresence>
        {isFocusMode && focusTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
              background: 'var(--bg-primary)', zIndex: 999, display: 'flex', 
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '40px'
            }}
          >
            <button 
                onClick={stopFocus}
                style={{ position: 'absolute', top: '40px', right: '40px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
                <X size={32} />
            </button>

            <div style={{ textAlign: 'center', maxWidth: '800px' }}>
                <div style={{ 
                    fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', 
                    letterSpacing: '0.2em', color: 'var(--text-tertiary)', marginBottom: '32px' 
                }}>
                    Deep Focus Mode
                </div>
                <h2 style={{ fontSize: '4rem', fontWeight: '800', letterSpacing: '-0.05em', lineHeight: 1.1, marginBottom: '48px' }}>
                    {focusTask.text}
                </h2>
                
                <div style={{ fontSize: '6rem', fontWeight: '300', fontFamily: 'monospace', marginBottom: '64px', color: 'var(--accent-black)' }}>
                    {formatTime(timerInFocus)}
                </div>

                <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="btn-primary" 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', padding: 0 }}
                    >
                        {isTimerRunning ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" />}
                    </button>
                    <button 
                        onClick={() => { toggleTask(focusTask.id, focusTask.completed); stopFocus(); }}
                        className="btn-primary" 
                        style={{ height: '80px', borderRadius: '40px', padding: '0 40px' }}
                    >
                        Complete Task
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ padding: 0 }}>
        {/* Header Section */}
        <header style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Timeline</div>
              <h1 style={{ fontSize: '3.5rem', fontWeight: '800', letterSpacing: '-0.05em', lineHeight: 1 }}>{format(selectedDate, 'MMMM do')}</h1>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '14px', border: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-black)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Progress</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{progress}%</div>
                    </div>
                </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>You have {remainingCount} pending objectives out of {totalCount} total.</p>
            <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                <RotateCcw size={14} /> Reset Timeline
            </button>
          </div>
        </header>

        {/* Task Input */}
        <section style={{ marginBottom: '64px' }}>
          <form onSubmit={handleAddTask} style={{ position: 'relative', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.03))' }}>
            <input type="text" placeholder="Deploy a new task..." className="glass-input" style={{ padding: '24px 140px 24px 32px', fontSize: '1.1rem', borderRadius: '20px', borderWidth: '2px' }} value={newTask} onChange={(e) => setNewTask(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ position: 'absolute', right: '10px', top: '10px', bottom: '10px', borderRadius: '14px', padding: '0 28px' }}>
              <Plus size={20} strokeWidth={2.5} /> <span>Queue</span>
            </button>
          </form>
        </section>

        {/* Task List */}
        <section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px' }}><span className="loader"></span></div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '120px 40px', background: 'var(--bg-tertiary)', borderRadius: '24px', border: '2px dashed var(--border-medium)', opacity: 0.8 }}>
                <div style={{ color: 'var(--text-tertiary)', marginBottom: '20px' }}><Calendar size={64} strokeWidth={1} /></div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Clean Slate</h3>
                <p style={{ color: 'var(--text-secondary)' }}>No tasks scheduled for this architecture.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task, index) => (
                  <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="glass-card task-card" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', borderRadius: '20px', border: task.completed ? '1.5px solid transparent' : '1.5px solid var(--border-light)', opacity: task.completed ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div onClick={() => toggleTask(task.id, task.completed)} style={{ cursor: 'pointer', color: task.completed ? 'var(--accent-black)' : 'var(--border-medium)', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {task.completed ? (
                          <div style={{ width: '32px', height: '32px', background: 'var(--accent-black)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Check size={18} strokeWidth={4} /></div>
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid currentColor', transition: 'all 0.2s ease' }} />
                        )}
                      </div>
                      
                      {editingTaskId === task.id ? (
                        <div style={{ flex: 1 }}><input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' ? handleSaveEdit(task.id) : e.key === 'Escape' ? setEditingTaskId(null) : null} autoFocus className="glass-input" style={{ padding: '8px 12px', height: 'auto', fontSize: '1rem', borderRadius: '12px' }} /></div>
                      ) : (
                        <>
                          <span onDoubleClick={() => handleEditTask(task)} style={{ flex: 1, fontSize: '1.15rem', fontWeight: '500', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)', cursor: 'text', letterSpacing: '-0.02em' }}>{task.text}</span>
                          <div className="task-actions" style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => startFocus(task)} title="Focus Mode" style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '8px' }}><Maximize2 size={18} /></button>
                            <button onClick={() => handleAtomize(task)} title="Atomize" style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '8px' }}><Zap size={18} /></button>
                            <button onClick={() => handleGetResources(task)} title="Resources" style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '8px' }}><Link size={18} /></button>
                            <button onClick={() => handleDeleteTask(task.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '8px' }}><Trash2 size={18} /></button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Subtasks and Resources */}
                    {(task.subtasks?.length > 0 || task.resources?.length > 0) && (
                      <div style={{ padding: '16px 0 0 56px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {task.subtasks?.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={12} /> Sub-tasks</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {task.subtasks.map((st, i) => (
                                <div key={i} style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{st}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {task.resources?.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Compass size={12} /> Learning Resources</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {task.resources.map((res, i) => (
                                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <ExternalLink size={14} /> {res.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {processingTaskId === task.id && (
                      <div style={{ padding: '8px 56px' }}><div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div></div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </main>

      <aside style={{ position: 'sticky', top: '120px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <CalendarWidget tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <Heatmap tasks={tasks} />

        <div className="glass-card" style={{ padding: '32px', background: 'var(--accent-black)', color: 'white', borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><Sparkles size={24} color="white" /> <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Architect AI</span></div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', lineHeight: '1.6' }}>Generate a high-performance roadmap tailored to your specific objectives.</p>
            <button onClick={handleGeneratePlan} disabled={generating} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                {generating ? 'Calculating...' : (<><span>Engineer Roadmap</span> <ArrowUpRight size={18} /></>)}
            </button>
        </div>

        <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Project Velocity</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, height: '6px', background: 'var(--border-light)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-black)', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{progress}%</span>
            </div>
        </div>
      </aside>
      
      <style>{`
        .task-card .task-actions { opacity: 0; transform: translateX(10px); transition: all 0.3s ease; }
        .task-card:hover .task-actions { opacity: 1; transform: translateX(0); }
        .task-card { transform-origin: center; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  );
};

export default Dashboard;
