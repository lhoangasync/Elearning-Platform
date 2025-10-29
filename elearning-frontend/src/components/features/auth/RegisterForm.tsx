"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error-message";
import api from "@/utils/api";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { DialogFooter } from "@/components/ui/dialog";
import { Lock, Mail, Phone, User } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { API_ENDPOINT } from "@/constants/endpoint";

const registerFormSchema = z
  .object({
    fullName: z.string().min(1, { message: "Full name is required." }),
    email: z.email({ message: "Please enter a valid email." }),
    phoneNumber: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const otpFormSchema = z.object({
  code: z.string().length(6, { message: "OTP must be 6 digits." }),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;
type OtpFormValues = z.infer<typeof otpFormSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RegisterFormValues | null>(null);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const formStep1 = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const formStep2 = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, router, isLoading]);

  // Step 1: Send OTP
  async function onSubmitStep1(values: RegisterFormValues) {
    setIsSubmitting(true);
    try {
      await api.post(API_ENDPOINT.SEND_OTP, {
        email: values.email,
        type: "REGISTER",
      });
      toast.success("OTP sent!", {
        description: `An OTP has been sent to ${values.email}.`,
        position: "top-center",
      });
      setFormData(values); // Save form data
      setStep(2); // Move to next step
    } catch (error) {
      toast.error("Failed to send OTP", {
        description: getErrorMessage(error),
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Step 2: Verify OTP and Register
  async function onSubmitStep2(values: OtpFormValues) {
    if (!formData) return;

    setIsSubmitting(true);
    try {
      const finalData = {
        ...formData,
        code: values.code,
      };
      await api.post(API_ENDPOINT.REGISTER, finalData);
      toast.success("Registration successful!", {
        description: "You can now log in with your new account.",
        position: "top-center",
      });
      router.push("/sign-in");
    } catch (error) {
      toast.error("Registration failed", {
        description: getErrorMessage(error),
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl lg:grid lg:grid-cols-2 bg-card">
        <div className="flex flex-col justify-center p-6 sm:p-12">
          {/* Step 1: Registration Form */}
          {step === 1 && (
            <div className="w-full max-w-md">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-8">
                  {/* <Image
                    src="/logo.svg"
                    alt="Ucademy Logo"
                    width={40}
                    height={40}
                  /> */}
                  <Logo />
                </div>
                {/* Sử dụng text-foreground và text-muted-foreground */}
                <h1 className="text-3xl font-bold text-foreground">Sign Up</h1>
                <p className="mt-2 text-muted-foreground">
                  Enter your details to get started!
                </p>
              </div>
              <Form {...formStep1}>
                <form
                  onSubmit={formStep1.handleSubmit(onSubmitStep1)}
                  className="mt-8 space-y-6"
                >
                  {/* Full Name */}
                  <FormField
                    control={formStep1.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <User size={15} />
                          <FormLabel>Full Name</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="eg. John Doe"
                            {...field}
                            className="placeholder:opacity-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Email */}
                  <FormField
                    control={formStep1.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <Mail size={15} />
                          <FormLabel>Email</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="eg. johndoe@gmail.com"
                            {...field}
                            className="placeholder:opacity-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Phone Number */}
                  <FormField
                    control={formStep1.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <Phone size={15} />
                          <FormLabel>Phone Number</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="eg. 098765421"
                            {...field}
                            className="placeholder:opacity-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Password */}
                  <FormField
                    control={formStep1.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <Lock size={15} />
                          <FormLabel>Password</FormLabel>
                        </div>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="**********"
                              {...field}
                              className="placeholder:opacity-50"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Confirm Password */}
                  <FormField
                    control={formStep1.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <Lock size={15} />
                          <FormLabel>Confirm Password</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="**********"
                            {...field}
                            className="placeholder:opacity-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 mt-6"
                  >
                    {isSubmitting && <LoadingSpinner />}
                    Continue
                  </Button>
                </form>
              </Form>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="font-semibold text-primary hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground">
                  Verify Your Email
                </h1>
                <p className="mt-2 text-muted-foreground">
                  A 6-digit code has been sent to{" "}
                  <strong>{formData?.email}</strong>.
                </p>
              </div>
              <Form {...formStep2}>
                <form
                  onSubmit={formStep2.handleSubmit(onSubmitStep2)}
                  className="space-y-6"
                >
                  <FormField
                    control={formStep2.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel>One-Time Password</FormLabel>
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
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting && <LoadingSpinner />}
                      Verify Code
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
              <div className="mt-6 text-center">
                <Button variant="link" onClick={() => setStep(1)}>
                  Go Back
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:items-center lg:justify-center rounded-l-xl">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              Start Your Learning Journey with{" "}
              <span className="underline">Ucademy</span>
            </h1>
            <p className="mt-4 text-lg opacity-80">
              Join thousands of learners and gain new skills in coding, AI, and
              data analytics from industry experts.
            </p>
            <div className="mt-10">
              <Image
                src="/online-learning.svg"
                alt="Tech Learning"
                width={500}
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
