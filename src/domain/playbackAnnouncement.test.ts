import { describe, expect, it } from 'vitest';
import {
  formatLayerToggleAnnouncement,
  formatPlayToggleAnnouncement,
  formatMasterVolumeAnnouncement,
  formatSleepTimerCancelAnnouncement,
  formatSleepTimerCompleteAnnouncement,
  formatSleepTimerClockStartAnnouncement,
  formatSleepTimerStartAnnouncement,
  formatWakeTimerCancelAnnouncement,
  formatWakeTimerClockStartAnnouncement,
  formatWakeTimerCompleteAnnouncement,
  formatWakeTimerStartAnnouncement
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
    expect(formatSleepTimerClockStartAnnouncement(23, 0)).toBe('已设置睡眠定时，将于 23:00 渐弱并停止');
    expect(formatSleepTimerStartAnnouncement(30)).toBe('已设置睡眠定时 30 分钟');
    expect(formatSleepTimerCancelAnnouncement()).toBe('已取消睡眠定时');
    expect(formatSleepTimerCompleteAnnouncement()).toBe('睡眠定时已到，播放已暂停');
  });
});

describe('formatWakeTimerAnnouncements', () => {
  it('announces start, cancel, and completion', () => {
    expect(formatWakeTimerStartAnnouncement(45)).toBe('已设置唤醒定时 45 分钟');
    expect(formatWakeTimerClockStartAnnouncement(7, 30)).toBe('已设置唤醒定时，将于 07:30 叫醒');
    expect(formatWakeTimerCancelAnnouncement()).toBe('已取消唤醒定时');
    expect(formatWakeTimerCompleteAnnouncement()).toBe('唤醒定时已到，主音量已渐强');
  });
});

describe('formatMasterVolumeAnnouncement', () => {
  it('announces rounded percent', () => {
    expect(formatMasterVolumeAnnouncement(0.82)).toBe('主音量 82%');
    expect(formatMasterVolumeAnnouncement(0.875)).toBe('主音量 88%');
    expect(formatMasterVolumeAnnouncement(0)).toBe('主音量 0%');
    expect(formatMasterVolumeAnnouncement(1)).toBe('主音量 100%');
  });
});
