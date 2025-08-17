import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceService } from '@/services/VoiceService';

// Minimal mocks for browser APIs
beforeEach(() => {
  (global as any).navigator = {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn(), kind: 'audio' }],
      }),
    },
  };

  (global as any).window = {
    SpeechRecognition: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onstart: null,
      onend: null,
      continuous: true,
      interimResults: true,
      lang: 'en-US',
      maxAlternatives: 1,
    })),
    speechSynthesis: {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    },
    AudioContext: vi.fn(() => ({
      createAnalyser: vi.fn(() => ({
        fftSize: 0,
        frequencyBinCount: 0,
        getByteFrequencyData: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      createMediaStreamSource: vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() })),
      close: vi.fn().mockResolvedValue(undefined),
      state: 'running',
    })),
  } as any;
});

describe('VoiceService', () => {
  it('initializes and can stop without error', async () => {
    const service = new VoiceService();
    expect(service.isVoiceSupported()).toBe(true);
    await expect(service.checkMicrophonePermission()).resolves.toBe(true);
    // Ensure stopRecording is safe when not started
    service.stopRecording();
    service.dispose();
    expect(true).toBe(true);
  });
});