import axios from "axios";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "https://finance-process-app-server-1.onrender.com";

interface ApiSuccess<T = any> {
  success: true;
  response: T;
}

interface ApiError {
  success: false;
  message: string;
}

type ApiResult<T = any> = ApiSuccess<T> | ApiError;

/* ================= AUTH ================= */

export const registerBorrower = async (
  email: string,
  password: string
): Promise<ApiResult> => {
  try {
    const res = await axios.post(`${baseUrl}/api/borrower/register`, {
      email,
      password,
    });
    return { success: true, response: res.data };
  } catch {
    return { success: false, message: "Registration failed" };
  }
};

export const loginBorrower = async (
  email: string,
  password: string
): Promise<ApiResult> => {
  try {
    const res = await axios.post(`${baseUrl}/api/borrower/login`, {
      email,
      password,
    });
    return { success: true, response: res.data };
  } catch {
    return { success: false, message: "Login failed" };
  }
};

/* ================= PROFILE (STEP 1) ================= */

export const submitBorrowerProfile = async (
  payload: {
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
  }
): Promise<ApiResult> => {
  try {
    const res = await axios.post(
      `${baseUrl}/api/borrower/profile/submit`,
      payload
    );
    console.log("API RESPONSE for submitborrowerprofile:", res.data);
    return { success: true, response: res.data.data };
  } catch {
    console.log("API ERROR for submitborrowerprofile");
    return { success: false, message: "Profile submission failed" };
  }
};

/* ================= EMPLOYMENT (STEP 2) ================= */

export const submitEmploymentInfo = async (
  payload: {
    UserId: string;
    EmploymentStatus: string;
    EmployerName?: string;
    YearsAtEmployer: number;
    MonthlyIncome: number;
  }
): Promise<ApiResult> => {
  try {
    const res = await axios.post(
      `${baseUrl}/api/borrower/employment/submit`,
      payload
    );
    return { success: true, response: res.data };
  } catch {
    return { success: false, message: "Employment submission failed" };
  }
};

/* ================= LOAN APPLICATION (STEP 3) ================= */

export const submitLoanApplication = async (
  payload: {
    RequestedOn: string,
    BorrowerEmail: string;
    LoanAmount: number;
    TermOfLoan: number;
    PurposeOfLoan: string;
    CaseStatus: string;
  }
): Promise<ApiResult> => {
  try {
    const res = await axios.post(
      `${baseUrl}/api/borrower/loan/submit`,
      payload
    );
    return { success: true, response: res.data };
  } catch {
    return { success: false, message: "Loan submission failed" };
  }
};

export const uploadBorrowerDocuments = async (
  UserId: string,
  DriversLicense?: File,
  PayStub?: File,
  ProfilePicture?: File
) => {
  const formData = new FormData();
  formData.append("UserId", UserId);

  if (DriversLicense) {
    formData.append("DriversLicense", DriversLicense);
  }

  if (PayStub) {
    formData.append("PayStub", PayStub);
  }

  if (ProfilePicture) {
    formData.append("ProfilePicture", ProfilePicture);
  }

  // IMPORTANT: Remove the headers object entirely. 
  // Axios will see FormData and set the boundary automatically.
  return axios.post(
    `${baseUrl}/api/borrower/documents/upload`,
    formData
  );
};
/* ================= STAGE MANAGEMENT (STEP 5) ================= */
export const createBorrowerStages = async (
  payload: {
    borrowerId: string;
    stage: Number;
    comments: string;
    isDocumentUploaded: boolean;
  }
): Promise<ApiResult> => {  
  try {
    const res = await axios.post(
      `${baseUrl}/api/borrower/stages/create-stage`,
      payload
    );
    return { success: true, response: res.data };
  } catch {
    return { success: false, message: "Stage creation failed" };
  }
};