const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="loading-spinner" role="status" aria-live="polite">
    <div className="loading-spinner__circle" />
    <p>{message}</p>
  </div>
);

export default LoadingSpinner;
