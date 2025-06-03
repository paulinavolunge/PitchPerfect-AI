
// Utility for managing and cleaning up resources
export class ResourceManager {
  private static objectUrls = new Set<string>();
  private static audioContexts = new Set<AudioContext>();
  private static mediaStreams = new Set<MediaStream>();

  static registerObjectUrl(url: string): void {
    this.objectUrls.add(url);
  }

  static revokeObjectUrl(url: string): void {
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }

  static registerAudioContext(context: AudioContext): void {
    this.audioContexts.add(context);
  }

  static closeAudioContext(context: AudioContext): void {
    if (this.audioContexts.has(context) && context.state !== 'closed') {
      context.close();
      this.audioContexts.delete(context);
    }
  }

  static registerMediaStream(stream: MediaStream): void {
    this.mediaStreams.add(stream);
  }

  static stopMediaStream(stream: MediaStream): void {
    if (this.mediaStreams.has(stream)) {
      stream.getTracks().forEach(track => track.stop());
      this.mediaStreams.delete(stream);
    }
  }

  static cleanupAll(): void {
    // Revoke all object URLs
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls.clear();

    // Close all audio contexts
    this.audioContexts.forEach(context => {
      if (context.state !== 'closed') {
        context.close();
      }
    });
    this.audioContexts.clear();

    // Stop all media streams
    this.mediaStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.mediaStreams.clear();
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    ResourceManager.cleanupAll();
  });
}
