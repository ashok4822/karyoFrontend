import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userAxios from "../../lib/userAxios";

const initialState = {
  addresses: [],
  loading: false,
  error: null,
};

// Fetch user's shipping addresses
export const fetchShippingAddresses = createAsyncThunk(
  "shippingAddress/fetchShippingAddresses",
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get("/users/shipping-addresses");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Failed to fetch shipping addresses"
      );
    }
  }
);

// Create new shipping address
export const createShippingAddress = createAsyncThunk(
  "shippingAddress/createShippingAddress",
  async (addressData, thunkAPI) => {
    try {
      const response = await userAxios.post("/users/shipping-address", addressData);
      return response.data;
    } catch (error) {
      // Return the full error response for field-level validation
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: "Failed to create shipping address" }
      );
    }
  }
);

// Update shipping address
export const updateShippingAddress = createAsyncThunk(
  "shippingAddress/updateShippingAddress",
  async ({ id, addressData }, thunkAPI) => {
    try {
      const response = await userAxios.put(`/users/shipping-address/${id}`, addressData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Failed to update shipping address"
      );
    }
  }
);

// Delete shipping address
export const deleteShippingAddress = createAsyncThunk(
  "shippingAddress/deleteShippingAddress",
  async (addressId, thunkAPI) => {
    try {
      await userAxios.delete(`/users/shipping-address/${addressId}`);
      return addressId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Failed to delete shipping address"
      );
    }
  }
);

// Set default shipping address
export const setDefaultShippingAddress = createAsyncThunk(
  "shippingAddress/setDefaultShippingAddress",
  async (addressId, thunkAPI) => {
    try {
      const response = await userAxios.put(`/users/shipping-address/${addressId}/default`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Failed to set default shipping address"
      );
    }
  }
);

const shippingAddressSlice = createSlice({
  name: "shippingAddress",
  initialState,
  reducers: {
    clearShippingAddressError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch shipping addresses
      .addCase(fetchShippingAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShippingAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload.addresses;
      })
      .addCase(fetchShippingAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create shipping address
      .addCase(createShippingAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createShippingAddress.fulfilled, (state, action) => {
        state.loading = false;
        const newAddress = action.payload.address;
        
        // If the new address is being set as default, unset all other addresses
        if (newAddress.isDefault) {
          state.addresses.forEach((addr) => {
            addr.isDefault = false;
          });
        }
        
        state.addresses.push(newAddress);
      })
      .addCase(createShippingAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update shipping address
      .addCase(updateShippingAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateShippingAddress.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAddress = action.payload.address;
        
        // If the updated address is being set as default, unset all other addresses
        if (updatedAddress.isDefault) {
          state.addresses.forEach((addr) => {
            addr.isDefault = false;
          });
        }
        
        // Update the specific address
        const index = state.addresses.findIndex(
          (addr) => addr._id === updatedAddress._id
        );
        if (index !== -1) {
          state.addresses[index] = updatedAddress;
        }
      })
      .addCase(updateShippingAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete shipping address
      .addCase(deleteShippingAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteShippingAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.filter(
          (addr) => addr._id !== action.payload
        );
      })
      .addCase(deleteShippingAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Set default shipping address
      .addCase(setDefaultShippingAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setDefaultShippingAddress.fulfilled, (state, action) => {
        state.loading = false;
        // Update all addresses to set isDefault to false
        state.addresses.forEach((addr) => {
          addr.isDefault = false;
        });
        // Set the selected address as default
        const index = state.addresses.findIndex(
          (addr) => addr._id === action.payload.address._id
        );
        if (index !== -1) {
          state.addresses[index].isDefault = true;
        }
      })
      .addCase(setDefaultShippingAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearShippingAddressError } = shippingAddressSlice.actions;
export default shippingAddressSlice.reducer; 