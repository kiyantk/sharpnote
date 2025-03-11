import React, { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableItem = ({ id, children, settingsIsDNDDisabled }) => {
  const [dragStartDelay, setDragStartDelay] = useState(false); // Track if the drag is delayed
  const [clickTimer, setClickTimer] = useState(null); // Timer for delay
  const [isDragging, setIsDragging] = useState(false); // Track if dragging has started

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDndKitDragging,
    isSorting,
  } = useSortable({ id, disabled: settingsIsDNDDisabled });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    opacity: isDndKitDragging ? 0.5 : 1, // Reduce opacity while dragging
    cursor: "grab",
    zIndex: 100
  };

  // Start drag after the delay (e.g., 300ms)
  const handleMouseDown = () => {
    setClickTimer(setTimeout(() => {
      setDragStartDelay(true); // Delay drag action
    }, 300)); // Delay duration (300ms)
  };

  // Reset timer and normal click action if drag doesn't start
  const handleMouseUp = () => {
    if (!isDragging && clickTimer) {
      clearTimeout(clickTimer);
    }
    setDragStartDelay(false); // Reset delay state
  };

  useEffect(() => {
    // When dragging starts, set dragging state to true
    if (isSorting) {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  }, [isSorting]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={handleMouseDown} // Trigger delay on mouse down
      onMouseUp={handleMouseUp} // Cancel the delay on mouse up
    >
      {children}
    </div>
  );
};

export default SortableItem;
