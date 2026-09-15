/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertCircle, CheckCircle, Eye, EyeOff, XCircle, ArrowRight } from "lucide-react";
// ui
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Input, PasswordStrengthIndicator, Spinner } from "@plane/ui";
import { getPasswordStrength, validatePersonName } from "@plane/utils";
// services
import { AuthService } from "@/services/auth.service";
// local components
import { FormContainer } from "./common/container";
import { AuthFormHeader } from "./common/header";
import { TermsAndConditions } from "../terms-and-conditions";
import { EAuthModes } from "@/helpers/authentication.helper";

type TCompleteSignUpValues = {
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
};

const authService = new AuthService();

export const SignUpVerifyForm = observer(function SignUpVerifyForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [verificationState, setVerificationState] = useState<"LOADING" | "VALID" | "INVALID">("LOADING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TCompleteSignUpValues>({
    defaultValues: {
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
    },
    mode: "onChange",
  });

  const currentPassword = watch("password") || "";
  const confirmPassword = watch("confirm_password") || "";

  useEffect(() => {
    if (!token || !email) {
      setVerificationState("INVALID");
      setErrorMessage("Invalid verification link. Missing token or email parameter.");
      return;
    }

    let isMounted = true;
    const checkToken = async () => {
      try {
        await authService.verifySignUpToken(token, email);
        if (isMounted) setVerificationState("VALID");
      } catch (error: any) {
        if (isMounted) {
          setVerificationState("INVALID");
          setErrorMessage(
            error?.message || "This sign-up link has expired (links expire after 24 hours) or has already been used."
          );
        }
      }
    };
    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token, email]);

  const isValidPassword = useMemo(() => {
    return (
      currentPassword.length > 0 &&
      currentPassword === confirmPassword &&
      getPasswordStrength(currentPassword) === E_PASSWORD_STRENGTH.STRENGTH_VALID
    );
  }, [currentPassword, confirmPassword]);

  const onCompleteSubmit = async (data: TCompleteSignUpValues) => {
    setErrorMessage(null);
    try {
      const response = await authService.completeSignUp({
        token,
        email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });

      if (response.redirect_url) {
        window.location.href = response.redirect_url;
      } else {
        window.location.href = "/onboarding";
      }
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to complete registration. Please try again.");
    }
  };

  if (verificationState === "LOADING") {
    return (
      <FormContainer>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Spinner height="32px" width="32px" />
          <p className="mt-4 text-14 font-medium text-secondary">Verifying your sign-up link...</p>
        </div>
      </FormContainer>
    );
  }

  if (verificationState === "INVALID") {
    return (
      <FormContainer>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-danger-subtle text-danger-primary">
            <XCircle className="size-7" />
          </div>
          <AuthFormHeader title="Link expired or invalid" description="Sign-up link is no longer active" />
          <p className="mt-3 text-13 text-secondary">
            {errorMessage ||
              "This sign-up link has expired (links are valid for 24 hours) or has already been used to create an account."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/sign-up" className="w-full">
            <Button variant="primary" size="xl" className="w-full justify-center">
              Request a new sign-up link <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
          <div className="text-center text-12 text-tertiary">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-accent-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <div className="flex flex-col">
        <AuthFormHeader title="Complete your account" description="Set your name and password to get started." />
        <div className="mt-2 flex items-center gap-1.5 text-12 text-success-primary">
          <CheckCircle className="size-3.5" />
          <span>
            Email verified: <strong>{email}</strong>
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-md border border-danger-strong/40 bg-danger-subtle p-3 text-13 text-danger-primary">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onCompleteSubmit)} className="space-y-4">
        {/* Email display (read only) */}
        <div className="space-y-1">
          <label htmlFor="verified-email" className="text-13 font-medium text-tertiary">
            Email
          </label>
          <Input
            id="verified-email"
            value={email}
            disabled
            className="h-10 w-full rounded-md border border-strong bg-surface-2 px-3 text-tertiary"
          />
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="first_name" className="text-13 font-medium text-tertiary">
              First name *
            </label>
            <Controller
              control={control}
              name="first_name"
              rules={{
                required: "First name is required",
                validate: validatePersonName,
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  ref={ref}
                  id="first_name"
                  value={value}
                  onChange={onChange}
                  placeholder="John"
                  className="h-10 w-full rounded-md border border-strong bg-surface-1 px-3"
                />
              )}
            />

            {errors.first_name && <span className="text-11 text-danger-primary">{errors.first_name.message}</span>}
          </div>

          <div className="space-y-1">
            <label htmlFor="last_name" className="text-13 font-medium text-tertiary">
              Last name
            </label>
            <Controller
              control={control}
              name="last_name"
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  ref={ref}
                  id="last_name"
                  value={value}
                  onChange={onChange}
                  placeholder="Doe"
                  className="h-10 w-full rounded-md border border-strong bg-surface-1 px-3"
                />
              )}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-13 font-medium text-tertiary">
            Set password *
          </label>
          <div className="relative flex items-center rounded-md bg-surface-1">
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  ref={ref}
                  type={showPassword.password ? "text" : "password"}
                  id="password"
                  value={value}
                  onChange={onChange}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="Enter a strong password"
                  className="h-10 w-full rounded-md border border-strong bg-surface-1 pr-10 pl-3"
                  autoComplete="new-password"
                />
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => ({ ...prev, password: !prev.password }))}
              className="absolute right-3 grid size-5 place-items-center text-placeholder hover:text-secondary"
            >
              {showPassword.password ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {currentPassword.length > 0 &&
            getPasswordStrength(currentPassword) !== E_PASSWORD_STRENGTH.STRENGTH_VALID && (
              <PasswordStrengthIndicator password={currentPassword} isFocused={isPasswordFocused} />
            )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="confirm_password" className="text-13 font-medium text-tertiary">
            Confirm password *
          </label>
          <div className="relative flex items-center rounded-md bg-surface-1">
            <Controller
              control={control}
              name="confirm_password"
              rules={{
                required: "Please confirm your password",
                validate: (value) => value === currentPassword || "Passwords do not match",
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  ref={ref}
                  type={showPassword.confirmPassword ? "text" : "password"}
                  id="confirm_password"
                  value={value}
                  onChange={onChange}
                  placeholder="Confirm your password"
                  className="h-10 w-full rounded-md border border-strong bg-surface-1 pr-10 pl-3"
                  autoComplete="new-password"
                />
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
              className="absolute right-3 grid size-5 place-items-center text-placeholder hover:text-secondary"
            >
              {showPassword.confirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <span className="text-11 text-danger-primary">{errors.confirm_password.message}</span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="xl"
          disabled={!isValidPassword || isSubmitting}
        >
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Complete registration"}
        </Button>
      </form>

      <TermsAndConditions authType={EAuthModes.SIGN_UP} />
    </FormContainer>
  );
});
