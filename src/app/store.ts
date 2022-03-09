import { configureStore } from '@reduxjs/toolkit';
import notesReducer from '../features/notesSlice';
import toolBoxReducer from '../features/toolBoxSlice';

export const store = configureStore({
  reducer: {
    notes: notesReducer,
    toolBox: toolBoxReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
