/** Screen-reader announcements for play/pause and layer toggles. */

export function formatPlayToggleAnnouncement(isPlaying: boolean): string {
  return isPlaying ? '已开始播放' : '已暂停播放';
}

export function formatLayerToggleAnnouncement(
  soundTitle: string,
  selected: boolean,
  activeCount: number
): string {
  if (selected) {
    return activeCount === 1 ? `已添加 ${soundTitle}` : `已添加 ${soundTitle}，当前 ${activeCount} 轨`;
  }

  if (activeCount === 0) {
    return `已移除 ${soundTitle}，混音已清空`;
  }

  return `已移除 ${soundTitle}，剩余 ${activeCount} 轨`;
}
