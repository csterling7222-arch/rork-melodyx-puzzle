# Melodyx Deployment Guide

## Pre-Submission Checklist

### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Console logs removed or minimized for production
- [ ] Error boundaries in place
- [ ] Offline functionality tested

### 2. Assets Required
- [ ] App icon (1024x1024 PNG, no transparency)
- [ ] Adaptive icon for Android (foreground + background)
- [ ] Splash screen image
- [ ] Screenshots for all device sizes
- [ ] App preview video (optional but recommended)

### 3. RevenueCat Setup
1. Create app in RevenueCat dashboard
2. Configure products:
   - `premium_monthly` - $4.99/month subscription
   - `hints_5_pack` - $0.99 consumable
   - `hints_15_pack` - $2.99 consumable
   - `hints_50_pack` - $4.99 consumable
   - Keyboard skins - $1.99-$3.99 non-consumable
3. Set up entitlements: `premium`, `ad_free`
4. Add API keys to environment variables

### 4. Environment Variables
```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_key
```

---

## iOS App Store Submission

### Step 1: Apple Developer Setup
1. Enroll in Apple Developer Program ($99/year)
2. Create App ID in Certificates, Identifiers & Profiles
3. Bundle ID: `app.melodyx.puzzle`

### Step 2: App Store Connect
1. Create new app in App Store Connect
2. Fill in app information:
   - **Name**: Melodyx: Daily Melody Puzzle
   - **Subtitle**: Guess Tunes Like Wordle
   - **Category**: Games > Puzzle
   - **Age Rating**: 4+
3. Add localizations (EN, ES, FR, JA, DE)

### Step 3: In-App Purchases
1. Create subscription group: "Melodyx Premium"
2. Add products matching RevenueCat configuration
3. Submit for review along with app

### Step 4: App Privacy
Configure App Privacy in App Store Connect:
- **Data Not Collected**: We minimize data collection
- **Data Linked to You**: None
- **Data Not Linked to You**: 
  - Usage Data (Analytics)
  - Diagnostics (Crash Data)

### Step 5: Build & Submit
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Create production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Step 6: Review Notes
Include in App Store Connect:
- Demo instructions (no account needed)
- Music licensing explanation (public domain/original)
- IAP testing information

---

## Google Play Store Submission

### Step 1: Google Play Console Setup
1. Create developer account ($25 one-time)
2. Create new application
3. Package name: `app.melodyx.puzzle`

### Step 2: Store Listing
1. Fill in store listing:
   - **Title**: Melodyx: Daily Melody Puzzle
   - **Short description**: (80 chars max)
   - **Full description**: (4000 chars max)
2. Add graphics:
   - Feature graphic (1024x500)
   - Screenshots (min 2, max 8 per type)
   - App icon (512x512)

### Step 3: Content Rating
1. Complete questionnaire
2. Expected rating: PEGI 3 / Everyone

### Step 4: In-App Products
1. Create products in Google Play Console
2. Match RevenueCat product IDs
3. Set up subscription pricing

### Step 5: Build & Submit
```bash
# Create production build (AAB)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### Step 6: Release Tracks
1. Start with Internal testing
2. Graduate to Closed testing (beta)
3. Open testing (optional)
4. Production release

---

## Testing Checklist

### Functional Testing
- [ ] Daily puzzle loads correctly
- [ ] Sound plays for all notes
- [ ] Haptic feedback works
- [ ] Streak tracking accurate
- [ ] Share functionality works
- [ ] All game modes accessible
- [ ] Leaderboard updates
- [ ] Achievements unlock properly

### IAP Testing
- [ ] Products load in shop
- [ ] Subscription purchase flow
- [ ] Consumable purchase flow
- [ ] Restore purchases works
- [ ] Entitlements apply correctly

### Offline Testing
- [ ] App launches offline
- [ ] Campaign mode playable offline
- [ ] Local data persists
- [ ] Sync works when online

### Accessibility Testing
- [ ] VoiceOver/TalkBack navigation
- [ ] High contrast mode readable
- [ ] Dynamic type respected
- [ ] Haptic feedback fallbacks

### Performance Testing
- [ ] 60 FPS during gameplay
- [ ] No memory leaks
- [ ] Fast app launch (<3s)
- [ ] Smooth animations

---

## Post-Launch Monitoring

### Analytics Events to Track
- `app_open` - App launches
- `puzzle_start` - Puzzle begins
- `puzzle_complete` - Puzzle finished
- `puzzle_share` - Results shared
- `mode_selected` - Game mode chosen
- `purchase_started` - IAP initiated
- `purchase_completed` - IAP successful
- `achievement_unlocked` - Achievement earned

### Key Metrics
- Daily Active Users (DAU)
- Retention (D1, D7, D30)
- Conversion rate (free to premium)
- Average session length
- Puzzle completion rate

### Crash Monitoring
- Configure crash reporting
- Monitor crash-free rate (target: >99.5%)
- Address critical issues within 24 hours

---

## Version Update Process

1. Update version in app.json
2. Update `whatsNew` in storeMetadata.ts
3. Build new version: `eas build --platform all`
4. Submit for review
5. Monitor rollout

---

## Support Resources

- **Technical Support**: support@melodyx.app
- **Privacy Inquiries**: privacy@melodyx.app
- **Legal**: legal@melodyx.app
- **Press Kit**: https://melodyx.app/press
