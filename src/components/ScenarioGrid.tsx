
import React from 'react';

const ScenarioGrid: React.FC = () => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scenario grid content will go here */}
      </div>
      {/* iOS-specific media query */}
      <style>{`
        @supports (-webkit-touch-callout: none) {
          .grid { display: flex; flex-wrap: wrap; }
        }
      `}</style>
    </>
  );
};

export default ScenarioGrid;
