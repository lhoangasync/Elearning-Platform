"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Logo from "@/components/shared/Logo";
import { getErrorMessage } from "@/utils/error-message";
import api from "@/utils/api";
import { API_ENDPOINT } from "@/constants/endpoint";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const step1Schema = z.object({
  email: z.email({ message: "Please enter a valid email." }),
});

const step2Schema = z
  .object({
    code: z
      .string()
      .min(6, { message: "Code must be 6 digits." })
      .max(6, { message: "Code must be 6 digits." }),
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  });

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const formStep1 = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: "" },
  });

  const formStep2 = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: { code: "", newPassword: "", confirmNewPassword: "" },
  });

  // Xử lý gửi mã OTP
  const handleSendCode = async (values: z.infer<typeof step1Schema>) => {
    setIsSubmitting(true);
    try {
      await api.post(API_ENDPOINT.SEND_OTP, {
        email: values.email,
        type: "FORGOT_PASSWORD",
      });
      toast.success("OTP sent successfully!", {
        description: `A verification code has been sent to ${values.email}`,
        position: "top-center",
      });
      setEmail(values.email);
      setStep(2);
    } catch (error) {
      toast.error("Failed to send OTP", {
        description: getErrorMessage(error),
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý đặt lại mật khẩu
  const handleResetPassword = async (values: z.infer<typeof step2Schema>) => {
    setIsSubmitting(true);
    try {
      await api.post(API_ENDPOINT.FORGOT_PASSWORD, {
        email,
        code: values.code,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      toast.success("Password reset successfully!", {
        description: "You can now log in with your new password.",
        position: "top-center",
      });
      router.push("/sign-in");
    } catch (error) {
      toast.error("Failed to reset password", {
        description: getErrorMessage(error),
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl lg:grid lg:grid-cols-2 bg-card">
        <div className="flex flex-col justify-center p-6 sm:p-12">
          <div className="w-full max-w-md mx-auto">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-8">
                <Logo />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Forgot Password
              </h1>
              <p className="mt-2 text-muted-foreground text-center">
                {step === 1
                  ? "Enter your email to receive a verification code."
                  : `Enter the code sent to ${email} and your new password.`}
              </p>
            </div>

            {step === 1 && (
              <Form {...formStep1}>
                <form
                  onSubmit={formStep1.handleSubmit(handleSendCode)}
                  className="mt-8 space-y-6"
                >
                  <FormField
                    control={formStep1.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            {...field}
                            className="h-12 rounded-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-lg text-base"
                  >
                    {isSubmitting && <LoadingSpinner />}
                    Send Code
                  </Button>
                </form>
              </Form>
            )}

            {step === 2 && (
              <Form {...formStep2}>
                <form
                  onSubmit={formStep2.handleSubmit(handleResetPassword)}
                  className="mt-8 space-y-6"
                >
                  <FormField
                    control={formStep2.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formStep2.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              {...field}
                              className="h-12 rounded-lg"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formStep2.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              {...field}
                              className="h-12 rounded-lg"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-lg text-base"
                  >
                    {isSubmitting && <LoadingSpinner />}
                    Reset Password
                  </Button>
                </form>
              </Form>
            )}

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:items-center lg:justify-center rounded-l-xl">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              Secure your account.
              <br />
              We`ve got your back.
            </h1>
            <p className="mt-4 text-lg opacity-80">
              Follow the steps to securely reset your password and regain access
              to your learning journey on{" "}
              <span className="font-bold">Ucademy</span>.
            </p>
            <div className="mt-10">
              <Image
                src="/secure.svg"
                alt="Forgot Password"
                width={400}
                height={300}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
