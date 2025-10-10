
import type { PluginListenerHandle } from "@capacitor/core";

declare module "@capacitor/core" {
  interface CapacitorPlugins {
    Permissions: {
      /** e.g. { name: "microphone" } */
      query(options: { name: string }): Promise<{ state: PermissionState }>;
      request(options: { name: string }): Promise<{ state: PermissionState }>;
      // minimal surface; extend if you need more later
    };
  }
}
