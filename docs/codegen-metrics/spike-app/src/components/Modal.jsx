export default function Modal({ open, title, onClose, children }) { if (!open) return null; return <div className="modal"><h2>{title}</h2><button onClick={onClose}>Close</button>{children}</div>; }
