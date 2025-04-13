import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableItem = ({ id, children, settingsIsDNDDisabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDndKitDragging,
  } = useSortable({ id, disabled: settingsIsDNDDisabled });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    opacity: isDndKitDragging ? 0.5 : 1, // Reduce opacity while dragging
    cursor: "default",
    zIndex: 100,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export default SortableItem;
