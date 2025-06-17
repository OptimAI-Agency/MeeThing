
import { useState, useEffect } from 'react';

export type BackgroundOption = 'peaceful-park' | 'misty-morning';

export const backgroundOptions = {
  'peaceful-park': {
    name: 'Peaceful Park Bench',
    url: '/placeholder.svg'
  },
  'misty-morning': {
    name: 'Misty Morning Path',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&auto=format'
  }
};

export const useBackground = () => {
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption>('peaceful-park');

  useEffect(() => {
    const savedBackground = localStorage.getItem('calendar-background') as BackgroundOption;
    if (savedBackground && backgroundOptions[savedBackground]) {
      setSelectedBackground(savedBackground);
    }
  }, []);

  const updateBackground = (background: BackgroundOption) => {
    setSelectedBackground(background);
    localStorage.setItem('calendar-background', background);
  };

  return {
    selectedBackground,
    updateBackground,
    backgroundUrl: backgroundOptions[selectedBackground].url
  };
};
