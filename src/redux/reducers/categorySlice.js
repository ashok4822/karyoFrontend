import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminAxios from "../../lib/adminAxios";

const initialState = {
  categories: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { status = 'all' } = params;
      const response = await adminAxios.get('/categories', {
        params: { status }
      });
      return response.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await adminAxios.post('/categories', categoryData);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, ...categoryData }, { rejectWithValue }) => {
    try {
      const response = await adminAxios.put(`/categories/${id}`, categoryData);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await adminAxios.delete(`/categories/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

export const restoreCategory = createAsyncThunk(
  'categories/restoreCategory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminAxios.patch(`/categories/${id}/restore`);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to restore category');
    }
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(cat => cat._id === action.payload._id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(cat => cat._id === action.payload);
        if (index !== -1) {
          state.categories[index].status = 'deleted';
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Restore category
      .addCase(restoreCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(cat => cat._id === action.payload._id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(restoreCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCategories, setLoading, setError, clearError } = categorySlice.actions;
export default categorySlice.reducer;
