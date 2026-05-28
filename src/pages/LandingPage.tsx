import { useNavigate } from 'react-router-dom';
import { useStudio } from '../layout/StudioContext';
import { APP_DISPLAY_NAME } from '../lib/appMeta';
import { markEnteredStudio } from '../storage/onboarding';
import { ThemeToggle } from '../theme/ThemeToggle';
import './LandingPage.css';

function StartButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { primeAudioContext } = useStudio();

  return (
    <button
      type="button"
      className={className ?? 'landing-cta'}
      onClick={() => {
        markEnteredStudio();
        void primeAudioContext();
        navigate('/studio');
      }}
    >
      开始使用
    </button>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <span className="landing-brand">{APP_DISPLAY_NAME}</span>
        <ThemeToggle />
      </header>

      <main>
        <section className="landing-hero">
          <h1>{APP_DISPLAY_NAME}</h1>
          <p className="landing-lead">
            叠加雨声、风扇、粉棕噪音与自定义音乐，打造属于你的专注、睡眠与放松声景。
          </p>
          <StartButton />
        </section>

        <section className="landing-section" aria-labelledby="features-title">
          <h2 id="features-title">能做什么</h2>
          <ul className="landing-list">
            <li>
              多轨叠加十五种内置环境声（含工地、办公室、飞机舱、公路、列车、咖啡馆、风扇）与导入的本地音乐
            </li>
            <li>Studio 搜索框按名称、描述或文件名快速筛选环境声</li>
            <li>可选播放渐入、屏幕常亮、可配置睡眠渐出；混音抽屉主音量滑块与键盘 +/- 调音量时读屏会播报</li>
            <li>每轨独立调节音量、声像与播放速度，支持静音</li>
            <li>主音量、立体声宽度与全局播放速度一键控制</li>
            <li>
              睡眠与唤醒定时（5–480 分钟）：睡眠到时渐弱并暂停；唤醒到时渐强起播，刷新后倒计时仍可继续
            </li>
            <li>命名场景预设：保存最多 12 组混音，一键切换专注、睡眠等固定搭配</li>
            <li>混音组合与主音量在刷新后自动恢复，有轨道时会自动继续播放</li>
            <li>分享混音链接或 JSON 分享码；打开带 <code>?share=</code> 的链接可自动导入配方</li>
            <li>桌面键盘快捷键：Space 播放/暂停、M 混音抽屉、+/- 主音量、? 查看说明</li>
            <li>支持的浏览器与 PWA 可在锁屏显示混音标题并控制播放/暂停</li>
            <li>导入 MP3、WAV、M4A 等格式，保存在本机音频库</li>
          </ul>
        </section>

        <section className="landing-section" aria-labelledby="how-title">
          <h2 id="how-title">怎么用</h2>
          <ol className="landing-steps">
            <li>选择一种或多种声音，或从预设加载常用搭配</li>
            <li>在混音台调节各轨与整体参数；需要时可设定睡眠定时或复制分享链接</li>
            <li>点选环境声即可播放，也可用底部按钮暂停；下次打开会记住混音设置，也可把链接发给朋友一键导入</li>
          </ol>
          <StartButton className="landing-cta landing-cta--secondary" />
        </section>

        <section className="landing-section" aria-labelledby="platforms-title">
          <h2 id="platforms-title">使用场景与平台</h2>
          <ul className="landing-list">
            <li>浏览器打开即可使用，无需注册</li>
            <li>可添加到主屏幕，像应用一样离线打开（PWA）</li>
            <li>提供 Android 版本，在手机上同样混音</li>
          </ul>
          <details className="landing-details">
            <summary>技术说明</summary>
            <p>基于 Web Audio 混音，支持 PWA 安装与 Capacitor Android 封装。</p>
          </details>
        </section>
      </main>

      <footer className="landing-footer">
        <a href="https://github.com/hkshu12/wix" rel="noreferrer" target="_blank">
          GitHub 仓库
        </a>
      </footer>
    </div>
  );
}
