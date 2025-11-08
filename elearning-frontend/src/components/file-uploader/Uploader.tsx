"use client";
import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { getPresignedUrl, uploadFileToStorage } from "@/services/media.service";
import { X, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import Image from "next/image";

interface UploaderState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;
  uploadedUrl?: string;
  fileType: "image" | "video";
}

interface UploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  onRemove?: () => void;
  maxSize?: number; // in MB
  accept?: Record<string, string[]>;
}

export function Uploader({
  value,
  onChange,
  onRemove,
  maxSize = 5,
  accept = { "image/*": [] },
}: UploaderProps) {
  const [fileState, setFileState] = useState<UploaderState>({
    error: false,
    file: null,
    id: null,
    uploading: false,
    progress: 0,
    isDeleting: false,
    fileType: "image",
    uploadedUrl: value,
  });

  async function uploadFile(file: File) {
    setFileState((prev) => ({
      ...prev,
      uploading: true,
      progress: 10,
    }));

    try {
      // Get presigned URL
      const { url, presignedUrl } = await getPresignedUrl({
        filename: file.name,
        filesize: file.size,
      });

      setFileState((prev) => ({ ...prev, progress: 32 }));

      // Upload to S3
      await uploadFileToStorage(presignedUrl, file);

      setFileState((prev) => ({
        ...prev,
        progress: 100,
        uploading: false,
        uploadedUrl: url,
      }));

      // Call onChange callback
      if (onChange) {
        onChange(url);
      }

      toast.success("File uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      setFileState((prev) => ({
        ...prev,
        uploading: false,
        error: true,
        progress: 0,
      }));
      toast.error("Upload failed", {
        description: error?.message || "Please try again",
      });
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const objectUrl = URL.createObjectURL(file);

      setFileState({
        file: file,
        uploading: false,
        progress: 0,
        objectUrl,
        error: false,
        id: uuidv4(),
        isDeleting: false,
        fileType: "image",
      });

      // Automatically start upload
      uploadFile(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rejectedFiles(fileRejection: FileRejection[]) {
    if (fileRejection.length) {
      const tooManyFiles = fileRejection.find(
        (rejection) => rejection.errors[0].code === "too-many-files"
      );

      const fileSizeTooBig = fileRejection.find(
        (rejection) => rejection.errors[0].code === "file-too-large"
      );

      if (tooManyFiles) {
        toast.error("Too many files selected, max is 1", {
          position: "top-center",
        });
      }

      if (fileSizeTooBig) {
        toast.error(`File size exceeds ${maxSize}MB limit`, {
          position: "top-center",
        });
      }
    }
  }

  const handleRemove = () => {
    if (fileState.objectUrl) {
      URL.revokeObjectURL(fileState.objectUrl);
    }

    setFileState({
      error: false,
      file: null,
      id: null,
      uploading: false,
      progress: 0,
      isDeleting: false,
      fileType: "image",
      objectUrl: undefined,
      uploadedUrl: undefined,
    });

    if (onRemove) {
      onRemove();
    }
    if (onChange) {
      onChange("");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false,
    maxSize: maxSize * 1024 * 1024,
    onDropRejected: rejectedFiles,
    disabled: fileState.uploading,
  });

  // Show preview if file is selected or uploaded
  const displayUrl = fileState.objectUrl || fileState.uploadedUrl || value;

  if (displayUrl) {
    return (
      <Card className="relative w-full h-64 border-2">
        <CardContent className="flex items-center justify-center h-full w-full p-4 relative">
          <Image
            src={displayUrl}
            alt="Uploaded file"
            fill
            className="object-contain"
          />

          {fileState.uploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <Progress value={fileState.progress} className="w-2/3" />
              <p className="text-sm text-muted-foreground">
                Uploading... {fileState.progress}%
              </p>
            </div>
          )}

          {!fileState.uploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64 cursor-pointer",
        isDragActive
          ? "border-primary bg-primary/10 border-solid"
          : "border-border hover:border-primary",
        fileState.uploading && "pointer-events-none opacity-50"
      )}
    >
      <CardContent className="flex flex-col items-center justify-center h-full w-full p-4 gap-4">
        <input {...getInputProps()} />

        {isDragActive ? (
          <>
            <Upload className="h-12 w-12 text-primary animate-bounce" />
            <p className="text-sm font-medium text-primary">
              Drop your file here
            </p>
          </>
        ) : (
          <>
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag & drop your image here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Maximum file size: {maxSize}MB
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
