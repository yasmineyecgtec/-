import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || '發生未預期的錯誤',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendlyMsg = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed && typeof parsed.error === 'string') {
          friendlyMsg = `資料庫權限或連線錯誤：${parsed.error}`;
        }
      } catch {
        // Use raw message when not JSON
      }

      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E5EAE7] rounded-xl p-8">
            <h1 className="text-xl font-bold text-[#111827] font-display mb-3">
              系統暫時無法載入資料
            </h1>
            <p className="text-sm text-[#4B5563] leading-relaxed mb-6 break-words">
              {friendlyMsg}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#155E3A] hover:bg-[#0F472B] rounded-lg transition-colors"
            >
              重新整理頁面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
