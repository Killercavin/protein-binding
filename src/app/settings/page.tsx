"use client";
import Breadcrumb from "@/components/ComponentHeader/ComponentHeader";
import Image from "next/image";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import DarkModeSwitcher from "@/components/Header/DarkModeSwitcher";
import { Edit, MailIcon, CameraIcon, User, AlertTriangle, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { getUserByEmail, updateUser } from "@/lib/actions/user.actions";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  userBio: string;
  photo: string;
  id: string;
}

const Settings = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    userBio: "",
    photo: "",
    id: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [personalInfoErrors, setPersonalInfoErrors] = useState<string | null>(null);
  const [photoErrors, setPhotoErrors] = useState<string | null>(null);
  const [personalInfoLoading, setPersonalInfoLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [personalInfoSuccess, setPersonalInfoSuccess] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [originalData, setOriginalData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        const user = await getUserByEmail(session.user.email);
        const userData: UserData = {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email,
          userBio: user.userBio || "",
          photo: user.photo || "/images/user/user-03.png",
          id: user._id,
        };
        setUserData(userData);
        setOriginalData(userData);
      }
    };

    fetchUserData();
  }, [session?.user?.email]);

  const validatePersonalInfo = (): boolean => {
    if (!userData.firstName.trim()) {
      setPersonalInfoErrors("First name is required");
      return false;
    }
    if (!userData.lastName.trim()) {
      setPersonalInfoErrors("Last name is required");
      return false;
    }
    setPersonalInfoErrors(null);
    return true;
  };

  const validatePhoto = (file: File | null): boolean => {
    if (!file) return true;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPhotoErrors("Image size should be less than 2MB");
      return false;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setPhotoErrors("Only JPG, PNG, GIF and SVG files are allowed");
      return false;
    }
    
    setPhotoErrors(null);
    return true;
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setPersonalInfoSuccess(false);
    
    // Validate form
    if (!validatePersonalInfo()) return;
    
    setPersonalInfoLoading(true);

    try {
      const updatedUser = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        userBio: userData.userBio,
        email: userData.email,
        photo: userData.photo, // Include the photo property
      };

      if (userData.id) {
        const updated = await updateUser(userData.id, updatedUser);
        setUserData(prev => ({ ...prev, ...updated }));
        setOriginalData(prev => ({ ...prev, ...updated }));
        setPersonalInfoSuccess(true);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setPersonalInfoSuccess(false), 3000);
      }
    } catch (error) {
      setPersonalInfoErrors("Failed to update profile. Please try again.");
      console.error("Error updating user:", error);
    } finally {
      setPersonalInfoLoading(false);
    }
  };

  const handleImageUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setPhotoSuccess(false);
    
    // Validate image
    if (!validatePhoto(imageFile)) return;
    
    setPhotoLoading(true);

    try {
      let base64Image = userData.photo;
      if (imageFile) {
        base64Image = await convertImageToBase64(imageFile);
      }

      if (userData.id) {
        const updatedUser = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          userBio: userData.userBio,
          photo: base64Image,
        };
        const updated = await updateUser(userData.id, updatedUser);
        setUserData(prev => ({ ...prev, photo: updated.photo }));
        setOriginalData(prev => (prev ? { ...prev, photo: updated.photo } : null));
        setPhotoSuccess(true);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setPhotoSuccess(false), 3000);
      }
    } catch (error) {
      setPhotoErrors("Failed to upload image. Please try again.");
      console.error("Error uploading image:", error);
    } finally {
      setPhotoLoading(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    
    // Clear success message when form is edited
    setPersonalInfoSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validatePhoto(file)) {
        setImageFile(file);
        setUserData((prevData) => ({
          ...prevData,
          photo: URL.createObjectURL(file),
        }));
        // Clear success message when form is edited
        setPhotoSuccess(false);
      }
    }
  };

  const resetPersonalInfo = () => {
    if (originalData) {
      setUserData(prev => ({
        ...prev,
        firstName: originalData.firstName,
        lastName: originalData.lastName,
        userBio: originalData.userBio,
      }));
      setPersonalInfoErrors(null);
      setPersonalInfoSuccess(false);
    }
  };

  const resetPhoto = () => {
    if (originalData) {
      setUserData(prev => ({
        ...prev,
        photo: originalData.photo,
      }));
      setImageFile(null);
      setPhotoErrors(null);
      setPhotoSuccess(false);
    }
  };

  const deletePhoto = () => {
    setUserData(prev => ({
      ...prev,
      photo: "/images/user/user-03.png",
    }));
    setImageFile(null);
    setPhotoSuccess(false);
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Settings" />
        <div className="mb-4 flex flex-row items-center space-x-2">
          <span>Toggle Theme</span>
          <DarkModeSwitcher />
        </div>
        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5 xl:col-span-3">
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Personal Information
                </h3>
              </div>
              <div className="p-7">
                {personalInfoErrors && (
                  <div className="mb-4 flex items-center rounded-md bg-red-50 p-3 text-red-500 dark:bg-red-900/30">
                    <AlertTriangle size={18} className="mr-2" />
                    <p>{personalInfoErrors}</p>
                  </div>
                )}
                
                {personalInfoSuccess && (
                  <div className="mb-4 flex items-center rounded-md bg-green-50 p-3 text-green-500 dark:bg-green-900/30">
                    <CheckCircle size={18} className="mr-2" />
                    <p>Personal information updated successfully!</p>
                  </div>
                )}
                
                <form onSubmit={handlePersonalInfoSubmit}>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        First Name <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4.5 top-3">
                          <User size={20} />
                        </span>
                        <input
                          className="w-full rounded-lg border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          name="firstName"
                          value={userData.firstName}
                          onChange={handleChange}
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Last Name <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4.5 top-3">
                          <User size={20} />
                        </span>
                        <input
                          className="w-full rounded-lg border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          name="lastName"
                          value={userData.lastName}
                          onChange={handleChange}
                          title="Last Name"
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-4.5 top-3">
                        <MailIcon size={20} />
                      </span>
                      <input
                        className="w-full rounded-lg border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-not-allowed bg-opacity-80"
                        type="email"
                        name="email"
                        value={userData.email}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      BIO
                    </label>
                    <div className="relative">
                      <span className="absolute left-4.5 top-4">
                        <Edit size={20} />
                      </span>

                      <textarea
                        className="w-full rounded-lg border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        name="userBio"
                        rows={6}
                        value={userData.userBio}
                        onChange={handleChange}
                        placeholder="Enter your bio"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4.5">
                    <button
                      className="flex justify-center rounded-lg border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                      type="button"
                      onClick={resetPersonalInfo}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex justify-center rounded-lg bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-70"
                      type="submit"
                      disabled={personalInfoLoading}
                    >
                      {personalInfoLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Image Upload Form */}
          <div className="col-span-5 xl:col-span-2">
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Your Photo
                </h3>
              </div>
              <div className="p-7">
                {photoErrors && (
                  <div className="mb-4 flex items-center rounded-md bg-red-50 p-3 text-red-500 dark:bg-red-900/30">
                    <AlertTriangle size={18} className="mr-2" />
                    <p>{photoErrors}</p>
                  </div>
                )}
                
                {photoSuccess && (
                  <div className="mb-4 flex items-center rounded-md bg-green-50 p-3 text-green-500 dark:bg-green-900/30">
                    <CheckCircle size={18} className="mr-2" />
                    <p>Profile photo updated successfully!</p>
                  </div>
                )}
                
                <form onSubmit={handleImageUploadSubmit}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full overflow-hidden">
                      <Image
                        src={userData.photo}
                        width={55}
                        height={55}
                        alt="User"
                        className="rounded-full h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="mb-1.5 text-black dark:text-white">
                        Edit your photo
                      </span>
                      <span className="flex gap-2.5">
                        <button
                          type="button"
                          className="text-sm hover:text-primary"
                          onClick={deletePhoto}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          className="text-sm hover:text-primary"
                          onClick={() => {
                            document.getElementById("fileInput")?.click();
                          }}
                        >
                          Update
                        </button>
                      </span>
                    </div>
                  </div>

                  <div
                    id="FileUpload"
                    className="relative mb-5.5 block w-full cursor-pointer appearance-none rounded-lg border border-dashed border-primary bg-gray px-4 py-4 dark:bg-meta-4 sm:py-7.5"
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/svg+xml"
                      onChange={handleFileChange}
                      className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                      id="fileInput"
                      title="Upload your photo"
                      placeholder="Upload your photo"
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                        <CameraIcon size={20} />
                      </span>
                      <p>
                        <span className="text-primary">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="mt-1.5">SVG, PNG, JPG or GIF</p>
                      <p>(max 2MB, 800 x 800px recommended)</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4.5">
                    <button
                      className="flex justify-center rounded-lg border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                      type="button"
                      onClick={resetPhoto}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex justify-center rounded-lg bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-70"
                      type="submit"
                      disabled={photoLoading}
                    >
                      {photoLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Settings;