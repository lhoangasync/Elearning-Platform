"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Hi!!!</h2>
      <Button>Hello {user?.fullName}</Button>
    </div>
  );
}
