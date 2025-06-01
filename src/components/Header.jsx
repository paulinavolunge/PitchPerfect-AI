
import React from "react";
import Logo from "./Logo";

/**
 * Header component for the Pitch Perfect AI app.
 * Integrates the new logo and ensures accessibility.
 */
const Header = () => (
  <header
    style={{
      display: "flex",
      alignItems: "center",
      padding: "16px 24px",
      background: "#fff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      zIndex: 10,
    }}
  >
    <Logo />
    <h1 style={{ marginLeft: 16, fontWeight: 700, fontSize: "1.5rem", color: "#222" }}>
      Pitch Perfect AI
    </h1>
  </header>
);

export default Header;
