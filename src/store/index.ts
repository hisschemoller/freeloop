import { configureStore } from '@reduxjs/toolkit';
import notesSlice from '../features/notes-slice';

export const store = configureStore({
  reducer: {
    notes: notesSlice,
  },
});

// export some helper types used to improve type-checking
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
