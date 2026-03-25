import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { UiPath, UiPathError } from '@uipath/uipath-typescript';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript';
import { jwtDecode } from 'jwt-decode';
import { getLenderRoleByEmail } from '../api/borrower/get';
import { Entities } from '@uipath/uipath-typescript/entities';

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
            const entitiesService = new Entities(sdk);
            const entities = await entitiesService.getAll();
            const lenderEntity = entities.find(e => e.name === "FLCM_Roles");

            console.log("Lender Entity Found:", lenderEntity);

            if (lenderEntity) {
              console.log(`Fetching records for entity ID: ${lenderEntity.id}`);

              // CHANGED: Added 'await' before entitiesService.getById to get the instance
              const entityInstance = await entitiesService.getById(lenderEntity.id);
              const lenderRes = await entityInstance.getAllRecords();

              console.log("Raw Lender Records:", lenderRes.items);

              const lenderRecord = (lenderRes.items as any[]).find(
                (r: any) => {console.log('r email', r.email, 'user email ', userEmail.toLowerCase()); return r.email.toLowerCase() === userEmail.toLowerCase() || r.Email.toLowerCase() === userEmail.toLowerCase()}
              );

              console.log("Matched Lender Record:", lenderRecord);

              if (lenderRecord) {
                console.log("Matched Lender Record:", lenderRecord);

                // Normalize the role from Data Service
                const rawRole = (lenderRecord.role || lenderRecord.Role || "").toLowerCase();

                let mappedRole = "";

                if (rawRole === "lender") {
                  mappedRole = "Officer"; // Or "Officer" if that is your internal app name for it
                } else if (rawRole === "underwriter") {
                  mappedRole = "Underwriter";
                } else {
                  mappedRole = "Viewer"; // Fallback
                }

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
        // sessionStorage.removeItem(tokenKey);
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