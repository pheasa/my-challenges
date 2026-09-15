/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { SignUpVerifyForm } from "@/components/account/auth-forms/signup-verify";
import { AuthFooter } from "@/components/auth-screens/footer";
import { AuthHeader } from "@/components/auth-screens/header";
import { EAuthModes, EPageTypes } from "@/helpers/authentication.helper";
import DefaultLayout from "@/layouts/default-layout";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

function SignUpVerifyPage() {
  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
        <div className="relative z-10 flex h-screen w-screen flex-col items-center overflow-hidden overflow-y-auto px-8 pt-6 pb-10">
          <AuthHeader type={EAuthModes.SIGN_UP} />
          <SignUpVerifyForm />
          <AuthFooter />
        </div>
      </AuthenticationWrapper>
    </DefaultLayout>
  );
}

export default SignUpVerifyPage;
