# Captain Underpants Adventure - TODO List

## 🎯 High Priority (Quick Wins)

### ✅ Combo System
**Status**: In Progress
**Difficulty**: Easy
**Impact**: High

Track consecutive successful dodges and reward skilled play.

**Features**:
- Track consecutive obstacles avoided without jumping unnecessarily
- Display combo counter on screen
- Visual feedback for combo milestones
- Bonus points:
  - 5+ combo: ×1.5 multiplier
  - 10+ combo: ×2 multiplier
  - 20+ combo: ×3 multiplier
- Reset on collision or missed obstacle

**Implementation Notes**:
- Add `comboCount` variable
- Add `comboMultiplier` variable
- Update score display to show combo
- Add visual effects for combo milestones
- Add sound effect for combo achievements

---

### 🔲 Flying Obstacles at Different Heights
**Status**: Not Started
**Difficulty**: Medium
**Impact**: High

Make duck mechanic more essential by adding obstacles that specifically require ducking.

**Features**:
- Add "high missiles" that must be jumped over
- Add "low missiles" that must be ducked under
- Clear visual differences (red = high, blue = low, etc.)
- Smart spawning algorithm to create interesting patterns

**Implementation Notes**:
- Extend obstacle types in `obstacleTypes` object
- Add height-based spawn logic
- Create distinct drawing functions for each type
- Balance spawn rates for fair gameplay

---

### ✅ Collectible Power-ups
**Status**: Completed
**Difficulty**: Medium
**Impact**: High

Add strategic power-ups that spawn randomly during gameplay.

**Power-up Types**:
1. **Invincibility Shield** (5 seconds)
   - Transparent bubble effect around character
   - Pass through obstacles safely
   - Visual glow and particle trail

2. **Slow Motion** (3 seconds)
   - Reduce game speed by 50%
   - Blue tint overlay
   - Slow-mo sound effect

3. **Score Multiplier** (10 seconds)
   - 2× points for all obstacles
   - Golden glow effect
   - Coin counter showing bonus points

**Implementation Notes**:
- Create `PowerUp` class
- Add power-up spawn timer
- Track active power-ups
- Visual indicators for active effects
- Collision detection for pickup

---

### 🔲 Collectible Coins/Stars
**Status**: Not Started
**Difficulty**: Easy
**Impact**: Medium

Secondary collectibles for long-term progression.

**Features**:
- Spawn between obstacles at varying heights
- Optional to collect (risk vs reward positioning)
- Track lifetime coins separately from score
- Use for unlocking skins/cosmetics
- Particle effect on collection

**Implementation Notes**:
- Create `Collectible` class
- Add coin counter display
- Store lifetime coins in localStorage/Telegram Cloud
- Golden sparkle animation
- Collection sound effect

---

## 🎨 Medium Priority (Good ROI)

### 🔲 Difficulty Modes
**Status**: Not Started
**Difficulty**: Easy
**Impact**: Medium

Multiple difficulty levels for accessibility and challenge.

**Modes**:
- **Easy**: 70% initial speed, 30% fewer obstacles, wider spacing
- **Normal**: Current settings (default)
- **Hard**: 130% initial speed, 50% more obstacles, tighter spacing

**Features**:
- Mode selection on start screen
- Separate high scores for each mode
- Different colored borders for visual distinction
- Unlock hard mode after score 50+ on normal

**Implementation Notes**:
- Add difficulty configuration object
- Mode selection UI
- Adjust `gameSpeed` and `nextObstacleTime` based on mode
- Store separate high scores with prefix

---

### 🔲 Background Music
**Status**: Not Started
**Difficulty**: Medium
**Impact**: High

Dynamic background music that enhances immersion.

**Features**:
- Looping soundtrack with multiple layers
- Dynamic intensity tied to game speed
- Calm at start, intense at high scores
- Smooth transitions between intensity levels
- Use Web Audio API (already implemented for SFX)

**Implementation Notes**:
- Create oscillator-based music generator
- Add music layer system (bass, melody, drums)
- Tie layer activation to score/speed
- Respect sound toggle button
- Volume balancing with SFX

---

### 🔲 Achievement System
**Status**: Not Started
**Difficulty**: Medium
**Impact**: Medium

Unlock badges for reaching milestones to increase replayability.

**Achievement Examples**:
- 🏅 "First Flight": Score 10 points
- 🏅 "Century Club": Score 100 points
- 🏅 "Duck Master": Duck under 50 obstacles
- 🏅 "Combo King": Achieve 20+ combo
- 🏅 "Night Survivor": Score 40+ (survive night mode)
- 🏅 "Storm Chaser": Complete game during rain event
- 🏅 "Speed Demon": Reach 10+ game speed
- 🏅 "Perfect Start": Score 20 without taking damage

**Implementation Notes**:
- Create achievements configuration array
- Track progress for each achievement
- Store unlocked achievements in localStorage/Telegram Cloud
- Display badge icons on game over screen
- Unlock notification animation
- Share achievements to Telegram

---

### 🔲 Visual Feedback Improvements
**Status**: Not Started
**Difficulty**: Easy
**Impact**: Medium

Enhanced visual feedback for player actions.

**Features**:
- **Near-miss indicator**: Spark effect when obstacle passes very close (<10px)
- **Perfect dodge**: Golden flash when dodging at optimal timing
- **Screen shake**: Subtle shake on collision before explosion
- **Speed lines**: Horizontal lines when game speed increases significantly
- **Combo flash**: Screen border pulse at combo milestones
- **Damage flash**: Red tint flash on collision

**Implementation Notes**:
- Add camera shake function
- Create particle effects for near-misses
- Add screen overlay effects
- Timing detection for "perfect" dodges
- Progressive speed line density

---

## 💡 Lower Priority (Nice to Have)

### 🔲 Character Skins/Unlockables
**Status**: Not Started
**Difficulty**: Medium
**Impact**: Low

Cosmetic customization for long-term engagement.

**Skins**:
- Default Captain Underpants
- Golden Cape (100 coins)
- Rainbow Cape (250 coins)
- Ninja Outfit (500 coins)
- Superhero Variant (1000 coins)

**Implementation Notes**:
- Create skin configuration with draw functions
- Skin selection menu
- Store owned skins in persistent storage
- Apply selected skin to character drawing
- Preview system in menu

---

### 🔲 Tutorial/Practice Mode
**Status**: Not Started
**Difficulty**: Easy
**Impact**: Low

Help new players learn the controls.

**Features**:
- Auto-activates on first play
- Slower obstacles with on-screen prompts
- "Jump now!" / "Duck now!" indicators
- Arrow pointing to appropriate button
- Skip button for experienced players
- Practice mode accessible from menu

**Implementation Notes**:
- Check `hasPlayedBefore` in localStorage
- Add tutorial state machine
- On-screen text prompts with arrows
- Slower game speed during tutorial
- Tutorial completion flag

---

### 🔲 Obstacle Variety
**Status**: Not Started
**Difficulty**: Medium
**Impact**: Medium

More diverse obstacles for strategic depth.

**Obstacle Types**:
- **Birds**: Fly high, must duck (animated wings)
- **Laser Beams**: Horizontal beams at fixed heights, must jump high
- **Multi-part Obstacles**: Requires quick jump → duck combo
- **Spinning Sawblades**: Can jump or duck depending on rotation
- **Balloons**: Float upward slowly, must duck or wait

**Implementation Notes**:
- Extend `obstacleTypes` configuration
- Create drawing functions for each type
- Unique collision boxes
- Visual distinction (color coding, animations)
- Balanced spawn distribution

---

### 🔲 Daily Challenges (Telegram)
**Status**: Not Started
**Difficulty**: Medium
**Impact**: Medium (Telegram users only)

Daily goals to encourage engagement.

**Challenge Examples**:
- "Score 50+ today" → Reward: 50 bonus coins
- "Play 5 games" → Reward: Special skin
- "Achieve 15+ combo" → Reward: 25 coins
- "Collect 20 coins" → Reward: Power-up unlock

**Implementation Notes**:
- Daily challenge rotation system
- Check Telegram Cloud Storage for completion
- Reset at midnight UTC
- Challenge notification on game start
- Reward distribution system

---

## 🔧 Technical Improvements

### 🔲 Better Mobile Experience
**Status**: Not Started
**Difficulty**: Easy
**Impact**: Medium

Optimize for mobile devices.

**Features**:
- Larger touch targets (80×80px buttons)
- Haptic feedback on collision (vibrate API)
- Landscape mode optimization
- Touch gesture support (swipe up = jump, swipe down = duck)
- Reduce particle count on low-end devices

**Implementation Notes**:
- Increase button sizes in mobile view
- Add `navigator.vibrate()` calls
- Detect landscape orientation
- Add swipe detection
- Performance detection and adaptive quality

---

### 🔲 Performance Optimizations
**Status**: Not Started
**Difficulty**: Medium
**Impact**: Medium

Improve performance on lower-end devices.

**Features**:
- Object pooling for particles and obstacles
- Canvas layer separation (static background vs dynamic elements)
- Offscreen canvas for background rendering
- RequestAnimationFrame optimization
- Reduce particle count based on device performance

**Implementation Notes**:
- Create object pool utility
- Multi-canvas setup with layering
- FPS monitoring
- Adaptive quality settings
- Minimize garbage collection

---

### 🔲 Analytics Integration
**Status**: Not Started
**Difficulty**: Easy
**Impact**: Low (Developer benefit)

Track gameplay metrics for data-driven improvements.

**Metrics to Track**:
- Average score per session
- Session length
- Most common failure points (score ranges)
- Duck vs jump ratio
- Power-up usage rates
- Difficulty mode distribution

**Implementation Notes**:
- Add event tracking function
- Store anonymous metrics
- Daily aggregation
- Privacy-compliant implementation
- Optional opt-out

---

## 📋 Completed Features

### ✅ Combo System
- Tracks consecutive successful dodges
- Score multipliers (×1.5, ×2.0, ×3.0)
- Visual counter with color coding
- Particle effects at milestones
- Audio feedback for achievements
- Best combo tracking

### ✅ Collectible Power-ups
- Three power-up types (Shield, Slow Motion, Score Multiplier)
- Floating collection with glow effects
- Active power-up UI indicators with timers
- Visual effects for each power-up type
- Sound effects for collection and activation
- Smart spawning system (10-15 second intervals)
- Power-up stacking and duration extension

### ✅ Sound System
- Jump sounds
- Collision explosions
- Score milestone beeps
- Power-up collection and activation sounds
- Combo achievement sounds
- Sound toggle button
- Web Audio API implementation

### ✅ Duck Mechanic
- Hold to duck functionality
- Cape physics for ducking
- Mobile duck button
- Keyboard controls (Arrow Down / S)

### ✅ Telegram Integration
- Cloud leaderboards
- Score sharing
- Auto-save best scores
- User authentication

### ✅ Visual Effects
- Dynamic cape animation
- Parallax scrolling backgrounds
- Night mode (score 20-40)
- Rain and lightning effects
- Animated ground (pebbles, worms)
- Particle explosions
- Power-up glow and sparkle effects
- Shield bubble animation
- Slow-motion purple tint
- Score multiplier golden glow

---

## Priority Recommendation

**Implement in this order for maximum impact**:
1. ✅ Combo System (In Progress)
2. Collectible Power-ups
3. Background Music
4. Flying Obstacles at Different Heights
5. Visual Feedback Improvements
6. Difficulty Modes
7. Achievement System

---

**Last Updated**: 2025-12-03
**Version**: 1.0
