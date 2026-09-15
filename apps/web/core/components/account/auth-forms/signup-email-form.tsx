/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { Mail, Clock, Send, MessageCircle, AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
// ui
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
import { checkEmailValidity } from "@plane/utils";
// services
import { AuthService } from "@/services/auth.service";
// local components
import { FormContainer } from "./common/container";
import { AuthFormHeader } from "./common/header";
import { TermsAndConditions } from "../terms-and-conditions";
import { EAuthModes } from "@/helpers/authentication.helper";

type TSignUpEmailValues = {
  email: string;
};

type TSupportChannels = {
  telegram: string;
  facebook: string;
  email: string;
};

const authService = new AuthService();

export const SignUpEmailForm = observer(function SignUpEmailForm() {
  const [viewState, setViewState] = useState<"INPUT" | "LINK_SENT" | "ACTIVE_LINK_EXISTS">("INPUT");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [supportChannels, setSupportChannels] = useState<TSupportChannels>({
    telegram: "https://t.me/plane_support",
    facebook: "https://facebook.com/plane",
    email: "support@plane.so",
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<TSignUpEmailValues>({
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const onSubmit = async (data: TSignUpEmailValues) => {
    setErrorMessage(null);
    setIsExistingUser(false);
    try {
      const response = await authService.sendSignUpLink({ email: data.email });
      setSubmittedEmail(data.email);

      if (response.support_channels) {
        setSupportChannels(response.support_channels);
      }

      if (response.status === "ACTIVE_LINK_EXISTS") {
        setViewState("ACTIVE_LINK_EXISTS");
      } else {
        setViewState("LINK_SENT");
      }
    } catch (error: any) {
      if (error?.error === "USER_ALREADY_EXIST") {
        setIsExistingUser(true);
        setErrorMessage(error?.message || "An account with this email already exists.");
      } else {
        setErrorMessage(error?.message || "Something went wrong while sending the sign-up link. Please try again.");
      }
    }
  };

  const handleReset = () => {
    setViewState("INPUT");
    setErrorMessage(null);
    setIsExistingUser(false);
    reset({ email: "" });
  };

  if (viewState === "LINK_SENT") {
    return (
      <FormContainer>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent-subtle text-accent-primary">
            <Mail className="size-7" />
          </div>
          <AuthFormHeader title="Check your email" description="We sent a verification link to your inbox" />
          <p className="mt-3 text-13 text-secondary">
            We have sent a sign-up link to <strong className="text-primary">{submittedEmail}</strong>. Please open your
            email and click the link to start using the app.
          </p>
        </div>

        <div className="rounded-lg border border-accent-subtle bg-accent-subtle/40 p-4 text-left">
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-accent-primary" />
            <div className="text-12 text-accent-primary">
              <span className="font-semibold">Notice:</span> This link will expire in <strong>24 hours</strong>. For
              security, the link will become inactive immediately once you complete registration.
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="secondary" size="xl" className="w-full justify-center" onClick={handleReset}>
            <ArrowLeft className="mr-2 size-4" /> Use a different email
          </Button>
          <div className="text-center text-12 text-tertiary">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-accent-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <TermsAndConditions authType={EAuthModes.SIGN_UP} />
      </FormContainer>
    );
  }

  if (viewState === "ACTIVE_LINK_EXISTS") {
    return (
      <FormContainer>
        <div className="flex flex-col items-center text-center">
          <div className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 mb-4 flex size-14 items-center justify-center rounded-full">
            <Clock className="size-7" />
          </div>
          <AuthFormHeader title="Link already sent" description="A verification link was already sent" />
          <p className="mt-3 text-13 text-secondary">
            A sign-up verification link has already been sent to{" "}
            <strong className="text-primary">{submittedEmail}</strong> and is currently active for{" "}
            <strong>24 hours</strong>. Please check your inbox as well as your spam/junk folder.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-subtle bg-surface-2 p-4 text-left">
          <p className="text-12 font-medium text-primary">
            Haven&apos;t received your email? Reach out to our support team:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {supportChannels.telegram && (
              <a
                href={supportChannels.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-subtle bg-surface-1 px-3 py-2 text-12 font-medium text-primary transition-colors hover:bg-surface-2"
              >
                <div className="flex items-center gap-2">
                  <Send className="size-4 text-[#229ED9]" />
                  <span>Telegram Support</span>
                </div>
                <ExternalLink className="size-3.5 text-placeholder" />
              </a>
            )}

            {supportChannels.facebook && (
              <a
                href={supportChannels.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-subtle bg-surface-1 px-3 py-2 text-12 font-medium text-primary transition-colors hover:bg-surface-2"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-[#1877F2]" />
                  <span>Facebook Support</span>
                </div>
                <ExternalLink className="size-3.5 text-placeholder" />
              </a>
            )}

            {supportChannels.email && (
              <a
                href={`mailto:${supportChannels.email}?subject=Help%20with%20Sign-up%20Verification&body=Hi%20Support,%20I%20requested%20a%20sign-up%20link%20for%20${encodeURIComponent(submittedEmail)}%20but%20have%20not%20received%20it.`}
                className="flex items-center justify-between rounded-md border border-subtle bg-surface-1 px-3 py-2 text-12 font-medium text-primary transition-colors hover:bg-surface-2"
              >
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-accent-primary" />
                  <span>Email Support ({supportChannels.email})</span>
                </div>
                <ExternalLink className="size-3.5 text-placeholder" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="secondary" size="xl" className="w-full justify-center" onClick={handleReset}>
            <ArrowLeft className="mr-2 size-4" /> Try another email
          </Button>
          <div className="text-center text-12 text-tertiary">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-accent-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <TermsAndConditions authType={EAuthModes.SIGN_UP} />
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <AuthFormHeader title="Create your account" description="Enter your email to receive a sign-up link." />

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-md border border-danger-strong/40 bg-danger-subtle p-3 text-13 text-danger-primary">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <p>{errorMessage}</p>
            {isExistingUser && (
              <Link href="/" className="font-semibold underline hover:text-danger-primary/80">
                Click here to sign in
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-13 font-medium text-tertiary">
            Email address
          </label>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Please enter a valid email address",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                ref={ref}
                id="email"
                name="email"
                type="email"
                value={value}
                onChange={onChange}
                placeholder="name@company.com"
                className="h-10 w-full rounded-md border border-strong bg-surface-1 px-3 placeholder:text-placeholder"
                autoComplete="email"
              />
            )}
          />
          {errors.email && <span className="text-12 text-danger-primary">{errors.email.message}</span>}
        </div>

        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={!isValid || isSubmitting}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Send sign-up link"}
        </Button>
      </form>

      <div className="text-center text-13 text-tertiary">
        Already have an account?{" "}
        <Link href="/" className="font-medium text-accent-primary hover:underline">
          Sign in
        </Link>
      </div>

      <TermsAndConditions authType={EAuthModes.SIGN_UP} />
    </FormContainer>
  );
});
