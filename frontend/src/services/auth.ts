import { getToken, logout } from "@/app/auth/auth";

export { getToken };

export function logoutUser() {
  logout();
}
