const ErrorAlert = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="error-alert" role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="error-alert__dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
