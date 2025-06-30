import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userAxios from "../../lib/userAxios";

// Async thunks
export const fetchUserActiveDiscounts = createAsyncThunk(
  "userDiscounts/fetchUserActiveDiscounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAxios.get("/users/discounts/eligible");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch eligible discounts"
      );
    }
  }
);

const initialState = {
  activeDiscounts: [],
  loading: false,
  error: null,
  selectedDiscount: null,
};

const userDiscountSlice = createSlice({
  name: "userDiscounts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedDiscount: (state, action) => {
      state.selectedDiscount = action.payload;
    },
    clearSelectedDiscount: (state) => {
      state.selectedDiscount = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user active discounts
      .addCase(fetchUserActiveDiscounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserActiveDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.activeDiscounts = action.payload.discounts;
      })
      .addCase(fetchUserActiveDiscounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedDiscount, clearSelectedDiscount } = userDiscountSlice.actions;
export default userDiscountSlice.reducer; 