// vite.polyfill.js
import { webcrypto } from 'crypto'

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto
}