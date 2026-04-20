import React from 'react';
import NotificationTimelineScreen from './NotificationTimelineScreen';

function WorkshopNotificationScreen({ claims = [], currentUser = null }) {
  return <NotificationTimelineScreen scope="workshop" claims={claims} currentUser={currentUser} />;
}

export default WorkshopNotificationScreen;
