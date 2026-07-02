import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export default function DataTable({
  columns,
  data,
  rowKey = 'id',
  emptyMessage = 'Aucune donnée',
  className = '',
  mobileCardRender
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!data?.length) {
    return <p className="afb-empty-state__title">{emptyMessage}</p>;
  }

  if (isMobile) {
    return (
      <div className={`data-table-cards ${className}`.trim()}>
        {data.map((row, rowIndex) => (
          <article key={row[rowKey] ?? rowIndex} className="data-table-card card">
            {mobileCardRender ? (
              mobileCardRender(row)
            ) : (
              columns.map((col) => (
                <div key={col.key} className="data-table-card__row">
                  <span className="data-table-card__label">{col.label}</span>
                  <span className="data-table-card__value">
                    {col.render ? col.render(row) : row[col.key]}
                  </span>
                </div>
              ))
            )}
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className={`table-responsive ${className}`.trim()}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row[rowKey] ?? rowIndex}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.label}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
