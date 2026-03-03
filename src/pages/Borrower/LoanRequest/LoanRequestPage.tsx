import React, { useState } from "react";
import Select from "../../../components/UI/Select";
import Textarea from "../../../components/UI/TextArea";
import Button from "../../../components/UI/Button";
import Input from "../../../components/UI/Input";

export default function LoanRequestPage() {
  const [form, setForm] = useState({
    loanAmount: "",
    loanPurpose: "",
    tenure: "",
    employmentType: "",
    monthlyIncome: "",
    existingEmi: "",
    notes: ""
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Loan Request Submitted:", form);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Request a Loan
          </h1>
          <p className="text-sm text-gray-500">
            Fill in the details below to submit your loan request
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-6 space-y-6"
        >

          {/* Loan Details */}
          <Section title="Loan Details">
            <Input
              label="Loan Amount (₹)"
              name="loanAmount"
              value={form.loanAmount}
              onChange={handleChange}
              placeholder="500000"
            />

            <Select
              label="Loan Purpose"
              name="loanPurpose"
              value={form.loanPurpose}
              onChange={handleChange}
              options={[
                "Personal",
                "Education",
                "Home Renovation",
                "Medical",
                "Business"
              ]}
            />

            <Select
              label="Tenure (Months)"
              name="tenure"
              value={form.tenure}
              onChange={handleChange}
              options={["6", "12", "18", "24", "36", "48", "60"]}
            />
          </Section>

          {/* Employment Details */}
          <Section title="Employment Details">
            <Select
              label="Employment Type"
              name="employmentType"
              value={form.employmentType}
              onChange={handleChange}
              options={["Salaried", "Self-Employed", "Freelancer"]}
            />

            <Input
              label="Monthly Income (₹)"
              name="monthlyIncome"
              value={form.monthlyIncome}
              onChange={handleChange}
              placeholder="75000"
            />

            <Input
              label="Existing EMI (₹)"
              name="existingEmi"
              value={form.existingEmi}
              onChange={handleChange}
              placeholder="10000"
            />
          </Section>

          {/* Notes */}
          <Textarea
            label="Additional Information"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Any additional details..."
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
            <Button type="submit">
              Submit Loan Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Layout Helper */
function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {title}
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}
