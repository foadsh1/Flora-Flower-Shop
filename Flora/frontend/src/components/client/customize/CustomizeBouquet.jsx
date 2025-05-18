import React, { useState } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FlowerSelection from "./FlowerSelection";
import WrapperSelection from "./WrapperSelection";
import DraggableFlower from "./DraggableFlower";
import DraggableWrapper from "./DraggableWrapper";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../assets/css/customize.css";

const PreviewArea = ({
  wrapper,
  setWrapper,
  bouquet,
  setBouquet,
  handleRemove,
  exporting, // ✅ NEW
}) => {
  const [, dropRef] = useDrop(() => ({
    accept: ["flower", "wrapper"],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const preview = document.querySelector(".preview-area");
      if (!offset || !preview) return;

      const previewRect = preview.getBoundingClientRect();
      const top = offset.y - previewRect.top - 30;
      const left = offset.x - previewRect.left - 30;

      if (item.type === "wrapper") {
        const id = item.id || Date.now() + Math.random();
        setWrapper({ ...item, id, top, left });
      } else {
        if (!item.id) {
          const newId = Date.now() + Math.random();
          setBouquet((prev) => [
            ...prev,
            { ...item, id: newId, top, left, type: "flower" },
          ]);
        } else {
          setBouquet((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, top, left } : f))
          );
        }
      }
    },
  }));

  return (
    <div ref={dropRef} className="preview-area">
      {wrapper && (
        <DraggableWrapper
          wrapper={wrapper}
          onRemove={() => setWrapper(null)}
          exporting={exporting} // ✅ pass flag
        />
      )}
      {bouquet.map((flower) => (
        <DraggableFlower
          key={flower.id}
          flower={flower}
          onRemove={() => handleRemove(flower.id)}
          exporting={exporting} // ✅ pass flag
        />
      ))}
    </div>
  );
};

const CustomizeBouquet = () => {
  const [bouquet, setBouquet] = useState([]);
  const [wrapper, setWrapper] = useState(null);
  const [exporting, setExporting] = useState(false); // ✅ NEW

  const handleRemove = (id) => {
    setBouquet((prev) => prev.filter((f) => f.id !== id));
  };

  const exportAsImage = () => {
    setExporting(true);
    setTimeout(() => {
      const preview = document.querySelector(".preview-area");
      if (!preview) return;

      html2canvas(preview).then((canvas) => {
        const link = document.createElement("a");
        link.download = "bouquet.png";
        link.href = canvas.toDataURL();
        link.click();

        toast.success("Bouquet exported!");
        setExporting(false);
      });
    }, 100); // ✅ allow time for remove buttons to hide
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="customize-container">
        <h2>Create Your Custom Bouquet 💐</h2>
        <div className="customize-panels">
          <div className="selection-panel">
            <h3>1. Select Flowers</h3>
            <FlowerSelection />
            <h3>2. Select Wrapper</h3>
            <WrapperSelection />
          </div>

          <div className="preview-panel">
            <h3>Live Preview</h3>
            <PreviewArea
              wrapper={wrapper}
              setWrapper={setWrapper}
              bouquet={bouquet}
              setBouquet={setBouquet}
              handleRemove={handleRemove}
              exporting={exporting}
            />
            <div className="preview-buttons">
              <button onClick={exportAsImage} className="export-btn">
                📸 Export as Image
              </button>
              <button onClick={() => { setBouquet([]); setWrapper(null); }} className="reset-btn">
                🔄 Reset Bouquet
              </button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default CustomizeBouquet;
