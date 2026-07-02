import { apiFetch } from "@/lib/api.utils";
import { Auth } from "@/types/auth";
import { User } from "@/types/user";
import { useAuthStore } from "@/stores/auth.store";

const {setUser, deleteUser} = useAuthStore.getState();

export const authAPI = {
  login(data: {
    email: string;
    password: string;
  }) {
    return apiFetch.post<Auth>("/auth/login",
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
  },
  me() {
    return apiFetch.get<User>("/auth/me");
  },
  logout() { 
    return apiFetch.get("/auth/logout")
  }
};

export const logoutService = async () => {
    try {
        await authAPI.logout();
        deleteUser();
    } catch (error) {
        console.log(error);
    }
}

export const getUserService = async () => {
  try {
    const user = await authAPI.me();
    setUser(user);
    return true
  } catch {
    deleteUser()
    return false
  }   
}