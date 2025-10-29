import { API_ENDPOINT } from "@/constants/endpoint";
import api from "@/utils/api";
import axios from "axios";

interface GetPresignedUrlPayload {
  filename: string;
  filesize: number;
}

interface GetPresignedUrlResponse {
  url: string;
  presignedUrl: string;
}

export const getPresignedUrl = async (payload: GetPresignedUrlPayload) => {
  const response = await api.post<GetPresignedUrlResponse>(
    API_ENDPOINT.UPLOAD,
    payload
  );
  return response.data;
};

export const uploadFileToStorage = async (presignedUrl: string, file: File) => {
  const response = await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
  return response;
};
