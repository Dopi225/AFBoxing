import React from 'react';

export default function SimpleList({
  items = [],
  renderItem,
  emptyTitle = 'Aucun élément',
  emptyMessage,
  actions,
}) {
  if (!items.length) {
    return (
      <div className="simple-list simple-list--empty">
        <p className="simple-list__empty-title">{emptyTitle}</p>
        {emptyMessage ? <p className="simple-list__empty-msg">{emptyMessage}</p> : null}
      </div>
    );
  }

  return (
    <ul className="simple-list" role="list">
      {items.map((item, index) => (
        <li key={item.id ?? index} className="simple-list__item">
          {renderItem(item, index)}
        </li>
      ))}
      {actions ? <li className="simple-list__actions">{actions}</li> : null}
    </ul>
  );
}
