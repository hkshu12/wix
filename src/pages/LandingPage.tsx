import { useNavigate } from 'react-router-dom';
import { markEnteredStudio } from '../storage/onboarding';
import { ThemeToggle } from '../theme/ThemeToggle';
import './LandingPage.css';

function StartButton({ className }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={className ?? 'landing-cta'}
      onClick={() => {
        markEnteredStudio();
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
        <span className="landing-brand">白噪音混音器</span>
        <ThemeToggle />
      </header>

      <main>
        <section className="landing-hero">
          <h1>白噪音混音器</h1>
          <p className="landing-lead">叠加雨声、海浪与自定义音乐，打造属于你的专注与放松声景。</p>
          <StartButton />
        </section>

        <section className="landing-section" aria-labelledby="features-title">
          <h2 id="features-title">能做什么</h2>
          <ul className="landing-list">
            <li>多轨叠加内置环境声与导入的本地音乐</li>
            <li>每轨独立调节音量、声像与播放速度，支持静音</li>
            <li>主音量、立体声宽度与全局播放速度一键控制</li>
            <li>导入 MP3、WAV、M4A 等格式，保存在本机音频库</li>
          </ul>
        </section>

        <section className="landing-section" aria-labelledby="how-title">
          <h2 id="how-title">怎么用</h2>
          <ol className="landing-steps">
            <li>选择一种或多种声音</li>
            <li>在混音台调节各轨与整体参数</li>
            <li>点击播放，沉浸在你的声景里</li>
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
