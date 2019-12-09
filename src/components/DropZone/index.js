import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './style.css';

function MyDropzone(props) {
  const { onDrop } = props;

  const _onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 1) {
      onDrop(acceptedFiles[0]);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: _onDrop,
    noClick: true
  });

  return (
    <div
      {...getRootProps()}
      className="dropzone"
    >
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="drop-indicator">
        <FontAwesomeIcon icon="file-upload" />  
        Drop the file here ...
        </div>
      )}
      {props.children}
    </div>
  );
}

export default MyDropzone;
