import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import storage from '../../services/storage';
import "./style.css";

function FuzzyOpen(props) {
  const {
    onDelete = () => {},
    onSelect = () => {},
    backdropClick = () => {}
  } = props;
  const [query, setQuery] = React.useState("");
  const [files, setFiles] = React.useState(storage.files());
  const items = Object.keys(files);
  const itemsFiltered = items.filter(i => query === '' || i.replace(query, '') !== i);

  React.useEffect(() => {
    document.querySelector(".FuzzyOpen .search input").focus();
  }, [])

  const deleteHandler = (e, item) => {
    e.stopPropagation();
    onDelete(item);
    setFiles(storage.files());
  };

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
                <FontAwesomeIcon icon="file" className="icon" />
                {item}
                <FontAwesomeIcon
                  icon="trash"
                  className="trash"
                  onClick={e => deleteHandler(e, item)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FuzzyOpen;
