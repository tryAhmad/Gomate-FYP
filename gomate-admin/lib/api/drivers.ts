import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface Driver {
  _id: string;
  fullname: {
    firstname: string;
    lastname?: string;
  };
  email: string;
  phoneNumber: string;
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  documents?: {
    cnic?: {
      front?: {
        url: string;
        publicId: string;
      };
      back?: {
        url: string;
        publicId: string;
      };
    };
    selfieWithId?: {
      url: string;
      publicId: string;
    };
    drivingLicense?: {
      front?: {
        url: string;
        publicId: string;
      };
      back?: {
        url: string;
        publicId: string;
      };
    };
  };
  vehicle?: {
    color: string;
    plate: string;
    capacity: number;
    vehicleType: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch drivers by verification status
 */
export const getDriversByStatus = async (
  status: "pending" | "approved" | "rejected"
): Promise<Driver[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/drivers/verification/status`,
      {
        params: { status },
      }
    );
    return response.data.drivers || [];
  } catch (error) {
    console.error("Error fetching drivers:", error);
    throw error;
  }
};

/**
 * Update driver verification status
 */
export const updateDriverVerification = async (
  driverId: string,
  verificationStatus: "pending" | "approved" | "rejected",
  rejectionReason?: string
): Promise<Driver> => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/drivers/${driverId}/verification`,
      {
        verificationStatus,
        rejectionReason,
      }
    );
    return response.data.driver;
  } catch (error) {
    console.error("Error updating verification status:", error);
    throw error;
  }
};

/**
 * Get driver by ID
 */
export const getDriverById = async (driverId: string): Promise<Driver> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/drivers/${driverId}`);
    return response.data.driver;
  } catch (error) {
    console.error("Error fetching driver:", error);
    throw error;
  }
};
