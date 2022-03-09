import React, { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import { MdClose } from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { deleteSelectedNote } from '../features/notesSlice';
import { showToolBox } from '../features/toolBoxSlice';

let domRect = new DOMRect();

const virtualElement = {
  getBoundingClientRect: () => domRect,
};

export default function ToolBox() {
  const dispatch = useAppDispatch();
  const {
    isShowing, x, y, size,
  } = useAppSelector((state) => state.toolBox);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [popperArrowElement, setPopperArrowElement] = useState<HTMLDivElement | null>(null);

  // popper
  const { attributes, styles, update } = usePopper(virtualElement, popperElement, {
    modifiers: [{ name: 'arrow', options: { element: popperArrowElement } }],
    placement: 'top',
  });

  // position toolbox
  useEffect(() => {
    domRect = new DOMRect(x, y, size, size);
    if (update) {
      update();
    }
  }, [x, y, size]);

  return (
    <div
      ref={setPopperElement}
      className={`popper ${isShowing ? 'show' : ''}`}
      style={styles.popper}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...attributes.popper}
    >
      <button
        type="button"
        onClick={() => {
          dispatch(showToolBox(false));
          dispatch(deleteSelectedNote());
        }}
      >
        <MdClose className="text-4xl" />
      </button>
      <div
        ref={setPopperArrowElement}
        className="popper-arrow"
        style={styles.arrow}
      />
    </div>
  );
}
