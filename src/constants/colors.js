// Futuristic Neon & Glassmorphism Theme Colors
export const COLORS = {
  // Backgrounds
  background: '#07080D',          // Deep space dark black-navy
  cardBg: 'rgba(20, 24, 43, 0.65)', // Glassmorphism base container background
  cardBgSelected: 'rgba(32, 38, 68, 0.8)',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.08)',  // Subtle glassmorphism border
  borderGlowing: 'rgba(0, 240, 255, 0.3)', // Cybercyan glowing border
  
  // Neon Accents
  cyan: '#00F0FF',                // Neon Cyan / Blue
  purple: '#A855F7',              // Neon Purple
  pink: '#EC4899',                // Neon Pink
  
  // Status Colors (Neon variants)
  applied: '#00F0FF',             // Neon Cyan
  shortlisted: '#A855F7',         // Neon Purple
  assessment: '#FFB800',          // Neon Gold/Yellow
  interviewAttended: '#F97316',   // Neon Orange
  selected: '#10B981',            // Neon Green
  rejected: '#EF4444',            // Neon Red
  
  // Gradients
  gradientStart: '#00F0FF',
  gradientEnd: '#A855F7',
  
  // Typography
  textPrimary: '#F8FAFC',         // Almost pure white
  textSecondary: '#94A3B8',       // Light slate grey
  textMuted: '#64748B',           // Muted slate grey
  
  // System States
  shadow: '#000000',
  error: '#EF4444',
  success: '#10B981',
};

// Map status name to color hex
export const getStatusColor = (status) => {
  switch (status) {
    case 'Applied':
      return COLORS.applied;
    case 'Shortlisted':
      return COLORS.shortlisted;
    case 'Assessment':
      return COLORS.assessment;
    case 'Interview Attended':
      return COLORS.interviewAttended;
    case 'Selected':
      return COLORS.selected;
    case 'Rejected':
      return COLORS.rejected;
    default:
      return COLORS.cyan;
  }
};
