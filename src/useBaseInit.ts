import { useContext, useEffect, useState } from "react";
import * as rdd from "react-device-detect";
import { useBaseFetch } from "./base-fetch-data";
import {
  BaseCookieStorage,
  BaseLocalStorage,
  FetchSetup,
  Profile,
} from "./base-models";
import BaseContext from "./base-context";

interface useBaseAppInitProps {
  fetchSetup: FetchSetup;
  counter: number;
  api_request_dg_id: string;
  cookies: BaseCookieStorage;
  locals: BaseLocalStorage;
  utm: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
  }
}

interface DgIdResponse {
  dg_id: string;
}

function useBaseInit({
  fetchSetup,
  counter,
  api_request_dg_id,
  cookies,
  locals,
  utm,
}: useBaseAppInitProps) {
  const [requestDgIdBody, setRequestDgIdBody] = useState<{
    fcm_token: string;
  }>();
  const { dg_id, setDgId, login, fcm_token, setFcmToken, setProfile } =
    useContext(BaseContext);
  const {
    utm_campaign,
    utm_medium,
    utm_source,
  } = utm;
  useBaseFetch<DgIdResponse>(fetchSetup, {
    enable: !!requestDgIdBody,
    url: api_request_dg_id,
    method: "POST",
    body: JSON.stringify(requestDgIdBody),
    onSuccessful: (data) => {
      const tmpDgID = (data as { dg_id: string }).dg_id;
      console.log("DGID GOT:", tmpDgID);
      setDgId(tmpDgID);
      cookies.set(cookies.keys.dg_id, tmpDgID);
      setFcmToken(requestDgIdBody?.fcm_token || "");
    },
    onNotSuccessful: (resp) => console.error("==> error DgId", resp.statusText),
    unAuthorized: true,
    counter,
  });

  useEffect(() => {
    if (!locals?.isReady || !window) return;
    const storedDgId = cookies.get(cookies.keys.dg_id);
    const storedToken = cookies.get(cookies.keys.token);
    const profileString = locals.get(locals.keys.profile);

    if (profileString) {
      try {
        const profile = JSON.parse(profileString) as Profile;
        setProfile(profile);
      } catch (e) {
        console.error("could not parse profile text");
      }
    }
    const storedRefreshToken = cookies.get(cookies.keys.refresh_token);
    if (storedToken && storedRefreshToken)
      login(storedToken, storedRefreshToken);
    if (storedDgId) {
      setDgId(storedDgId);
    } else {
      const screen_resolution =
        window.devicePixelRatio * screen.width +
        "X" +
        window.devicePixelRatio * screen.height;

      const deviceData = {
        ip: "",
        isp_name: "",
        is_used_vpn: 1,
        platform_name: "WEB",
        platform_version_code: "",
        platform_version_name: rdd.browserName, // environment.VERSION_NAME,
        os_name: rdd.osName,
        os_version: rdd.osVersion, //this.deviceInfo.os_version,
        is_rooted: 0,
        device_uuid: "",
        device_brand: "",
        device_model: rdd.deviceType, //this.deviceInfo.deviceType,
        device_language: "",
        screen_density: window.devicePixelRatio.toString(),
        screen_resolution,
        cpu: "",
        timezone: "",
        browser_name: rdd.browserName, //this.deviceInfo.browser,
        agent: window.navigator.userAgent, // this.deviceInfo.userAgent,
        referrer: document.referrer, // !!this.document.referrer ? this.document.referrer : "",
        utm_source,
        utm_medium,
        utm_campaign,
        fcm_token: "",
        google_advertising_id: "",
        google_service_framework: "",
      };
      setRequestDgIdBody(deviceData);
    }
  }, [locals?.isReady]);

  return { dg_id };
}

export default useBaseInit;
