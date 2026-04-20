import React from 'react';
import NotificationTimelineScreen from './NotificationTimelineScreen';

function OfficerNotificationAuditScreen({ claims = [] }) {
  return <NotificationTimelineScreen scope="officer" claims={claims} />;
}

export default OfficerNotificationAuditScreen;
