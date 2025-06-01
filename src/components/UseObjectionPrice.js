import { useState } from "react";
import { getObjectionFeedback } from "../services/objectionService";

export default function useObjectionPractice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  async function submitObjection(scenario, objectionText) {
    setLoading(true);
    setError("");
    setFeedback(null);
    try {
      const response = await getObjectionFeedback(scenario.id, objectionText);
      setFeedback(response);
    } catch (err) {
      setError(
        err?.message ||
          "Something went wrong. Please try again or contact support."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetError() {
    setError("");
  }

  return { loading, error, feedback, submitObjection, resetError };
}
