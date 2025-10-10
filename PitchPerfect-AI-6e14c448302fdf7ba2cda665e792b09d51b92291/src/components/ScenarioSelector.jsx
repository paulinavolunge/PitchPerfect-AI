
import React from "react";
import scenarios from "../data/scenarios";

const ScenarioSelector = ({ selectedScenario, onSelect }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ fontWeight: 600 }}>Choose a Scenario:</h3>
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        listStyle: "none",
        padding: 0
      }}
    >
      {scenarios.map((scenario) => (
        <li key={scenario.id}>
          <button
            onClick={() => onSelect(scenario)}
            aria-pressed={selectedScenario?.id === scenario.id}
            style={{
              padding: "10px 16px",
              borderRadius: 6,
              border: selectedScenario?.id === scenario.id ? "2px solid #0070f3" : "1px solid #ccc",
              background: selectedScenario?.id === scenario.id ? "#e6f0ff" : "#fff",
              fontWeight: selectedScenario?.id === scenario.id ? 700 : 400,
              cursor: "pointer",
              minWidth: 120,
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            <span title={scenario.title}>{scenario.title}</span>
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default ScenarioSelector;
