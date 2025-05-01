import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/shared/Navbar";
import routes from "./routes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./components/shared/Footer";
const App = () => {
  return (
    <>
      <Navbar />
      <ToastContainer position="bottom-right" />
      <Routes>
        {routes.map((r, i) => (
          <Route key={i} path={r.path} element={r.element} />
        ))}
      </Routes>
      <Footer /> 
    </>
  );
};

export default App;
