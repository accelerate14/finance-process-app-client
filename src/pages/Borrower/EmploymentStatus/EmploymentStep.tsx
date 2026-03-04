import { useState } from "react";
import Button from "../../../components/UI/Button";
import Select from "../../../components/UI/Select";
import Input from "../../../components/UI/Input";
import { submitEmploymentInfo } from "../../../api/borrower/post";
import { useAuth } from "../../../context/useAuth";
import { jwtDecode } from "jwt-decode";

export default function EmploymentStep({
  defaultValues,
  onNext,
  onBack,
}: any) {
  const { borrowerId } = useAuth(); // borrowerId (string)
  const [data, setData] = useState(defaultValues || {});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!data.employmentStatus) return "Employment status is required";
    if (!data.yearsAtEmployer) return "Years at employer is required";
    if (!data.monthlyIncome) return "Monthly income is required";
    return null;
  };

  const handleNext = async () => {
    setApiError(null);

    const validationError = validate();
    if (validationError) {
      setApiError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      UserId: jwtDecode<{ guid: string }>(localStorage.getItem("borrower_token") || "").guid || borrowerId,
      EmploymentStatus: data.employmentStatus,
      EmployerName: data.employerName || null,
      YearsAtEmployer: Number(data.yearsAtEmployer),
      MonthlyIncome: Number(data.monthlyIncome),
    };

    const result = await submitEmploymentInfo(payload);

    setLoading(false);

    if (!result.success) {
      setApiError(result.message || "Employment submission failed");
      return;
    }

    // ✅ Move forward ONLY on success
    onNext({
      ...data,
      employmentCompleted: true,
      employmentId: result.response?.Id,
    });
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">
        Employment Information
      </h2>

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
        />

        <Input
          label="Years at this Employer*"
          name="yearsAtEmployer"
          type="number"
          value={data.yearsAtEmployer || ""}
          onChange={handleChange}
        />

        <Input
          label="Monthly Gross Income*"
          name="monthlyIncome"
          type="number"
          value={data.monthlyIncome || ""}
          onChange={handleChange}
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