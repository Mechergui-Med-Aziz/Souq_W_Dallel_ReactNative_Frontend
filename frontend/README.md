# Souq w Dallel — Frontend

**Souq w Dallel** (سوق و دلال) is a cross-platform online auction marketplace built with React Native and Expo. Users can create auctions, place bids, manage parcels, and handle payments — all from a single codebase that runs on Android, iOS, and Web.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Features](#features)
- [Role-Based Access](#role-based-access)
- [Theme System](#theme-system)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Payment Integration (Stripe)](#payment-integration-stripe)
- [Cross-Platform Utilities](#cross-platform-utilities)
- [Reusable Components](#reusable-components)
- [Environment Configuration](#environment-configuration)

---

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | React Native + Expo | 0.81.5 / SDK 54 |
| **Routing** | Expo Router (file-based) | 6.x |
| **State Management** | Redux Toolkit + Redux Persist | 2.x / 6.x |
| **HTTP Client** | Axios | 1.x |
| **Payments** | Stripe (native + web) | stripe-react-native 0.50 / react-stripe-js 3.x |
| **UI Icons** | @expo/vector-icons (Ionicons) | 15.x |
| **Gradients** | expo-linear-gradient | 15.x |
| **Charts** | react-native-chart-kit | 6.x |
| **Image Picker** | expo-image-picker | 17.x |
| **Storage** | AsyncStorage | 2.x |
| **Animations** | react-native-reanimated | 4.x |
| **Date Utils** | date-fns | 4.x |
| **Web Support** | react-native-web | 0.21.x |

---

## Project Structure

```
frontend/
├── app/                          # Expo Router — file-based routes
│   ├── _layout.jsx               # Root layout (providers, tab navigation)
│   ├── index.jsx                 # Home page (auction grid + sidebars)
│   ├── create-auction.jsx        # Auction creation form
│   ├── verify-account.jsx        # Email verification page
│   ├── reset-password.jsx        # Password reset (email + CIN)
│   ├── reset-password-verify.jsx # Reset verification code page
│   │
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.jsx
│   │   ├── login.jsx
│   │   └── register.jsx
│   │
│   ├── (dashboard)/              # User dashboard group
│   │   ├── profile.jsx           # User profile + photo upload
│   │   ├── edit-profile.jsx      # Edit profile fields
│   │   ├── my-auctions.jsx       # User's created/won auctions
│   │   ├── my-parcels.jsx        # User's parcels list
│   │   └── notifications.jsx     # Notification center
│   │
│   ├── (admin)/                  # Admin dashboard group
│   │   ├── _layout.jsx
│   │   └── dashboard.jsx         # Full admin panel (auctions, users, parcels, stats)
│   │
│   ├── (transporter)/            # Transporter group
│   │   ├── home.jsx              # Transporter dashboard
│   │   └── parcels.jsx           # Assigned parcels management
│   │
│   ├── auction-details/
│   │   └── [id].jsx              # Dynamic auction details page
│   │
│   ├── edit-auction/
│   │   └── [id].jsx              # Dynamic auction editing page
│   │
│   └── parcel-details/
│       └── [id].jsx              # Dynamic parcel details page
│
├── components/                   # Reusable UI components
│   ├── ThemedView.jsx            # Theme-aware View wrapper
│   ├── ThemedText.jsx            # Theme-aware Text wrapper
│   ├── ThemedCard.jsx            # Theme-aware Card with elevation
│   ├── ThemedButton.jsx          # Theme-aware Button
│   ├── ThemedTextInput.jsx       # Theme-aware TextInput
│   ├── ThemedLogo.jsx            # App logo component
│   ├── ThemedLoader.jsx          # Loading indicator
│   ├── Spacer.jsx                # Layout spacing helper
│   ├── AuctionCard.jsx           # Auction grid card
│   ├── AuctionFilters.jsx        # Category/status filters
│   ├── LeftSidebar.jsx           # Navigation sidebar (desktop)
│   ├── RightSidebar.jsx          # Info sidebar (desktop)
│   ├── PaymentModal.jsx          # 1 TND bid deposit payment
│   └── AuctionPaymentModal.jsx   # Winner auction payment
│
├── constants/
│   ├── Colors.js                 # Light/dark color tokens
│   ├── ThemeContext.js           # Theme provider + useTheme hook
│   └── api.js                    # API base URL + endpoint definitions
│
├── store/                        # Redux state management
│   ├── index.js                  # Store configuration + persist setup
│   ├── initAuth.js               # Auth initialization helper
│   ├── slices/                   # Redux Toolkit slices
│   │   ├── authSlice.js          # Auth state (login, register, logout)
│   │   ├── userSlice.js          # User profile CRUD
│   │   ├── auctionSlice.js       # Auction CRUD + bidding
│   │   ├── parcelSlice.js        # Parcel management
│   │   ├── notificationSlice.js  # Notifications
│   │   ├── paymentSlice.js       # Payment state
│   │   ├── depositSlice.js       # Auction deposits
│   │   └── reviewSlice.js        # Auction reviews
│   │
│   └── services/                 # API service layer
│       ├── authService.js        # Auth API calls
│       ├── userService.js        # User API calls
│       ├── auctionService.js     # Auction API calls
│       ├── parcelService.js      # Parcel API calls
│       ├── paymentService.js     # Stripe payment API calls
│       ├── depositService.js     # Deposit API calls
│       ├── notificationService.js# Notification API calls
│       ├── reviewService.js      # Review API calls
│       └── expirationService.js  # Auction auto-expiration checker
│
├── hooks/
│   ├── useAuth.js                # Auth hook (login, register, logout)
│   └── useAppDispatch.js         # Typed Redux dispatch/selector
│
├── lib/
│   ├── axios.js                  # Axios instance + interceptors
│   └── stripe/
│       ├── index.js              # Stripe exports (native: Android/iOS)
│       └── index.web.js          # Stripe exports (web: browser)
│
├── utils/
│   ├── alertHelper.js            # Cross-platform alert/confirm dialogs
│   └── auctionUtils.js           # Auction helper functions
│
├── assets/                       # Static assets (icons, splash)
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── babel.config.js               # Babel configuration
└── metro.config.js               # Metro bundler configuration
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    UI Layer                      │
│   (Pages in app/, Components in components/)     │
│                                                  │
│   useTheme() ─── ThemeContext ─── Colors.js      │
│   useAuth()  ─── hooks/useAuth.js                │
└─────────────┬───────────────────────────────────┘
              │ dispatch(action) / useAppSelector()
              ▼
┌─────────────────────────────────────────────────┐
│              State Layer (Redux)                 │
│   store/slices/ ── createAsyncThunk actions      │
│   Persisted: auth, payment (AsyncStorage)        │
└─────────────┬───────────────────────────────────┘
              │ calls service functions
              ▼
┌─────────────────────────────────────────────────┐
│             Service Layer                        │
│   store/services/ ── business logic + API calls  │
└─────────────┬───────────────────────────────────┘
              │ axiosInstance.get/post/put/delete
              ▼
┌─────────────────────────────────────────────────┐
│            HTTP Layer (Axios)                    │
│   lib/axios.js ── base URL, token interceptor    │
│   constants/api.js ── endpoint URL builders      │
└─────────────┬───────────────────────────────────┘
              │ HTTP requests
              ▼
┌─────────────────────────────────────────────────┐
│          Spring Boot Backend API                 │
│   http://<host>:8080/api/...                     │
└─────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- **Expo CLI** (`npx expo`)
- **Android Studio** (for Android emulator) or a physical device with Expo Go
- **Backend server** running on Spring Boot (default: `http://192.168.1.6:8080`)

### Installation

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure the backend URL
#    Edit constants/api.js and set API_BASE_URL to your backend IP
#    Example: export const API_BASE_URL = "http://192.168.1.6:8080";

# 4. Configure Stripe publishable key
#    Edit app/_layout.jsx and set the publishableKey prop in <StripeProvider>
```

### Running

```bash
# Start on all platforms (opens Expo dev tools)
npm start

# Start on web only
npm run web
# or
npx expo start --web

# Start on Android
npm run android
# or
npx expo run:android

# Start on iOS
npm run ios
```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `expo start` | Start the Expo dev server |
| `android` | `expo run:android` | Build and run on Android |
| `ios` | `expo run:ios` | Build and run on iOS |
| `web` | `expo start --web` | Start in web browser |

---

## Features

### User Features
- **Account Management** — Register, login, email verification, password reset
- **Auction Browsing** — Browse, filter by category, search auctions
- **Auction Creation** — Create auctions with photos, pricing, expiration dates
- **Bidding** — Place bids with 1 TND deposit via Stripe
- **Auction Winning** — Pay final amount, auto-parcel creation
- **Reviews** — Add/edit/delete reviews on auctions
- **Parcel Tracking** — Track won auction parcels delivery status
- **Quality Check** — Report parcel quality issues
- **Notifications** — Real-time bid alerts, auction wins, system messages
- **Profile Management** — Edit profile, upload photo
- **Dark/Light Mode** — Toggle theme with persistent preference

### Admin Features
- **Dashboard** — Statistics, charts, revenue overview
- **Auction Moderation** — Approve/deny pending auctions
- **User Management** — Block/unblock users, role assignment
- **Parcel Management** — Assign transporters, set addresses
- **Transporter Management** — Promote/demote transporter role
- **Notification Center** — Admin-specific alerts

### Transporter Features
- **Parcel Dashboard** — View assigned parcels
- **Delivery Confirmation** — Mark parcels as delivered
- **Status Tracking** — Real-time delivery progress

---

## Role-Based Access

The app routes users based on their role after login:

| Role | Redirect | Main Pages |
|---|---|---|
| **User** | `index.jsx` (Home) | Browse auctions, bid, profile, my-auctions, my-parcels |
| **Admin** | `(admin)/dashboard.jsx` | Full admin panel |
| **Transporter** | `(transporter)/home.jsx` | Transporter dashboard + parcels |

Role-based routing is handled in `app/_layout.jsx` → `AppContent()`.

---

## Theme System

### How It Works

1. **`Colors.js`** defines color tokens for `light` and `dark` themes
2. **`ThemeContext.js`** provides the current theme via React Context
3. **Themed components** (`ThemedView`, `ThemedText`, etc.) auto-resolve colors
4. **`toggleTheme()`** switches between light ↔ dark and persists to AsyncStorage

### Usage in Components

```jsx
import { useTheme } from '../constants/ThemeContext';
import { Colors } from '../constants/Colors';

function MyComponent() {
  const { colorScheme, toggleTheme, isDark } = useTheme();
  const theme = Colors[colorScheme]; // resolved theme tokens

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Hello</Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Ionicons name={isDark ? 'sunny' : 'moon'} />
      </TouchableOpacity>
    </View>
  );
}
```

### Available Color Tokens

| Token | Light | Dark |
|---|---|---|
| `background` | `#ffffff` | `#252231` |
| `text` | `#625f72` | `#a8a4b8` |
| `title` | `#201e2b` | `#fff` |
| `cardBackground` | `#ffffff` | `#343049` |
| `navBackground` | `#edecf3` | `#1b1a24` |
| `borderColor` | `#e8e7ed` | `#3d3852` |
| `inputBackground` | `#f5f5f5` | `#2f2b3d` |

---

## State Management

### Redux Store Structure

```
store
├── auth       (persisted) — token, user, loading, error
├── user                   — userData, allUsers
├── auction                — auctions list, currentAuction, bidding state
├── parcel                 — parcels list, currentParcel
├── notifications          — notifications list, unreadCount
├── payment    (persisted) — clientSecret
├── deposit                — deposits list
└── reviews                — auction reviews
```

### Data Flow

```
UI Event → dispatch(asyncThunkAction(args))
        → Slice thunk calls serviceFunction(args)
        → Service calls axiosInstance.post(API_ENDPOINT)
        → Backend responds
        → Thunk returns payload
        → Slice reducer updates state
        → UI re-renders via useAppSelector()
```

### Example: Placing a Bid

```
1. User clicks "Enchérir" button
2. → dispatch(placeBid({ auctionId, bidderId, bidAmount }))
3. → auctionSlice thunk calls auctionService.placeBid(...)
4. → axiosInstance.put(API_ENDPOINTS.PLACE_BID(auctionId, bidderId, bidAmount))
5. → Backend processes bid, returns updated auction
6. → Slice updates currentAuction in state
7. → UI shows updated bid amount
```

---

## API Layer

### Configuration

- **Base URL**: `constants/api.js` → `API_BASE_URL`
- **Axios Instance**: `lib/axios.js` — auto-attaches JWT token, handles 401 errors
- **Endpoints**: `constants/api.js` → `API_ENDPOINTS` object with URL builder functions

### Service Files

| Service | File | Responsibility |
|---|---|---|
| Auth | `authService.js` | Login, register, verify, password reset |
| User | `userService.js` | Profile CRUD, photo upload, role management |
| Auction | `auctionService.js` | Auction CRUD, bidding, photo retrieval |
| Parcel | `parcelService.js` | Parcel CRUD, quality check, delivery |
| Payment | `paymentService.js` | Stripe payment intents |
| Deposit | `depositService.js` | Bid deposits tracking |
| Notification | `notificationService.js` | User notifications |
| Review | `reviewService.js` | Auction reviews CRUD |
| Expiration | `expirationService.js` | Auto-expire ended auctions |

---

## Payment Integration (Stripe)

### Cross-Platform Setup

Stripe uses **platform-specific modules** via Metro's module resolution:

| Platform | File | Library |
|---|---|---|
| Android/iOS | `lib/stripe/index.js` | `@stripe/stripe-react-native` |
| Web | `lib/stripe/index.web.js` | `@stripe/react-stripe-js` + `@stripe/stripe-js` |

Both export the **same API**: `StripeProvider`, `CardField`, `useStripe`.

Components import from a single path:
```jsx
import { StripeProvider, CardField, useStripe } from '../lib/stripe';
```

Metro automatically resolves `index.js` vs `index.web.js` based on the target platform.

### Payment Flows

**1. Bid Deposit (1 TND)**
```
User clicks "Enchérir" → PaymentModal opens
→ paymentService.createPaymentIntent() → POST /api/payment/pay1dt
→ Stripe CardField → confirmPayment(clientSecret)
→ User can now place bids
```

**2. Auction Creation Fee**
```
Seller creates auction → AuctionPaymentModal (isCreationFee=true)
→ paymentService.payCreationFees(auctionId, amountInMillimes)
→ POST /api/payment/payCreationAuctionFees/{auctionId}/{amount}
→ Auction status → "pending" (awaiting admin approval)
```

**3. Winner Final Payment**
```
Winner clicks "Payer" → AuctionPaymentModal (isCreationFee=false)
→ paymentService.payAuction(auctionId, amount)
→ POST /api/payment/payAuction/{auctionId}/{amount}
→ Backend: marks auction.isPaid=true + creates Parcel
```

---

## Cross-Platform Utilities

### Alert Helper (`utils/alertHelper.js`)

React Native's `Alert.alert()` doesn't support callback buttons on web. This utility provides:

| Function | Web | Native |
|---|---|---|
| `showAlert(title, msg)` | `window.alert()` | `Alert.alert()` |
| `confirmDialog(title, msg, onConfirm)` | `window.confirm()` | `Alert.alert()` with buttons |

```jsx
import { showAlert, confirmDialog } from '../utils/alertHelper';

showAlert('Succès', 'Opération réussie');

confirmDialog('Supprimer', 'Êtes-vous sûr ?', () => {
  // onConfirm callback
});
```

---

## Reusable Components

| Component | Purpose |
|---|---|
| `ThemedView` | View with theme background + optional SafeAreaView |
| `ThemedText` | Text with theme colors (regular or title variant) |
| `ThemedCard` | Card container with theme background, border, optional elevation |
| `ThemedButton` | Styled button with primary color |
| `ThemedTextInput` | TextInput with theme-aware background and text colors |
| `ThemedLoader` | Centered loading spinner |
| `ThemedLogo` | App logo display |
| `Spacer` | Fixed-height spacing element |
| `AuctionCard` | Auction preview card with image, price, timer, category |
| `AuctionFilters` | Category filter bar for auction list |
| `LeftSidebar` | Navigation sidebar (desktop layout) |
| `RightSidebar` | Info/stats sidebar (desktop layout) |
| `PaymentModal` | Stripe card form for bid deposit (1 TND) |
| `AuctionPaymentModal` | Stripe card form for creation fees or winner payment |

---

## Environment Configuration

| Setting | File | Description |
|---|---|---|
| Backend URL | `constants/api.js` | `API_BASE_URL` — set to your backend's IP:port |
| Stripe Key | `app/_layout.jsx` | `publishableKey` prop in `<StripeProvider>` |
| App Name | `app.json` | `expo.name` — "Souq w Dallel" |
| Bundle ID | `app.json` | `android.package` / `ios.bundleIdentifier` |

---

## Backend Requirements

This frontend connects to a **Spring Boot** backend with:

- **MongoDB** for data storage (users, auctions, parcels, notifications)
- **GridFS** for photo storage
- **Stripe API** for payment processing
- **Email service** for verification codes and notifications

Default backend URL: `http://192.168.1.6:8080`

---

## License

This project is private and not licensed for redistribution.
