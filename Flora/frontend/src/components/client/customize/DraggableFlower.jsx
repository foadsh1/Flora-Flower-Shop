import React from "react";
import { useDrag } from "react-dnd";

const DraggableFlower = ({ flower, onRemove, exporting }) => {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "flower",
      item: {
        id: flower.id,
        src: flower.src,
        name: flower.name,
        top: flower.top,
        left: flower.left,
        type: "flower",
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [flower]
  );

  return (
    <div
      ref={dragRef}
      className="draggable-flower"
      style={{
        top: flower.top,
        left: flower.left,
        opacity: isDragging ? 0.4 : 1,
        position: "absolute",
      }}
    >
      <img src={flower.src} alt={flower.name} width="60" />
      {!exporting && (
        <button className="remove-button" onClick={onRemove}>
          ×
        </button>
      )}
    </div>
  );
};

export default DraggableFlower;
