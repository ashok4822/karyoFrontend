import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducers/authSlice";
import productReducer from "../reducers/productSlice";
import cartReducer from "../reducers/cartSlice";
import categoryReducer from "../reducers/categorySlice";
import userReducer from "../reducers/userSlice";
import dashboardReducer from "../reducers/dashboardSlice";
import wishlistReducer from "../reducers/wishlistSlice";
import storage from "redux-persist/lib/storage";
import { persistStore, persistReducer } from "redux-persist";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    products: productReducer,
    cart: cartReducer,
    categories: categoryReducer,
    users: userReducer,
    dashboard: dashboardReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export const RootState = store.getState;
export const AppDispatch = store.dispatch;
