import { useContext } from "react";
import BaseContext from "./base-context";

function useBaseNotification() {
  const {
    notification,
    notificationIsShown,
    setNotification,
    showNotification,
    clearNotification,
  } = useContext(BaseContext);

	return {
    notification,
    notificationIsShown,
    setNotification,
    showNotification,
    clearNotification,		
	}
}

export default useBaseNotification;
