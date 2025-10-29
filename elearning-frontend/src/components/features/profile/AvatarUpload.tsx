"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error-message";
import { getPresignedUrl, uploadFileToStorage } from "@/services/media.service";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { getInitials } from "@/utils/get-initial";
import { Input } from "@/components/ui/input";

interface AvatarUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  fallbackName: string;
}

export function AvatarUpload({
  value,
  onChange,
  fallbackName,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setIsUploading(true);
    try {
      const { url, presignedUrl } = await getPresignedUrl({
        filename: file.name,
        filesize: file.size,
      });

      await uploadFileToStorage(presignedUrl, file);

      onChange(url);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error("Upload failed", { description: getErrorMessage(error) });
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="flex flex-col items-center gap-4 mb-5">
      <div className="relative rounded-full border-2 border-dashed border-border p-1">
        <Avatar className="h-32 w-32">
          <AvatarImage src={preview || value || undefined} alt={fallbackName} />
          <AvatarFallback>{getInitials(fallbackName)}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 rounded-full">
            <LoadingSpinner />
          </div>
        )}
      </div>
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/webp image/jpg"
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Camera className="mr-2 h-4 w-4" />
        Change Avatar
      </Button>
    </div>
  );
}
