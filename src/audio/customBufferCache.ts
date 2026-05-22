const customBuffers = new Map<string, AudioBuffer>()

export function registerCustomBuffer(id: string, buffer: AudioBuffer) {
  customBuffers.set(id, buffer)
}

export function unregisterCustomBuffer(id: string) {
  customBuffers.delete(id)
}

export function getCustomBuffer(id: string): AudioBuffer | undefined {
  return customBuffers.get(id)
}
