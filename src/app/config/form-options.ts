// Centralized dropdown / option definitions for Interview Evaluation System
export const POSITION_OPTIONS = [
  'Developer','Designer','Manager','QA Engineer','DevOps','Data Engineer','Data Scientist','Product Manager','Other'
];

// Initial Form
export const ELIGIBILITY_STATUS_OPTIONS = ['Eligible','Not Eligible','On-Hold'];
export const RESUME_QUALITY_OPTIONS = ['Excellent','Good','Average','Poor'];
export const EXPERIENCE_MATCH_OPTIONS = ['Yes','No','Partial'];
export const EDUCATION_FIT_OPTIONS = ['Yes','No','NA'];
export const INITIAL_DECISION_OPTIONS = ['Proceed to System Task','Reject','On-Hold'];

// System Task
export const TASK_TYPE_OPTIONS = ['Coding Test','Case Study','Design Task','Aptitude Test'];
export const SUBMISSION_STATUS_OPTIONS = ['Submitted','Not Submitted','Late Submission'];
export const TASK_DIFFICULTY_OPTIONS = ['Easy','Medium','Hard'];
export const TASK_EVALUATION_RESULT_OPTIONS = ['Pass','Fail','Borderline'];

// Technical Interview
export const TECHNICAL_SKILL_RATING_OPTIONS = ['Excellent','Good','Average','Poor'];
export const PROBLEM_SOLVING_OPTIONS = ['Strong','Moderate','Weak'];
export const CODING_STANDARDS_OPTIONS = ['High','Acceptable','Low'];
export const SYSTEM_DESIGN_KNOWLEDGE_OPTIONS = ['Expert','Intermediate','Beginner','Not Applicable'];
export const COMMUNICATION_OPTIONS = ['Excellent','Good','Average','Poor'];
export const ROUND_STATUS_OPTIONS = ['Pass','Fail','On-Hold'];

// Manager Interview
export const LEADERSHIP_POTENTIAL_OPTIONS = ['High','Medium','Low','Not Required'];
export const TEAM_FIT_OPTIONS = ['Strong Fit','Moderate Fit','Weak Fit'];
export const DECISION_MAKING_OPTIONS = ['Excellent','Good','Average','Poor'];
export const DOMAIN_KNOWLEDGE_OPTIONS = ['Expert','Intermediate','Beginner'];
export const MANAGER_RECOMMENDATION_OPTIONS = ['Strong Hire','Hire','No Hire','On-Hold'];

// HR Interview
export const SOFT_SKILLS_OPTIONS = ['Excellent','Good','Average','Poor'];
export const CULTURAL_FIT_OPTIONS = ['Strong Fit','Moderate Fit','Weak Fit'];
export const SALARY_FITMENT_OPTIONS = ['Within Budget','Slightly Above Budget','Not Affordable'];
export const RELOCATION_READINESS_OPTIONS = ['Yes','No','Not Required'];
export const HR_FINAL_DECISION_OPTIONS = ['Proceed to Offer','Reject','On-Hold'];

// Consolidated Report
export const YES_NO_OPTIONS = ['Yes','No'];
export const ROUND_STATUS_EXTENDED_OPTIONS = ['Pass','Fail','On-Hold','Not Applicable'];
export const FINAL_DECISION_OPTIONS = ['Hired','Rejected','On-Hold'];

// Dashboard filters
export const FILTER_ROLE_OPTIONS = ['All Roles','Developer','Designer','Manager','Other'];
export const FILTER_STAGE_OPTIONS = ['Initial Form','System Task','Technical','Manager','HR'];
export const FILTER_STATUS_OPTIONS = ['All','Pass','Fail','On-Hold','Pending'];
export const REPORT_FORMAT_OPTIONS = ['PDF','Excel','Dashboard View'];

// Utility type for select options (if mapping value/label in future)
export interface OptionItem { value: string; label: string; }