import { FeedbackSurvey } from './retention/FeedbackSurvey';
import { DiscountOffer } from './retention/DiscountOffer';
import { FinalConfirmation } from './retention/FinalConfirmation';
import { CompletionSummary } from './retention/CompletionSummary';
import { CallbackScheduler } from './retention/CallbackScheduler';
import { ServiceUpgrade } from './retention/ServiceUpgrade';
import { PauseSubscription } from './retention/PauseSubscription';
import { LoyaltyReward } from './retention/LoyaltyReward';

export const componentMap = {
  'FeedbackSurvey': FeedbackSurvey,
  'DiscountOffer': DiscountOffer,
  'FinalConfirmation': FinalConfirmation,
  'CompletionSummary': CompletionSummary,
  'CallbackScheduler': CallbackScheduler,
  'ServiceUpgrade': ServiceUpgrade,
  'PauseSubscription': PauseSubscription,
  'LoyaltyReward': LoyaltyReward,
} as const;