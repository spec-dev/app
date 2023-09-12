import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Toast from './Toast';

function SidecarErrorToastContainer() {

  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, duration = 5000) => {
    const notification = { message, duration, id: Date.now() };
    setNotifications((prevNotifications) => [...prevNotifications, notification]);
  };

  const removeNotification = (index) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = [...prevNotifications];
      updatedNotifications.splice(index, 1);
      return updatedNotifications;
    });
  };

  useEffect(() => {
    const eventHandler = (_, msg) => {
      addNotification(msg);
    };

    window.electronAPI?.on('sidecar-error', eventHandler);

    return () => {
      window.electronAPI?.off('sidecar-error', eventHandler);
    };
  }, []);

  return ReactDOM.createPortal(
    <div className="toast-container">
      {notifications.map((notification, index) => (
        <Toast
          key={index}
          message={notification.message}
          duration={notification.duration}
          onClose={() => removeNotification(index)}
        />
      ))}
    </div>,
    document.body
  );

}

export default SidecarErrorToastContainer;