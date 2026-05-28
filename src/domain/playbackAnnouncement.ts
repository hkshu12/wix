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

export function formatSleepTimerStartAnnouncement(minutes: number): string {
  return `已设置睡眠定时 ${minutes} 分钟`;
}

export function formatSleepTimerCancelAnnouncement(): string {
  return '已取消睡眠定时';
}

export function formatSleepTimerCompleteAnnouncement(): string {
  return '睡眠定时已到，播放已暂停';
}

export function formatMasterVolumeAnnouncement(masterVolume: number): string {
  const percent = Math.round(masterVolume * 100);
  return `主音量 ${percent}%`;
}
