import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="p-4 bg-red-900/50 text-red-400 rounded-full mb-4 border border-red-700/50">
            <AlertOctagon className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Đã xảy ra lỗi không mong muốn</h1>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Ứng dụng đã gặp sự cố đột ngột. Dữ liệu của bạn trong IndexedDB vẫn an toàn và không bị mất. Vui lòng tải lại ứng dụng.
          </p>
          {this.state.error && (
            <div className="max-w-md w-full bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-left text-xs font-mono text-slate-300 mb-6 overflow-x-auto">
              {this.state.error.message}
            </div>
          )}
          <Button
            variant="primary"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={this.handleReload}
          >
            Tải lại Ứng dụng
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
