import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../services/notificationService';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (userId, { rejectWithValue }) => {
    try {
      const notifications = await notificationService.getUserNotifications(userId);
      return notifications;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const notification = await notificationService.markAsRead(notificationId);
      return notification;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markMultipleAsRead = createAsyncThunk(
  'notifications/markMultipleAsRead',
  async (notificationIds, { rejectWithValue }) => {
    try {
      const results = await notificationService.markMultipleAsRead(notificationIds);
      return results.map(r => r.data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          state.unreadCount = state.notifications.filter(n => !n.read).length;
        }
      })
      .addCase(markMultipleAsRead.fulfilled, (state, action) => {
        action.payload.forEach(updated => {
          const index = state.notifications.findIndex(n => n.id === updated.id);
          if (index !== -1) {
            state.notifications[index] = updated;
          }
        });
        state.unreadCount = state.notifications.filter(n => !n.read).length;
      });
  },
});

export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;