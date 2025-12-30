import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface DocumentUploadData {
  driverId: string;
  cnicFront?: string; // URI from ImagePicker
  cnicBack?: string;
  selfieWithId?: string;
  licenseFront?: string;
  licenseBack?: string;
  profilePhoto?: string;
  vehicleImages?: string[];
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  vehicleCompany?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  vehicleCapacity?: string;
}

/**
 * Upload driver documents to backend
 * @param data - Document upload data with image URIs
 * @returns Response from backend
 */
export const uploadDriverDocuments = async (data: DocumentUploadData) => {
  try {
    console.log("=== UPLOAD DEBUG INFO ===");
    console.log("API URL:", API_BASE_URL);
    console.log("Driver ID:", data.driverId);
    console.log("Documents to upload:", {
      cnicFront: !!data.cnicFront,
      cnicBack: !!data.cnicBack,
      selfieWithId: !!data.selfieWithId,
      licenseFront: !!data.licenseFront,
      licenseBack: !!data.licenseBack,
    });

    const formData = new FormData();

    // Helper function to append image to FormData
    const appendImage = (fieldName: string, uri: string) => {
      const filename = uri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append(fieldName, {
        uri,
        name: filename,
        type,
      } as any);
    };

    // Append images if they exist
    if (data.profilePhoto) {
      appendImage("profilePhoto", data.profilePhoto);
    }
    if (data.cnicFront) {
      appendImage("cnicFront", data.cnicFront);
    }
    if (data.cnicBack) {
      appendImage("cnicBack", data.cnicBack);
    }
    if (data.selfieWithId) {
      appendImage("selfieWithId", data.selfieWithId);
    }
    if (data.licenseFront) {
      appendImage("licenseFront", data.licenseFront);
    }
    if (data.licenseBack) {
      appendImage("licenseBack", data.licenseBack);
    }

    // Append vehicle images
    if (data.vehicleImages && data.vehicleImages.length > 0) {
      data.vehicleImages.forEach((uri, index) => {
        const filename = uri.split("/").pop() || `vehicle-${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("vehicleImages", {
          uri,
          name: filename,
          type,
        } as any);
      });
    }

    // Append text fields
    if (data.fullName) formData.append("fullName", data.fullName);
    if (data.phone) formData.append("phone", data.phone);
    if (data.dateOfBirth) formData.append("dateOfBirth", data.dateOfBirth);
    if (data.vehicleCompany)
      formData.append("vehicleCompany", data.vehicleCompany);
    if (data.vehicleModel) formData.append("vehicleModel", data.vehicleModel);
    if (data.vehicleColor) formData.append("vehicleColor", data.vehicleColor);
    if (data.vehicleType) formData.append("vehicleType", data.vehicleType);
    if (data.vehiclePlate) formData.append("vehiclePlate", data.vehiclePlate);
    if (data.vehicleCapacity)
      formData.append("vehicleCapacity", data.vehicleCapacity);

    const response = await axios.post(
      `${API_BASE_URL}/drivers/${data.driverId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 second timeout for uploads
      }
    );

    console.log("Upload successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("=== UPLOAD ERROR DEBUG ===");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Response status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    console.error("Request URL:", error.config?.url);
    console.error("Full error:", JSON.stringify(error, null, 2));

    throw new Error(
      error.response?.data?.message || "Failed to upload documents"
    );
  }
};

/**
 * Get driver verification status
 * @param driverId - Driver ID
 * @returns Driver data with verification status
 */
export const getDriverVerificationStatus = async (driverId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/drivers/${driverId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching driver status:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch driver status"
    );
  }
};
