export const apiHandler = async (promise) => {
  try {
    const { data } = await promise;
    return { success: true, data };
  } catch (error) {
    let message = "An unexpected error occurred.";
    let status = 500;

    if (error.response) {
      message = error.response.data?.message || error.response.statusText;
      status = error.response.status;
    } else if (error.message) {
      message = error.message;
    }

    return { success: false, error: message, status };
  }
};
