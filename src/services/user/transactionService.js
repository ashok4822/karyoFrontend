import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

export const getWalletTransactions = async () => {
  return await apiHandler(userAxios.get("/users/wallet/transactions"));
};
