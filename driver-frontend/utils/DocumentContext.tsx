import React, { createContext, useContext, useState, ReactNode } from "react";
import { uploadDriverDocuments } from "@/utils/documentUpload";
import { Alert } from "react-native";

interface DocumentImages {
  cnicFront: string | null;
  cnicBack: string | null;
  selfieWithId: string | null;
  licenseFront: string | null;
  licenseBack: string | null;
  profilePhoto: string | null;
  vehicleImages: string[];
}

interface BasicInfo {
  fullName: string;
  phone: string;
  dateOfBirth: string;
}

interface VehicleInfo {
  company: string;
  model: string;
  color: string;
  type: string;
  plate: string;
  capacity: string;
}

interface DocumentContextType {
  images: DocumentImages;
  basicInfo: BasicInfo;
  vehicleInfo: VehicleInfo;
  setImage: (key: keyof DocumentImages, uri: string | null) => void;
  addVehicleImage: (uri: string) => void;
  removeVehicleImage: (index: number) => void;
  setBasicInfo: (info: Partial<BasicInfo>) => void;
  setVehicleInfo: (info: Partial<VehicleInfo>) => void;
  uploadDocuments: (driverId: string) => Promise<boolean>;
  clearAllImages: () => void;
  isUploading: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [images, setImages] = useState<DocumentImages>({
    cnicFront: null,
    cnicBack: null,
    selfieWithId: null,
    licenseFront: null,
    licenseBack: null,
    profilePhoto: null,
    vehicleImages: [],
  });

  const [basicInfo, setBasicInfoState] = useState<BasicInfo>({
    fullName: "",
    phone: "",
    dateOfBirth: "",
  });

  const [vehicleInfo, setVehicleInfoState] = useState<VehicleInfo>({
    company: "",
    model: "",
    color: "",
    type: "",
    plate: "",
    capacity: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  const setImage = (key: keyof DocumentImages, uri: string | null) => {
    if (key === "vehicleImages") {
      // Don't use this for vehicle images, use addVehicleImage instead
      return;
    }
    setImages((prev) => ({ ...prev, [key]: uri }));
  };

  const addVehicleImage = (uri: string) => {
    setImages((prev) => ({
      ...prev,
      vehicleImages: [...prev.vehicleImages, uri],
    }));
  };

  const removeVehicleImage = (index: number) => {
    setImages((prev) => ({
      ...prev,
      vehicleImages: prev.vehicleImages.filter((_, i) => i !== index),
    }));
  };

  const setBasicInfo = (info: Partial<BasicInfo>) => {
    setBasicInfoState((prev) => ({ ...prev, ...info }));
  };

  const setVehicleInfo = (info: Partial<VehicleInfo>) => {
    setVehicleInfoState((prev) => ({ ...prev, ...info }));
  };

  const clearAllImages = () => {
    setImages({
      cnicFront: null,
      cnicBack: null,
      selfieWithId: null,
      licenseFront: null,
      licenseBack: null,
      profilePhoto: null,
      vehicleImages: [],
    });
    setBasicInfoState({
      fullName: "",
      phone: "",
      dateOfBirth: "",
    });
    setVehicleInfoState({
      company: "",
      model: "",
      color: "",
      type: "",
      plate: "",
      capacity: "",
    });
  };

  const uploadDocuments = async (driverId: string): Promise<boolean> => {
    setIsUploading(true);
    try {
      await uploadDriverDocuments({
        driverId,
        cnicFront: images.cnicFront || undefined,
        cnicBack: images.cnicBack || undefined,
        selfieWithId: images.selfieWithId || undefined,
        licenseFront: images.licenseFront || undefined,
        licenseBack: images.licenseBack || undefined,
        profilePhoto: images.profilePhoto || undefined,
        vehicleImages:
          images.vehicleImages.length > 0 ? images.vehicleImages : undefined,
        fullName: basicInfo.fullName,
        phone: basicInfo.phone,
        dateOfBirth: basicInfo.dateOfBirth,
        vehicleCompany: vehicleInfo.company,
        vehicleModel: vehicleInfo.model,
        vehicleColor: vehicleInfo.color,
        vehicleType: vehicleInfo.type,
        vehiclePlate: vehicleInfo.plate,
        vehicleCapacity: vehicleInfo.capacity,
      });

      Alert.alert(
        "Success",
        "Documents uploaded successfully! Your account is now pending verification.",
        [{ text: "OK" }]
      );
      return true;
    } catch (error: any) {
      Alert.alert(
        "Upload Failed",
        error.message || "Failed to upload documents. Please try again.",
        [{ text: "OK" }]
      );
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        images,
        basicInfo,
        vehicleInfo,
        setImage,
        addVehicleImage,
        removeVehicleImage,
        setBasicInfo,
        setVehicleInfo,
        uploadDocuments,
        clearAllImages,
        isUploading,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
};
