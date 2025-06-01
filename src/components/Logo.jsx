
import React from "react";

/**
 * Logo component for Pitch Perfect AI.
 * Displays the provided logo image with alt text for accessibility.
 */
const Logo = ({ width = 180, height = 80, style }) => (
  <img
    src="/assets/logo-pitchperfectai.png"
    alt="Pitch Perfect AI Logo"
    width={width}
    height={height}
    style={style}
  />
);

export default Logo;
