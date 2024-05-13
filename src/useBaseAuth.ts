import { useCallback, useContext } from "react";
import BaseContext from "./base-context";
import { BaseCookieStorage, BaseLocalStorage, Profile } from "./base-models";

interface useBaseAuthProps {
  cookies: BaseCookieStorage;
  locals: BaseLocalStorage;
  logoutCallback?: Function;
}
function useBaseAuth({ cookies, locals, logoutCallback }: useBaseAuthProps) {
  const ctx = useContext(BaseContext);
  const {
    isLoggedIn,
    isIntlUser,
    dg_id,
    token,
    refreshToken,
    profile,
    referrer,
    setReferrer,
  } = ctx;
  const login = useCallback(
    (token: string, refresh_token: string) => {
      cookies.set(cookies.keys.token, token);
      cookies.set(cookies.keys.refresh_token, refresh_token);
      ctx.login(token, refresh_token);
    },
    [ctx.login, cookies.set, cookies.keys]
  );
  const logout = useCallback(() => {
    cookies.clear(cookies.keys.token);
    cookies.clear(cookies.keys.refresh_token);
    locals.clear(locals.keys.profile);
    ctx.logout();
    if (logoutCallback) logoutCallback();
  }, [ctx.logout, cookies.clear, locals.clear, logoutCallback]);

  const setProfile = useCallback(
    (profile: Profile) => {
      locals.set(locals.keys.profile, JSON.stringify(profile));
      ctx.setProfile(profile);
    },
    [ctx.setProfile, locals.set]
  );

  const setDgId = useCallback(
    (dgid: string) => {
      cookies.set(cookies.keys.dg_id, dgid);
      ctx.setDgId(dgid);
    },
    [ctx.setDgId, cookies.set]
  );

  const clearProfile = useCallback(() => {
    locals.clear(locals.keys.profile);
    ctx.setProfile(null);
  }, [ctx.setProfile, locals.clear]);

  return {
    token,
    refreshToken,
    isLoggedIn,
    isIntlUser,
    dg_id,
    profile,
    referrer,
    login,
    logout,
    setProfile,
    clearProfile,
    setReferrer,
  };
}

export default useBaseAuth;
