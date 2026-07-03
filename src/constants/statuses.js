// Application status categories
export const STATUSES = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  ASSESSMENT: 'Assessment',
  INTERVIEW_ATTENDED: 'Interview Attended',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

// Order of statuses for display or logical flow
export const STATUS_LIST = [
  STATUSES.APPLIED,
  STATUSES.SHORTLISTED,
  STATUSES.ASSESSMENT,
  STATUSES.INTERVIEW_ATTENDED,
  STATUSES.SELECTED,
  STATUSES.REJECTED,
];

// Helper to get the next status in the progression
export const getNextStatus = (currentStatus) => {
  switch (currentStatus) {
    case STATUSES.APPLIED:
      return [STATUSES.SHORTLISTED];
    case STATUSES.SHORTLISTED:
      return [STATUSES.ASSESSMENT];
    case STATUSES.ASSESSMENT:
      return [STATUSES.INTERVIEW_ATTENDED];
    case STATUSES.INTERVIEW_ATTENDED:
      return [STATUSES.SELECTED, STATUSES.REJECTED];
    default:
      // Selected or Rejected are final statuses in the quick-flow, return empty array (no quick action buttons)
      return [];
  }
};
