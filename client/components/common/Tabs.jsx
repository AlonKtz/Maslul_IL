import React from 'react';

/*
  A row of tab buttons. tabs is [{ id, label }], active is the id that is
  selected and onChange gets the id that was clicked.
*/
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={'tab' + (tab.id === active ? ' is-active' : '')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
