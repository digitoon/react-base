import { useEffect, useState } from "react";
import {
  browserName,
  browserVersion,
  mobileModel,
  mobileVendor,
  osName,
  osVersion
} from "react-device-detect";
import {
  useBaseFetch
} from "./base-fetch-data";
import { ActiveSub, ChildInfo, FetchSetup, Profile } from "./base-models";
import useBaseAuth from "./useBaseAuth";
import useBaseNotification from "./useBaseNotification";

export function useBaseLoginProcess(fetchSetup: FetchSetup, props: UseLoginProps) {
  const {
    device_id,
    onLoginFailed,
    onLoginSucceed,
    api,
  } = props;
  const {locals, cookies, logoutCallback} = fetchSetup
  const {
    dg_id,
    token,
    login,
    setProfile,
  } = useBaseAuth({
    locals,
    cookies, 
    logoutCallback,
  });

  const { showNotification} = useBaseNotification();

  const [stage, setStage] = useState<Stage>("mobile-number-page");
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [stage2Response, setStage2Response] =
    useState<MobileLoginStep2Response>();
  const [step1RequestBody, setStep1RequestBody] =
    useState<MobileLoginStep1Request | null>(null);
  const [step2RequestBody, setStep2RequestBody] =
    useState<MobileLoginStep2Request | null>(null);
  const [currentFetch, setCurrentFetch] = useState<Fetch>("no-fetch");
  const [childId, setChildId] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [childrenInfo, setChildrenInfo] = useState<ChildInfo[]>();
  const [phoneMoment, setLocalPhoneMoment] = useState("");

  const setPhoneMoment = (mobileStr: string, nickname: string, timeNow?: number) => {
    const thePhoneMoment = `${mobileStr}::${timeNow || Date.now()}::${nickname || "guest"}`;
    setLocalPhoneMoment(thePhoneMoment);
    locals.set(locals.keys.phone_moment, thePhoneMoment);
  };

  const clearPhoneMoment = () => {
    setLocalPhoneMoment("");
    locals.clear(locals.keys.phone_moment);
  }

  const setPhoneNumber = (phoneNumber: string) => {
    setStep1RequestBody({
      device_id,
      device_model: `browser-${mobileVendor}-${mobileModel}-${browserName}-${browserVersion}`,
      device_os: `NextJS-${osVersion}-${osName}`,
      mobile: phoneNumber
    });
  }

  const setPinCode = (pin: string) => setPin(pin);
  const selectChildId = (id: number) => {
    setChildId(id);
    setCurrentFetch("fetch-4");
  }

  // fetch-1
  useBaseFetch<MobileLoginStep1Response>(fetchSetup, {
    enable: currentFetch === "fetch-1",
    url: api.mobile_login_step1,
    method: "POST",
    body: JSON.stringify(step1RequestBody),
    onSuccessful: (data) => {
      setPhoneMoment(step1RequestBody?.mobile || "", data.nickname);
      setCurrentFetch("no-fetch");
      setStage("verify-page");
    },
    onNotSuccessful: () => {

      clearPhoneMoment()
      setCurrentFetch("no-fetch");
      setStage("mobile-number-page");
    },
    pendingHandlerSetter: setIsLoading,
    unAuthorized: true,
    showClientSideError: true,
    showSuccess: true,
  });

  // fetch-2
  useBaseFetch(fetchSetup, {
    enable: currentFetch === "fetch-2" && !!step2RequestBody,
    url: api.mobile_login_step2,
    method: "POST",
    body: JSON.stringify(step2RequestBody),
    onSuccessful: (data) => {
      setStage("verify-page");
      clearPhoneMoment()
      setStage2Response(data as MobileLoginStep2Response);
      setCurrentFetch("fetch-3");
      onLoginSucceed();
    },
    on401: () => {
			const err = "کد اشتباه است";
			setError(err);
      showNotification({
        notifType: "error",
        message: err,
      })
      setCurrentFetch("no-fetch");
      setStage("verify-page");
    },
    onNotSuccessful: () => {
      setStep2RequestBody(null);
      setCurrentFetch("no-fetch");
      setStage("verify-page");
      onLoginFailed();
    },
    pendingHandlerSetter: setIsLoading,
    with_dg_id: true,
    unAuthorized: true,
    showClientSideError: true,
  });

  // fetch-3
  useBaseFetch(fetchSetup, {
    enable: currentFetch === "fetch-3" && !!stage2Response && !!dg_id,
    url: api.request_children_list,
    method: "GET",
    onSuccessful: (data) => {
      const castData = data as ChildInfo[];
      if (castData.length > 1) {
        setStage("select-child");
        setChildrenInfo(castData);
      } else {
        const { token, refresh_token } = stage2Response;
        login(token, refresh_token);
        setCurrentFetch("fetch-5");
      }
    },
    forcedToken: stage2Response?.token,
    pendingHandlerSetter: setIsLoading,
    onNotSuccessful: (response) => {
      if (response.status) {
        // when there is no family
        const { token, refresh_token } = stage2Response;
        login(token, refresh_token);
        setCurrentFetch("fetch-5");
      }
    },
  });

	// fetch-4
  useBaseFetch(fetchSetup, {
    enable: currentFetch === "fetch-4" && !!childId && !!dg_id,
		url: api.get_token_user,
		method: "GET",
		onSuccessful: (data) => {
			setCurrentFetch("fetch-5");
			const { token, refresh_token } = data as {
				token: string;
				refresh_token: string;
			};
			login(token, refresh_token);
		},
		with_dg_id: true,
		showClientSideError: true,
		forcedToken: stage2Response?.token,
		pendingHandlerSetter: setIsLoading,
  });	

	// fetch-5
	useBaseFetch(fetchSetup, {
    enable: currentFetch === "fetch-5" && !!token,
		url: api.request_profile_with_active_subs,
		method: "GET",
		onSuccessful: (data) => {
			setCurrentFetch("no-fetch");
			const castData = data as MobileLoginStep3Response;
			setProfile(castData);
		},
		with_dg_id: true,
		showClientSideError: true,
		pendingHandlerSetter: setIsLoading,
  });	

  useEffect(() => {
    if (step1RequestBody) setCurrentFetch("fetch-1");
  }, [step1RequestBody]);

  useEffect(() => {
    if (!locals.isReady) return;
    const newPhoneMoment = locals.get(locals.keys.phone_moment);
    if (!newPhoneMoment) return;
    if (newPhoneMoment.split("::").length !== 3) return;
    const [mobile, moment, nickname] = newPhoneMoment.split("::");
    const isSafeMoment = !!moment && !!isNumeric(moment);
    if (!isSafeMoment) return;
    const momentNumber = parseInt(moment);
    if (Date.now() - momentNumber > 60000) {
      clearPhoneMoment();
    } else {
      setPhoneMoment(mobile, nickname, momentNumber);
      setStage("verify-page");
    }

  }, [locals.isReady]);

  useEffect(() => {
    if (!pin) return;
    if (pin.startsWith("modify-phone-number")) {
      clearPhoneMoment()
      setStage("mobile-number-page");
      setCurrentFetch("no-fetch");
      return;
    }

    if (pin.startsWith("resend-pin-code")) {
      setStep1RequestBody((state) => {
        return { ...state, resend: true };
      });
      return;
    }

    if (phoneMoment) {
      setStep2RequestBody({
        device_id,
        mobile: phoneMoment.split("::")[0],
        nickname: phoneMoment.split("::")[2],
        verification_code: pin,
      });
    }
    setCurrentFetch("fetch-2");
  }, [pin]);

  useEffect(() => {
    console.log("fetch: ", currentFetch, "Stage: ", stage, "dg-id:", dg_id, token);
    
  }, [currentFetch, stage, dg_id]);

  return {
    stage,
    error,
		isLoading,
    childrenInfo,
    phoneMoment,
    setPhoneNumber,
    setPinCode,
    selectChildId,
  };
}




interface UseLoginProps {
  device_id: "mobile" | "desktop" | "TV";
  onLoginSucceed: () => void;
  onLoginFailed: () => void;
  api: {
    mobile_login_step1: string;
    mobile_login_step2: string;
    request_children_list: string;
		get_token_user: string;
		request_profile_with_active_subs: string;
  };
}

interface MobileLoginStep2Response {
  error: number;
  message: string;
  token: string;
  refresh_token: string;
  files_added: any[];
  nickname: string;
  fino_token: string;
  user_id: number;
  is_parent: boolean;
  has_password: boolean;
}

interface MobileLoginStep1Request {
  mobile: string;
  device_id: string;
  device_model: string;
  device_os: string;
}

interface MobileLoginStep1Response {
  error: number;
  message: string;
  nickname: string;
  is_first_login: boolean;
}

interface MobileLoginStep2Request {
  mobile: string;
  device_id: string;
  verification_code: string;
  nickname: string;
}

interface MobileLoginStep3Response extends Profile {
  active_subs: ActiveSub[];
}


function isNumeric(str: any) {
  //if (typeof str != "string") return false // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

export type Stage =
  | "initial"
  | "mobile-number-page"
  | "verify-page"
  | "select-child"
  | "finished";

type Fetch =
  | "no-fetch"
  | "fetch-1"
  | "fetch-2"
  | "fetch-3"
  | "fetch-4"
  | "fetch-5";

