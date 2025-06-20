import { createSlice } from '@reduxjs/toolkit';
import dummyProducts from '../../lib/dummyProducts';

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
    productsPerPage: 9
  }
};

export const fetchDummyProducts = (page = 1, limit = 9) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    // Simulate network delay
    await new Promise((res) => setTimeout(res, 500));
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = dummyProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(dummyProducts.length / limit);
    
    dispatch(setProducts({
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: dummyProducts.length,
        productsPerPage: limit
      }
    }));
  } catch (err) {
    dispatch(setError('Failed to fetch products'));
  }
};

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
