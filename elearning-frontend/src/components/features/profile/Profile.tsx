"use client";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  KeyRound,
  Lock,
  Shield,
  ShieldCheck,
  User,
  Verified,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { AvatarUpload } from "./AvatarUpload";
import api from "@/utils/api";
import { API_ENDPOINT } from "@/constants/endpoint";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error-message";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 numbers")
    .nullable()
    .optional(),
  avatar: z.url("Please enter a valid URL.").nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, mutate } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      avatar: "",
    },
  });

  useEffect(() => {
    if (user) {
      const nameParts = user.fullName.split(" ") || [];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      form.reset({
        firstName: firstName,
        lastName: lastName,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
      });
    }
  }, [user, form]);

  async function onSubmit(values: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        phoneNumber: values.phoneNumber,
        avatar: values.avatar,
      };

      await api.put(API_ENDPOINT.UPDATE_PROFILE, payload);

      await mutate();

      toast.success("Profile updated successfully!", {
        position: "top-center",
      });
    } catch (error) {
      toast.error("Failed to update profile", {
        description: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  if (!user) return null;

  return (
    <div className="min-h-screen w-full p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={user.avatar || "https://github.com/shadcn.png"}
              alt="User Avatar"
            />
            <AvatarFallback>{user?.fullName}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center justify-center">
              <h1 className="text-3xl font-bold">{user?.fullName}</h1>
              <ShieldCheck className="text-blue-500  mt-1" />
            </div>

            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile" className="mt-6">
            <div className="space-y-8">
              {/* Profile Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="avatar"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center">
                            <FormLabel>Avatar</FormLabel>
                            <FormControl>
                              <AvatarUpload
                                value={field.value}
                                onChange={field.onChange}
                                fallbackName={user.fullName}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            defaultValue={user.email}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Input
                            id="role"
                            defaultValue={user.role.name}
                            disabled
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your phone number"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="avatar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/avatar.png"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <LoadingSpinner />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab Content */}
          <TabsContent value="security" className="mt-6">
            <div className="space-y-8">
              {/* Security Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="secondary">
                      <Shield className="w-4 h-4 mr-2" />
                      Enable
                    </Button>
                  </div>

                  <Separator />

                  {/* Password */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Password</p>
                      <p className="text-sm text-muted-foreground">
                        Last changed 3 months ago
                      </p>
                    </div>
                    <Button variant="secondary">
                      <KeyRound className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab Content */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Notification settings content goes here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
