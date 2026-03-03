import { useState } from "react";
import Input from "../../../components/UI/Input";
import Button from "../../../components/UI/Button";
import { submitBorrowerProfile } from "../../../api/borrower/post";
import { useAuth } from "../../../context/useAuth";
import { jwtDecode } from "jwt-decode";

export default function PersonalInfoStep({
  defaultValues,
  onSuccess,
  allowNextWithoutValidation = false,
}: any) {
  const [data, setData] = useState(defaultValues || {});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isProfileCompleted = data?.profileCompleted === true;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (allowNextWithoutValidation) return true;

    const requiredFields = [
      "firstName",
      "lastName",
      "dob",
      "ssn",
      "address",
      "city",
      "state",
      "zip",
      "email",
    ];

    return requiredFields.every((f) => data[f]);
  };

  const handleNext = async () => {
    setApiError(null);

    if (!validate()) {
      setApiError("Please fill all required fields.");
      return;
    }

    // If already completed → just move ahead
    if (isProfileCompleted) {
      onSuccess(data);
      return;
    }

    setLoading(true);

    const payload = {
      FirstName: data.firstName,
      LastName: data.lastName,
      DateOfBirth: data.dob,
      SSN: data.ssn,
      Address: data.address,
      City: data.city,
      State: data.state,
      ZipCode: data.zip,
      Email: data.email,
      profileCompleted: true,
      UserId: jwtDecode<{ borrowerId: string }>(localStorage.getItem("borrower_token") || "").borrowerId,
    };

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

    localStorage.setItem("borrowerId", result.response.id);
    setLoading(false);
    onSuccess(updatedData);
  };

  // if (isProfileCompleted) {
  //   return (
  //     <>
  //       <div className="p-6 bg-green-50 rounded text-green-700">
  //         ✅ You have already confirmed this step.
  //       </div>
  //       <div className="flex justify-center mt-6">
  //         <Button onClick={handleNext} loading={loading}>
  //           Next
  //         </Button>
  //       </div>
  //     </>
  //   );
  // }

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Borrower Information</h2>

      {apiError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="First Name*" name="firstName" value={data.firstName || ""} onChange={handleChange} />
        <Input label="Last Name*" name="lastName" value={data.lastName || ""} onChange={handleChange} />
        <Input type="date" label="Date of Birth*" name="dob" value={data.dob || ""} onChange={handleChange} />
        <Input label="SSN*" name="ssn" type="number" value={data.ssn || ""} onChange={handleChange} />
        <Input label="Address*" name="address" value={data.address || ""} onChange={handleChange} className="md:col-span-2" />
        <Input label="City*" name="city" value={data.city || ""} onChange={handleChange} />
        <Input label="State*" name="state" value={data.state || ""} onChange={handleChange} />
        <Input label="Zip*" name="zip" type="number" value={data.zip || ""} onChange={handleChange} />
        <Input label="Email*" name="email" type="email" value={data.email || ""} onChange={handleChange} />
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleNext} loading={loading}>
          Next
        </Button>
      </div>
    </>
  );
}