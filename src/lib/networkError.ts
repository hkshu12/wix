export function formatNetworkError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return '网络连接失败，请检查网络后重试';
    }
    return error.message;
  }

  return fallback;
}
