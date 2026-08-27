/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLoginMediums } from "@plane/types";
import { CORE_LOGIN_MEDIUM_LABELS } from "./core";
import { EXTENDED_LOGIN_MEDIUM_LABELS } from "./extended";

export enum E_PASSWORD_STRENGTH {
  EMPTY = "empty",
  LENGTH_NOT_VALID = "length_not_valid",
  STRENGTH_NOT_VALID = "strength_not_valid",
  STRENGTH_VALID = "strength_valid",
}

export const PASSWORD_MIN_LENGTH = 8;

export const SPACE_PASSWORD_CRITERIA = [
  {
    key: "min_8_char",
    label: "Min 8 characters",
    isCriteriaValid: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  // {
  //   key: "min_1_upper_case",
  //   label: "Min 1 upper-case letter",
  //   isCriteriaValid: (password: string) => PASSWORD_NUMBER_REGEX.test(password),
  // },
  // {
  //   key: "min_1_number",
  //   label: "Min 1 number",
  //   isCriteriaValid: (password: string) => PASSWORD_CHAR_CAPS_REGEX.test(password),
  // },
  // {
  //   key: "min_1_special_char",
  //   label: "Min 1 special character",
  //   isCriteriaValid: (password: string) => PASSWORD_SPECIAL_CHAR_REGEX.test(password),
  // },
];

export enum EAuthPageTypes {
  PUBLIC = "PUBLIC",
  NON_AUTHENTICATED = "NON_AUTHENTICATED",
  SET_PASSWORD = "SET_PASSWORD",
  ONBOARDING = "ONBOARDING",
  AUTHENTICATED = "AUTHENTICATED",
}

export enum EPageTypes {
  INIT = "INIT",
  PUBLIC = "PUBLIC",
  NON_AUTHENTICATED = "NON_AUTHENTICATED",
  ONBOARDING = "ONBOARDING",
  AUTHENTICATED = "AUTHENTICATED",
}

export enum EAuthModes {
  SIGN_IN = "SIGN_IN",
  SIGN_UP = "SIGN_UP",
}

export enum EAuthSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
}

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  TOAST_ALERT = "TOAST_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

export enum EAdminAuthErrorCodes {
  // Admin
  ADMIN_ALREADY_EXIST = "5150",
  REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME = "5155",
  INVALID_ADMIN_EMAIL = "5160",
  INVALID_ADMIN_PASSWORD = "5165",
  REQUIRED_ADMIN_EMAIL_PASSWORD = "5170",
  ADMIN_AUTHENTICATION_FAILED = "5175",
  ADMIN_USER_ALREADY_EXIST = "5180",
  ADMIN_USER_DOES_NOT_EXIST = "5185",
  ADMIN_USER_DEACTIVATED = "5190",
}

export type TAdminAuthErrorInfo = {
  type: EErrorAlertType;
  code: EAdminAuthErrorCodes;
  title: string;
  message: string | React.ReactNode;
};

export const LOGIN_MEDIUM_LABELS: Record<TLoginMediums, string> = {
  ...CORE_LOGIN_MEDIUM_LABELS,
  ...EXTENDED_LOGIN_MEDIUM_LABELS,
} as const;
