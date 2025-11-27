export const analyticsService = {
  trackEvent: (eventName: string, data?: Record<string, any>) => {
    // In a real app, this would send data to Google Analytics, Mixpanel, etc.
    console.log(`[Analytics] ${eventName}`, data || '');
  }
};
