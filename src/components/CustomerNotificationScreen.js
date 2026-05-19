import React from 'react';
import NotificationTimelineScreen from './NotificationTimelineScreen';

function CustomerNotificationScreen({ claims = [], currentUser = null }) {
  return <NotificationTimelineScreen scope="customer" claims={claims} currentUser={currentUser} theme="customer" />;
}

export default CustomerNotificationScreen;
