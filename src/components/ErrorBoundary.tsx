// ============================================================================
// TRADYX REACT ERROR BOUNDARY (src/components/ErrorBoundary.tsx)
// Author: Senior Front-End Developer & Resilience Specialist
// Description: Global React Error Boundary component to prevent white screen crashes.
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Unhandled React Error caught by ErrorBoundary:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 selection:bg-rose-500 selection:text-slate-950">
                    <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6 text-center">
                        <div className="mx-auto w-16 h-16 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
                            <ShieldAlert className="w-8 h-8 animate-pulse" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-extrabold tracking-tight text-slate-100">
                                Qualcosa è andato storto
                            </h2>
                            <p className="text-xs text-slate-400 font-sans leading-relaxed">
                                Si è verificato un errore imprevisto durante il rendering dell'interfaccia. L'applicazione è stata protetta dall'ErrorBoundary per evitare crash del browser.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-[11px] font-mono text-rose-300/90 overflow-x-auto max-h-32">
                                <div className="font-bold flex items-center gap-1.5 text-rose-400 mb-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {this.state.error.name}
                                </div>
                                <div>{this.state.error.message}</div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={this.handleReset}
                            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Ricarica Applicazione
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
