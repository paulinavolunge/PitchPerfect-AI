export interface MicConstraints {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface CreateMicOptions extends MicConstraints {}

export async function createMicStream(options: CreateMicOptions): Promise<MediaStream> {
  const { echoCancellation, noiseSuppression, autoGainControl } = options;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia is not supported in this environment');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 48000,
      echoCancellation,
      noiseSuppression,
      autoGainControl,
    },
    video: false,
  });

  return stream;
}

export function stopMicStream(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // ignore
    }
  }
}