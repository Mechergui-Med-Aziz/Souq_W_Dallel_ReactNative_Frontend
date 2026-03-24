import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import auctionReducer from './slices/auctionSlice';
import notificationReducer from './slices/notificationSlice';
import paymentReducer from './slices/paymentSlice';
import depositReducer from './slices/depositSlice';
import parcelReducer from './slices/parcelSlice';
import reviewReducer from './slices/reviewSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'payment'],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedPaymentReducer = persistReducer(persistConfig, paymentReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    user: userReducer,
    auction: auctionReducer,
    notifications: notificationReducer,
    payment: persistedPaymentReducer,
    deposit: depositReducer,
    parcel: parcelReducer,
    reviews: reviewReducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);