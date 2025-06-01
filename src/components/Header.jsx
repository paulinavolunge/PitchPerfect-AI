
import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

/**
 * Header component for the Pitch Perfect AI app.
 * Uses only the logo image for consistent branding.
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
    <Link to="/" aria-label="PitchPerfect AI Home">
      <Logo />
    </Link>
  </header>
);

export default Header;
