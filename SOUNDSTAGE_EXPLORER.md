# Soundstage Explorer - Audio Masking Pattern System

## Overview
The Soundstage Explorer is a 2D interactive canvas that allows users to create complex spatial-frequency masking patterns for audio experimentation. It works with both tone bursts and bandpassed noise to explore auditory masking effects.

## Core Concept
- **Horizontal axis (X)**: Represents stereo panning positions (Left to Right)
- **Vertical axis (Y)**: Represents frequency (High at top, Low at bottom, logarithmic scale)
- **Dots/Markers**: Each dot represents a frequency position that will be used in the masking pattern

## How It Works

### User Interaction
1. **Click** on the canvas to add a frequency marker at that position
2. **Drag** markers vertically to adjust their frequency (continuous)
3. **Right-click** to remove a marker
4. Horizontal positions are **fixed** to discrete pan slots based on the pan count setting
5. **Multiple dots per column** are allowed and create polyrhythmic patterns

### Pattern Generation
When you place dots on the canvas, the system creates an alternating pattern:

#### For a single column with two dots (e.g., 500Hz and 2000Hz):
1. **500Hz filled** - Only the 2000Hz band is notched out
2. **Both notched** - Both 500Hz and 2000Hz bands are notched out  
3. **2000Hz filled** - Only the 500Hz band is notched out
4. **Both notched** - Both 500Hz and 2000Hz bands are notched out
5. (Pattern repeats)

### Audio Modes
- **Tone Mode**: Plays sine tone bursts at the specified frequencies
- **Bandpassed Noise Mode**: Plays noise with notch filters at the specified frequencies

### Key Parameters
- **Notch Bandwidth**: Controls how wide the frequency notches are (default: 2.0 octaves)
- **Pan Count**: Number of discrete stereo positions (1 = mono, 5 = full stereo spread)
- **Attack/Release**: Envelope timing for the bursts (100ms attack, 100ms release)

## Technical Implementation

### Masking Behavior
- Each dot creates a frequency "notch" (a band that gets removed from the spectrum)
- The pattern cycles through which notch is "filled in" with sound
- All other notches remain active, creating a complex spectral pattern
- The "both notched" steps between each filled position create rhythmic spacing

### Noise Generation
- Uses pink noise mixed with brown noise to achieve -4.5dB/octave spectral slope
- Bandpass filters create the notches by removing specific frequency bands
- Multiple notches can be active simultaneously

### Pattern Cycling
- With multiple dots in the same column, the system cycles through each frequency
- Creates polyrhythmic patterns when different columns have different numbers of dots
- Each cycle step alternates between a "filled" state and an "all notched" state

## Use Cases
- Exploring auditory masking and frequency discrimination
- Creating rhythmic spectral patterns
- Testing perceptual effects of notched noise
- Investigating spatial-frequency interactions in hearing

## Current Status
The system is functional with:
- ✅ Interactive 2D canvas with drag-and-drop
- ✅ Multiple dots per column support
- ✅ Proper alternating pattern (filled -> notched -> filled -> notched)
- ✅ Both tone and noise modes
- ✅ Adjustable bandwidth and other parameters
- ✅ Consistent pattern generation with sorted frequency positions