# Melodyx Launch Readiness Checklist

## App Store & Google Play Submission Guide

### Pre-Submission Checklist

#### 1. App Metadata ✓
- [x] App Name: "Melodyx: Daily Melody Puzzle & Music Learning"
- [x] Subtitle: "Guess Songs, Learn Music, Train Your Ear"
- [x] Short Description (80 chars max)
- [x] Full Description (4000 chars max)
- [x] Keywords (100 chars, comma-separated)
- [x] Categories: Games (Primary), Education (Secondary)
- [x] Age Rating: 4+ / Everyone
- [x] Support URL: https://melodyx.app/support
- [x] Marketing URL: https://melodyx.app
- [x] Privacy Policy URL: https://melodyx.app/privacy

#### 2. Visual Assets
- [ ] App Icon (1024x1024 PNG, no alpha)
- [ ] Screenshots (see specifications below)
- [ ] App Preview Video (optional, 15-30s)

##### Screenshot Requirements

**iOS (Required)**
| Device | Size | Quantity |
|--------|------|----------|
| iPhone 6.7" | 1290 x 2796 | 5-10 |
| iPhone 6.5" | 1242 x 2688 | 5-10 |
| iPhone 5.5" | 1242 x 2208 | 5-10 |
| iPad Pro 12.9" | 2048 x 2732 | 5-10 |

**Android (Required)**
| Type | Size | Quantity |
|------|------|----------|
| Phone | 1080 x 1920 | 4-8 |
| 7" Tablet | 1200 x 1920 | 4-8 |
| 10" Tablet | 1920 x 1200 | 4-8 |

##### Recommended Screenshot Scenes
1. Home screen with daily puzzle
2. Gameplay with piano keyboard
3. Win celebration with confetti
4. Learning mode with AI coach
5. Sound Fever endless mode
6. Shop with themes/instruments
7. Global leaderboards
8. Multiplayer duels
9. Eco mode carbon tracking
10. Wellness mode relaxation

#### 3. Localizations ✓
- [x] English (en)
- [x] Spanish (es)
- [x] French (fr)
- [x] German (de)
- [x] Japanese (ja)
- [x] Portuguese (pt)
- [x] Italian (it)
- [x] Korean (ko)
- [x] Chinese Simplified (zh)
- [x] Russian (ru)

#### 4. Legal Documents ✓
- [x] Privacy Policy (GDPR/CCPA compliant)
- [x] Terms of Service
- [x] App Review Notes

#### 5. In-App Purchases
| Product | Type | Price |
|---------|------|-------|
| Melodyx Premium Monthly | Auto-Renewable Sub | $4.99 |
| Melodyx Premium Yearly | Auto-Renewable Sub | $39.99 |
| Hint Pack (5) | Consumable | $0.99 |
| Hint Pack (20) | Consumable | $2.99 |
| Hint Pack (50) | Consumable | $4.99 |
| Neon Theme Pack | Non-Consumable | $1.99 |
| Premium Instruments | Non-Consumable | $3.99 |
| Carbon Offset (Small) | Consumable | $0.99 |
| Carbon Offset (Large) | Consumable | $4.99 |

---

### iOS App Store Submission

#### Build Configuration
```json
{
  "ios": {
    "bundleIdentifier": "app.rork.melodyx-puzzle",
    "buildNumber": "1",
    "supportsTablet": true,
    "infoPlist": {
      "NSMicrophoneUsageDescription": "Melodyx uses your microphone for voice-based melody input and pitch detection in learning mode.",
      "NSCameraUsageDescription": "Melodyx uses your camera for AR music visualizations and sharing features.",
      "NSHealthShareUsageDescription": "Melodyx reads mindfulness minutes to sync with your wellness goals.",
      "ITSAppUsesNonExemptEncryption": false
    }
  }
}
```

#### App Store Connect Steps
1. Create new app in App Store Connect
2. Enter all metadata and descriptions
3. Upload screenshots for all device sizes
4. Configure In-App Purchases in App Store Connect
5. Submit App Privacy questionnaire
6. Upload build via Transporter or Xcode
7. Select build for review
8. Submit for review

#### Common Rejection Reasons & Fixes
| Issue | Fix |
|-------|-----|
| Guideline 2.1 - App Completeness | Ensure all features work, no placeholder content |
| Guideline 2.3 - Accurate Metadata | Screenshots match actual app functionality |
| Guideline 3.1.1 - In-App Purchase | Restore purchases button visible, IAP labels clear |
| Guideline 4.2 - Minimum Functionality | App provides meaningful, unique functionality |
| Guideline 5.1.1 - Data Collection | Privacy policy accessible, data usage disclosed |

---

### Google Play Store Submission

#### Build Configuration
```json
{
  "android": {
    "package": "app.rork.melodyx_puzzle",
    "versionCode": 1,
    "permissions": [
      "android.permission.VIBRATE",
      "android.permission.RECORD_AUDIO",
      "android.permission.INTERNET"
    ]
  }
}
```

#### Play Console Steps
1. Create new app in Google Play Console
2. Complete Store Listing (all languages)
3. Upload screenshots and graphics
4. Complete Content Rating questionnaire
5. Set pricing and distribution
6. Configure In-App Products
7. Upload AAB (Android App Bundle)
8. Create release and submit for review

#### Required Graphics
- Hi-res Icon: 512 x 512 PNG
- Feature Graphic: 1024 x 500 PNG
- Phone Screenshots: Min 2, Max 8
- Tablet Screenshots: Min 1

#### Data Safety Declaration
- Data collected: Gameplay stats, account info (optional)
- Data shared: None
- Data encrypted: Yes (in transit and at rest)
- Data deletion: Available via account deletion

---

### Testing Checklist

#### Functional Testing
- [ ] Daily puzzle loads correctly
- [ ] All game modes functional
- [ ] Audio playback without issues
- [ ] Haptic feedback working
- [ ] Offline mode functional
- [ ] Cloud sync working
- [ ] Push notifications delivered
- [ ] All IAP products purchasable
- [ ] Restore purchases works
- [ ] Share functionality works
- [ ] All 10 languages display correctly

#### Performance Testing
- [ ] 60 FPS maintained on target devices
- [ ] App launch < 3 seconds
- [ ] No memory leaks after extended play
- [ ] Battery usage reasonable
- [ ] Network usage optimized

#### Accessibility Testing
- [ ] VoiceOver/TalkBack compatible
- [ ] High contrast mode functional
- [ ] Dynamic text scaling works
- [ ] All interactive elements have labels
- [ ] Color-blind friendly indicators

#### Device Testing
- [ ] iPhone SE (smallest iOS)
- [ ] iPhone 15 Pro Max (largest iOS)
- [ ] iPad Pro
- [ ] Android low-end (2GB RAM)
- [ ] Android high-end (flagship)
- [ ] Android tablet

---

### Post-Launch Checklist

#### Day 1
- [ ] Monitor crash reports (Sentry)
- [ ] Check App Store reviews
- [ ] Verify IAP working in production
- [ ] Test daily puzzle delivery
- [ ] Announce on social media

#### Week 1
- [ ] Respond to user reviews
- [ ] Analyze retention metrics
- [ ] Monitor server performance
- [ ] Prepare hotfix if needed
- [ ] ASO optimization based on data

#### Month 1
- [ ] Feature usage analytics review
- [ ] Plan first content update
- [ ] Community engagement strategy
- [ ] Influencer outreach
- [ ] Performance optimization pass

---

### Contact Information

- **Support Email**: support@melodyx.app
- **Legal Email**: legal@melodyx.app
- **Privacy Email**: privacy@melodyx.app
- **Marketing**: marketing@melodyx.app

---

### Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | Jan 2026 | Initial release |

---

*Last Updated: January 11, 2026*
