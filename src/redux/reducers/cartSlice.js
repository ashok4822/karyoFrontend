import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userAxios from "../../lib/userAxios";

const initialState = {
  items: [],
  loading: false,
  error: null,
  initialized: false,
  availableStock: {},
  availableStockLoading: false,
  availableStockError: null,
};

// Fetch cart from backend
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, thunkAPI) => {
    try {
      const res = await userAxios.get("/cart");
      return res.data.items || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to fetch cart"
      );
    }
  }
);

// Add item to cart
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productVariantId, quantity = 1 }, thunkAPI) => {
    try {
      const res = await userAxios.post("/cart/add", {
        productVariantId,
        quantity,
      });
      return res.data.cart.items || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to add to cart"
      );
    }
  }
);

// Update cart item quantity
export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ productVariantId, quantity }, thunkAPI) => {
    try {
      const res = await userAxios.put("/cart/update", {
        productVariantId,
        quantity,
      });
      return res.data.cart.items || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to update cart item"
      );
    }
  }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (productVariantId, thunkAPI) => {
    try {
      await userAxios.delete("/cart/remove", {
        data: { productVariantId },
      });
      return productVariantId;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to remove from cart"
      );
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, thunkAPI) => {
    try {
      await userAxios.delete("/cart/clear");
      return [];
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to clear cart"
      );
    }
  }
);

// Get available stock for a product (considering cart quantities)
export const getAvailableStock = createAsyncThunk(
  "cart/getAvailableStock",
  async (productId, thunkAPI) => {
    try {
      const res = await userAxios.get(`/cart/available-stock/${productId}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to get available stock"
      );
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartState: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        if (!state.initialized) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.initialized = true;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // Clear available stock cache to force refresh
        state.availableStock = {};
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // Clear available stock cache to force refresh
        state.availableStock = {};
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.productVariantId._id !== action.payload
        );
        // Clear available stock cache to force refresh
        state.availableStock = {};
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        // Clear available stock cache to force refresh
        state.availableStock = {};
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get available stock
      .addCase(getAvailableStock.pending, (state) => {
        state.availableStockLoading = true;
        state.availableStockError = null;
      })
      .addCase(getAvailableStock.fulfilled, (state, action) => {
        state.availableStockLoading = false;
        state.availableStock[action.payload.productId] = action.payload.variants;
      })
      .addCase(getAvailableStock.rejected, (state, action) => {
        state.availableStockLoading = false;
        state.availableStockError = action.payload;
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
