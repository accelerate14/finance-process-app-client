import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { UiPath, UiPathError } from '@uipath/uipath-typescript';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript';
import { jwtDecode } from 'jwt-decode';
import { getLenderRoleByEmail } from '../api/borrower/get';

interface UiPathAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  sdk: UiPath;
  login: (role?: string) => Promise<void>;
  logout: () => void;
  user: string | null;
  error: string | null;
  roleLender: string | null;
}

const UiPathAuthContext = createContext<UiPathAuthContextType | undefined>(undefined);

export const UiPathAuthProvider: React.FC<{ children: React.ReactNode; config: UiPathSDKConfig }> = ({ children, config }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedRole, setLenderRole] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  
  const sdkRef = useRef(new UiPath(config));
  const sdk = sdkRef.current;

// useEffect(() => {
//   const initOAuth = async () => {
//     // 1. Check if we have a token in session storage FIRST
//     const tokenKey = `uipath_sdk_user_token-${config.clientId}`; // Dynamically target your specific token
//     const storedToken = sessionStorage.getItem(tokenKey);
//     const isCallback = sdk.isInOAuthCallback();

//     // 2. Only run initialization if we are returning from a login (callback) 
//     // OR if we actually have a token to validate.
//     if (!isCallback && !storedToken) {
//       console.log("No session found, staying logged out.");
//       setIsLoading(false);
//       return;
//     }

//     try {
//       if (isCallback) {
//         console.log("Completing OAuth callback...");
//         await sdk.completeOAuth();
//       }

//       // Initialize only if we have a token or are in callback
//       await sdk.initialize();

//       if (sdk.isAuthenticated()) {
//         const lenderToken = sessionStorage.getItem(tokenKey);
//         if (lenderToken) {
//           const decodedToken = jwtDecode<any>(lenderToken);
//           setUser(decodedToken?.name);
          
//           const roleResponse = await getLenderRoleByEmail(decodedToken?.name);
//           if (roleResponse.success) {
//             setLenderRole(roleResponse.response.role === "lender" ? "Officer" : "Underwriter");
//             setIsAuthenticated(true);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("SDK Init Error:", err);
//       // If the token was expired, clear it so we don't loop
//       sessionStorage.removeItem(tokenKey);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   initOAuth();
// }, [sdk, config.clientId]); // Add config.clientId to dependencies

useEffect(() => {
  const initOAuth = async () => {
    const tokenKey = `uipath_sdk_user_token-${config.clientId}`;
    const storedToken = sessionStorage.getItem(tokenKey);
    const isCallback = sdk.isInOAuthCallback();

    console.log("Checking Auth State:", { isCallback, hasStoredToken: !!storedToken });

    if (!isCallback && !storedToken) {
      console.log("No session or callback detected. Staying logged out.");
      setIsLoading(false);
      return;
    }

    try {
      if (isCallback) {
        console.log("OAuth callback detected. Completing handshake...");
        await sdk.completeOAuth();
      }

      console.log("Initializing SDK...");
      await sdk.initialize();

      const authenticated = sdk.isAuthenticated();
      console.log("Is Authenticated:", authenticated);

      if (authenticated) {
        const lenderToken = sessionStorage.getItem(tokenKey);
        if (lenderToken) {
          const decodedToken = jwtDecode<any>(lenderToken);
          const userEmail = decodedToken?.email || decodedToken?.name;
          console.log("Decoded User Info:", { name: decodedToken?.name, email: userEmail });
          
          setUser(decodedToken?.name);

          console.log("Fetching all entities from Data Service...");
          const entities = await sdk.entities.getAll();
          const lenderEntity = entities.find(e => e.name === "roles");

          console.log("Lender Entity Found:", lenderEntity);

          if (lenderEntity) {
            console.log(`Fetching records for entity ID: ${lenderEntity.id}`);
            const lenderRes = await sdk.entities.getRecordsById(lenderEntity.id);
            console.log("Raw Lender Records:", lenderRes.items);
            
            const lenderRecord = lenderRes.items.find(
              (r: any) => r.email === userEmail || r.Email === userEmail
            );

            if (lenderRecord) {
              console.log("Matched Lender Record:", lenderRecord);
              const mappedRole = lenderRecord.role.toLowerCase() === "lender" ? "Officer" : "Underwriter";
              
              console.log("Setting Assigned Role:", mappedRole);
              setLenderRole(mappedRole);
              setIsAuthenticated(true);
            } else {
              console.warn("User email does not match any record in the Lender entity.");
            }
          } else {
            console.error("Critical: 'Lender' entity not found in UiPath Data Service.");
          }
        }
      }
    } catch (err) {
      console.error("SDK Init Error:", err);
      sessionStorage.removeItem(tokenKey);
    } finally {
      setIsLoading(false);
      console.log("Initialization sequence complete.");
    }
  };

  initOAuth();
}, [sdk, config.clientId]);

  const login = async (role?: string) => {
    setIsLoading(true);
    try {
      console.log("Initiating login...");
      console.log("SDK before initialize:", sdk);
      await sdk.initialize(); // Redirects to UiPath Cloud
      console.log("Redirecting to UiPath Cloud for authentication...");
      // Optional: Store intended role if needed before redirect
      if (role) {
        sessionStorage.setItem("intended_role", role);
      }

    } catch (err) {
      setError("Redirect failed");
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setLenderRole(null);
    sdkRef.current = new UiPath(config);
    window.location.href = "/";
  };

  return (
    <UiPathAuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      sdk,
      login, 
      logout, 
      user, 
      error, 
      roleLender: fetchedRole 
    }}>
      {children}
    </UiPathAuthContext.Provider>
  );
};

export const useUiPathAuth = () => {
  const ctx = useContext(UiPathAuthContext);
  if (!ctx) throw new Error("useUiPathAuth must be used inside UiPathAuthProvider");
  return ctx;
};

// import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
// import { UiPath, UiPathError } from '@uipath/uipath-typescript';
// import type { UiPathSDKConfig } from '@uipath/uipath-typescript';
// import { jwtDecode } from 'jwt-decode';
// import { getLenderRoleByEmail } from '../api/borrower/get';

// interface UiPathAuthContextType {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   sdk: UiPath;
//   login: (role: string) => Promise<void>;
//   logout: () => void;
//   error: string | null;
//   roleLender: string | null;
// }

// const UiPathAuthContext = createContext<UiPathAuthContextType | undefined>(undefined);

// export const UiPathAuthProvider: React.FC<{ children: React.ReactNode; config: UiPathSDKConfig }> = ({ children, config }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [fetchedRole, setLenderRole] = useState<string | null>(null);
  
//   // Use useRef to keep the SDK instance alive during redirects
//   const sdkRef = useRef(new UiPath(config));
//   const sdk = sdkRef.current;

//   // useEffect(() => {
//   //   const initOAuth = async () => {
//   //     try {
//   //       if (sdk.isInOAuthCallback()) {
//   //         console.log("OAuth callback detected...");
//   //         await sdk.completeOAuth();
//   //       }
        
//   //       console.log("SDK initialized, isAuthenticated:", sdk.isAuthenticated());
//   //       const lenderToken = sessionStorage.getItem("uipath_sdk_user_token-f167c2c7-2f0b-4a2f-bf12-6d4c99624c54");
//   //       if (lenderToken) {
//   //         const decodedToken = jwtDecode<any>(lenderToken);
//   //         const email = decodedToken?.name;
//   //         const roleResponse = await getLenderRoleByEmail(email);
//   //         console.log("Navbar - role from localStorage:", decodedToken?.name);
//   //         if (roleResponse.success && roleResponse.response) {
//   //           const fetchedRole = roleResponse.response.role;
//   //           console.log("Fetched lender role:", fetchedRole);
//   //           if (fetchedRole === "Lender") {
//   //             setLenderRole("Lender");
//   //           } else if (fetchedRole === "Underwriter") {
//   //             setLenderRole("Underwriter");
//   //           }
//   //           setIsAuthenticated(true);
//   //         }
//   //       }
          
//   //     } catch (err) {
//   //       setError(err instanceof UiPathError ? err.message : "OAuth Init Failed");
//   //     } finally {
//   //       setIsLoading(false);
//   //     }
//   //   };
//   //   initOAuth();
//   // }, [sdk]);

//   useEffect(() => {
//     const initOAuth = async () => {
//       try {
//         if (sdk.isInOAuthCallback()) {
//           await sdk.completeOAuth();
//         }
        
//         // Check if we have a session token
//         const lenderToken = sessionStorage.getItem("uipath_sdk_user_token-f167c2c7-2f0b-4a2f-bf12-6d4c99624c54");
        
//         if (lenderToken && sdk.isAuthenticated()) {
//           const decodedToken = jwtDecode<any>(lenderToken);
//           const email = decodedToken?.name;

//           // Fetch role from backend
//           const roleResponse = await getLenderRoleByEmail(email);
          
//           if (roleResponse.success && roleResponse.response) {
//             const rawRole = roleResponse.response.role.toLowerCase(); // handle lowercase
            
//             // Map roles: lender -> Officer, underwriter -> Underwriter
//             if (rawRole === "lender") {
//               setLenderRole("Officer");
//             } else if (rawRole === "underwriter") {
//               setLenderRole("Underwriter");
//             }
            
//             setIsAuthenticated(true);
//           } else {
//             setError("User role not recognized.");
//           }
//         }
//       } catch (err) {
//         setError(err instanceof UiPathError ? err.message : "Authentication Failed");
//       } finally {
//         setIsLoading(false); // Stop loading ONLY after role check is done
//       }
//     };
//     initOAuth();
//   }, [sdk]);

//   const login = async (role: string) => {
//     setIsLoading(true);
//     try {
//       console.log("sdk before initialize", sdk);
//       console.log("isauthenticated hook:", isAuthenticated);
//       console.log("isAuthenticated", sdk.isAuthenticated());
//       await sdk.initialize(); // Redirects to UiPath Cloud
//       console.log("Redirecting to UiPath Cloud for authentication...");
//       console.log("sdk", sdk);
//       console.log("isAuthenticated", sdk.isAuthenticated());
      
//       if (role === "Lender") {
//         setLenderRole("Lender");
//       } else if (role === "Underwriter") {
//         setLenderRole("Underwriter");
//       }
//     } catch (err) {
//       setError("Redirect failed");
//       setIsLoading(false);
//     }
//   };

//   const logout = () => {
//     sessionStorage.clear();
//     setIsAuthenticated(false);
//     setLenderRole(null);
//     // Refresh SDK instance for next attempt
//     sdkRef.current = new UiPath(config);
//     window.location.href = "/";
//   };

//   return (
//     <UiPathAuthContext.Provider value={{ isAuthenticated, isLoading, sdk, login, logout, error, roleLender: fetchedRole }}>
//       {children}
//     </UiPathAuthContext.Provider>
//   );
// };

// export const useUiPathAuth = () => {
//   const ctx = useContext(UiPathAuthContext);
//   if (!ctx) throw new Error("useUiPathAuth must be used inside UiPathAuthProvider");
//   return ctx;
// };


// // import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
// // import type { ReactNode } from 'react';
// // import { UiPath, UiPathError } from '@uipath/uipath-typescript';
// // import type { UiPathSDKConfig } from '@uipath/uipath-typescript';

// // interface UiPathAuthContextType {
// //   isAuthenticated: boolean;
// //   isLoading: boolean;
// //   sdk: UiPath;
// //   login: () => Promise<void>;
// //   logout: () => void;
// //   error: string | null;
// // }

// // const UiPathAuthContext = createContext<UiPathAuthContextType | undefined>(undefined);

// // export const UiPathAuthProvider: React.FC<{ children: ReactNode; config: UiPathSDKConfig }> = ({ children, config }) => {
// //   const [isAuthenticated, setIsAuthenticated] = useState(false);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
  
// //   // Ref keeps the same SDK instance across the redirect reloads
// //   const sdkRef = useRef<UiPath>(new UiPath(config));
// //   const sdk = sdkRef.current;

// //   useEffect(() => {
// //     const initLenderAuth = async () => {
// //       setIsLoading(true);
// //       try {
// //         // Handle the return from UiPath Login
// //         if (sdk.isInOAuthCallback()) {
// //           console.log("Lender OAuth callback detected...");
// //           await sdk.completeOAuth();
// //         }
        
// //         setIsAuthenticated(sdk.isAuthenticated());
// //       } catch (err) {
// //         console.error('Lender Auth Init Error:', err);
// //         setError(err instanceof UiPathError ? err.message : 'Lender login failed');
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };
    
// //     initLenderAuth();
// //   }, [sdk]);

// //   const login = async () => {
// //     setIsLoading(true);
// //     setError(null);
// //     try {
// //       // 🚨 This is what triggers the browser redirect to cloud.uipath.com
// //       await sdk.initialize(); 
// //       setIsAuthenticated(sdk.isAuthenticated());
// //     } catch (err) {
// //       setError(err instanceof UiPathError ? err.message : 'Login failed');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const logout = () => {
// //     setIsAuthenticated(false);
// //     // Refresh SDK instance for next attempt
// //     sdkRef.current = new UiPath(config);
// //     window.location.href = "/";
// //   };

// //   return (
// //     <UiPathAuthContext.Provider value={{ isAuthenticated, isLoading, sdk, login, logout, error }}>
// //       {children}
// //     </UiPathAuthContext.Provider>
// //   );
// // };

// // export const useUiPathAuth = () => {
// //   const context = useContext(UiPathAuthContext);
// //   if (!context) throw new Error('useUiPathAuth must be used within UiPathAuthProvider');
// //   return context;
// // };