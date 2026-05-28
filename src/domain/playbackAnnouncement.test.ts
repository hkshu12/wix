import { describe, expect, it } from 'vitest';
import {
  formatLayerToggleAnnouncement,
  formatPlayToggleAnnouncement,
  formatSleepTimerCancelAnnouncement,
  formatSleepTimerCompleteAnnouncement,
  formatSleepTimerStartAnnouncement
} from './playbackAnnouncement';

describe('formatPlayToggleAnnouncement', () => {
  it('announces play and pause', () => {
    expect(formatPlayToggleAnnouncement(true)).toBe('已开始播放');
    expect(formatPlayToggleAnnouncement(false)).toBe('已暂停播放');
  });
});

describe('formatLayerToggleAnnouncement', () => {
  it('announces add with track count', () => {
    expect(formatLayerToggleAnnouncement('雨声', true, 1)).toBe('已添加 雨声');
    expect(formatLayerToggleAnnouncement('雨声', true, 3)).toBe('已添加 雨声，当前 3 轨');
  });

  it('announces remove with remaining count or empty mix', () => {
    expect(formatLayerToggleAnnouncement('雨声', false, 2)).toBe('已移除 雨声，剩余 2 轨');
    expect(formatLayerToggleAnnouncement('雨声', false, 0)).toBe('已移除 雨声，混音已清空');
  });
});

describe('formatSleepTimerAnnouncements', () => {
  it('announces start, cancel, and completion', () => {
    expect(formatSleepTimerStartAnnouncement(30)).toBe('已设置睡眠定时 30 分钟');
    expect(formatSleepTimerCancelAnnouncement()).toBe('已取消睡眠定时');
    expect(formatSleepTimerCompleteAnnouncement()).toBe('睡眠定时已到，播放已暂停');
  });
});
