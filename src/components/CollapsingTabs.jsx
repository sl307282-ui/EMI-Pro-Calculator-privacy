import React, { forwardRef } from 'react';

/**
 * Reusable Collapsing Tab Switcher
 * Pinned beneath the header with smooth 60fps scroll-shrinking.
 *
 * @param {Array<{ id: string, label: string }>} tabs
 * @param {string} activeTab
 * @param {(tabId: string) => void} onTabChange
 * @param {string} [className]
 * @param {string} [activePillColor]
 */
const renderIcon = (icon) => {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  const IconComponent = icon;
  return <IconComponent size={15} strokeWidth={2.4} />;
};

const CollapsingTabs = forwardRef(({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
  activePillColor = 'bg-blue-600 text-white shadow-md shadow-blue-500/25',
}, ref) => {
  return (
    <div
      ref={ref}
      className={`collapsing-tabs-wrapper px-4 ${className}`}
    >
      <div className="max-w-lg mx-auto">
        <div className="collapsing-tabs-pill bg-gray-100 dark:bg-gray-800 flex gap-1 shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`collapsing-tabs-btn flex-1 font-bold uppercase tracking-wider transition-colors duration-150 flex items-center justify-center select-none ${
                  isActive
                    ? activePillColor
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon && (
                  <span className="collapsing-tabs-icon inline-flex items-center justify-center mr-1.5 shrink-0">
                    {renderIcon(tab.icon)}
                  </span>
                )}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

CollapsingTabs.displayName = 'CollapsingTabs';

export default CollapsingTabs;
