import { FeedbackSurvey } from './retention/FeedbackSurvey';
import { DiscountOffer } from './retention/DiscountOffer';
import { FinalConfirmation } from './retention/FinalConfirmation';

export const componentMap = {
  'FeedbackSurvey': FeedbackSurvey,
  'DiscountOffer': DiscountOffer,
  'FinalConfirmation': FinalConfirmation,
} as const;