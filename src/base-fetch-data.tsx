import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  BaseMessageResponse,
  FetchSetup,
  HttpMethods
} from "./base-models";
import useBaseAuth from "./useBaseAuth";
import useBaseNotification from "./useBaseNotification";

type FetchDataStates = "1st-trial" | "2nd-trial" | "refresh";

export interface BaseFetchDataProps<T> {
  enable: boolean;
  url: string;
  method: HttpMethods;
  body?: BodyInit;
  headers?: HeadersInit;
  onSuccessful?: (data: T) => void;
  on401?: (response: Response) => void;
  onNotSuccessful?: (response: Response) => void;
  onError?: (reason: any) => void;
  onFinally?: () => void;
  pendingHandlerSetter?: Dispatch<SetStateAction<boolean>>;
  hidePending?: boolean;
  showClientSideError?: boolean;
  showSuccess?: boolean;
  unAuthorized?: boolean;
  admin?: boolean;
  with_dg_id?: boolean;
  counter?: number;
  isTextResponse?: boolean;
  forcedToken?: string;
}
export function useBaseFetch<T>(setup: FetchSetup, props: BaseFetchDataProps<T>) {
  const {
    enable,
    url,
    method,
    body,
    headers,
    onSuccessful,
    on401,
    onNotSuccessful,
    onError,
    onFinally,
    pendingHandlerSetter,
    hidePending,
    showClientSideError,
    showSuccess,
    unAuthorized,
    admin,
    with_dg_id,
    counter,
    isTextResponse,
    forcedToken,
  } = props;
  const {cookies, locals, logoutCallback} = setup;
  const { login, logout, dg_id, isLoggedIn, refreshToken, token } =
    useBaseAuth({
      cookies,
      locals,
      logoutCallback,
    });

  const { showNotification, clearNotification } = useBaseNotification();
  const [myState, setMyState] = useState<FetchDataStates>("1st-trial");

  useEffect(() => {
    if (!enable) return;
    if (!unAuthorized && !isLoggedIn && !forcedToken) return;
    if (!hidePending && !pendingHandlerSetter) {
      // showNotification({
      //   notifType: "pending"
      // });
    } else if (pendingHandlerSetter) {
      pendingHandlerSetter(true);
    }

    //             __               _
    //   _ __ ___ / _|_ __ ___  ___| |__
    //  | '__/ _ \ |_| '__/ _ \/ __| '_ \
    //  | | |  __/  _| | |  __/\__ \ | | |
    //  |_|  \___|_| |_|  \___||___/_| |_|

    if (myState === "refresh") {
      if (!refreshToken) {
        logout();
        return;
      }

      setup.fetchRefreshToken().then((response) => {
        switch (responseRange(response.status)) {
          case "successful":
            response.json().then((data: {[key: string]: string}) => {
              login(
                data[setup.response_token_key],
                data[setup.response_refresh_token_key]
              );
              setMyState("2nd-trial");
            });
            return;
          case "client-error":
            /**
             * response.status === 400: refresh token is expired
             * response.status === 401: device  is expired
             */
            if (response.status === 400 || response.status === 401) {
              logout();
              return;
            }
          default:
            break;
        }
        if (responseRange(response.status) === "successful") {
        }
      });
    } else {
      //  _     _      ___     ____            _
      // / |___| |_   ( _ )   |___ \ _ __   __| |
      // | / __| __|  / _ \/\   __) | '_ \ / _` |
      // | \__ \ |_  | (_>  <  / __/| | | | (_| |
      // |_|___/\__|  \___/\/ |_____|_| |_|\__,_|

      const url_with_UTM = setup.addedUrlParams
        ? addParamArrToUrl(url, convertUtmCookiesToParams(setup.addedUrlParams))
        : url;
      const url_with_dg_id =
        with_dg_id && dg_id
          ? addParamToUrl(url_with_UTM, "dg_id", dg_id)
          : url_with_UTM;

      const baseFetch = unAuthorized
        ? API.fetch(url_with_dg_id, {
            method: method,
            body: body,
            headers: headers,
          })
        : API.methodAuth<T>(method, {
            url: url_with_dg_id,
            token: forcedToken || token,
            requestInfo: {
              method: method,
              body: body,
              headers: headers,
            },
          });
      baseFetch
        .then((response) => {
          switch (responseRange(response.status)) {
            case "successful": {
              !!isTextResponse
                ? response
                    .text()
                    .then((data) => {
                      onSuccessful && onSuccessful(data as T);
                    })
                    .catch((e) => console.error(e))
                : response
                    .json()
                    .then((data: unknown) => {
                      onSuccessful && onSuccessful(data as T);
                      showSuccess &&
                        showNotification({
                          notifType: "success",
                          message: (data as BaseMessageResponse).message,
                        });
                    })
                    .catch((e) => console.error(e));
              break;
            }
            case "client-error":
              if (response.status === 401 && on401) {
                on401(response);
                return;
              } else if (response.status === 401 && token && !refreshToken) {
                logout();
                return;
              } else if (
                response.status === 401 &&
                token &&
                myState === "1st-trial"
              ) {
                setMyState("refresh");
                return;
              } else if (response.status === 401 && myState === "2nd-trial") {
                onNotSuccessful && onNotSuccessful(response);
                return;
              } else if (showClientSideError) {
                response.json().then((errorResponse: { message: string }) =>
                  showNotification({
                    notifType: "error",
                    message: errorResponse.message,
                  })
                );

                onNotSuccessful && onNotSuccessful(response);
                return;
              } else {
                onNotSuccessful && onNotSuccessful(response);
              }
            default:
              onNotSuccessful && onNotSuccessful(response);
              break;
          }

          clearNotification();
        })
        .catch((reason) => {
          if (onError) {
            onError(reason);
          } else {
            showNotification({
              notifType: "error",
              message: "خطا در برقراری ارتباط",
            });
          }
        })
        .finally(() => {
          pendingHandlerSetter && pendingHandlerSetter(false);
          onFinally && onFinally();
        });
    }
  }, [myState, counter, url, enable, forcedToken]);
}

export default function BaseFetchData<T extends BaseMessageResponse>(setup: FetchSetup, params: BaseFetchDataProps<T>) {
  useBaseFetch<T>(setup, params);
  return null;
}

interface UrlParam {
  param: string;
  value: string | number | undefined | null;
}

function convertUtmCookiesToParams(
  utmCookies: Record<string, string>
): UrlParam[] {
  return Object.keys(utmCookies).map((key) => ({
    param: key,
    value: utmCookies[key],
  }));
}

interface APIGetConfig<T> {
  url: string;
  token: string;
  requestInfo?: RequestInit;
}

const API = {
  fetch: async function (url: string, requestInfo?: RequestInit) {
    const calculatedRequestInfo = {
      ...requestInfo,
      headers: {
        "Accept-Language": "fa-ir",
        "Content-Type": "application/json",
        ...requestInfo?.headers,
      },
    };

    return fetch(url, calculatedRequestInfo);
  },

  fetchAuth: async function <T>(config: APIGetConfig<T>) {
    const { url, token, requestInfo } = config;
    const addedRequestInfo = requestInfo
      ? {
          ...requestInfo,
          headers: {
            "Accept-Language": "fa",
            Authorization: `Token ${token}`,
            ...requestInfo.headers,
          },
        }
      : null;
    return API.fetch(url, addedRequestInfo as RequestInit);
  },

  methodAuth: async function <T>(method: HttpMethods, config: APIGetConfig<T>) {
    const { url, token, requestInfo } = config;

    return API.fetchAuth({
      url,
      token,
      requestInfo: {
        ...requestInfo,
        method: method,
      },
    });
  },
};

const addParamToUrl = (url: string, param: string, value: string) =>
  url + (url.includes("?") ? "" : "?") + "&" + param + "=" + value;

export const addParamArrToUrl = (url: string, paramArr: UrlParam[]) => {
  const paramValues = paramArr.map((i) => i.param + "=" + i.value).join("&");
  return url + (url.includes("?") ? "&" : "?") + paramValues;
};

type ResponseRange =
  | "informational"
  | "successful"
  | "redirection"
  | "client-error"
  | "server-error"
  | "unknown";

const responseRange = (code: number | null | undefined): ResponseRange => {
  if (!code) return "unknown";
  switch (true) {
    case code >= 100 && code <= 199:
      return "informational";
    case code >= 200 && code <= 299:
      return "successful";
    case code >= 300 && code <= 399:
      return "redirection";
    case code >= 400 && code <= 499:
      return "client-error";
    case code >= 500 && code <= 599:
      return "server-error";
    default:
      return "unknown";
  }
};
