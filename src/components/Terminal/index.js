import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './style.css';

function Terminal(props) {
  const { text, close } = props;
  return (
    <div className="Terminal">
      <button onClick={close} className="close">
        <FontAwesomeIcon icon="times" />
      </button>
      <pre>{text}</pre>
    </div>
  );
}

export default Terminal;
