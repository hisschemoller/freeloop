/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';
import Note from '../interfaces/Note';

interface NotesState {
  notes: Note[];
  selectedIndex: number;
}

const initialState: NotesState = {
  notes: [],
  selectedIndex: -1,
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    addNote(state, action: PayloadAction<Note>) {
      state.notes = [...state.notes, action.payload];
    },
    selectNote(state, action: PayloadAction<number>) {
      state.selectedIndex = action.payload;
    },
  },
});

export const { addNote, selectNote } = notesSlice.actions;

export const selectNotes = (state: RootState) => state.notes.notes;

export default notesSlice.reducer;
