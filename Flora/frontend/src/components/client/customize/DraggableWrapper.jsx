// src/components/client/DraggableWrapper.jsx
import React from "react";
import { useDrag } from "react-dnd";

const DraggableWrapper = ({ wrapper, onRemove }) => {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "wrapper",
      item: {
        id: wrapper.id,
        src: wrapper.src,
        name: wrapper.name,
        top: wrapper.top,
        left: wrapper.left,
        type: "wrapper",
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [wrapper]
  );

  return (
    <div
      ref={dragRef}
      className="draggable-flower" // ✅ same class to use existing styling
      style={{
        top: wrapper.top,
        left: wrapper.left,
        opacity: isDragging ? 0.4 : 1,
        position: "absolute",
        zIndex: 0, // ✅ always behind flowers
      }}
    >
      <img src={wrapper.src} alt={wrapper.name} className="wrapper-svg" />
      <button className="remove-button" onClick={onRemove}>
        ×
      </button>
    </div>
  );
};

export default DraggableWrapper;
