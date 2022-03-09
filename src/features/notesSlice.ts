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
    addNote(state, action: PayloadAction<{ x: number, y: number }>) {
      const { x, y } = action.payload;
      state.selectedIndex = state.notes.length;
      state.notes = [...state.notes, { time: y, pitch: x }];
    },
    deleteSelectedNote(state) {
      state.notes = state.notes.reduce((accumulator, note, index) => (
        state.selectedIndex === index ? accumulator : [...accumulator, note]
      ), [] as Note[]);
    },
    dragNote(state, action: PayloadAction<{ x: number, y: number }>) {
      const { x, y } = action.payload;
      state.notes[state.selectedIndex] = {
        ...state.notes[state.selectedIndex], time: y, pitch: x,
      };
    },
    selectNote(state, action: PayloadAction<number>) {
      state.selectedIndex = action.payload;
    },
  },
});

export const {
  addNote, deleteSelectedNote, dragNote, selectNote,
} = notesSlice.actions;

export const selectNotes = (state: RootState) => state.notes.notes;

export default notesSlice.reducer;
