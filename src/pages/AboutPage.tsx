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
        <h2 id="about-app-title">应用</h2>
        <p>
          <strong>{APP_DISPLAY_NAME}</strong> — 多轨白噪音与自定义音乐混音，支持环境声叠加、睡眠定时与立体声宽度调节。
        </p>
        <ul>
          <li>
            版本：<strong>{version || '…'}</strong>
            {build ? `（构建 ${build}）` : null}
          </li>
          <li>平台：{android ? 'Capacitor Android 封装' : '浏览器 / PWA'}</li>
        </ul>
      </section>

      <section className="app-page-card" aria-labelledby="about-distribution-title">
        <h2 id="about-distribution-title">分发与许可</h2>
        {android ? (
          <ul>
            <li>通过 GitHub Release 获取签名 APK，安装包名 <code>app.whiteNoiseMixer.studio</code>。</li>
            <li>升级需使用相同签名渠道的 Release 包；若曾安装调试版，请先卸载再安装正式版。</li>
            <li>内置环境声素材为 CC0 协议，详见应用资源目录中的署名说明。</li>
          </ul>
        ) : (
          <ul>
            <li>Web 构建可部署至 GitHub Pages，亦支持「添加到主屏幕」作为 PWA 使用。</li>
            <li>Android APK 与 Web 压缩包均在 GitHub Release 中提供，版本号与 tag 同步。</li>
            <li>本项目为客户端混音应用，音频处理在本地 Web Audio 完成，不上传用户文件。</li>
          </ul>
        )}
        <div className="app-page-actions">
          <a className="app-page-btn" href={GITHUB_RELEASES_URL} rel="noreferrer" target="_blank">
            查看 Release
          </a>
        </div>
      </section>

      {!android ? (
        <section className="app-page-card" aria-labelledby="about-tech-title">
          <h2 id="about-tech-title">技术栈</h2>
          <p>React、Vite、Web Audio API、vite-plugin-pwa，Android 端由 Capacitor 封装 Web 资源。</p>
        </section>
      ) : null}
    </>
  );
}
