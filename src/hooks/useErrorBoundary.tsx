import React, { Component, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryComponent extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
    toast.error('Something went wrong. Please try again later.');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Oops! Something went wrong.</h2>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const useErrorBoundary = () => {
  return {
    ErrorBoundary: ErrorBoundaryComponent
  };
};