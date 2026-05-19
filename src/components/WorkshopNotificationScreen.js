import React from 'react';
import NotificationTimelineScreen from './NotificationTimelineScreen';

function WorkshopNotificationScreen({ claims = [], currentUser = null, theme = 'default' }) {
  return <NotificationTimelineScreen scope="workshop" claims={claims} currentUser={currentUser} theme={theme} />;
}

export default WorkshopNotificationScreen;
