import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminAxios from "../../lib/adminAxios";

// Async thunks
export const fetchDiscounts = createAsyncThunk(
  "discounts/fetchDiscounts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const response = await adminAxios.get(`/discounts?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch discounts"
      );
    }
  }
);

export const createDiscount = createAsyncThunk(
  "discounts/createDiscount",
  async (discountData, { rejectWithValue }) => {
    try {
      const response = await adminAxios.post("/discounts", discountData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create discount"
      );
    }
  }
);

export const updateDiscount = createAsyncThunk(
  "discounts/updateDiscount",
  async ({ id, discountData }, { rejectWithValue }) => {
    try {
      const response = await adminAxios.put(`/discounts/${id}`, discountData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update discount"
      );
    }
  }
);

export const deleteDiscount = createAsyncThunk(
  "discounts/deleteDiscount",
  async (id, { rejectWithValue }) => {
    try {
      await adminAxios.delete(`/discounts/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete discount"
      );
    }
  }
);

export const restoreDiscount = createAsyncThunk(
  "discounts/restoreDiscount",
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminAxios.patch(`/discounts/${id}/restore`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restore discount"
      );
    }
  }
);

export const fetchActiveDiscounts = createAsyncThunk(
  "discounts/fetchActiveDiscounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get("/discounts/active/all");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch active discounts"
      );
    }
  }
);

const initialState = {
  discounts: [],
  activeDiscounts: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 0,
  currentDiscount: null,
  filters: {
    search: "",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

const discountSlice = createSlice({
  name: "discounts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDiscount: (state, action) => {
      state.currentDiscount = action.payload;
    },
    clearCurrentDiscount: (state) => {
      state.currentDiscount = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: "",
        status: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch discounts
      .addCase(fetchDiscounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts = action.payload.discounts;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchDiscounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create discount
      .addCase(createDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDiscount.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts.unshift(action.payload.discount);
        state.total += 1;
      })
      .addCase(createDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update discount
      .addCase(updateDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDiscount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.discounts.findIndex(
          (discount) => discount._id === action.payload.discount._id
        );
        if (index !== -1) {
          state.discounts[index] = action.payload.discount;
        }
        state.currentDiscount = null;
      })
      .addCase(updateDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete discount
      .addCase(deleteDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDiscount.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts = state.discounts.filter(
          (discount) => discount._id !== action.payload
        );
        state.total -= 1;
      })
      .addCase(deleteDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Restore discount
      .addCase(restoreDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreDiscount.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts.unshift(action.payload.discount);
        state.total += 1;
      })
      .addCase(restoreDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch active discounts
      .addCase(fetchActiveDiscounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.activeDiscounts = action.payload.discounts;
      })
      .addCase(fetchActiveDiscounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentDiscount,
  clearCurrentDiscount,
  setFilters,
  clearFilters,
} = discountSlice.actions;

export default discountSlice.reducer; 