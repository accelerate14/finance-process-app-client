import { useState, useEffect } from "react";
import Button from "../../../components/UI/Button";
import Select from "../../../components/UI/Select";
import Input from "../../../components/UI/Input";
import { submitEmploymentInfo } from "../../../api/borrower/post";
import { useAuth } from "../../../context/useAuth";
import { jwtDecode } from "jwt-decode";
import { employmentInfoSchema } from "../../../validations/employment.validation";

export default function EmploymentStep({
  defaultValues,
  onNext,
  onBack,
}: any) {
  const { borrowerId } = useAuth(); // borrowerId (string)
  const [data, setData] = useState(defaultValues || {});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Sync data if defaultValues change (after API load)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setData(defaultValues);
    }
  }, [defaultValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    setApiError(null);

    // Keep your specific UserId retrieval logic
    const token = localStorage.getItem("borrower_token");
    const decodedUserId = token ? jwtDecode<{ guid: string }>(token).guid : borrowerId;

    // Prepare payload to match Joi Schema casing
    const payload = {
      UserId: decodedUserId,
      EmploymentStatus: data.employmentStatus,
      EmployerName: data.employerName || "",
      YearsAtEmployer: data.yearsAtEmployer ? Number(data.yearsAtEmployer) : 0,
      MonthlyIncome: data.monthlyIncome ? Number(data.monthlyIncome) : 0,
    };

    // 1. Joi Validation (Replacing the old manual validate function)
    const { error } = employmentInfoSchema.validate(payload, { abortEarly: true });
    if (error) {
      setApiError(error.details[0].message);
      return;
    }

    // 2. Change Detection (Skip API if nothing changed)
    // We check if an ID exists (meaning it's an update) and if values are the same
    const hasChanges = Object.keys(payload).some((key) => {
      if (key === "UserId") return false;
      // Map payload keys back to data keys for comparison
      const dataKeyMap: { [key: string]: string } = {
        EmploymentStatus: "employmentStatus",
        EmployerName: "employerName",
        YearsAtEmployer: "yearsAtEmployer",
        MonthlyIncome: "monthlyIncome",
      };
      const dataKey = dataKeyMap[key];
      return String(payload[key as keyof typeof payload]) !== String(defaultValues[dataKey] || "");
    });

    if (data.Id && !hasChanges) {
      console.log("No changes detected. Skipping API call.");
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

    // ✅ Move forward ONLY on success
    onNext({
      ...data,
      ...payload, // Spread payload to keep state updated with numbers
      employmentCompleted: true,
      employmentId: result.response?.Id,
      Id: result.response?.Id // Store ID for future change detection
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
          // Optional: Disable if Unemployed for better UX
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
          label="Monthly Gross Income*"
          name="monthlyIncome"
          type="number"
          value={data.monthlyIncome || ""}
          onChange={handleChange}
          disabled={data.employmentStatus === "Unemployed"}
        />
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