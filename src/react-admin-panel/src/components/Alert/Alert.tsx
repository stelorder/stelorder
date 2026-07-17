import { Toast } from 'react-bootstrap'

export function Alert({
  message,
  type,
  show,
  close,
  top,
}: {
  message: string
  type: 'success' | 'danger'
  show: boolean
  close: () => void,
  top?: string
}) {
  return (
    <Toast show={show} onClose={close} className={`text-bg-${type} border-0 text-white`} autohide style={{
      position: 'fixed',
      right: '10px',
      top: top ?? '10px',
    }}>
      <Toast.Header>
        <strong className="me-auto">{type === 'success' ? 'Solicitud exitosa' : 'Error'}</strong>
      </Toast.Header>
      <Toast.Body>{message}</Toast.Body>
    </Toast>
  )
}