import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { depositService } from '../services/depositService';

export const fetchAllDeposits = createAsyncThunk(
  'deposit/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const deposits = await depositService.getAllDeposits();
      return deposits;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDepositsByAuction = createAsyncThunk(
  'deposit/fetchByAuction',
  async (auctionId, { rejectWithValue }) => {
    try {
      const deposits = await depositService.getDepositsByAuctionId(auctionId);
      return deposits;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const depositSlice = createSlice({
  name: 'deposit',
  initialState: {
    deposits: [],
    auctionDeposits: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDeposits: (state) => {
      state.deposits = [];
      state.auctionDeposits = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllDeposits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDeposits.fulfilled, (state, action) => {
        state.loading = false;
        state.deposits = action.payload || [];
      })
      .addCase(fetchAllDeposits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDepositsByAuction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepositsByAuction.fulfilled, (state, action) => {
        state.loading = false;
        state.auctionDeposits = action.payload || [];
      })
      .addCase(fetchDepositsByAuction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDeposits } = depositSlice.actions;
export default depositSlice.reducer;