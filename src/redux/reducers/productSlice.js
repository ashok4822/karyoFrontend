import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAxios from '../../lib/adminAxios';

const initialState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  filters: {
    category: null,
    priceRange: null,
    sortBy: null,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    productsPerPage: 5
  }
};

// Async thunk to fetch products from backend
export const fetchProductsFromBackend = createAsyncThunk(
  'products/fetchProductsFromBackend',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 5, search = '', status, category, brand, variantColour, variantCapacity } = params;
      
      const response = await adminAxios.get('/products', {
        params: {
          page,
          limit,
          search,
          status,
          category,
          brand,
          variantColour,
          variantCapacity,
        },
      });
      
      return {
        products: response.data.products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(response.data.total / limit),
          totalProducts: response.data.total,
          productsPerPage: limit,
        },
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload.products;
      state.pagination = action.payload.pagination;
      state.loading = false;
      state.error = null;
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: null,
        priceRange: null,
        sortBy: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsFromBackend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsFromBackend.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchProductsFromBackend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      });
  },
});

export const {
  setProducts,
  setSelectedProduct,
  setLoading,
  setError,
  setFilters,
  clearFilters,
} = productSlice.actions;

export default productSlice.reducer;
