import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[BPTG Solver] render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          backgroundColor: '#0a0a0a', color: '#f0f0f0', padding: 32, fontFamily: 'system-ui',
        }}>
          <div style={{ fontSize: 40 }}>⚠</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#ff0070', margin: 0 }}>
            Something went wrong
          </h1>
          <pre style={{
            fontSize: 12, color: '#888', background: '#111', padding: 16,
            borderRadius: 8, maxWidth: 600, overflow: 'auto', whiteSpace: 'pre-wrap',
          }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              background: '#ff0070', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 700,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
