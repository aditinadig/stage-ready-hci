import { useEffect, useState } from 'react';

export default function NotificationBanner({ show, message, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className={`notification-banner ${isVisible ? 'notification-banner--visible' : ''}`}>
      <div className="notification-banner__content">
        <div className="notification-banner__icon">🔔</div>
        <div className="notification-banner__text">
          <div className="notification-banner__title">New Update</div>
          <div className="notification-banner__message">{message}</div>
        </div>
        <button 
          className="notification-banner__close"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

