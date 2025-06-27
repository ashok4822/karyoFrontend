import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // Each item: { id, name, price, image, variant }
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      // Prevent duplicates by id+variant
      const exists = state.items.find(
        (item) => item.id === action.payload.id && item.variant === action.payload.variant
      );
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(
        (item) => !(item.id === action.payload.id && item.variant === action.payload.variant)
      );
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer; 