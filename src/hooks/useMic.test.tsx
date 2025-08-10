import { renderHook, act } from '@testing-library/react';
import { useMic } from './useMic';

// Minimal MediaStream/Track mocks
class MockMediaStreamTrack implements MediaStreamTrack {
  enabled = true;
  id = Math.random().toString(36).slice(2);
  kind: MediaStreamTrackKind = 'audio';
  label = '';
  muted = false;
  onended: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  onmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  onoverconstrained: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  onunmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  readyState: MediaStreamTrackState = 'live';
  applyConstraints(): Promise<void> { return Promise.resolve(); }
  clone(): MediaStreamTrack { return this; }
  getCapabilities(): MediaTrackCapabilities { return {}; }
  getConstraints(): MediaTrackConstraints { return {}; }
  getSettings(): MediaTrackSettings { return {}; }
  stop = vi.fn();
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
}

class MockMediaStream implements MediaStream {
  active = true;
  id: string;
  onactive: ((this: MediaStream, ev: Event) => any) | null = null;
  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  oninactive: ((this: MediaStream, ev: Event) => any) | null = null;
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  private tracks: MediaStreamTrack[];
  constructor(id: string) {
    this.id = id;
    this.tracks = [new MockMediaStreamTrack()];
  }
  addTrack(): void {}
  clone(): MediaStream { return this; }
  getAudioTracks(): MediaStreamTrack[] { return this.tracks; }
  getVideoTracks(): MediaStreamTrack[] { return []; }
  getTracks(): MediaStreamTrack[] { return this.tracks; }
  getTrackById(): MediaStreamTrack | null { return this.tracks[0] ?? null; }
  removeTrack(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
}

// Mock getUserMedia
const gumMock = vi.fn();

beforeAll(() => {
  // @ts-expect-error add mediaDevices mock
  global.navigator.mediaDevices = { getUserMedia: gumMock } as any;
});

beforeEach(() => {
  gumMock.mockReset();
});

it('does not create a second stream if one is active', async () => {
  const stream = new MockMediaStream('stream-1');
  gumMock.mockResolvedValue(stream);

  const { result } = renderHook(() => useMic());

  await act(async () => {
    await result.current.start();
  });

  expect(gumMock).toHaveBeenCalledTimes(1);
  const firstId = result.current.streamId;

  await act(async () => {
    await result.current.start();
  });

  expect(gumMock).toHaveBeenCalledTimes(1);
  expect(result.current.streamId).toBe(firstId);
});

it('unmount cleans up tracks', async () => {
  const stream = new MockMediaStream('stream-2');
  gumMock.mockResolvedValue(stream);

  const { result, unmount } = renderHook(() => useMic());

  await act(async () => {
    await result.current.start();
  });

  const track = stream.getTracks()[0] as MockMediaStreamTrack;
  expect(track.stop).toHaveBeenCalledTimes(0);

  unmount();

  expect(track.stop).toHaveBeenCalledTimes(1);
});

it('start→stop→start produces unique stream IDs and no console errors', async () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  // return unique streams on each call
  gumMock.mockImplementation(async () => new MockMediaStream(`id-${Math.random().toString(36).slice(2)}`));

  const { result } = renderHook(() => useMic());

  const ids = new Set<string>();
  for (let i = 0; i < 5; i++) {
    await act(async () => { await result.current.start(); });
    if (result.current.streamId) ids.add(result.current.streamId);
    act(() => { result.current.stop(); });
  }

  expect(ids.size).toBe(5);
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
});