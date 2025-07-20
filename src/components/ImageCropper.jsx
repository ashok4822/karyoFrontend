import React, { useState, useCallback } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/imageUtils';
import './ImageCropper.css';

const ImageCropper = ({ 
  show, 
  onHide, 
  imageFile, 
  onCropComplete: onCropCompleteCallback, 
  aspectRatio = 1,
  title = "Crop Image",
  loading = false 
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [error, setError] = useState('');

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const handleCrop = async () => {
    try {
      setError('');
      if (!croppedAreaPixels) {
        setError('Please adjust the crop area');
        return;
      }

      const croppedImage = await getCroppedImg(imageFile, croppedAreaPixels);
      onCropCompleteCallback(croppedImage);
    } catch (err) {
      setError('Failed to crop image. Please try again.');
      console.error('Crop error:', err);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="mb-3">
          <Form.Label>Adjust the crop area and zoom level</Form.Label>
          <Form.Range
            min={0.25}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mb-3"
          />
          <div className="text-center text-muted small">
            Zoom: {zoom.toFixed(1)}x
          </div>
        </div>

        <div 
          style={{ 
            position: 'relative', 
            height: '400px', 
            background: '#fff',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {imageFile && (
            <Cropper
              image={URL.createObjectURL(imageFile)}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onCropComplete={onCropComplete}
              onZoomChange={onZoomChange}
              showGrid={true}
              objectFit="contain"
              minZoom={0.25}
              maxZoom={3}
              restrictPosition={false}
            />
          )}
        </div>

        <div className="mt-3 text-center text-muted small">
          Drag to move • Scroll to zoom • Adjust the crop area to your preference
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleCrop}
          disabled={loading || !croppedAreaPixels}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Cropping...
            </>
          ) : (
            'Crop & Save'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageCropper; 