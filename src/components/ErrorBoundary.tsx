import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white rounded-3xl border border-rose-100 shadow-sm my-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {this.props.fallbackTitle || 'Não foi possível carregar este módulo'}
          </h3>
          <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
            Ocorreu uma inconsistência temporária ou erro ao baixar os recursos necessários desta seção.
          </p>
          {this.state.error && (
            <div className="bg-slate-50 text-slate-600 text-xs font-mono p-3 rounded-xl mb-6 max-w-lg overflow-x-auto text-left border border-slate-200">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Recarregar Módulo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
