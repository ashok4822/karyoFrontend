import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Send contact form data to server
export const submitContactForm = (formData) => {
  return apiHandler(userAxios.post("/contact", formData));
};
