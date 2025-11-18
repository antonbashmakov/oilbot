import { createSystem, defaultConfig } from "@chakra-ui/react";

// Color palette constants based on the specified dark theme
export const colors = {
  // Primary Backgrounds: Deep, desaturated grays
  background: {
    primary: "#121212",
    secondary: "#1E1E1E",
  },
  
  // Surface/Container Elements: Slightly lighter shades of dark gray
  surface: {
    container: "#2C2C2C",
    elevated: "#333333",
  },
  
  // Text Color: Light, muted colors
  text: {
    primary: "#E0E0E0",
    secondary: "#CCCCCC",
    hint: "#999999",
  },
  
  // Accent Colors: Complementary, vibrant colors for interactive elements
  accent: {
    blue: "#4A90E2",      // Muted blue
    green: "#4CAF50",     // Muted green
    purple: "#9C27B0",    // Muted purple
    orange: "#FF9800",    // Muted orange
  },
  
  // Status Colors for delivery statuses
  status: {
    pending: "#FF9800",   // Orange for PENDING
    inTransit: "#4A90E2", // Blue for IN_TRANSIT
    inTransitBack: "#9C27B0", // Purple for IN_TRANSIT_BACK
    fulfilled: "#4CAF50", // Green for FULLFILLED
  },
  
  // Borders/Dividers: Very subtle, darker gray lines
  border: {
    subtle: "#444444",
    medium: "#555555",
  },
};

// Create the theme system
export const theme = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        // Background colors
        "bg.primary": { value: colors.background.primary },
        "bg.secondary": { value: colors.background.secondary },
        
        // Surface colors
        "surface.container": { value: colors.surface.container },
        "surface.elevated": { value: colors.surface.elevated },
        
        // Text colors
        "text.primary": { value: colors.text.primary },
        "text.secondary": { value: colors.text.secondary },
        "text.hint": { value: colors.text.hint },
        
        // Accent colors
        "accent.blue": { value: colors.accent.blue },
        "accent.green": { value: colors.accent.green },
        "accent.purple": { value: colors.accent.purple },
        "accent.orange": { value: colors.accent.orange },
        
        // Status colors
        "status.pending": { value: colors.status.pending },
        "status.inTransit": { value: colors.status.inTransit },
        "status.inTransitBack": { value: colors.status.inTransitBack },
        "status.fulfilled": { value: colors.status.fulfilled },
        
        // Border colors
        "border.subtle": { value: colors.border.subtle },
        "border.medium": { value: colors.border.medium },
      },
    },
  },
});

export type Theme = typeof theme;
