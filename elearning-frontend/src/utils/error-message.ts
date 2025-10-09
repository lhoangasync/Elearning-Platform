import axios from "axios";

export function getErrorMessage(error: unknown): string {
  const defaultMessage = "An unexpected error occurred. Please try again.";

  // 1. Kiểm tra xem có phải là lỗi Axios không
  if (!axios.isAxiosError(error) || !error.response) {
    if (error instanceof Error) return error.message;
    return defaultMessage;
  }

  const data = error.response.data;

  if (!data || typeof data !== "object") {
    return error.response.statusText || defaultMessage;
  }

  if ("message" in data) {
    const messageValue = data.message;

    // Cấu trúc: { message: [ { field: '...', error: '...' } ] }
    // Hoặc: { message: [ { path: '...', message: '...' } ] }
    if (Array.isArray(messageValue) && messageValue.length > 0) {
      const firstErrorObject = messageValue[0];
      if (typeof firstErrorObject === "object" && firstErrorObject !== null) {
        // **Ưu tiên lấy key 'error', nếu không có thì lấy key 'message'**
        if (
          "error" in firstErrorObject &&
          typeof firstErrorObject.error === "string"
        ) {
          return firstErrorObject.error;
        }
        if (
          "message" in firstErrorObject &&
          typeof firstErrorObject.message === "string"
        ) {
          return firstErrorObject.message;
        }
      }
    }

    // Cấu trúc: { message: 'Invalid credentials' }
    if (typeof messageValue === "string") {
      return messageValue;
    }
  }

  if ("error" in data && typeof data.error === "string") {
    return data.error;
  }

  return defaultMessage;
}
