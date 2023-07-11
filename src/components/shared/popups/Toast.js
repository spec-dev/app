import React, { useEffect, useState } from 'react';
import { closeIcon } from '../../../svgs/icons';

function Toast({ message, duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="toast">
      <div className="toast-message">{message}</div>
      <button className="toast-close-button" onClick={onClose}>
        <div className='toast-close-icon' dangerouslySetInnerHTML={{ __html: closeIcon }} />
      </button>
    </div>
  );
}

export default Toast;