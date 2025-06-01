
import React from "react";
import Header from "./components/Header";
import ObjectionPractice from "./components/ObjectionPractice";

/**
 * Main app component.
 * Integrates the logo in the header.
 */
function App() {
  return (
    <div>
      <Header />
      <main>
        <ObjectionPractice />
      </main>
    </div>
  );
}

export default App;
