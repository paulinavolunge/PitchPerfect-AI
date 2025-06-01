
import React, { useState } from "react";
import ScenarioSelector from "./ScenarioSelector";
import FeedbackModal from "./FeedbackModal";
import useObjectionPractice from "../hooks/useObjectionPractice";

const ObjectionPractice = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [userObjection, setUserObjection] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const {
    loading,
    error,
    feedback,
    submitObjection,
    resetError
  } = useObjectionPractice();

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    setUserObjection("");
    setShowFeedback(false);
    resetError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userObjection.trim().length < 5) {
      alert("Please enter a more detailed objection (min. 5 characters).");
      return;
    }
    await submitObjection(selectedScenario, userObjection);
    setShowFeedback(true);
  };

  return (
    <div>
      <ScenarioSelector
        selectedScenario={selectedScenario}
        onSelect={handleScenarioSelect}
      />
      {selectedScenario && (
        <form onSubmit={handleSubmit} aria-label="Objection submission form">
          <label htmlFor="userObjection" className="sr-only">
            Your Objection
          </label>
          <textarea
            id="userObjection"
            value={userObjection}
            onChange={(e) => setUserObjection(e.target.value)}
            required
            minLength={5}
            aria-required="true"
            aria-label={`Submit your objection for ${selectedScenario.title}`}
            placeholder="Type your objection here..."
            style={{ width: "100%", minHeight: 80 }}
          />
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            style={{ marginTop: 12 }}
          >
            {loading ? "Evaluating..." : "Submit"}
          </button>
        </form>
      )}

      {error && (
        <div role="alert" style={{ color: "red" }}>
          {error}
        </div>
      )}

      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        feedback={feedback}
        scenario={selectedScenario}
        userObjection={userObjection}
      />
    </div>
  );
};

export default ObjectionPractice;
