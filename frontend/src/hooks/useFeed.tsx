import { useContext } from 'react';
import { FeedContext, FeedContextType } from '../context/FeedContext';

/**
 * Custom hook to access the Feed context
 * @returns {FeedContextType} The feed context value
 * @throws {Error} If used outside of a FeedProvider
 */
export const useFeed = (): FeedContextType => {
  const context = useContext(FeedContext);
  
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  
  return context;
};