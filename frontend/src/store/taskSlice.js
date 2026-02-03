import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: [],
  loading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action) => {
      state.tasks = action.payload;
      state.loading = false;
    },
    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
    },
    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    setTaskLoading: (state, action) => {
      state.loading = action.payload;
    },
    setTaskError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setTasks, addTask, updateTask, deleteTask, setTaskLoading, setTaskError } = taskSlice.actions;
export default taskSlice.reducer;
