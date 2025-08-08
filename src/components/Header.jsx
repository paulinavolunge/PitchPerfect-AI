
import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo.tsx";
import { ScreenReaderOnly } from "./accessibility/ScreenReaderOnly";

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
    role="banner"
  >
    <Link 
      to="/" 
      aria-label="Go to PitchPerfect AI homepage"
      style={{ display: "flex", alignItems: "center" }}
    >
      <Logo />
      <ScreenReaderOnly>PitchPerfect AI - Home</ScreenReaderOnly>
    </Link>
  </header>
);

export default Header;
