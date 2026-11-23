import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { FirestoreErrorInfo } from '../lib/firestoreError';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Spark Admin Portal ErrorBoundary:', error, info);
  }

  private parseFirestoreInfo(message: string): FirestoreErrorInfo | null {
    try {
      const parsed = JSON.parse(message) as FirestoreErrorInfo;
      if (parsed && typeof parsed === 'object' && 'operationType' in parsed) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const message = this.state.error?.message || 'An unexpected application error occurred.';
    const firestoreInfo = this.parseFirestoreInfo(message);

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-slate-900">
                {firestoreInfo ? 'Firestore Permission or Connection Error' : 'Application Error'}
              </h1>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {firestoreInfo
                  ? `Operation "${firestoreInfo.operationType}" on "${firestoreInfo.path ?? 'unknown'}" was rejected: ${firestoreInfo.error}`
                  : message}
              </p>

              {firestoreInfo && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 space-y-1">
                  <div>User: {firestoreInfo.authInfo?.email || 'Not signed in'}</div>
                  <div>Operation: {firestoreInfo.operationType}</div>
                  <div>Path: {firestoreInfo.path || '—'}</div>
                </div>
              )}

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reload Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
