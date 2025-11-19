import { createSystem, defaultConfig } from "@chakra-ui/react";

// Color palette constants based on the specified Tailwind config
export const colors = {
  // Primary Colors
  primary: {
    blue: "#4A90E2",      // Corporate Blue
    blueDark: "#58A6FF",  // Primary Dark
  },
  
  // Status Colors
  status: {
    success: "#28A745",   // Success Green
    successDark: "#34D399",
    warning: "#FFC107",   // Warning Yellow
    warningDark: "#FBBF24",
  },
  
  // Background Colors
  background: {
    light: "#f6f6f8",
    dark: "#101622",      // Background Dark
    tertiary: "#141927",
  },
  
  // Surface Colors
  surface: {
    dark: "#1A2233",      // Surface Dark
    elevated: "#2A3344",
  },
  
  // Text Colors
  text: {
    primary: "white",
    secondary: "#CCCCCC",
    hint: "#999999",
  },
  
  // Neutral Colors
  neutral: {
    default: "#6c757d",
    dark: "#8B949E",
  },
  
  // Status Colors for delivery statuses (mapped to new palette)
  deliveryStatus: {
    pending: "#FFC107",   // Warning Yellow for PENDING
    inTransit: "#4A90E2", // Corporate Blue for IN_TRANSIT
    inTransitBack: "#9C27B0", // Purple for IN_TRANSIT_BACK
    fulfilled: "#28A745", // Success Green for FULLFILLED
  },
  
  // Borders/Dividers
  border: {
    subtle: "#2D3748",
    medium: "#4A5568",
  },
};

// Create the theme system
export const theme = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        // Background colors
        "bg.primary": { value: colors.background.dark },
        "bg.secondary": { value: colors.background.tertiary },
        "bg.tertiary": { value: colors.background.tertiary },
        
        // Surface colors
        "surface.container": { value: colors.surface.dark },
        "surface.elevated": { value: colors.surface.elevated },
        
        // Text colors
        "text.primary": { value: colors.text.primary },
        "text.secondary": { value: colors.text.secondary },
        "text.hint": { value: colors.text.hint },
        
        // Primary colors
        "primary.blue": { value: colors.primary.blue },
        "primary.blueDark": { value: colors.primary.blueDark },
        
        // Status colors
        "status.success": { value: colors.status.success },
        "status.successDark": { value: colors.status.successDark },
        "status.warning": { value: colors.status.warning },
        "status.warningDark": { value: colors.status.warningDark },
        
        // Delivery status colors
        "status.pending": { value: colors.deliveryStatus.pending },
        "status.inTransit": { value: colors.deliveryStatus.inTransit },
        "status.inTransitBack": { value: colors.deliveryStatus.inTransitBack },
        "status.fulfilled": { value: colors.deliveryStatus.fulfilled },
        
        // Neutral colors
        "neutral.default": { value: colors.neutral.default },
        "neutral.dark": { value: colors.neutral.dark },
        
        // Border colors
        "border.subtle": { value: colors.border.subtle },
        "border.medium": { value: colors.border.medium },
      },
      fonts: {
        "display": { value: "Inter, sans-serif" },
      },
      radii: {
        "DEFAULT": { value: "0.25rem" },
        "lg": { value: "0.5rem" },
        "xl": { value: "0.75rem" },
        "full": { value: "9999px" },
      },
    },
  },
});

export type Theme = typeof theme;
