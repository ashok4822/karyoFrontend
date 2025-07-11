import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

// Fetch users with pagination, search, and status filter
export const getUsers = ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
}) => {
  return apiHandler(
    adminAxios.get("/users", {
      params: {
        page,
        limit,
        search,
        status,
      },
    })
  );
};

// Block or unblock a user (same endpoint toggles status)
export const toggleBlockUser = (userId) => {
  return apiHandler(adminAxios.patch(`/users/${userId}/block`));
};
