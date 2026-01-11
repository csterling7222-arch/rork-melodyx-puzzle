# Melodyx Beta Testing Guide

## Overview

This guide covers beta testing procedures for Melodyx using TestFlight (iOS) and Internal Testing (Android). Target: 100 beta testers across platforms.

## Pre-Launch Checklist

### Technical Requirements
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] 60FPS performance on target devices
- [ ] Offline mode functional
- [ ] Audio playback glitch-free
- [ ] Premium purchases working via RevenueCat
- [ ] Error tracking (Sentry-style) configured
- [ ] Analytics events firing correctly

### Content Requirements
- [ ] 500+ songs in library
- [ ] All instruments functional
- [ ] Learning curricula complete
- [ ] Shop items configured
- [ ] Localization verified (10 languages)

## iOS TestFlight Setup

### 1. Build Configuration
```bash
# Ensure app.json has correct bundle identifier
# Build for TestFlight
eas build --platform ios --profile preview
```

### 2. TestFlight Upload
1. Log into App Store Connect
2. Navigate to TestFlight section
3. Upload build via Transporter or EAS
4. Wait for processing (~30 min)
5. Add beta testers via email

### 3. Tester Groups
- **Internal Team**: 5-10 developers/QA
- **External Beta**: 90-95 users
  - Music enthusiasts
  - Puzzle game players
  - Mix of demographics

### 4. TestFlight Feedback
- Enable screenshot feedback
- Monitor crash reports
- Review user feedback daily

## Android Internal Testing

### 1. Build Configuration
```bash
# Build for internal testing
eas build --platform android --profile preview
```

### 2. Play Console Setup
1. Log into Google Play Console
2. Navigate to Testing > Internal Testing
3. Upload AAB file
4. Create tester list (email addresses)
5. Share opt-in link with testers

### 3. Staged Rollout
- Week 1: 20% of testers
- Week 2: 50% of testers
- Week 3: 100% of testers

## Testing Scenarios

### Core Gameplay
| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Daily Puzzle | Open app, play daily | Complete 6-guess game |
| Win Flow | Guess correctly | Confetti, modal, stats update |
| Lose Flow | Use all guesses | Reveal answer, share option |
| Streak | Win consecutive days | Streak counter increments |

### Audio System
| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Note Preview | Tap piano key | Sound plays immediately |
| Melody Play | Complete game, tap play | Full melody plays |
| Instrument Switch | Change instrument | Notes use new sound |
| Audio Hint | Use audio hint | First 3 notes play |

### Learning Mode
| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Start Lesson | Select curriculum, lesson | Audio plays, UI ready |
| Submit Attempt | Play notes, submit | Accuracy calculated |
| Complete Lesson | Achieve required accuracy | XP awarded, progress saved |
| AI Coach | Complete with AI enabled | Feedback generated |

### Purchases
| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| View Products | Open shop | Products load from RevenueCat |
| Purchase Flow | Tap buy button | Native payment sheet appears |
| Restore | Tap restore | Previous purchases restored |
| Premium Access | Purchase premium | Features unlock immediately |

### Offline Mode
| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Airplane Mode | Enable, play daily | Game works offline |
| Sync Resume | Reconnect | Stats sync to cloud |
| Cached Audio | Play offline | Pre-cached sounds work |

### Performance
| Test Case | Target | Tool |
|-----------|--------|------|
| FPS | 60 FPS sustained | Performance Monitor |
| Launch Time | <3 seconds | Stopwatch |
| Memory | <200MB | Device settings |
| Battery | <5%/hour active use | Battery monitor |

## Device Matrix

### iOS Devices
- iPhone 12 (baseline)
- iPhone 13/14/15 Pro
- iPhone SE (3rd gen)
- iPad Air/Pro

### Android Devices
- Pixel 6/7/8
- Samsung Galaxy S21/S22/S23
- OnePlus 9/10
- Mid-range: Samsung A53, Pixel 6a

## Bug Reporting Template

```markdown
## Bug Report

**Device**: [e.g., iPhone 14 Pro]
**OS Version**: [e.g., iOS 17.2]
**App Version**: [e.g., 1.0.0 build 42]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**: 

**Actual Behavior**: 

**Screenshots/Video**: [Attach]

**Crash Logs**: [If applicable]
```

## Feedback Collection

### In-App Surveys
- Post-game satisfaction (1-5 stars)
- Feature requests (open text)
- Bug reports (structured form)

### External Channels
- Discord community (#beta-feedback)
- Email: beta@melodyx.app
- TestFlight/Play Store reviews

## Success Metrics

### Launch Criteria
- [ ] Crash-free rate > 99.5%
- [ ] Average rating > 4.0
- [ ] D1 retention > 40%
- [ ] D7 retention > 20%
- [ ] No P0/P1 bugs open

### Key Metrics to Track
- Daily Active Users (DAU)
- Games completed per session
- Learning lessons per week
- Conversion rate (free to premium)
- Average session length

## Timeline

### Week 1-2: Internal Testing
- Team-only access
- Focus on critical bugs
- Performance profiling

### Week 3-4: Closed Beta
- 50 external testers
- Gather initial feedback
- Iterate on UX issues

### Week 5-6: Open Beta
- 100 testers
- Final polish
- Prepare store listing

### Week 7: Launch Prep
- Final build
- Store review submission
- Marketing preparation

## Contact

- **Beta Lead**: [Name]
- **QA Lead**: [Name]
- **Emergency**: [Phone/Slack]

---

*Last Updated: January 2026*
