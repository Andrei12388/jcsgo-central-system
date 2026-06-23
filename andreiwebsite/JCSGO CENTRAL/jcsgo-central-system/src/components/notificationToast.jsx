import { createContext, useContext } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const notify = {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg),
    info: (msg) => toast.info(msg),
    warning: (msg) => toast.warning(msg),
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* GLOBAL TOAST CONTAINER (ONLY ONCE IN APP) */}
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        newestOnTop
        pauseOnHover
        style={{ zIndex: 9999999 }}
      />
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);