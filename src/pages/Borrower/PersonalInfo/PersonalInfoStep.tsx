import { useState } from "react";
import Input from "../../../components/UI/Input";
import Button from "../../../components/UI/Button";
import { submitBorrowerProfile } from "../../../api/borrower/post";
import { jwtDecode } from "jwt-decode";
import { borrowerProfileSchema } from "../../../validations/borrower.validation";

interface BorrowerPayload {
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  SSN: string;
  Address: string;
  City: string;
  State: string;
  ZipCode: string;
  Email: string;
  profileCompleted: boolean;
  UserId: string;
  [key: string]: any; // This "Index Signature" fixes the error
}

export default function PersonalInfoStep({
  defaultValues,
  onSuccess,
  allowNextWithoutValidation = false,
}: any) {
  const [data, setData] = useState(defaultValues || {});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  console.log("data:", data, "defaultValues:", defaultValues);
  const isProfileCompleted = !!defaultValues?.Id;
  const isDateOfBirthAvailable = !!defaultValues.DateOfBirth;
  const isSSNAvailable = !!defaultValues.SSN;
  localStorage.setItem("borrowerId", jwtDecode<{ guid: string }>(localStorage.getItem("borrower_token") || "").guid);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.name === "SSN" || e.target.name === "ZipCode") {
      // 1. Remove anything that isn't a number
      const onlyNums = e.target.value.replace(/[^0-9]/g, "");

      // 2. Limit to specific lengths (9 for SSN, 6 for Zip)
      const maxLength = e.target.name === "SSN" ? 9 : 6;
      if (onlyNums.length <= maxLength) {
        setData({ ...data, [e.target.name]: onlyNums });
      }
      return; // Stop here so the general logic below doesn't overwrite this
    }

    setData({ ...data, [e.target.name]: e.target.value });
  };

  const validate = (payload: any) => {
    if (allowNextWithoutValidation) return { error: null };

    // Validate the payload against the Joi schema
    const { error } = borrowerProfileSchema.validate(payload, { abortEarly: true });
    return { error };
  };

  const handleNext = async () => {
    setApiError(null);

    // Prepare payload first so we can validate it
    const payload: BorrowerPayload = {
      FirstName: data.FirstName,
      LastName: data.LastName,
      DateOfBirth: data.DateOfBirth,
      SSN: data.SSN,
      Address: data.Address,
      City: data.City,
      State: data.State,
      ZipCode: data.ZipCode,
      Email: data.Email || jwtDecode<{ email: string }>(localStorage.getItem("borrower_token") || "").email,
      profileCompleted: true,
      UserId: jwtDecode<{ guid: string }>(localStorage.getItem("borrower_token") || "").guid,
    };

    const { error } = validate(payload);

    if (error) {
      setApiError(error.details[0].message);
      return;
    }



    const hasChanges = (Object.keys(payload) as Array<keyof BorrowerPayload>).some(key => {
      // Skip comparing UserId or profileCompleted as they are usually static/internal
      if (key === 'UserId' || key === 'profileCompleted') return false;

      const currentVal = payload[key];
      const originalVal = defaultValues[key];

      if (key === 'DateOfBirth' && originalVal && currentVal) {
        return originalVal.split('T')[0] !== currentVal.split('T')[0];
      }

      return currentVal !== originalVal;
    });

    // If already completed → just move ahead
    console.log("isProfileCompleted:", isProfileCompleted, "hasChanges:", hasChanges);
    if (isProfileCompleted && !hasChanges) {
      onSuccess(data);
      return;
    }

    setLoading(true);

    const result = await submitBorrowerProfile(payload);

    if (!result.success) {
      setApiError(result.message || "Profile submission failed");
      setLoading(false);
      return;
    }

    const updatedData = {
      ...data,
      profileCompleted: true,
      borrowerProfileId: result.response.id,
    };

    localStorage.setItem("borrowerId", jwtDecode<{ guid: string }>(localStorage.getItem("borrower_token") || "").guid);
    setLoading(false);
    onSuccess(updatedData);
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Borrower Information</h2>

      {apiError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="First Name*" name="FirstName" value={data.FirstName || ""} onChange={handleChange} />
        <Input label="Last Name*" name="LastName" value={data.LastName || ""} onChange={handleChange} />
        <Input type="date" label="Date of Birth*" name="DateOfBirth" value={data.DateOfBirth ? data.DateOfBirth.split('T')[0] : ""} disabled={isDateOfBirthAvailable} onChange={handleChange} />
        <Input label="SSN*" name="SSN" type="number" maxLength={9} value={data.SSN || ""} disabled={isSSNAvailable} onChange={handleChange} />
        <Input label="Address*" name="Address" value={data.Address || ""} onChange={handleChange} className="md:col-span-2" />
        <Input label="City*" name="City" value={data.City || ""} onChange={handleChange} />
        <Input label="State*" name="State" value={data.State || ""} onChange={handleChange} />
        <Input label="Zip*" name="ZipCode" type="number" value={data.ZipCode || ""} onChange={handleChange} />
        <Input label="Email*" name="Email" type="email" disabled value={jwtDecode<{ email: string }>(localStorage.getItem("borrower_token") || "").email} onChange={handleChange} />
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleNext} loading={loading}>
          Next
        </Button>
      </div>
    </>
  );
}