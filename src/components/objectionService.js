// Example API service for objection feedback, with input sanitization

export async function getObjectionFeedback(scenarioId, objectionText) {
  // Input sanitization
  if (typeof objectionText !== "string" || objectionText.trim().length < 5) {
    throw new Error("Objection text must be at least 5 characters.");
  }

  // Simulate API call (replace with real endpoint)
  const response = await fetch(`/api/objection-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId, objection: objectionText.trim() })
  });

  if (!response.ok) {
    throw new Error("Failed to get feedback. Please try again.");
  }
  return response.json();
}
