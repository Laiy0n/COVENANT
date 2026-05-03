# COVENANT Game Improvements TODO
Status: In Progress

## Approved Plan Steps:
- [x] 1. Update App.jsx: Add global settings state (brightness:1.5, sensitivity:0.002), localStorage persist, pass to GameView/SettingsPanel.
- [x] 2. Update SettingsPanel.jsx: Link sliders to props, add brightness slider (0.5-3.0) in video tab.
- [x] 3. Update GameView.jsx: Pass settings prop to GameEngine.
- [x] 4. Update GameEngine.js: 
  - Use settings.sensitivity.
  - Boost lighting/exposure/fog dynamically with settings.brightness.
  - Add sprintStamina to movement.
  - Add 3s spawnInvuln.
  - Scale enemy dmg by dist, reduce speeds.
  - Reduce initial enemies to 3.
- [x] 5. Update Enemies.js: Reduce base speeds 20%.
- [x] 6. Test: npm run dev, verify brightness, settings realtime, survival on spawn, R6 movement.
- [ ] 7. attempt_completion.

Updated after each step.

