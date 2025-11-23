import React from 'react';
import { InfoMessage } from './ui/InfoMessage';

const InfoMessageExample: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>InfoMessage Component Examples</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Info variant */}
        <InfoMessage
          type="info"
          badgeText="AI Tip"
          message="Want to skip the docs? Use the"
          linkText="MCP Server"
          linkHref="/docs/get-started/ai/mcp-server"
        />

        {/* Warning variant */}
        <InfoMessage
          type="warning"
          badgeText="Warning"
          message="This action cannot be undone. Please proceed with caution."
        />

        {/* Alert variant */}
        <InfoMessage
          type="alert"
          badgeText="Alert"
          message="System maintenance scheduled for tonight at 10 PM. Save your work."
        />

        {/* Info without link */}
        <InfoMessage
          type="info"
          badgeText="Note"
          message="All changes are automatically saved as you type."
        />

        {/* Warning with link */}
        <InfoMessage
          type="warning"
          badgeText="Update Required"
          message="Your app version is outdated. Please"
          linkText="update now"
          linkHref="/settings/updates"
        />
      </div>
    </div>
  );
};

