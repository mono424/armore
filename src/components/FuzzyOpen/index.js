import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import storage from '../../services/storage';
import "./style.css";

function FuzzyOpen(props) {
  const { onSelect = () => {}, backdropClick = () => {} } = props;
  const [query, setQuery] = React.useState("");
  const files = storage.files();
  const items = Object.keys(files);
  const itemsFiltered = items.filter(i => query === '' || i.replace(query, '') !== i);

  return (
    <div className="FuzzyOpen" onClick={backdropClick}>
      <div className="search" onClick={e => e.stopPropagation()}>
        <input value={query} onChange={e => setQuery(e.target.value)} />
        {!itemsFiltered.length && (
          <div class="nothing-found">No items found.</div>
        )}
        {!!itemsFiltered.length && (
          <ul>
            {itemsFiltered.map(item => (
              <li key={item} onClick={() => onSelect(item)}>
                <FontAwesomeIcon icon="file" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FuzzyOpen;
