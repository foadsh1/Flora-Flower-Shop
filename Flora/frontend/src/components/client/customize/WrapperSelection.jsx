// src/components/client/WrapperSelection.jsx
import React from "react";
import wrap1 from "../../../assets/images/customize/wrappers/Wrapper1.svg";
import wrap2 from "../../../assets/images/customize/wrappers/Wrapper2.svg";
import wrap3 from "../../../assets/images/customize/wrappers/Wrapper3.svg";
import wrap4 from "../../../assets/images/customize/wrappers/Wrapper4.svg";
import wrap5 from "../../../assets/images/customize/wrappers/Wrapper5.svg";
import { useDrag } from "react-dnd";

  const DraggableWrapperOption = ({ wrapper }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "wrapper",
    item: { ...wrapper, type: "wrapper" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <img
      ref={dragRef}
      src={wrapper.src}
      alt={wrapper.name}
      width="80"
      style={{
        marginRight: "10px",
        marginBottom: "10px",
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
      }}
    />
  );
};
const WrapperSelection = ({ setSelectedWrapper }) => {
  const wrappers = [
    { name: "Wrap 1", src: wrap1 },
    { name: "Wrap 2", src: wrap2 },
    { name: "Wrap 3", src: wrap3 },
    { name: "Wrap 4", src: wrap4 },
    { name: "Wrap 5", src: wrap5 },
  ];
  return (
    <div className="wrapper-selection">
      {wrappers.map((w, i) => (
        <DraggableWrapperOption key={i} wrapper={w} />
      ))}
    </div>
  );
};
export default WrapperSelection;
