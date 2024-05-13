import { createContext, useState } from "react";
import { BaseNotification, Profile } from "./base-models";


export interface BaseStore {
  token: string;
  refreshToken: string;
  dg_id: string;
  profile?: Profile;
  isLoggedIn: boolean;
  isIntlUser?: boolean;
  notification?: BaseNotification;
  notificationIsShown: boolean;
  fcm_token: string,
  referrer: string;
  setDgId: (dgId: string) => void;
  setProfile: (profile: Profile | null) => void;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  setNotification: (notif: BaseNotification | null) => void;
  showNotification: (notif: BaseNotification | null) => void;
  clearNotification: () => void;
  setFcmToken: (fcmToken: string) => void,
  setReferrer: (ref: string) => void;
}

export const initialBaseStore: BaseStore = {
  token: "",
  refreshToken: "",
  dg_id: "",
  isLoggedIn: false,
  notificationIsShown: false,
  fcm_token: "",
  referrer: "",
  setProfile: (profile: Profile) => {},
  login: (token: string, refreshToken: string) => {},
  setDgId: (dg_id: string) => {},
  logout: () => {},
  setNotification: (notif: BaseNotification | null) => {},
  showNotification: (notif: BaseNotification | null) => {},
  clearNotification: () => {},
  setFcmToken: fcmToken => {},
  setReferrer: (ref) => {},
};

const BaseContext = createContext(initialBaseStore);

export function BaseContextProvider(props: any) {
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [dg_id, setDgId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isIntlUser, setIsIntlUser] = useState(false);
  const [referrer, setReferrer] = useState("");
  const [notificationIsShown, setNotificationIsShown] = useState(false);
  const [notification, setNotification] = useState<BaseNotification>({
    message: "",
    notifType: "success",
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [fcm_token, setFcmToken] = useState("");


  const baseContextValue: BaseStore = {
    token,
    refreshToken,
    dg_id,
    isLoggedIn,
    isIntlUser,
    notification,
    notificationIsShown,
    fcm_token,
    profile,
    referrer,
    setNotification,
    showNotification: () => setNotificationIsShown(true),
    clearNotification: () => setNotificationIsShown(false),
    setDgId,
    setProfile,
    setFcmToken,
    setReferrer,
    logout: () => {
      setToken("");
      setRefreshToken("");
      setIsLoggedIn(false);
      setIsIntlUser(process.env.NEXT_PUBLIC_INTERNATIONAL === "yes");
      setProfile(null);
    },
    login: (token: string, refreshToken: string) => {
      token && setToken(token);
      refreshToken && setRefreshToken(refreshToken);
      const tmpIsLoggedIn: boolean = token?.length > 10;
      setIsLoggedIn(tmpIsLoggedIn);
      setIsIntlUser(
        !tmpIsLoggedIn && process.env.NEXT_PUBLIC_INTERNATIONAL === "yes"
      );

    },
  };

  return (
    <BaseContext.Provider value={baseContextValue}>
      {props.children}
    </BaseContext.Provider>
  );
}

export default BaseContext;
