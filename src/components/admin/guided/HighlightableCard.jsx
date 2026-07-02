import React from 'react';
import { useHighlightItem } from '../../../hooks/useHighlightItem';

export default function HighlightableCard({ id, className = '', children, as: Tag = 'article', ...rest }) {
  const { ref, isHighlighted } = useHighlightItem(id);
  return (
    <Tag
      ref={ref}
      className={`${className}${isHighlighted ? ' is-highlighted' : ''}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
