import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auctionService } from '../services/auctionService';

export const fetchAllAuctions = createAsyncThunk(
  'auction/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const auctions = await auctionService.getAllAuctions();
      return auctions;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAuctionById = createAsyncThunk(
  'auction/fetchById',
  async (auctionId, { rejectWithValue }) => {
    try {
      const auction = await auctionService.getAuctionById(auctionId);
      return auction;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAuction = createAsyncThunk(
  'auction/create',
  async ({ auctionData, photoFiles = [], userId }, { rejectWithValue }) => {
    try {
      const auction = await auctionService.createAuction(auctionData, photoFiles, userId);
      return auction;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAuction = createAsyncThunk(
  'auction/update',
  async ({ auctionId, auctionData }, { rejectWithValue }) => {
    try {
      const auction = await auctionService.updateAuction(auctionId, auctionData);
      return auction;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAuctionWithPhotos = createAsyncThunk(
  'auction/updateWithPhotos',
  async ({ auctionId, auctionData, photoFiles = [], removedPhotoIds = [] }, { rejectWithValue }) => {
    try {
      const auction = await auctionService.updateAuction(auctionId, auctionData, photoFiles, removedPhotoIds);
      return auction;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAuction = createAsyncThunk(
  'auction/delete',
  async (auctionId, { rejectWithValue }) => {
    try {
      await auctionService.deleteAuction(auctionId);
      return { auctionId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserAuctions = createAsyncThunk(
  'auction/fetchUserAuctions',
  async (userId, { rejectWithValue }) => {
    try {
      const auctions = await auctionService.getUserAuctions(userId);
      return auctions;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const updateExpiredStatus = (auction) => {
  if (!auction || !auction.expireDate) return auction;
  
  const now = new Date();
  const expiration = new Date(auction.expireDate);
  
  if (now >= expiration && auction.status !== 'ended') {
    return {
      ...auction,
      status: 'ended'
    };
  }
  
  return auction;
};

const auctionSlice = createSlice({
  name: 'auction',
  initialState: {
    auctions: [],
    userAuctions: [],
    currentAuction: null,
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  },
  reducers: {
    clearAuctions: (state) => {
      state.auctions = [];
      state.userAuctions = [];
      state.currentAuction = null;
      state.error = null;
    },
    clearCurrentAuction: (state) => {
      state.currentAuction = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllAuctions
      .addCase(fetchAllAuctions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAuctions.fulfilled, (state, action) => {
        state.loading = false;
        // Update expired status for all auctions
        state.auctions = (action.payload || []).map(updateExpiredStatus);
      })
      .addCase(fetchAllAuctions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchAuctionById
      .addCase(fetchAuctionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuctionById.fulfilled, (state, action) => {
        state.loading = false;
        // Update expired status for current auction
        state.currentAuction = updateExpiredStatus(action.payload);
      })
      .addCase(fetchAuctionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // createAuction
      .addCase(createAuction.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createAuction.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) {
          const auctionWithStatus = updateExpiredStatus(action.payload);
          state.auctions.unshift(auctionWithStatus);
          state.userAuctions.unshift(auctionWithStatus);
        }
      })
      .addCase(createAuction.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // updateAuction
      .addCase(updateAuction.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateAuction.fulfilled, (state, action) => {
        state.updating = false;
        if (action.payload) {
          const updatedAuction = updateExpiredStatus(action.payload);
          
          // Update in main auctions list
          const index = state.auctions.findIndex(a => a.id === updatedAuction.id);
          if (index !== -1) {
            state.auctions[index] = updatedAuction;
          }
          
          // Update in user auctions list
          const userIndex = state.userAuctions.findIndex(a => a.id === updatedAuction.id);
          if (userIndex !== -1) {
            state.userAuctions[userIndex] = updatedAuction;
          }
          
          // Update current auction if it's the same one
          if (state.currentAuction?.id === updatedAuction.id) {
            state.currentAuction = updatedAuction;
          }
        }
      })
      .addCase(updateAuction.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // updateAuctionWithPhotos
      .addCase(updateAuctionWithPhotos.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateAuctionWithPhotos.fulfilled, (state, action) => {
        state.updating = false;
        if (action.payload) {
          const updatedAuction = updateExpiredStatus(action.payload);
          
          // Update in main auctions list
          const index = state.auctions.findIndex(a => a.id === updatedAuction.id);
          if (index !== -1) {
            state.auctions[index] = updatedAuction;
          }
          
          // Update in user auctions list
          const userIndex = state.userAuctions.findIndex(a => a.id === updatedAuction.id);
          if (userIndex !== -1) {
            state.userAuctions[userIndex] = updatedAuction;
          }
          
          // Update current auction if it's the same one
          if (state.currentAuction?.id === updatedAuction.id) {
            state.currentAuction = updatedAuction;
          }
        }
      })
      .addCase(updateAuctionWithPhotos.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // deleteAuction
      .addCase(deleteAuction.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteAuction.fulfilled, (state, action) => {
        state.deleting = false;
        state.auctions = state.auctions.filter(a => a.id !== action.payload.auctionId);
        state.userAuctions = state.userAuctions.filter(a => a.id !== action.payload.auctionId);
      })
      .addCase(deleteAuction.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      })
      
      // fetchUserAuctions
      .addCase(fetchUserAuctions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAuctions.fulfilled, (state, action) => {
        state.loading = false;
        // Update expired status for user auctions
        state.userAuctions = (action.payload || []).map(updateExpiredStatus);
      })
      .addCase(fetchUserAuctions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAuctions, clearCurrentAuction, clearError } = auctionSlice.actions;
export default auctionSlice.reducer;