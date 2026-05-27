export interface FileReadProgress {
  loaded: number;
  total: number;
}

/** Whole-number percent (0–100) for progress UI. */
export function formatFileReadPercent(progress: FileReadProgress): number {
  if (progress.total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((progress.loaded / progress.total) * 100));
}

/** Reads a file as `ArrayBuffer`, reporting `FileReader` progress when available. */
export function readFileAsArrayBuffer(
  file: File,
  onProgress?: (progress: FileReadProgress) => void
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!onProgress) {
        return;
      }

      const total = event.lengthComputable ? event.total : file.size;
      onProgress({ loaded: event.loaded, total });
    };

    reader.onload = () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
        return;
      }

      reject(new Error('FileReader did not return ArrayBuffer'));
    };

    reader.onerror = () => reject(reader.error ?? new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}
