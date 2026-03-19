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

export const fetchAuctionsByStatus = createAsyncThunk(
  'auction/fetchByStatus',
  async (status, { rejectWithValue }) => {
    try {
      const auctions = await auctionService.getAuctionsByStatus(status);
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
  async ({ auctionId, auctionData, photoFiles = [], removedPhotoIds = [] }, { rejectWithValue }) => {
    try {
      const auction = await auctionService.updateAuction(auctionId, auctionData, photoFiles, removedPhotoIds);
      return auction;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const approveAuction = createAsyncThunk(
  'auction/approve',
  async ({ auctionId, adminId }, { rejectWithValue }) => {
    try {
      const auction = await auctionService.updateAuctionStatus(auctionId, adminId, 'active');
      return auction;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const denyAuction = createAsyncThunk(
  'auction/deny',
  async ({ auctionId, adminId }, { rejectWithValue }) => {
    try {
      const auction = await auctionService.updateAuctionStatus(auctionId, adminId, 'denied');
      return auction;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addReview = createAsyncThunk(
  'auction/addReview',
  async ({ auctionId, reviewerId, review }, { rejectWithValue }) => {
    try {
      await auctionService.addReview(auctionId, reviewerId, review);
      return { auctionId, reviewerId, review };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchReviews = createAsyncThunk(
  'auction/fetchReviews',
  async (auctionId, { rejectWithValue }) => {
    try {
      const reviews = await auctionService.getReviews(auctionId);
      return { auctionId, reviews };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const processWinner = createAsyncThunk(
  'auction/processWinner',
  async (auctionId, { rejectWithValue, dispatch }) => {
    try {
      console.log(`Calling processWinner endpoint for auction ${auctionId}`);
      
      // Call backend to process winner
      const response = await auctionService.processWinner(auctionId);
      console.log('Process winner response:', response);
      
      // Fetch the updated auction to get the new status
      const updatedAuction = await auctionService.getAuctionById(auctionId);
      console.log('Updated auction:', updatedAuction);
      
      return { auctionId, auction: updatedAuction };
    } catch (error) {
      console.error('Process winner error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return rejectWithValue(error.message || 'Failed to process winner');
    }
  }
);

export const placeBid = createAsyncThunk(
  'auction/placeBid',
  async ({ auctionId, bidderId, bidAmount }, { rejectWithValue }) => {
    try {
      const result = await auctionService.placeBid(auctionId, bidderId, bidAmount);
      return result;
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
  return auction;
};

const auctionSlice = createSlice({
  name: 'auction',
  initialState: {
    auctions: [],
    userAuctions: [],
    currentAuction: null,
    reviews: {},
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  },
  reducers: {
    updateAuctionInStore: (state, action) => {
      const updatedAuction = action.payload;
      
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
    },
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
      .addCase(fetchAllAuctions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAuctions.fulfilled, (state, action) => {
        state.loading = false;
        state.auctions = (action.payload || []).map(updateExpiredStatus);
      })
      .addCase(fetchAllAuctions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchAuctionsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuctionsByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.auctions = (action.payload || []).map(updateExpiredStatus);
      })
      .addCase(fetchAuctionsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchAuctionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuctionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAuction = updateExpiredStatus(action.payload);
      })
      .addCase(fetchAuctionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
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
      
      .addCase(updateAuction.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateAuction.fulfilled, (state, action) => {
        state.updating = false;
        if (action.payload) {
          const updatedAuction = updateExpiredStatus(action.payload);
          
          const index = state.auctions.findIndex(a => a.id === updatedAuction.id);
          if (index !== -1) {
            state.auctions[index] = updatedAuction;
          }
          
          const userIndex = state.userAuctions.findIndex(a => a.id === updatedAuction.id);
          if (userIndex !== -1) {
            state.userAuctions[userIndex] = updatedAuction;
          }
          
          if (state.currentAuction?.id === updatedAuction.id) {
            state.currentAuction = updatedAuction;
          }
        }
      })
      .addCase(updateAuction.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      .addCase(approveAuction.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(approveAuction.fulfilled, (state, action) => {
        state.updating = false;
        if (action.payload) {
          const updatedAuction = updateExpiredStatus(action.payload);
          
          const index = state.auctions.findIndex(a => a.id === updatedAuction.id);
          if (index !== -1) {
            state.auctions[index] = updatedAuction;
          }
          
          const userIndex = state.userAuctions.findIndex(a => a.id === updatedAuction.id);
          if (userIndex !== -1) {
            state.userAuctions[userIndex] = updatedAuction;
          }
          
          if (state.currentAuction?.id === updatedAuction.id) {
            state.currentAuction = updatedAuction;
          }
        }
      })
      .addCase(approveAuction.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      .addCase(denyAuction.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(denyAuction.fulfilled, (state, action) => {
        state.updating = false;
        if (action.payload) {
          const updatedAuction = updateExpiredStatus(action.payload);
          
          const index = state.auctions.findIndex(a => a.id === updatedAuction.id);
          if (index !== -1) {
            state.auctions[index] = updatedAuction;
          }
          
          const userIndex = state.userAuctions.findIndex(a => a.id === updatedAuction.id);
          if (userIndex !== -1) {
            state.userAuctions[userIndex] = updatedAuction;
          }
          
          if (state.currentAuction?.id === updatedAuction.id) {
            state.currentAuction = updatedAuction;
          }
        }
      })
      .addCase(denyAuction.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      .addCase(addReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchReviews.fulfilled, (state, action) => {
        const { auctionId, reviews } = action.payload;
        state.reviews[auctionId] = reviews;
      })
      
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
      
      .addCase(fetchUserAuctions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAuctions.fulfilled, (state, action) => {
        state.loading = false;
        state.userAuctions = (action.payload || []).map(updateExpiredStatus);
      })
      .addCase(fetchUserAuctions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(processWinner.fulfilled, (state, action) => {
        const { auctionId, auction } = action.payload;

        // Update in main auctions list
        const index = state.auctions.findIndex(a => a.id === auctionId);
        if (index !== -1) {
          state.auctions[index] = auction;
        }

        // Update in user auctions list
        const userIndex = state.userAuctions.findIndex(a => a.id === auctionId);
        if (userIndex !== -1) {
          state.userAuctions[userIndex] = auction;
        }

        // Update current auction if it's the same one
        if (state.currentAuction?.id === auctionId) {
          state.currentAuction = auction;
        }

        console.log(`Auction ${auctionId} marked as ended and winner processed`);
        
        // Trigger a notification refresh to get the new notification
        // This assumes you have a fetchNotifications function
        if (state.auth?.user?.id) {
          store.dispatch(fetchNotifications(state.auth.user.id));
        }
      });
  },
});

export const { clearAuctions, clearCurrentAuction, clearError, updateAuctionInStore } = auctionSlice.actions;
export default auctionSlice.reducer;