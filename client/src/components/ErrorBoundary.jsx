import { Component } from 'react';

// 全局错误边界：渲染异常时显示友好降级 UI，避免整站白屏
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // 便于线上排查：错误会上报到控制台
    console.error('ErrorBoundary caught an error:', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center" role="alert">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-extrabold text-text-primary">页面出错了</h1>
          <p className="text-text-secondary mt-2">
            发生了意料之外的错误，您可以重试或刷新页面。
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={this.reset} className="btn-primary">
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
