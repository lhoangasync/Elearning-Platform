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
import { Eye, EyeOff } from "lucide-react";
import { IconGoogle } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error-message";
import { TwoFactorAuthModal } from "./TwoFactorAuthModal";

const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [pendingCredentials, setPendingCredentials] =
    useState<LoginFormValues | null>(null);
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, router, isLoading]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      console.log("Form submitted with values:", values);
      await login(values);
      toast.success("Login successful!", {
        description: "Welcome back!",
        position: "top-center",
      });
      router.push("/");
    } catch (error) {
      console.log(error);
      const errorMessage = getErrorMessage(error);
      if (
        errorMessage === "Invalid verification code" ||
        errorMessage === "Invalid verification code"
      ) {
        setPendingCredentials(values);
        setIs2faModalOpen(true);
        toast.error("Two-factor authentication required", {
          description: "Please enter your authentication code.",
          position: "top-center",
        });
        return;
      }

      toast.error("Login failed", {
        description: errorMessage,
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handle2faSubmit = async (code: string) => {
    if (!pendingCredentials) return;

    try {
      await login({
        ...pendingCredentials,
        totpCode: code,
      });

      toast.success("Verification Successfully!", {
        position: "top-center",
      });
      setIs2faModalOpen(false);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  if (isLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {" "}
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl lg:grid lg:grid-cols-2 bg-white">
          <div className="flex flex-col justify-center bg-white p-6 sm:p-12">
            <div className="w-full max-w-md">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-8">
                  <Image
                    src="/logo.svg"
                    alt="Filuick Pay"
                    width={40}
                    height={40}
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
                <p className="mt-2 text-gray-600">
                  Welcome back! Please enter your details
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-8 space-y-6"
                >
                  {/* Email */}
                  <FormField
                    control={form.control}
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

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              {...field}
                              className="h-12 rounded-lg pr-10"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
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

                  <div className="flex items-center justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Forgot password
                    </Link>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    className="h-12 w-full rounded-lg bg-blue-600 text-base hover:bg-blue-700"
                  >
                    Sign in
                  </Button>
                </form>
              </Form>

              <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 flex-shrink text-sm text-gray-500">
                  OR
                </span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <Button variant="outline" className="h-12 w-full rounded-lg">
                <IconGoogle />
                Continue with Google
              </Button>

              <p className="mt-8 text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="font-semibold text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="hidden bg-blue-600 p-12 text-white lg:flex lg:flex-col lg:items-center lg:justify-center rounded-l-xl">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold leading-tight">
                Welcome back! Level up your tech skills with{" "}
                <span className="underline">Ucademy</span>
              </h1>
              <p className="mt-4 text-lg text-blue-200">
                Learn coding, AI, and data analytics from industry experts.
                Start where you left off and keep building your future — one
                course at a time.
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
      <TwoFactorAuthModal
        isOpen={is2faModalOpen}
        onClose={() => setIs2faModalOpen(false)}
        onSubmit={handle2faSubmit}
      />
    </>
  );
}
