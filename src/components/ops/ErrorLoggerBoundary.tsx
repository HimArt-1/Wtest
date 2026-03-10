"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorLoggerBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        fetch("/api/ops/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "error",
                source: "ErrorBoundary",
                message: error.message,
                stack: error.stack,
                metadata: { componentStack: info.componentStack?.slice(0, 500) },
            }),
        }).catch(() => {});
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-theme mb-2">حدث خطأ</h3>
                    <p className="text-sm text-theme-subtle mb-4">تم تسجيل الخطأ وسيتم مراجعته</p>
                    <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-bg text-sm font-bold hover:opacity-90">
                        <Home className="w-4 h-4" />
                        العودة للرئيسية
                    </Link>
                </div>
            );
        }
        return this.props.children;
    }
}
