/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TBillingFrequency, TProductBillingFrequency } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";

/**
 * Default billing frequency for each product subscription type
 */
export const DEFAULT_PRODUCT_BILLING_FREQUENCY: TProductBillingFrequency = {
  [EProductSubscriptionEnum.FREE]: undefined,
  [EProductSubscriptionEnum.ONE]: undefined,
  [EProductSubscriptionEnum.PRO]: "month",
  [EProductSubscriptionEnum.BUSINESS]: "month",
  [EProductSubscriptionEnum.ENTERPRISE]: "month",
};

/**
 * Subscription types that support billing frequency toggle (monthly/yearly)
 */
export const SUBSCRIPTION_WITH_BILLING_FREQUENCY = [EProductSubscriptionEnum.ENTERPRISE];

/**
 * URL for the "Talk to Sales" page where users can contact sales team
 */
export const TALK_TO_SALES_URL = "https://plane.so/talk-to-sales";

/**
 * Mapping of subscription types to their respective upgrade/redirection URLs based on billing frequency
 * Used for self-hosted installations to redirect users to appropriate upgrade pages
 */
export const SUBSCRIPTION_REDIRECTION_URLS: Record<EProductSubscriptionEnum, Record<TBillingFrequency, string>> = {
  [EProductSubscriptionEnum.FREE]: {
    month: TALK_TO_SALES_URL,
    year: TALK_TO_SALES_URL,
  },
  [EProductSubscriptionEnum.ONE]: {
    month: TALK_TO_SALES_URL,
    year: TALK_TO_SALES_URL,
  },
  [EProductSubscriptionEnum.PRO]: {
    month: "https://app.plane.so/upgrade/pro/self-hosted?plan=month",
    year: "https://app.plane.so/upgrade/pro/self-hosted?plan=year",
  },
  [EProductSubscriptionEnum.BUSINESS]: {
    month: "https://app.plane.so/upgrade/business/self-hosted?plan=month",
    year: "https://app.plane.so/upgrade/business/self-hosted?plan=year",
  },
  [EProductSubscriptionEnum.ENTERPRISE]: {
    month: TALK_TO_SALES_URL,
    year: TALK_TO_SALES_URL,
  },
};

/**
 * Mapping of subscription types to their respective marketing webpage URLs
 * Used to direct users to learn more about each plan's features and pricing
 */
export const SUBSCRIPTION_WEBPAGE_URLS: Record<EProductSubscriptionEnum, string> = {
  [EProductSubscriptionEnum.FREE]: TALK_TO_SALES_URL,
  [EProductSubscriptionEnum.ONE]: TALK_TO_SALES_URL,
  [EProductSubscriptionEnum.PRO]: "https://plane.so/pro",
  [EProductSubscriptionEnum.BUSINESS]: "https://plane.so/business",
  [EProductSubscriptionEnum.ENTERPRISE]: "https://plane.so/business",
};
