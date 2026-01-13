import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AlertTriangle, RefreshCw, Home, Music } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { addBreadcrumb, captureError } from '@/utils/errorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  screenName?: string;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    addBreadcrumb({
      category: 'error_boundary',
      message: `Error in ${this.props.screenName || 'unknown'}: ${error.message}`,
      level: 'error',
      data: { componentStack: errorInfo.componentStack },
    });
    captureError(error, { tags: { screen: this.props.screenName || 'unknown' } });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={48} color={Colors.present} />
            </View>
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              Your progress is saved! Try again or head back home.
            </Text>
            
            {this.props.screenName && (
              <View style={styles.screenInfo}>
                <Music size={14} color={Colors.textMuted} />
                <Text style={styles.screenName}>in {this.props.screenName}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color={Colors.text} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              {this.props.showHomeButton && (
                <TouchableOpacity
                  style={styles.homeButton}
                  onPress={() => {
                    this.handleRetry();
                  }}
                  activeOpacity={0.8}
                >
                  <Home size={20} color={Colors.accent} />
                </TouchableOpacity>
              )}
            </View>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.present + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  screenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  screenName: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  homeButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  errorDetails: {
    marginTop: 24,
    maxHeight: 200,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.present,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 8,
  },
});

export default ErrorBoundary;
