import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase/config';
import { setUser, setLoading } from './store/authSlice';
import { setTasks, setTaskLoading } from './store/taskSlice';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        dispatch(setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }));
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(setTaskLoading(true));
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        dispatch(setTasks(tasks));
      });
      return () => unsubscribe();
    }
  }, [user, dispatch]);

  if (loading) {
    return (
      <div className="auth-layout">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main>
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AuthPage />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
