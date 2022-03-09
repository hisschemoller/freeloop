/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ToolBoxState {
  isShowing: boolean;
  x: number;
  y: number;
  size: number;
}

const initialState: ToolBoxState = {
  isShowing: false,
  x: 0,
  y: 0,
  size: 1,
};

const toolBoxSlice = createSlice({
  name: 'toolBox',
  initialState,
  reducers: {
    positionToolBox(state, action: PayloadAction<{ x: number, y: number, size: number }>) {
      const { x, y, size } = action.payload;
      state.x = x;
      state.y = y;
      state.size = size;
    },
    showToolBox(state, action: PayloadAction<boolean>) {
      state.isShowing = action.payload;
    },
  },
});

export const { positionToolBox, showToolBox } = toolBoxSlice.actions;

export default toolBoxSlice.reducer;
