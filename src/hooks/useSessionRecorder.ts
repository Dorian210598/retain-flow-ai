import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionRecorderConfig {
  sessionId: string;
  stepId: string;
  throttleMs?: number;
}

interface CustomMouseEvent {
  x: number;
  y: number;
  timestamp: number;
}

interface ElementTimeTracker {
  [selector: string]: {
    startTime: number;
    totalTime: number;
  };
}

export const useSessionRecorder = ({ sessionId, stepId, throttleMs = 100 }: SessionRecorderConfig) => {
  const mousePositions = useRef<CustomMouseEvent[]>([]);
  const lastThrottleTime = useRef(0);
  const elementTimeTracker = useRef<ElementTimeTracker>({});
  const currentElement = useRef<string | null>(null);
  const sessionStartTime = useRef(Date.now());

  const getElementSelector = useCallback((element: Element): string => {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }, []);

  const trackElementTime = useCallback((element: Element | null) => {
    const now = Date.now();
    
    // Stop tracking previous element
    if (currentElement.current && elementTimeTracker.current[currentElement.current]) {
      const tracker = elementTimeTracker.current[currentElement.current];
      tracker.totalTime += now - tracker.startTime;
    }

    // Start tracking new element
    if (element) {
      const selector = getElementSelector(element);
      currentElement.current = selector;
      
      if (!elementTimeTracker.current[selector]) {
        elementTimeTracker.current[selector] = { startTime: now, totalTime: 0 };
      } else {
        elementTimeTracker.current[selector].startTime = now;
      }
    } else {
      currentElement.current = null;
    }
  }, [getElementSelector]);

  const recordEvent = useCallback(async (eventType: string, eventData: any) => {
    console.log('🎥 Recording event:', eventType, eventData);
    try {
      const result = await supabase.from('interaction_events').insert({
        session_id: sessionId,
        step_id: stepId,
        event_type: eventType,
        event_data: {
          ...eventData,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          page_url: window.location.pathname,
          session_duration: Date.now() - sessionStartTime.current
        }
      });
      console.log('✅ Event recorded successfully:', result);
    } catch (error) {
      console.error('❌ Failed to record event:', error);
    }
  }, [sessionId, stepId]);

  const handleMouseMove = useCallback((e: Event) => {
    const mouseEvent = e as any; // DOM MouseEvent
    const now = Date.now();
    
    if (now - lastThrottleTime.current >= throttleMs) {
      const mouseData = {
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
        timestamp: now
      };
      
      mousePositions.current.push(mouseData);
      lastThrottleTime.current = now;

      // Track element hover
      const elementUnderMouse = document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY);
      trackElementTime(elementUnderMouse);

      // Record mouse movement with current element context
      recordEvent('mouse_move', {
        mouse_position: { x: mouseEvent.clientX, y: mouseEvent.clientY },
        element_selector: elementUnderMouse ? getElementSelector(elementUnderMouse) : null,
        element_text: elementUnderMouse?.textContent?.slice(0, 100) || null
      });
    }
  }, [throttleMs, trackElementTime, recordEvent, getElementSelector]);

  const handleClick = useCallback((e: Event) => {
    const mouseEvent = e as any; // DOM MouseEvent
    const target = e.target as Element;
    
    recordEvent('click', {
      mouse_position: { x: mouseEvent.clientX, y: mouseEvent.clientY },
      element_selector: getElementSelector(target),
      element_text: target.textContent?.slice(0, 100) || null,
      time_on_element: elementTimeTracker.current[getElementSelector(target)]?.totalTime || 0
    });
  }, [recordEvent, getElementSelector]);

  const handleScroll = useCallback(() => {
    recordEvent('scroll', {
      scroll_position: {
        x: window.scrollX,
        y: window.scrollY
      }
    });
  }, [recordEvent]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // User left the page/tab
      recordEvent('page_blur', {
        element_time_data: elementTimeTracker.current
      });
    } else {
      // User returned to the page/tab
      recordEvent('page_focus', {});
    }
  }, [recordEvent]);

  useEffect(() => {
    console.log('🎬 useSessionRecorder mounting with:', { sessionId, stepId, hasSessionId: !!sessionId, hasStepId: !!stepId });
    
    if (!sessionId || !stepId) {
      console.log('⚠️ Session recording skipped - missing sessionId or stepId');
      return;
    }

    console.log('🚀 Starting session recording...');
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Record session start
    console.log('📝 Recording session_start event');
    recordEvent('session_start', {
      user_agent: navigator.userAgent,
      referrer: document.referrer
    });

    return () => {
      // Cleanup
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Record final element time data
      if (currentElement.current && elementTimeTracker.current[currentElement.current]) {
        const tracker = elementTimeTracker.current[currentElement.current];
        tracker.totalTime += Date.now() - tracker.startTime;
      }

      recordEvent('session_end', {
        element_time_data: elementTimeTracker.current,
        total_mouse_events: mousePositions.current.length
      });
    };
  }, [sessionId, stepId, handleMouseMove, handleClick, handleScroll, handleVisibilityChange, recordEvent]);

  return {
    mousePositions: mousePositions.current,
    elementTimeData: elementTimeTracker.current
  };
};