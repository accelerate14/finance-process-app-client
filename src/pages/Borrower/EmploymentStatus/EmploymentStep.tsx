import { useState, useEffect } from "react";
import Button from "../../../components/UI/Button";
import Select from "../../../components/UI/Select";
import Input from "../../../components/UI/Input";
import { submitEmploymentInfo } from "../../../api/borrower/post";
import { useAuth } from "../../../context/useAuth";
import { jwtDecode } from "jwt-decode";
import { employmentInfoSchema } from "../../../validations/employment.validation";

export default function EmploymentStep({ defaultValues, onNext, onBack }: any) {
  const { borrowerId } = useAuth();
  const [data, setData] = useState(defaultValues || {});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setData(defaultValues);
    }
  }, [defaultValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Check if the user is changing the Employment Status
    if (name === "employmentStatus") {
      // Reset all fields and only set the new status
      setData({
        employmentStatus: value,
        employerName: "",
        yearsAtEmployer: "",
        monthlyIncome: "",
        compensationType: "",
        employerAddress: "",
        employerCity: "",
        employerState: "",
        employerZipCode: "",
        // Preserve the internal ID if it exists so we don't lose the DB reference
        Id: data.Id
      });

      // Clear any existing errors when status changes
      setApiError(null);
    } else {
      // General case for all other inputs
      setData({ ...data, [name]: value });
    }
  };

  const handleNext = async () => {
    setApiError(null);

    const token = localStorage.getItem("borrower_token");
    const decodedUserId = token ? jwtDecode<{ guid: string }>(token).guid : borrowerId;

    // 1. Prepare payload with NEW FIELDS
    const payload = {
      UserId: decodedUserId,
      EmploymentStatus: data.employmentStatus,
      EmployerName: data.employerName || "",
      YearsAtEmployer: data.yearsAtEmployer ? Number(data.yearsAtEmployer) : 0,
      MonthlyIncome: data.monthlyIncome ? Number(data.monthlyIncome) : 0,
      // New Fields added here
      CompensationType: data.compensationType || "",
      EmployerAddress: data.employerAddress || "",
      EmployerCity: data.employerCity || "",
      EmployerState: data.employerState || "",
      EmployerZipCode: data.employerZipCode || "",
    };

    // 2. Joi Validation
    const { error } = employmentInfoSchema.validate(payload, { abortEarly: true });
    if (error) {
      setApiError(error.details[0].message);
      return;
    }

    // 3. Updated Change Detection (Includes new fields)
    const hasChanges = Object.keys(payload).some((key) => {
      if (key === "UserId") return false;
      const dataKeyMap: { [key: string]: string } = {
        EmploymentStatus: "employmentStatus",
        EmployerName: "employerName",
        YearsAtEmployer: "yearsAtEmployer",
        MonthlyIncome: "monthlyIncome",
        CompensationType: "compensationType",
        EmployerAddress: "employerAddress",
        EmployerCity: "employerCity",
        EmployerState: "employerState",
        EmployerZipCode: "employerZipCode",
      };
      const dataKey = dataKeyMap[key];
      return String(payload[key as keyof typeof payload] || "") !== String(defaultValues[dataKey] || "");
    });

    if (data.Id && !hasChanges) {
      onNext(data);
      return;
    }

    setLoading(true);
    const result = await submitEmploymentInfo(payload);
    setLoading(false);

    if (!result.success) {
      setApiError(result.message || "Employment submission failed");
      return;
    }

    onNext({
      ...data,
      ...payload,
      employmentCompleted: true,
      employmentId: result.response?.Id,
      Id: result.response?.Id
    });
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Employment Information</h2>

      {apiError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Employment Status*"
          name="employmentStatus"
          options={["Salaried", "Self-Employed", "Unemployed"]}
          value={data.employmentStatus || ""}
          onChange={handleChange}
        />

        <Input
          label="Employer Name"
          name="employerName"
          value={data.employerName || ""}
          onChange={handleChange}
          disabled={data.employmentStatus === "Unemployed"}
        />

        <Select
          label="Compensation Type*"
          name="compensationType"
          options={["Salary", "Hourly"]}
          value={data.compensationType || ""}
          onChange={handleChange}
          disabled={data.employmentStatus === "Unemployed"}
        />

        <Input
          label="Monthly Gross Income*"
          name="monthlyIncome"
          type="number"
          value={data.monthlyIncome || ""}
          onChange={handleChange}
          disabled={data.employmentStatus === "Unemployed"}
        />

        <Input
          label="Years at this Employer*"
          name="yearsAtEmployer"
          type="number"
          value={data.yearsAtEmployer || ""}
          onChange={handleChange}
          disabled={data.employmentStatus === "Unemployed"}
        />

        <Input
          label="Employer Address"
          name="employerAddress"
          value={data.employerAddress || ""}
          onChange={handleChange}
          disabled={data.employmentStatus === "Unemployed"}
        />

        <Input
          label="Employer City"
          name="employerCity"
          value={data.employerCity || ""}
          onChange={handleChange}
          disabled={data.employmentStatus === "Unemployed"}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="State"
            name="employerState"
            value={data.employerState || ""}
            onChange={handleChange}
            disabled={data.employmentStatus === "Unemployed"}
          />
          <Input
            label="Zip Code"
            name="employerZipCode"
            value={data.employerZipCode || ""}
            onChange={handleChange}
            disabled={data.employmentStatus === "Unemployed"}
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleNext} loading={loading}>
          Next
        </Button>
      </div>
    </>
  );
}