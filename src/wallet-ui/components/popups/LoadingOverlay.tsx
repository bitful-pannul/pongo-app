import Col from '../spacing/Col';
import Loader from './Loader';

import './LoadingOverlay.css';

const LoadingOverlay = ({
  loading,
  text,
}: {
  loading: boolean;
  text?: string;
}) => {
  if (!loading) {
    return null;
  }

  return (
    <Col className="loading-overlay">
      <Col className={`${text ? 'solid' : ''}`} style={{ height: 'fit-content', minHeight: 160 }}>
        {!!text && <Col className="loader-text">{text}</Col>}
        <Loader />
      </Col>
    </Col>
  );
};

export default LoadingOverlay;
