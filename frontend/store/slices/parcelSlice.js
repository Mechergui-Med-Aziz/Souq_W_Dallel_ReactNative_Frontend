import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { parcelService } from '../services/parcelService';

export const fetchAllParcels = createAsyncThunk(
  'parcel/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const parcels = await parcelService.getAllParcels();
      return parcels;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchParcelsByAdmin = createAsyncThunk(
  'parcel/fetchByAdmin',
  async (adminId, { rejectWithValue }) => {
    try {
      console.log('Fetching parcels for admin:', adminId);
      const parcels = await parcelService.getParcelsByAdmin(adminId);
      console.log('Parcels received:', parcels);
      return parcels || [];
    } catch (error) {
      console.error('Error in fetchParcelsByAdmin:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchParcelsByTransporter = createAsyncThunk(
  'parcel/fetchByTransporter',
  async (transporterId, { rejectWithValue }) => {
    try {
      const parcels = await parcelService.getParcelsByTransporter(transporterId);
      return parcels;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchParcelsByBuyer = createAsyncThunk(
  'parcel/fetchByBuyer',
  async (buyerId, { rejectWithValue }) => {
    try {
      const parcels = await parcelService.getParcelsByBuyer(buyerId);
      return parcels;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchParcelById = createAsyncThunk(
  'parcel/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const parcel = await parcelService.getParcelById(id);
      return parcel;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateParcelQuality = createAsyncThunk(
  'parcel/updateQuality',
  async ({ id, isValid, description }, { rejectWithValue }) => {
    try {
      const parcel = await parcelService.updateParcelQuality(id, isValid, description);
      return parcel;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deliverParcel = createAsyncThunk(
  'parcel/deliver',
  async (id, { rejectWithValue }) => {
    try {
      const parcel = await parcelService.deliverParcel(id);
      return parcel;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const assignTransporter = createAsyncThunk(
  'parcel/assignTransporter',
  async ({ id, transporterId }, { rejectWithValue }) => {
    try {
      const parcel = await parcelService.assignTransporter(id, transporterId);
      return parcel;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateParcel = createAsyncThunk(
  'parcel/update',
  async ({ id, parcelData }, { rejectWithValue }) => {
    try {
      const parcel = await parcelService.updateParcel(id, parcelData);
      return parcel;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const parcelSlice = createSlice({
  name: 'parcel',
  initialState: {
    parcels: [],
    adminParcels: [],
    transporterParcels: [],
    buyerParcels: [],
    currentParcel: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearParcels: (state) => {
      state.parcels = [];
      state.adminParcels = [];
      state.transporterParcels = [];
      state.buyerParcels = [];
      state.currentParcel = null;
    },
    clearCurrentParcel: (state) => {
      state.currentParcel = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllParcels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllParcels.fulfilled, (state, action) => {
        state.loading = false;
        state.parcels = action.payload || [];
      })
      .addCase(fetchAllParcels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchParcelsByAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParcelsByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.adminParcels = action.payload || [];
      })
      .addCase(fetchParcelsByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchParcelsByTransporter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParcelsByTransporter.fulfilled, (state, action) => {
        state.loading = false;
        state.transporterParcels = action.payload || [];
      })
      .addCase(fetchParcelsByTransporter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchParcelsByBuyer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParcelsByBuyer.fulfilled, (state, action) => {
        state.loading = false;
        state.buyerParcels = action.payload || [];
      })
      .addCase(fetchParcelsByBuyer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchParcelById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParcelById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentParcel = action.payload;
      })
      .addCase(fetchParcelById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateParcelQuality.fulfilled, (state, action) => {
        const updatedParcel = action.payload;
        if (updatedParcel) {
          const updateList = (list) => list.map(p => p.id === updatedParcel.id ? updatedParcel : p);
          state.parcels = updateList(state.parcels);
          state.adminParcels = updateList(state.adminParcels);
          state.transporterParcels = updateList(state.transporterParcels);
          state.buyerParcels = updateList(state.buyerParcels);
          if (state.currentParcel?.id === updatedParcel.id) {
            state.currentParcel = updatedParcel;
          }
        }
      })
      .addCase(deliverParcel.fulfilled, (state, action) => {
        const updatedParcel = action.payload;
        if (updatedParcel) {
          const updateList = (list) => list.map(p => p.id === updatedParcel.id ? updatedParcel : p);
          state.parcels = updateList(state.parcels);
          state.adminParcels = updateList(state.adminParcels);
          state.transporterParcels = updateList(state.transporterParcels);
          state.buyerParcels = updateList(state.buyerParcels);
          if (state.currentParcel?.id === updatedParcel.id) {
            state.currentParcel = updatedParcel;
          }
        }
      })
      .addCase(assignTransporter.fulfilled, (state, action) => {
        const updatedParcel = action.payload;
        if (updatedParcel) {
          const updateList = (list) => list.map(p => p.id === updatedParcel.id ? updatedParcel : p);
          state.parcels = updateList(state.parcels);
          state.adminParcels = updateList(state.adminParcels);
          state.transporterParcels = updateList(state.transporterParcels);
          if (state.currentParcel?.id === updatedParcel.id) {
            state.currentParcel = updatedParcel;
          }
        }
      });
  },
});

export const { clearParcels, clearCurrentParcel } = parcelSlice.actions;
export default parcelSlice.reducer;