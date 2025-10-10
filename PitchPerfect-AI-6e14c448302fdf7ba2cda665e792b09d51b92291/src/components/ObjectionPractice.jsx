
import React, { useState } from "react";
import ScenarioSelector from "./ScenarioSelector";

import VoiceInput from "./voice/VoiceInput";
import useObjectionPractice from "../hooks/useObjectionPractice";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const ObjectionPractice = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [userObjection, setUserObjection] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [useVoiceInput, setUseVoiceInput] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

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
    setVoiceTranscript("");
    setShowFeedback(false);
    resetError();
  };

  const handleVoiceTranscript = (text, isFinal) => {
    setVoiceTranscript(text);
    if (isFinal) {
      setUserObjection(text);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const objectionText = useVoiceInput ? voiceTranscript : userObjection;
    
    if (objectionText.trim().length < 5) {
      alert("Please enter a more detailed objection (min. 5 characters).");
      return;
    }
    
    await submitObjection(selectedScenario, objectionText);
    setShowFeedback(true);
  };

  const inputValue = useVoiceInput ? voiceTranscript : userObjection;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Objection Handling Practice</CardTitle>
        </CardHeader>
        <CardContent>
          <ScenarioSelector
            selectedScenario={selectedScenario}
            onSelect={handleScenarioSelect}
          />
        </CardContent>
      </Card>

      {selectedScenario && (
        <Card>
          <CardHeader>
            <CardTitle>Practice Scenario: {selectedScenario.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="voice-input"
                  checked={useVoiceInput}
                  onCheckedChange={setUseVoiceInput}
                />
                <Label htmlFor="voice-input">Use voice input</Label>
              </div>

              {useVoiceInput ? (
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  placeholder="Click the microphone and speak your objection response..."
                  className="w-full"
                />
              ) : (
                <div>
                  <Label htmlFor="userObjection" className="sr-only">
                    Your Objection Response
                  </Label>
                  <Textarea
                    id="userObjection"
                    value={userObjection}
                    onChange={(e) => setUserObjection(e.target.value)}
                    required
                    minLength={5}
                    placeholder="Type your objection response here..."
                    className="min-h-[120px]"
                  />
                </div>
              )}

              {inputValue && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <Label className="text-sm font-medium text-gray-700">Your Response:</Label>
                  <p className="text-sm text-gray-600 mt-1">"{inputValue}"</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? "Evaluating..." : "Submit Response"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600" role="alert">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {showFeedback && feedback && (
        <Card className="mt-6 p-6 bg-green-50 border border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-800">AI Feedback</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFeedback(false)}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              Close
            </Button>
          </div>
          {feedback.suggestion && (
            <p className="text-green-700 mb-2">{feedback.suggestion}</p>
          )}
          {feedback.score && (
            <div className="text-sm text-green-600">
              Score: {feedback.score}/10
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ObjectionPractice;
