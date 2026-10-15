/**
 * FINServ Tabs Component
 * Built on accessible Radix UI Tabs primitive
 */

import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className = '',
}) => {
  const initialValue = defaultValue || tabs[0]?.id || '';

  return (
    <RadixTabs.Root
      value={value}
      defaultValue={initialValue}
      onValueChange={onValueChange}
      className={`tabs-root ${className}`.trim()}
    >
      <RadixTabs.List className="tabs-list" aria-label="Banking options tabs">
        {tabs.map(tab => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className="tabs-trigger"
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {tabs.map(tab => (
        <RadixTabs.Content key={tab.id} value={tab.id} className="tabs-content">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};
