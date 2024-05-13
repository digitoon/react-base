import { Dispatch, SetStateAction } from "react";

export interface Profile {
    id: number;
    error?: boolean;
    nickname: string;
    date_of_birth: string;
    gender: string;
    avatar: string;
    mobile: string;
    email?: string;
    isp_data?: IspData;
    city?: string;
    city_id?: number;
    province?: string;
    active_subs?: ActiveSub[];
    is_official?: boolean;
    limit_age?: LimitAge;
    first_name: string;
    last_name: string;
  }
  
  export type HttpMethods = "GET" | "POST" | "DELETE" | "PUT";

  
  export interface IspData {
    name: string;
    color: string;
    icon?: any;
    sub_net_rate?: any;
    nosub_net_rate?: any;
    description: string;
    net_name_custom: string;
  }
  
  export interface ActiveSub {
    id: number;
    purchase_type: number;
    product_title: string;
    price: number;
    created_time: string;
    expire_time: string;
    date_added: string;
    server_time: string;
    auto_recharge: boolean;
    target_type: number;
    target_id: number;
    avatar: string;
    description: string;
    url?: string;
  }
  
  export interface LimitAge {
    id: number;
    title: string;
    age: number;
    logo: string;
    is_set: boolean;
  }
  
  export interface BaseNotification {
    title?: string;
    message?: string;
    notifType: "success" | "error" | "pending" | "warning" | "info";
  }

  interface BaseStorage {
    get: (key: string) => string;
    set: (key: string, value: string) => void;
    clear: (key: string) => void;
    keys: {[key:string]: string};
    isReady: boolean;
  }

  export interface BaseCookieStorage extends BaseStorage{
    keys: CookiesStorageKeys;
  }

  export interface BaseLocalStorage extends BaseStorage{
    keys: LocalStorageKeys;
  }
  
  export const isValidToken = (token: string) => token && token.length > 10;

  export type CookiesStorageKeys = {
    token: string,
    refresh_token: string,
    dg_id: string,
  }

  export type LocalStorageKeys = {
    profile: string,
    phone_moment: string,
    avLog: string,
  }
  export const defaultCookiesStorageKeys: CookiesStorageKeys = {
    token: "token",
    refresh_token: "refresh_token",
    dg_id: "dg_id",
  }

  export const defaultLocalStorageKeys: LocalStorageKeys = {
    profile: "profile",
    phone_moment: "phone_moment",
    avLog: "avLog",
  }

  export interface ChildInfo {
    id: number;
    nickname: string;
    email?: any;
    mobile: string;
    avatar: string;
    gender: string;
    date_of_birth: string;
    is_official: boolean;
    limit_age: LimitAge;
  }

  export interface BaseMessageResponse {
    message?: string;
  }
  
  export interface Notification {
    error: (message: string) => void;
    success: (message: string) => void;
    clear: () => void;
  }
  
  export interface FetchSetup {
    response_token_key: string;
    response_refresh_token_key: string;
    addedUrlParams: Record<string, string>;
    cookies: BaseCookieStorage;
    locals: BaseLocalStorage;
    fetchRefreshToken: () => Promise<Response>;
    logoutCallback: () => void;
  }
  