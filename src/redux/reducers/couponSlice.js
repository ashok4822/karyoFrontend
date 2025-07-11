import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminAxios from "../../lib/adminAxios";

// Async thunks
export const fetchCoupons = createAsyncThunk(
  "coupons/fetchCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
      const response = await adminAxios.get(`/coupons?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch coupons"
      );
    }
  }
);

export const createCoupon = createAsyncThunk(
  "coupons/createCoupon",
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await adminAxios.post("/coupons", couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create coupon"
      );
    }
  }
);

export const updateCoupon = createAsyncThunk(
  "coupons/updateCoupon",
  async ({ id, couponData }, { rejectWithValue }) => {
    try {
      const response = await adminAxios.put(`/coupons/${id}`, couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update coupon"
      );
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  "coupons/deleteCoupon",
  async (id, { rejectWithValue }) => {
    try {
      await adminAxios.delete(`/coupons/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete coupon"
      );
    }
  }
);

export const restoreCoupon = createAsyncThunk(
  "coupons/restoreCoupon",
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminAxios.patch(`/coupons/${id}/restore`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restore coupon"
      );
    }
  }
);

const initialState = {
  coupons: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 0,
  currentCoupon: null,
  filters: {
    search: "",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

const couponSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCoupon: (state, action) => {
      state.currentCoupon = action.payload;
    },
    clearCurrentCoupon: (state) => {
      state.currentCoupon = null;
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
      // Fetch coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.coupons;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create coupon
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons.unshift(action.payload.coupon);
        state.total += 1;
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update coupon
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.coupons.findIndex(
          (coupon) => coupon._id === action.payload.coupon._id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload.coupon;
        }
        state.currentCoupon = null;
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete coupon
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = state.coupons.filter(
          (coupon) => coupon._id !== action.payload
        );
        state.total -= 1;
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Restore coupon
      .addCase(restoreCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons.unshift(action.payload.coupon);
        state.total += 1;
      })
      .addCase(restoreCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentCoupon,
  clearCurrentCoupon,
  setFilters,
  clearFilters,
} = couponSlice.actions;

export default couponSlice.reducer; 