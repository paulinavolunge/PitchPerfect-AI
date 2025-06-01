import React from "react";

const FeedbackModal = ({ open, onClose, feedback, scenario, userObjection }) => {
  if (!open) return null;

  const getPersonalizedMessage = () => {
    if (!feedback || !scenario) return "Keep practicing!";
    // Example: personalize feedback based on objection type
    if (feedback.score > 80) {
      return `Great job! Your response to "${scenario.title}" shows strong understanding.`;
    }
    if (feedback.score > 50) {
      return `Solid effort! To improve, consider: ${feedback.tip}`;
    }
    return `Keep going! Focus on: ${feedback.tip}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="modal"
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 24,
        maxWidth: 480,
        margin: "5% auto",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)"
      }}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        style={{ float: "right", fontSize: 18, background: "none", border: "none" }}
      >
        ×
      </button>
      <h2 tabIndex={0} style={{ fontWeight: 700 }}>
        Feedback
      </h2>
      <div style={{ margin: "12px 0" }}>{getPersonalizedMessage()}</div>
      <div style={{ fontSize: 15, color: "#555" }}>
        <strong>Your Objection:</strong> {userObjection}
      </div>
      <div style={{ marginTop: 10, fontStyle: "italic" }}>
        <strong>AI Suggestion:</strong> {feedback?.suggestion}
      </div>
    </div>
  );
};

export default FeedbackModal;
