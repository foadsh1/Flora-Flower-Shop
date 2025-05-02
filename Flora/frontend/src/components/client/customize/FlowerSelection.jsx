// src/components/client/FlowerSelection.jsx
import React from "react";
import { useDrag } from "react-dnd";
import flower1 from "../../../assets/images/customize/flowers/flower1.svg";
import flower2 from "../../../assets/images/customize/flowers/flower2.svg";
import flower3 from "../../../assets/images/customize/flowers/flower3.svg";
import flower4 from "../../../assets/images/customize/flowers/flower4.svg";
import flower5 from "../../../assets/images/customize/flowers/flower5.svg";
import flower6 from "../../../assets/images/customize/flowers/flower6.svg";
import flower7 from "../../../assets/images/customize/flowers/flower7.svg";


const Flower = ({ flower }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "flower",
    item: {
      ...flower,
      type: "flower", // 👈 no id here!
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef}
      style={{
        margin: "10px",
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
    >
      <img src={flower.src} alt={flower.name} width="60" />
    </div>
  );
};

const FlowerSelection = () => {
  const flowers = [
    { name: "Rose", src: flower1 },
    { name: "Daisy", src: flower2 },
    { name: "lavender", src: flower3 },
    { name: "blossom", src: flower4 },
    { name: "tulip", src: flower5 },
    { name: "flower", src: flower6 },
    { name: "unflowe", src: flower7 },
  ];

  return (
    <div className="flower-selection">
      {flowers.map((f, idx) => (
        <Flower key={idx} flower={f} />
      ))}
    </div>
  );
};

export default FlowerSelection;
