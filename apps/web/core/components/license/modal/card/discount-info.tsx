/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { cn } from "@plane/utils";

type TDiscountInfoProps = {
  className?: string;
  currency: string;
  price: number;
};

export function DiscountInfo({ className, currency, price }: TDiscountInfoProps) {
  return <span className={cn(className)}>{currency}{price}</span>;
}
