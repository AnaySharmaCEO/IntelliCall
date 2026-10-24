import { useAsync } from "./useAsync";
import { usersService } from "../services";
import type { User } from "../types";

export function useCurrentUser() {
  return useAsync<User | null>(() => usersService.getCurrent(), []);
}
