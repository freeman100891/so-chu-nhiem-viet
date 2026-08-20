import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../../../shared/components/Button';

interface Props {
  children: ReactNode;
  widgetName?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in widget ${this.props.widgetName || 'Dashboard'}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 text-center space-y-2.5">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 mx-auto flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-900 dark:text-red-200">
              Không thể tải khối dữ liệu {this.props.widgetName ? `"${this.props.widgetName}"` : ''}
            </h4>
            <p className="text-[11px] text-red-700/80 dark:text-red-400 mt-0.5">
              Đã xảy ra sự cố khi truy vấn dữ liệu cục bộ. Vui lòng thử lại.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl text-red-700 border-red-300 hover:bg-red-100/60"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={this.handleRetry}
          >
            Thử tải lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
