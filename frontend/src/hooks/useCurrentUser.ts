import { useEffect } from "react";
import { authAPI, getUserService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useState } from "react";

export const useCurrentUser = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getUserService().finally(() => {
      setReady(true);
    })
  }, []);
  return ready
};