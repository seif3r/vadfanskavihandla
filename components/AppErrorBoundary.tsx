import { Component } from "react";

import CrashScreen from "@/components/CrashScreen";
import { AppErrorBoundaryProps, AppErrorBoundaryState } from "@/types/components";

// Catches a crash while rendering anywhere in the app and shows CrashScreen instead of a white
// screen. Its own class rather than Expo Router's ErrorBoundary export: with that export the
// statically rendered web page no longer matches the first render in the browser (React error 418).
export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  retry = async () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) return <CrashScreen error={this.state.error} retry={this.retry} />;
    return this.props.children;
  }
}
