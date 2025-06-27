import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userAxios from "../../lib/userAxios";

const initialState = {
  items: [], // Each item: { id, name, price, image, variant }
  loading: false,
  error: null,
};

// Fetch wishlist from backend
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, thunkAPI) => {
    try {
      const res = await userAxios.get("/wishlist");
      // Map backend items to frontend format
      return res.data.map((item) => ({
        id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.image,
        variant: item.variant,
        variantName: "", // Optionally fetch variant name if needed
      }));
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to fetch wishlist"
      );
    }
  }
);

// Add to wishlist (backend)
export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async (item, thunkAPI) => {
    try {
      await userAxios.post("/wishlist/add", {
        product: item.id,
        variant: item.variant,
      });
      return item;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to add to wishlist"
      );
    }
  }
);

// Remove from wishlist (backend)
export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (item, thunkAPI) => {
    try {
      await userAxios.post("/wishlist/remove", {
        product: item.id,
        variant: item.variant,
      });
      return item;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to remove from wishlist"
      );
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        const exists = state.items.find(
          (item) =>
            item.id === action.payload.id &&
            item.variant === action.payload.variant
        );
        if (!exists) {
          state.items.push(action.payload);
        }
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) =>
            !(
              item.id === action.payload.id &&
              item.variant === action.payload.variant
            )
        );
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
