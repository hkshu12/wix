import { useEffect, useState } from 'react';
import { APP_DISPLAY_NAME, GITHUB_RELEASES_URL, getAppVersionInfo } from '../lib/appMeta';
import { isAndroidApp } from '../lib/platform';

export function AboutPage() {
  const android = isAndroidApp();
  const [version, setVersion] = useState('');
  const [build, setBuild] = useState<string | undefined>();

  useEffect(() => {
    void getAppVersionInfo().then((info) => {
      setVersion(info.version);
      setBuild(info.build);
    });
  }, []);

  return (
    <>
      <section className="app-page-card" aria-labelledby="about-app-title">
        <h2 id="about-app-title">关于应用</h2>
        <p>
          <strong>{APP_DISPLAY_NAME}</strong> 帮助你在安静或专注时叠加多种环境声，或混入自己的音乐，调节音量、声场与播放节奏，并可用睡眠定时自动渐弱停止。
        </p>
        <ul>
          <li>
            版本：<strong>{version || '…'}</strong>
            {build ? `（内部编号 ${build}）` : null}
          </li>
          <li>运行环境：{android ? 'Android 应用' : '浏览器 / 可安装到主屏幕'}</li>
        </ul>
      </section>

      <section className="app-page-card" aria-labelledby="about-distribution-title">
        <h2 id="about-distribution-title">获取与隐私</h2>
        {android ? (
          <ul>
            <li>通过应用内「更新」或官方发布页获取安装包，覆盖安装即可保留本机混音与偏好（除非卸载应用）。</li>
            <li>若曾安装过其他来源的测试包，请先卸载后再安装正式版，以免系统拒绝覆盖安装。</li>
            <li>内置环境声为可免费商用的素材，详细署名见应用内说明。</li>
          </ul>
        ) : (
          <ul>
            <li>网页版可在线使用，也可添加到主屏幕，像应用一样全屏打开。</li>
            <li>Android 安装包与网页版版本号一致，便于对照更新内容。</li>
            <li>混音与导入的音频均在本地处理与保存，不会上传到服务器。</li>
          </ul>
        )}
        <div className="app-page-actions">
          <a className="app-page-btn" href={GITHUB_RELEASES_URL} rel="noreferrer" target="_blank">
            查看版本发布
          </a>
        </div>
      </section>

      {!android ? (
        <section className="app-page-card" aria-labelledby="about-features-title">
          <h2 id="about-features-title">功能亮点</h2>
          <ul>
            <li>多轨混音：雨声、海浪、篝火等环境声可自由叠加。</li>
            <li>保存常用混音方案，一键恢复上次的层次与总音量。</li>
            <li>睡眠定时与渐弱，适合睡前聆听。</li>
          </ul>
        </section>
      ) : null}
    </>
  );
}
