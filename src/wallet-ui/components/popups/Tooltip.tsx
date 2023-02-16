import React, { useState } from 'react'
import './Tooltip.css'
interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  tip: string
  right?: boolean
  tipStyle?: any
}

// .tooltip {
//   font-size: 12px;
//   position: absolute;
//   z-index: 3px;
//   bottom: 2em;
//   background: white;
//   color: gray;
//   white-space: nowrap;
//   padding: 2px 6px;
//   border-radius: 4px;
//   box-shadow: 1px 1px 2px #333;
// }

export const Tooltip = ({ tip, right = false, children, tipStyle = {}, ...props }: TooltipProps) => {
  const [show, setShow] = useState(false)

  return (
    <div {...props} style={{ ...props.style }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div style={{ position: 'relative' }}>
        {children}
        {show && <span className='tooltip' style={{ 
          right: right ? 0 : undefined,
          left: right ? undefined: 0,
        ...tipStyle }}
        >
          {tip}
        </span>}
      </div>
    </div>
  )
}
